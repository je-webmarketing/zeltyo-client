import { useMemo, useState, useEffect, useCallback } from "react";
import {
  initOneSignal,
  getOneSignalStatus,
  enableOneSignalNotifications,
} from "./lib/onesignal";
import { buildApiUrl } from "./config/api";

import BookingForm from "./components/BookingForm";
import CommerceSection from "./components/CommerceSection";
import OffersSection from "./components/OffersSection";
import NotificationsSection from "./components/NotificationsSection";
import GeoSection from "./components/GeoSection";
import LoyaltyCardSection from "./components/LoyaltyCardSection";
import ClientBookingsSection from "./components/ClientBookingsSection";
import CreateCardSection from "./components/CreateCardSection";
import BusinessZoneSection from "./components/BusinessZoneSection";
import HeroSection from "./components/HeroSection";

const STORAGE_MERCHANT_CONTACT = "zeltyo_merchant_contact";
const STORAGE_PROGRAM_SETTINGS = "zeltyo_program_settings";
const STORAGE_MENU = "zeltyo_menu";
const STORAGE_MENU_IMAGE = "merchant_menu_image";
const STORAGE_SELECTED_BUSINESS = "zeltyo_selected_business";
const STORAGE_SELECTED_ZONE = "zeltyo_selected_zone";

const COLORS = {
  bg: "#050505",
  surface: "#111111",
  surfaceSoft: "#161616",
  border: "#2A2A2A",
  gold: "#D4AF37",
  goldLight: "#F2D06B",
  copper: "#D97A32",
  copperLight: "#F2A65A",
  red: "#C94B32",
  redLight: "#E06A4C",
  text: "#F7F4EA",
  textSoft: "#CFC7B0",
  success: "#22c55e",
  blackCard: "#0B0B0B",
};

function toRad(value) {
  return (value * Math.PI) / 180;
}

function getDistanceKm(lat1, lng1, lat2, lng2) {
  const aLat = Number(lat1);
  const aLng = Number(lng1);
  const bLat = Number(lat2);
  const bLng = Number(lng2);

  if (
    !Number.isFinite(aLat) ||
    !Number.isFinite(aLng) ||
    !Number.isFinite(bLat) ||
    !Number.isFinite(bLng)
  ) {
    return Infinity;
  }

  const R = 6371;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(aLat)) *
      Math.cos(toRad(bLat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(distanceKm) {
  if (!Number.isFinite(distanceKm)) return "";
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m`;
  return `${distanceKm.toFixed(1)} km`;
}

function getDistanceLabel(distanceKm) {
  if (!Number.isFinite(distanceKm)) return "";
  if (distanceKm < 1) return "À côté";
  if (distanceKm < 5) return "Très proche";
  if (distanceKm < 15) return "Proche";
  return formatDistance(distanceKm);
}

function getOfferBadge(type) {
  if (type === "flash") return "Offre flash";
  if (type === "reward") return "Récompense";
  if (type === "exclusive") return "Exclusif";
  return "Offre";
}

function getOfferUrgencyLabel(offer) {
  if (offer?.validToday && offer?.limited) return "🔥 Aujourd’hui seulement";
  if (offer?.validToday) return "Aujourd’hui";
  if (offer?.limited) return "Limité";
  return "Disponible";
}

function safeJsonParse(value, fallback = null) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function normalizePromotion(promo, fallback = {}) {
  return {
    id: promo?.id || fallback.id || `PROMO-${Date.now()}`,
    title: promo?.title || "Offre spéciale",
    description: promo?.description || "",
    type: promo?.type || "flash",
    discountLabel: promo?.code || promo?.discountLabel || "Offre",
    validToday: promo?.validToday !== false,
    limited: Boolean(promo?.limited),
    ctaLabel: promo?.ctaLabel || "",
    ctaUrl: promo?.ctaUrl || "",
    businessId: promo?.businessId || fallback.businessId || "",
    businessName: fallback.businessName || promo?.businessName || "Commerce",
    city: fallback.city || promo?.city || "",
    zoneLabel: fallback.zoneLabel || promo?.zoneLabel || "",
    googleMapsUrl: fallback.googleMapsUrl || promo?.googleMapsUrl || "",
    distanceKm: fallback.distanceKm ?? Infinity,
    isNearby: true,
    active: promo?.active !== false,
  };
}

function isPromotionActive(promo) {
  const status = String(promo?.status || "").toLowerCase();
  const validUntil = promo?.validUntil ? new Date(promo.validUntil) : null;
  const isExpired = validUntil && validUntil < new Date();

  return !isExpired && (status === "active" || status === "actif" || status === "");
}

export default function ClientApp() {
  const [apiBusinesses, setApiBusinesses] = useState([]);
  const [locationMode, setLocationMode] = useState("auto");
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  const [oneSignalReady, setOneSignalReady] = useState(false);
  const [permission, setPermission] = useState(false);
  const [optedIn, setOptedIn] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState(null);

  const [offerFilter, setOfferFilter] = useState("all");
  const [showAllOffers, setShowAllOffers] = useState(false);

  const [merchantContact, setMerchantContact] = useState(null);
  const [programSettings, setProgramSettings] = useState(null);
  const [merchantPromotions, setMerchantPromotions] = useState([]);

  const [clientData, setClientData] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [clientBookings, setClientBookings] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [menuImage, setMenuImage] = useState("");
  const [clientCard, setClientCard] = useState(null);
  const [businessContents, setBusinessContents] = useState([]);
 
  const [geoState, setGeoState] = useState({
    loading: false,
    error: "",
    coords: null,
  });

  const [activeTab, setActiveTab] = useState("offers");
  const [manualBusinessId, setManualBusinessId] = useState(() => {
  const saved = localStorage.getItem(STORAGE_SELECTED_BUSINESS);
  return saved && saved.trim() ? saved : null;
});
const [manualCountry, setManualCountry] = useState("");
const [manualCity, setManualCity] = useState("");
const [manualZone, setManualZone] = useState("");
const [manualRegion, setManualRegion] = useState("");
const [favoriteDestinations, setFavoriteDestinations] = useState(() => {
  const saved = localStorage.getItem("zeltyo_favorite_destinations");
  return saved ? JSON.parse(saved) : [];
});

const [selectedZoneId, setSelectedZoneId] = useState(() => {
  return localStorage.getItem(STORAGE_SELECTED_ZONE) || "";
});

useEffect(() => {
  if (selectedZoneId) {
    localStorage.setItem(STORAGE_SELECTED_ZONE, selectedZoneId);
  }
}, [selectedZoneId]);

  const urlParams = new URLSearchParams(window.location.search);
const businessIdFromUrl = urlParams.get("businessId");


  useEffect(() => {
  async function loadBusinesses() {
    try {
      const response = await fetch(buildApiUrl("/businesses"));
      const json = await response.json();

      console.log("BUSINESS CONTENT RESPONSE =", json);

      if (response.ok && json.ok && Array.isArray(json.businesses)) {
        const normalized = json.businesses.map((business) => {
          const lat = business.latitude != null ? Number(business.latitude) : null;
          const lng = business.longitude != null ? Number(business.longitude) : null;

          return {
            ...business,
            lat,
            lng,
            address:
              business.address ||
              [business.city, business.country].filter(Boolean).join(", "),
            googleMapsUrl:
              lat != null && lng != null
                ? `https://www.google.com/maps?q=${lat},${lng}`
                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    [business.name, business.city, business.country]
                      .filter(Boolean)
                      .join(", ")
                  )}`,
            offers: Array.isArray(business.offers) ? business.offers : [],
          };
        });

        setApiBusinesses(normalized);
      }
    } catch (error) {
      console.error("Erreur chargement commerces :", error);
      setApiBusinesses([]);
    }
  }

  loadBusinesses();
}, []);

  const loadClientFromBackend = useCallback(async () => {
    const pathParts = window.location.pathname.split("/");
    const cardId = pathParts.includes("card")
      ? pathParts[pathParts.indexOf("card") + 1]
      : null;

    if (!cardId) return;

    try {
      const response = await fetch(buildApiUrl(`/clients/by-loyalty/${cardId}`));
      const data = await response.json();

      if (response.ok && data.ok && data.client) {
        setClientData(data.client);
      }
    } catch (error) {
      console.error("Erreur chargement client backend :", error);
    }
  }, []);

  useEffect(() => {
    loadClientFromBackend();

    const interval = setInterval(() => {
      loadClientFromBackend();
    }, 5000);

    return () => clearInterval(interval);
  }, [loadClientFromBackend]);

  useEffect(() => {
    async function loadMerchantData() {
      try {
        const parsedMerchantContact = safeJsonParse(
          localStorage.getItem(STORAGE_MERCHANT_CONTACT),
          null
        );
        const parsedProgramSettings = safeJsonParse(
          localStorage.getItem(STORAGE_PROGRAM_SETTINGS),
          null
        );

        if (parsedMerchantContact) {
          setMerchantContact(parsedMerchantContact);
        }

        if (parsedProgramSettings) {
          setProgramSettings(parsedProgramSettings);
        }

       const businessId =
  parsedProgramSettings?.businessId ||
  parsedMerchantContact?.businessId ||
  manualBusinessId ||
businessIdFromUrl ||
  "";

        const response = await fetch(buildApiUrl(`/promotions/public/${businessId}`));
        const data = await response.json();

        console.log("PROMOTIONS DATA CLIENT =", data);

        if (response.ok && data.ok && Array.isArray(data.promotions)) {
          setMerchantPromotions(data.promotions);
          return;
        }

        console.warn("Promotions publiques non chargées :", data);
        setMerchantPromotions([]);
      } catch (error) {
        console.error("Erreur lecture données commerçant côté client :", error);
        setMerchantPromotions([]);
      }
    }

    loadMerchantData();
  }, []);

function requestUserLocation() {
  console.log("requestUserLocation appelée");

  if (!navigator.geolocation) {
    setGeoState({
      status: "error",
      message: "La géolocalisation n'est pas disponible sur ce navigateur.",
      latitude: null,
      longitude: null,
    });
    return;
  }

  setLocationMode("auto");

  setGeoState({
    status: "loading",
    message: "Recherche de votre position...",
    latitude: null,
    longitude: null,
  });

  navigator.geolocation.getCurrentPosition(
    (position) => {
      console.log("POSITION OK", position.coords);

      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      setGeoState({
        status: "success",
        message: `Position détectée : ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
        latitude,
        longitude,
      });
    },
    (error) => {
      console.error("Erreur géolocalisation :", error);

      let message = "Impossible de récupérer votre position.";

      if (error.code === 1) {
        message =
          "Autorisation refusée. Cliquez sur l’icône de localisation dans Chrome et autorisez le site.";
      }

      if (error.code === 2) {
        message = "Position indisponible. Réessayez ou utilisez le choix manuel.";
      }

      if (error.code === 3) {
        message = "Temps d’attente dépassé. Réessayez ou utilisez le choix manuel.";
      }

      setGeoState({
        status: "error",
        message,
        latitude: null,
        longitude: null,
      });
    },
    {
      enableHighAccuracy: false,
      timeout: 20000,
      maximumAge: 60000,
    }
  );
}
  useEffect(() => {
    function handleBeforeInstallPrompt(event) {
      event.preventDefault();
      setDeferredPrompt(event);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function bootOneSignal() {
      const isProd = window.location.origin.includes("zeltyo-clients.netlify.app");

      if (!isProd) {
        console.log("OneSignal désactivé hors production");
        return;
      }

      try {
        await initOneSignal();
        const status = await getOneSignalStatus();

        if (!isMounted) return;

        setOneSignalReady(true);
        setPermission(Boolean(status.permission));
        setOptedIn(Boolean(status.optedIn));
        setSubscriptionId(status.subscriptionId || null);
      } catch (error) {
        console.error("Erreur init OneSignal :", error);

        if (!isMounted) return;

        setOneSignalReady(false);
        setPermission(false);
        setOptedIn(false);
        setSubscriptionId(null);
      }
    }

    bootOneSignal();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setShowAllOffers(false);
  }, [offerFilter, merchantPromotions]);

  useEffect(() => {
    try {
      const savedMenu = safeJsonParse(localStorage.getItem(STORAGE_MENU), []);
      const savedMenuImage = localStorage.getItem(STORAGE_MENU_IMAGE) || "";

      setMenuItems(Array.isArray(savedMenu) ? savedMenu : []);
      setMenuImage(savedMenuImage);
    } catch {
      setMenuItems([]);
      setMenuImage("");
    }
  }, []);

  useEffect(() => {
    const existingStyle = document.getElementById("zeltyo-client-animations");
    if (existingStyle) return;

    const style = document.createElement("style");
    style.id = "zeltyo-client-animations";
    style.innerHTML = `
      @keyframes pulseGold {
        0% { box-shadow: 0 0 10px rgba(212,175,55,0.10); }
        50% { box-shadow: 0 0 35px rgba(212,175,55,0.25); }
        100% { box-shadow: 0 0 10px rgba(212,175,55,0.10); }
      }
      html {
        scroll-behavior: smooth;
      }
    `;
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    if (manualBusinessId) {
      localStorage.setItem(STORAGE_SELECTED_BUSINESS, manualBusinessId);
    }
  }, [manualBusinessId]);

  const dynamicBusiness = useMemo(() => {
    if (!merchantContact && !programSettings) return null;

    const activePromotions = Array.isArray(merchantPromotions)
      ? merchantPromotions.filter(isPromotionActive)
      : [];

    console.log("CLIENT PROMOS RAW =", merchantPromotions);
    console.log("CLIENT PROMOS ACTIVE =", activePromotions);

    const businessName = merchantContact?.shopName || "Mon Commerce";
    const address = merchantContact?.address || "";
    const city = merchantContact?.city || programSettings?.locationSettings?.city || "";
    const country =
      merchantContact?.country || programSettings?.locationSettings?.country || "";

    const lat = programSettings?.locationSettings?.latitude
      ? Number(programSettings.locationSettings.latitude)
      : null;

    const lng = programSettings?.locationSettings?.longitude
      ? Number(programSettings.locationSettings.longitude)
      : null;

    const hasCoordinates = Number.isFinite(lat) && Number.isFinite(lng);

    const businessQuery = encodeURIComponent(
      [businessName, address, city, country].filter(Boolean).join(", ")
    );

    const googleMapsUrl = hasCoordinates
      ? `https://www.google.com/maps?q=${lat},${lng}`
      : `https://www.google.com/maps/search/?api=1&query=${businessQuery}`;

    const reviewUrl =
      merchantContact?.reviewUrl || `https://www.google.com/search?q=${businessQuery}`;

    const businessId =
  programSettings?.businessId ||
  merchantContact?.businessId ||
  manualBusinessId ||
  "";
    const zoneLabel = programSettings?.locationSettings?.zoneLabel || "";
    const distanceKm =
      geoState.coords && hasCoordinates
        ? getDistanceKm(geoState.coords.lat, geoState.coords.lng, lat, lng)
        : Infinity;

    return {
      id: businessId,
      name: businessName,
      address,
      city,
      country,
      zoneId: "dynamic-zone",
      zoneLabel,
      radiusKm: Number(programSettings?.locationSettings?.radiusKm || 0),
      displayRadiusKm: Number(programSettings?.locationSettings?.radiusKm || 20),
      rewardGoal: Number(programSettings?.rewardGoal || 10),
      rewardLabel: programSettings?.rewardLabel || "1 récompense",
      points: 0,
      promo: activePromotions[0]?.title || "Aucune promotion active",
      color: programSettings?.primaryColor || COLORS.gold,
      description: "Retrouvez vos avantages fidélité et vos offres en cours.",
      lat,
      lng,
      hasCoordinates,
      googleMapsUrl,
      reviewUrl,
      offers: activePromotions.map((promo, index) =>
        normalizePromotion(promo, {
          id: `PROMO-${index + 1}`,
          businessId,
          businessName,
          city,
          zoneLabel,
          googleMapsUrl,
          distanceKm,
        })
      ),
    };
  }, [merchantContact, programSettings, merchantPromotions, geoState.coords]);

 const businesses = useMemo(() => {
  const list = [...apiBusinesses];

  if (
    dynamicBusiness &&
    !list.find((business) => String(business.id) === String(dynamicBusiness.id))
  ) {
    list.push(dynamicBusiness);
  }

  return list;
}, [apiBusinesses, dynamicBusiness]);

  const availableCountries = [
  ...new Set(
    businesses
      .map((b) => b.country)
      .filter(Boolean)
  ),
];

const availableCities = [
  ...new Set(
    businesses
      .filter(
        (b) =>
          !manualCountry || b.country === manualCountry
      )
      .map((b) => b.city)
      .filter(Boolean)
  ),
];

const availableZones = [
  ...new Set(
    businesses
      .filter(
        (b) =>
          (!manualCountry || b.country === manualCountry) &&
          (!manualCity || b.city === manualCity)
      )
      .map((b) => b.zoneLabel)
      .filter(Boolean)
  ),
];

  const selectedBusiness = useMemo(() => {
    if (!businesses.length) {
  return {
    id: manualBusinessId || businessIdFromUrl || "BUS-ISTANBUL",
    name: "ISTANBUL KEBAB",
    offers: [],
    rewardGoal: 10,
  };
}
   console.log("MANUAL BUSINESS ID =", manualBusinessId);
console.log("API BUSINESSES LENGTH =", businesses.length);
 console.log("CHECKING MANUAL BUSINESS");

    if (manualBusinessId) {
  const manualBusiness = businesses.find(
    (business) => String(business.id) === String(manualBusinessId)
  );

  if (manualBusiness) {
    return {
      ...manualBusiness,
      radiusKm: Number(manualBusiness.radiusKm || 0),
      region: manualBusiness.region || "",
      zoneLabel: manualBusiness.zoneLabel || "",
    };
  }

  localStorage.removeItem(STORAGE_SELECTED_BUSINESS);
}

    if (!geoState.coords) {
  return {
    ...businesses[0],
    radiusKm: Number(businesses[0].radiusKm || 0),
    region: businesses[0].region || "",
    zoneLabel: businesses[0].zoneLabel || "",
  };
}



    const ranked = [...businesses].sort((a, b) => {
      const distanceA = getDistanceKm(
        geoState.coords.lat,
        geoState.coords.lng,
        a.lat,
        a.lng
      );

      const distanceB = getDistanceKm(
        geoState.coords.lat,
        geoState.coords.lng,
        b.lat,
        b.lng
      );

      return distanceA - distanceB;
    });

    return ranked[0];
  }, [businesses, geoState.coords, manualBusinessId]);

  useEffect(() => {
  
console.log("MENU EFFECT TRIGGER =", activeTab, selectedBusiness?.id);

  async function loadBusinessContents() {
    
    if (!selectedBusiness?.id) return;

    try {
      const url = `/business-content/public/${selectedBusiness.id}`;

      console.log("BUSINESS CONTENT URL =", url);

      const response = await fetch(buildApiUrl(url));
      const json = await response.json();

      console.log("BUSINESS CONTENT RESPONSE =", json);

      if (response.ok && json.ok && Array.isArray(json.contents)) {
        setBusinessContents(json.contents);
      } else {
        setBusinessContents([]);
      }
    } catch (error) {
      console.error("Erreur chargement menus/services :", error);
      setBusinessContents([]);
    }
  }

  loadBusinessContents();
}, [selectedBusiness?.id]);


  const selectedBusinessDistance =
    geoState.coords && selectedBusiness?.lat != null && selectedBusiness?.lng != null
      ? getDistanceKm(
          geoState.coords.lat,
          geoState.coords.lng,
          selectedBusiness.lat,
          selectedBusiness.lng
        )
      : null;

  const nearbyBusinesses = useMemo(() => {
    return businesses.map((business) => {
      const distance =
        geoState.coords && business?.lat != null && business?.lng != null
          ? getDistanceKm(
              geoState.coords.lat,
              geoState.coords.lng,
              business.lat,
              business.lng
            )
          : Infinity;

      return {
        ...business,
        distanceKm: distance,
      };
    });
  }, [businesses, geoState.coords]);

  const nearbyOffers = useMemo(() => {
    if (Array.isArray(selectedBusiness?.offers) && selectedBusiness.offers.length > 0) {
      return selectedBusiness.offers.map((offer, index) =>
        normalizePromotion(offer, {
          id: `OFFER-${index + 1}`,
          businessId: selectedBusiness?.id || manualBusinessId || businessIdFromUrl || "",
          businessName: selectedBusiness?.name || "Commerce",
          city: selectedBusiness?.city || "",
          zoneLabel: selectedBusiness?.zoneLabel || "",
          googleMapsUrl: selectedBusiness?.googleMapsUrl || "",
          distanceKm: selectedBusinessDistance ?? Infinity,
        })
      );
    }

    if (Array.isArray(merchantPromotions) && merchantPromotions.length > 0) {
      return merchantPromotions.filter(isPromotionActive).map((promo, index) =>
        normalizePromotion(promo, {
          id: `PROMO-${index + 1}`,
          businessId: selectedBusiness?.id || manualBusinessId || businessIdFromUrl || "",
          businessName: selectedBusiness?.name || "Commerce",
          city: selectedBusiness?.city || "",
          zoneLabel: selectedBusiness?.zoneLabel || "",
          googleMapsUrl: selectedBusiness?.googleMapsUrl || "",
          distanceKm: selectedBusinessDistance ?? Infinity,
        })
      );
    }

    return [];
  }, [selectedBusiness, merchantPromotions, selectedBusinessDistance]);

  console.log("SELECTED BUSINESS =", selectedBusiness);
  console.log("CLIENT DATA =", clientData);
console.log("CLIENT BUSINESS =", clientData?.businessId);
console.log("SELECTED BUSINESS ID =", selectedBusiness?.id);
  console.log("DYNAMIC BUSINESS =", dynamicBusiness);
  console.log("API BUSINESSES =", apiBusinesses);
  console.log("NEARBY OFFERS =", nearbyOffers);
  console.log("MERCHANT PROMOTIONS =", merchantPromotions);

  const filteredOffers = useMemo(() => {
    if (!Array.isArray(nearbyOffers)) return [];

    let list = nearbyOffers.filter((offer) => offer?.active !== false);

    if (offerFilter === "flash") {
      list = list.filter((offer) => offer.type === "flash");
    }

    if (offerFilter === "reward") {
      list = list.filter((offer) => offer.type === "reward");
    }

    return list;
  }, [nearbyOffers, offerFilter]);

  const featuredOffer = useMemo(() => {
    if (!nearbyOffers.length) return null;

    const ranked = [...nearbyOffers].sort((a, b) => {
      const aScore =
        (a.type === "flash" ? 30 : 0) +
        (a.validToday ? 20 : 0) +
        (a.limited ? 15 : 0) +
        (Number.isFinite(a.distanceKm) ? Math.max(0, 20 - a.distanceKm) : 0);

      const bScore =
        (b.type === "flash" ? 30 : 0) +
        (b.validToday ? 20 : 0) +
        (b.limited ? 15 : 0) +
        (Number.isFinite(b.distanceKm) ? Math.max(0, 20 - b.distanceKm) : 0);

      return bScore - aScore;
    });

    return ranked[0] || null;
  }, [nearbyOffers]);

  const visibleOfferCards = useMemo(() => {
    const list = filteredOffers.filter((offer) => offer.id !== featuredOffer?.id);
    return showAllOffers ? list : list.slice(0, 4);
  }, [filteredOffers, featuredOffer, showAllOffers]);

  const hiddenOffersCount = Math.max(
    filteredOffers.filter((offer) => offer.id !== featuredOffer?.id).length -
      visibleOfferCards.length,
    0
  );

  const client = {
    id: clientData?.id || "",
    loyaltyId: clientData?.loyaltyId || clientData?.id || "",
    name: clientData?.name || "Client",
    phone: clientData?.phone || "",
    email: clientData?.email || "",
    country: selectedBusiness?.country || "",
    region: selectedBusiness?.region || "",
    city: selectedBusiness?.city || "",
    zoneId: selectedBusiness?.zoneId || "",
    zoneLabel: selectedBusiness?.zoneLabel || "",
    radiusKm: selectedBusiness?.radiusKm || 0,
    points:
  String(clientCard?.businessId || clientData?.businessId || "") ===
  String(selectedBusiness?.id || "")
    ? Number(clientCard?.points || clientData?.points || 0)
    : 0,

visits:
  String(clientCard?.businessId || clientData?.businessId || "") ===
  String(selectedBusiness?.id || "")
    ? Number(clientCard?.visits || clientData?.visits || 0)
    : 0,

rewardsAvailable:
  String(clientCard?.businessId || clientData?.businessId || "") ===
  String(selectedBusiness?.id || "")
    ? Number(clientCard?.rewardsAvailable || clientData?.rewardsAvailable || 0)
    : 0,
  };


  const loadClientBookings = useCallback(async (clientId) => {
    try {
      if (!clientId) return;

      const isPhone = String(clientId).startsWith("0");
      const endpoint = isPhone
        ? `/bookings/by-phone/${clientId}`
        : `/bookings/by-client/${clientId}`;

      console.log("ENDPOINT CLIENT BOOKINGS =", endpoint);

      const response = await fetch(buildApiUrl(endpoint));
      const data = await response.json();

      console.log("BOOKINGS DATA CLIENT =", data);

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Erreur chargement réservations client");
      }

const fidelityBusinessId =
  clientData?.businessId ||
  selectedBusiness?.id ||
  manualBusinessId ||
  businessIdFromUrl ||
  "";

const clientResponse = await fetch(
  buildApiUrl(
    `/clients/by-loyalty/${clientId}?businessId=${fidelityBusinessId}`
  )
);
      const fidelityData = await clientResponse.json();

      console.log("FIDELITY DATA =", fidelityData);
console.log("CLIENT API =", fidelityData.client);

      if (fidelityData.ok && fidelityData.client) {
        setClientCard(fidelityData.client);
      }

      setClientBookings(data.bookings || []);
    } catch (error) {
      console.error("Erreur chargement réservations client :", error);
    }
  }, [
  selectedBusiness?.id,
  manualBusinessId,
  businessIdFromUrl,
  clientData?.businessId,
]);

  useEffect(() => {
    console.log("CLIENT DATA BOOKINGS =", clientData);

    const fallbackPhone = localStorage.getItem("zeltyo_last_phone");
    const identifier =
  clientData?.loyaltyId ||
  clientData?.id ||
  localStorage.getItem("zeltyo_loyalty_id") ||
  clientData?.phone ||
  fallbackPhone;

    if (!identifier) {
      console.log("Aucun id/téléphone client pour charger les réservations");
      return undefined;
    }

    console.log("IDENTIFIER BOOKINGS =", identifier);

    loadClientBookings(identifier);

    const interval = setInterval(() => {
      loadClientBookings(identifier);
    }, 10000);

    return () => clearInterval(interval);
  }, [clientData, loadClientBookings]);

  const clientPoints = Number(client?.points || 0);
  const clientRewards = Number(client?.rewardsAvailable || 0);
  const rewardGoal = Number(selectedBusiness?.rewardGoal || 10);

  const clientProgress = rewardGoal > 0 ? (clientPoints / rewardGoal) * 100 : 0;
  const cyclePoints = rewardGoal > 0 ? clientPoints % rewardGoal : 0;

  const clientRewardRemaining =
  rewardGoal <= 0
    ? 0
    : clientPoints >= rewardGoal
      ? rewardGoal - (clientPoints % rewardGoal || 0)
      : rewardGoal - clientPoints;

const rewardsAvailable = Math.floor(
  clientPoints / Math.max(1, rewardGoal)
);

const rewardAvailable = rewardsAvailable > 0;

  const createClient = async () => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    if (!cleanName || (!cleanEmail && !cleanPhone)) {
      alert("Merci de renseigner un nom et au moins un email ou un téléphone.");
      return;
    }

    try {
      const response = await fetch(buildApiUrl("/clients"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
  name: cleanName,
  email: cleanEmail,
  phone: cleanPhone,
  businessId: selectedBusiness?.id ||manualBusinessId || businessIdFromUrl || "",
}),
      });

      const data = await response.json();

      if (!response.ok || !data.ok || !data.client) {
        throw new Error(data.error || "Erreur création client");
      }

      setClientData(data.client);

      if (cleanPhone) {
        localStorage.setItem("zeltyo_last_phone", cleanPhone);
      }

      window.history.replaceState(
        null,
        "",
        `/card/${data.client.loyaltyId || data.client.id}`
      );

      setName("");
      setEmail("");
      setPhone("");

      alert(data.created ? "Carte fidélité créée ✅" : "Carte fidélité retrouvée ✅");
    } catch (error) {
      console.error("Erreur création carte :", error);
      alert("Erreur création carte fidélité");
    }
  };

 const cardUrl = useMemo(() => {
  const currentCardId = window.location.pathname.split("/card/")[1];
  const cardId = currentCardId || client?.loyaltyId || client?.id;

  if (!cardId) {
    return window.location.href;
  }

  const businessId =
  selectedBusiness?.id ||
  clientData?.businessId ||
  manualBusinessId ||
  businessIdFromUrl ||
  "";

  return `${window.location.origin}/card/${cardId}?businessId=${businessId}`;
}, [
  client?.loyaltyId,
  client?.id,
  selectedBusiness?.id,
  clientData?.businessId,
  manualBusinessId,
  businessIdFromUrl,
]);

  const saveClientSubscription = async (newSubscriptionId, externalId = "") => {
    try {
      const response = await fetch(buildApiUrl("/clients/register-subscription"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: client.id,
          name: client.name,
          phone: client.phone,
          subscriptionId: newSubscriptionId,
          externalId,
          country: client.country,
          city: client.city,
          zoneId: client.zoneId,
          businessId: selectedBusiness?.id || manualBusinessId || businessIdFromUrl || "",
          region: client.region,
          zoneLabel: client.zoneLabel,
          radiusKm: client.radiusKm,
        }),
      });

      const data = await response.json();
      console.log("Client sauvegardé :", data);
    } catch (error) {
      console.error("Erreur sauvegarde client :", error);
    }
  };

  const handleEnableNotifications = async () => {
    try {
      const isLocalhost =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";

      if (isLocalhost) {
        alert(
          "OneSignal n'est pas disponible en localhost avec votre configuration actuelle. Testez cette fonction sur Netlify."
        );
        return;
      }

      await initOneSignal();
      const status = await enableOneSignalNotifications({
  businessId: selectedBusiness?.id,
  clientId: client?.id || client?.loyaltyId,
});

      setOneSignalReady(true);
      setPermission(Boolean(status.permission));
      setOptedIn(Boolean(status.optedIn));
      setSubscriptionId(status.subscriptionId || null);

      if (status.subscriptionId) {
  await saveClientSubscription(status.subscriptionId, status.externalId);
}

      if (status.permission !== true) {
        alert("Notifications refusées");
        return;
      }

      alert("Notifications activées ✅");
    } catch (error) {
      console.error("Erreur OneSignal :", error);
      alert("Erreur lors de l’activation des notifications");
    }
  };

  function addFavoriteDestination(destination) {
  const exists = favoriteDestinations.some(
    (d) =>
      d.country === destination.country &&
      d.region === destination.region &&
      d.city === destination.city &&
      d.zone === destination.zone
  );

  if (exists) return;

  const updated = [...favoriteDestinations, destination];

  setFavoriteDestinations(updated);

  localStorage.setItem(
    "zeltyo_favorite_destinations",
    JSON.stringify(updated)
  );
}

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(212,175,55,0.08), transparent 24%), #050505",
        color: COLORS.text,
        fontFamily: "Inter, Arial, sans-serif",
        padding: 20,
      }}
    >
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <HeroSection COLORS={COLORS} menuImage={menuImage} menuItems={menuItems} />

        {nearbyBusinesses.length > 1 && (
          <div
            style={{
              display: "grid",
              gap: 12,
              marginBottom: 18,
            }}
          >
            {nearbyBusinesses.map((business) => (
              <div
                key={business.id}
                style={{
                  padding: 14,
                  borderRadius: 18,
                  background:
                    selectedBusiness?.id === business.id
                      ? "rgba(217,122,50,0.14)"
                      : COLORS.surface,
                  border:
                    selectedBusiness?.id === business.id
                      ? "1px solid rgba(217,122,50,0.35)"
                      : `1px solid ${COLORS.border}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div
                      style={{
                        color: COLORS.goldLight,
                        fontWeight: 800,
                        fontSize: 18,
                        marginBottom: 4,
                      }}
                    >
                      {business.name}
                    </div>

                    <div
                      style={{
                        color: COLORS.textSoft,
                        fontSize: 13,
                      }}
                    >
                      {Number.isFinite(business.distanceKm)
                        ? formatDistance(business.distanceKm)
                        : business.city}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setManualBusinessId(business.id);

                      window.scrollTo({
                        top: 0,
                        behavior: "smooth",
                      });
                    }}
                    style={
                      selectedBusiness?.id === business.id
                        ? ghostButton()
                        : copperButton()
                    }
                  >
                    {selectedBusiness?.id === business.id ? "Commerce actif" : "Choisir"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <section style={{ marginBottom: 18 }}>
          <h1
            style={{
              margin: "0 0 8px 0",
              fontSize: 28,
              color: COLORS.text,
            }}
          >
            Ma carte fidélité
          </h1>

          <p
            style={{
              margin: "0 0 10px 0",
              color: COLORS.textSoft,
              lineHeight: 1.6,
            }}
          >
            Retrouvez vos avantages, vos points et les offres près de vous.
          </p>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <span
              style={{
                padding: "8px 12px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${COLORS.border}`,
                color: COLORS.text,
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              Commerce actif : {selectedBusiness?.name || "Commerce"}
            </span>

            <button
              type="button"
              onClick={() => setActiveTab("cards")}
              style={copperButton()}
            >
              💳 Voir mes cartes
            </button>
          </div>
        </section>

        <div
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            marginBottom: 18,
            paddingBottom: 4,
          }}
        >
          {[
  ["offers", "Offres"],
  ["booking", "Réserver"],
  ["loyalty", "Fidélité"],
  ["commerce", "Commerce"],
  ["menu", "Menu & Services"],
  ["cards", "Mes cartes"],
].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              style={{
                padding: "10px 14px",
                borderRadius: 999,
                border: "1px solid #2A2A2A",
                background:
                  activeTab === key
                    ? "linear-gradient(135deg,#D97A32,#F2A65A)"
                    : "#111111",
                color: activeTab === key ? "#111111" : "#F7F4EA",
                fontWeight: 900,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "offers" && (
          <>
            <GeoSection
  COLORS={COLORS}
  locationMode={locationMode}
  setLocationMode={setLocationMode}
  requestUserLocation={requestUserLocation}
  geoState={geoState}
  selectedBusiness={selectedBusiness}
  selectedBusinessDistance={selectedBusinessDistance}
  getDistanceLabel={getDistanceLabel}
  copperButton={copperButton}
  ghostButton={ghostButton}
  manualRegion={manualRegion}
setManualRegion={setManualRegion}
favoriteDestinations={favoriteDestinations}
addFavoriteDestination={addFavoriteDestination}
  ZoneLine={ZoneLine}
  style={{
  width: "100%",
  padding: "12px",
  borderRadius: 12,
  border: `1px solid ${COLORS.border}`,
  background: COLORS.surface,
  color: COLORS.text,
  fontWeight: 700,
  }}

  manualBusinessId={manualBusinessId}
  setManualBusinessId={setManualBusinessId}
  STORAGE_SELECTED_BUSINESS={STORAGE_SELECTED_BUSINESS}
  businesses={businesses}

  manualCountry={manualCountry}
setManualCountry={setManualCountry}
manualCity={manualCity}
setManualCity={setManualCity}
manualZone={manualZone}
setManualZone={setManualZone}
availableCountries={availableCountries}
availableCities={availableCities}
availableZones={availableZones}
/>

<div
  style={{
    marginBottom: 16,
    textAlign: "center",
    color: COLORS.gold,
    fontWeight: 700,
  }}
>
  🎁 {filteredOffers.length} offre(s) disponible(s)
</div>

            <OffersSection
              COLORS={COLORS}
              featuredOffer={featuredOffer}
              filteredOffers={filteredOffers}
              visibleOfferCards={visibleOfferCards}
              hiddenOffersCount={hiddenOffersCount}
              showAllOffers={showAllOffers}
              setShowAllOffers={setShowAllOffers}
              offerFilter={offerFilter}
              setOfferFilter={setOfferFilter}
              getOfferBadge={getOfferBadge}
              getOfferUrgencyLabel={getOfferUrgencyLabel}
              getDistanceLabel={getDistanceLabel}
              copperButton={copperButton}
              ghostButton={ghostButton}
              onViewCommerce={() => setActiveTab("commerce")}
            />
          </>
        )}

        {activeTab === "booking" && (
          <>
            <CreateCardSection
              COLORS={COLORS}
              name={name}
              setName={setName}
              email={email}
              setEmail={setEmail}
              phone={phone}
              setPhone={setPhone}
              createClient={createClient}
              inputStyle={inputStyle}
              copperButton={copperButton}
            />

            <BookingForm
              selectedBusiness={{
                ...selectedBusiness,
                id: selectedBusiness?.id || manualBusinessId || businessIdFromUrl || "",
                menu: menuItems,
                phone: merchantContact?.phone || selectedBusiness?.phone || "",
              }}
              clientData={client}
            />

            <ClientBookingsSection COLORS={COLORS} clientBookings={clientBookings} />
          </>
        )}

        {activeTab === "loyalty" && (
          <LoyaltyCardSection
            COLORS={COLORS}
            selectedBusiness={selectedBusiness}
            selectedBusinessDistance={selectedBusinessDistance}
            formatDistance={formatDistance}
            cardUrl={cardUrl}
            client={client}
            clientPoints={clientPoints}
            rewardGoal={rewardGoal}
            clientProgress={clientProgress}
            clientRewardRemaining={clientRewardRemaining}
            rewardAvailable={rewardAvailable}
            InfoCard={InfoCard}
            MiniStat={MiniStat}
            rewardsAvailable={rewardsAvailable}
          />
        )}

        {activeTab === "commerce" && (
          <div id="commerce-section">
             <GeoSection
      COLORS={COLORS}
      locationMode={locationMode}
      setLocationMode={setLocationMode}
      requestUserLocation={requestUserLocation}
      geoState={geoState}
      selectedBusiness={selectedBusiness}
      selectedBusinessDistance={selectedBusinessDistance}
      getDistanceLabel={getDistanceLabel}
      copperButton={copperButton}
      ghostButton={ghostButton}
      ZoneLine={ZoneLine}
      manualBusinessId={manualBusinessId}
      setManualBusinessId={setManualBusinessId}
      STORAGE_SELECTED_BUSINESS={STORAGE_SELECTED_BUSINESS}
      businesses={businesses}
    />

            <BusinessZoneSection
              COLORS={COLORS}
              selectedBusiness={selectedBusiness}
              inputStyle={inputStyle}
              ZoneLine={ZoneLine}
            />

            <CommerceSection
              COLORS={COLORS}
              selectedBusiness={selectedBusiness}
              selectedBusinessDistance={selectedBusinessDistance}
              formatDistance={formatDistance}
              copperButton={copperButton}
              ghostButton={ghostButton}
              reviewButton={reviewButton}
            />
          </div>
        )}

        {activeTab === "menu" && (
  <div>
    <h2 style={{ color: COLORS.goldLight }}>Menu & Services</h2>

    {businessContents.length === 0 ? (
      <div
        style={{
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 22,
          padding: 18,
          textAlign: "center",
        }}
      >
        <p style={{ color: COLORS.textSoft }}>
          Aucun menu ou service disponible pour ce commerce.
        </p>
      </div>
    ) : (
      <div style={{ display: "grid", gap: 16 }}>
        {businessContents.map((item) => (
          <div
            key={item.id}
            style={{
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 22,
              padding: 18,
              boxShadow: "0 10px 24px rgba(0,0,0,0.28)",
            }}
          >
            <div
              style={{
                color: COLORS.goldLight,
                fontWeight: 900,
                fontSize: 20,
                marginBottom: 8,
              }}
            >
              {item.title || item.fileName || "Menu / Service"}
            </div>

            {item.description ? (
              <p style={{ color: COLORS.textSoft, lineHeight: 1.6 }}>
                {item.description}
              </p>
            ) : null}

            {item.price ? (
              <div
                style={{
                  color: COLORS.copperLight,
                  fontWeight: 900,
                  marginBottom: 12,
                }}
              >
                {item.price} €
              </div>
            ) : null}

            {item.mimeType?.startsWith("image/") ? (
              <img
                src={item.fileData}
                alt={item.title || item.fileName || "Menu"}
                style={{
                  width: "100%",
                  borderRadius: 16,
                  border: `1px solid ${COLORS.border}`,
                  background: "#000",
                  maxHeight: 520,
                  objectFit: "contain",
                }}
              />
            ) : item.mimeType === "application/pdf" ? (
              <button
  style={copperButton()}
  onClick={() => {
    if (!item.fileData) {
      alert("PDF indisponible");
      return;
    }

    const win = window.open();
    if (win) {
      win.document.write(`
        <iframe
          src="${item.fileData}"
          style="width:100%;height:100vh;border:none;"
        ></iframe>
      `);
    }
  }}
>
  📄 Ouvrir le PDF
</button>
            ) : null}
          </div>
        ))}
      </div>
    )}
  </div>
)}

        {activeTab === "cards" && (
          <NotificationsSection
            COLORS={COLORS}
            deferredPrompt={deferredPrompt}
            setDeferredPrompt={setDeferredPrompt}
            oneSignalReady={oneSignalReady}
            permission={permission}
            optedIn={optedIn}
            subscriptionId={subscriptionId}
            handleEnableNotifications={handleEnableNotifications}
            copperButton={copperButton}
            ghostButton={ghostButton}
            PremiumStatusCard={PremiumStatusCard}
          />
        )}
      </div>
    </div>
  );
}

function inputStyle() {
  return {
    width: "100%",
    padding: "14px 14px",
    borderRadius: "14px",
    border: `1px solid ${COLORS.border}`,
    boxSizing: "border-box",
    fontSize: "15px",
    outline: "none",
    background: COLORS.surfaceSoft,
    color: COLORS.text,
  };
}

function copperButton() {
  return {
    background: "linear-gradient(135deg, #D97A32, #F2A65A)",
    color: "#111111",
    border: "none",
    padding: "13px 18px",
    borderRadius: 14,
    cursor: "pointer",
    fontWeight: 800,
    boxShadow: "0 12px 24px rgba(217,122,50,0.22)",
    fontSize: 14,
  };
}

const copperButtonSmall = () => {
  return {
    background: "linear-gradient(135deg, #D97A32, #F2A65A)",
    color: "#111111",
    border: "none",
    padding: "10px 12px",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 800,
    boxShadow: "0 10px 20px rgba(217,122,50,0.20)",
    fontSize: 13,
  };
};

function ghostButton() {
  return {
    background: "linear-gradient(180deg, #161616, #101010)",
    color: COLORS.text,
    border: `1px solid ${COLORS.border}`,
    padding: "13px 18px",
    borderRadius: 14,
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 14,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
  };
}

function ghostButtonSmall() {
  return {
    background: "linear-gradient(180deg, #161616, #101010)",
    color: COLORS.text,
    border: `1px solid ${COLORS.border}`,
    padding: "10px 12px",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 13,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
  };
}

function reviewButton() {
  return {
    background: "linear-gradient(135deg, #C94B32, #D97A32)",
    color: "#111111",
    border: "none",
    padding: "12px 16px",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 800,
    boxShadow: "0 10px 22px rgba(201,75,50,0.2)",
  };
}

function InfoCard({ label, value, accent }) {
  const isRed = accent === "red";

  return (
    <div
      style={{
        padding: 14,
        borderRadius: 16,
        background: isRed ? "rgba(201,75,50,0.14)" : "rgba(217,122,50,0.12)",
        border: `1px solid ${COLORS.border}`,
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: COLORS.textSoft,
          marginBottom: 6,
          textTransform: "uppercase",
          letterSpacing: 0.8,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 18,
          fontWeight: 800,
          color: isRed ? "#f5b09f" : COLORS.copperLight,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 90,
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${COLORS.border}`,
        borderRadius: 14,
        padding: "10px 12px",
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: COLORS.textSoft,
          textTransform: "uppercase",
          letterSpacing: 0.8,
          marginBottom: 6,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 16,
          fontWeight: 800,
          color: COLORS.goldLight,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function PremiumStatusCard({ label, value, highlight }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        borderRadius: 14,
        background: highlight ? "rgba(217,122,50,0.10)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${highlight ? "rgba(217,122,50,0.30)" : COLORS.border}`,
      }}
    >
      <span
        style={{
          color: COLORS.textSoft,
          fontSize: 14,
        }}
      >
        {label}
      </span>

      <span
        style={{
          color: highlight ? COLORS.copperLight : COLORS.text,
          fontWeight: 800,
          fontSize: 14,
          textAlign: "right",
          wordBreak: "break-all",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function ZoneLine({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        fontSize: 13,
      }}
    >
      <span style={{ color: COLORS.textSoft }}>{label}</span>
      <span style={{ color: COLORS.text, fontWeight: 700, textAlign: "right" }}>
        {value}
      </span>
    </div>
  );
}

