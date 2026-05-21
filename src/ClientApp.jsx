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
  const [apiBusiness, setApiBusiness] = useState(null);
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

  const [geoState, setGeoState] = useState({
    loading: false,
    error: "",
    coords: null,
  });

  const [activeTab, setActiveTab] = useState("offers");
  const [manualBusinessId, setManualBusinessId] = useState(() => {
    return localStorage.getItem(STORAGE_SELECTED_BUSINESS) || null;
  });

  const urlParams = new URLSearchParams(window.location.search);
const businessIdFromUrl = urlParams.get("businessId");

const activeBusinessId =
  businessIdFromUrl ||
  manualBusinessId ||
  clientData?.businessId ||
  programSettings?.businessId ||
  merchantContact?.businessId ||
  "BUS-2";

  useEffect(() => {
    async function loadBusiness() {
      if (!activeBusinessId) return;
      try {
        const response = await fetch(buildApiUrl(`/businesses/${activeBusinessId}`))
        const json = await response.json();

        if (response.ok && json.ok && json.business) {
          const business = json.business;
          const lat = business.latitude != null ? Number(business.latitude) : null;
          const lng = business.longitude != null ? Number(business.longitude) : null;

          setApiBusiness({
            ...business,
            id: business.id || activeBusinessId || "",
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
          });
        }
      } catch (error) {
        console.error("Erreur chargement commerce :", error);
      }
    }

    loadBusiness();
  }, [activeBusinessId]);

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
  activeBusinessId ||
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

  const requestUserLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setGeoState({
        loading: false,
        error: "La géolocalisation n'est pas supportée sur cet appareil.",
        coords: null,
      });
      return;
    }

    setGeoState({
      loading: true,
      error: "",
      coords: null,
    });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoState({
          loading: false,
          error: "",
          coords: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          },
        });
      },
      (error) => {
        let message = "Impossible de récupérer votre position.";

        if (error.code === 1) message = "Vous avez refusé l'accès à la position.";
        if (error.code === 2) message = "Position indisponible actuellement.";
        if (error.code === 3) message = "La demande de géolocalisation a expiré.";

        setGeoState({
          loading: false,
          error: message,
          coords: null,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  }, []);

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
    const list = [];

    if (apiBusiness) {
      list.push(apiBusiness);
    }

    if (
      dynamicBusiness &&
      !list.find((business) => String(business.id) === String(dynamicBusiness.id))
    ) {
      list.push(dynamicBusiness);
    }

    return list;
  }, [apiBusiness, dynamicBusiness]);

  const selectedBusiness = useMemo(() => {
    if (!businesses.length) {
      return { offers: [] };
    }

    if (manualBusinessId) {
      const manualBusiness = businesses.find(
        (business) => String(business.id) === String(manualBusinessId)
      );

      if (manualBusiness) {
        return manualBusiness;
      }
    }

    if (!geoState.coords) {
      return businesses[0];
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
          businessId: selectedBusiness?.id || activeBusinessId || "",
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
          businessId: selectedBusiness?.id || activeBusinessId || "",
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
  console.log("DYNAMIC BUSINESS =", dynamicBusiness);
  console.log("API BUSINESS =", apiBusiness);
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
    points: Number(clientData?.points || clientCard?.points || 0),
    visits: Number(clientData?.visits || clientCard?.visits || 0),
    rewardsAvailable: Number(
      clientData?.rewardsAvailable || clientCard?.rewardsAvailable || 0
    ),
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

      const clientResponse = await fetch(buildApiUrl(`/clients/by-loyalty/${clientId}`));
      const fidelityData = await clientResponse.json();

      console.log("CLIENT FIDELITY DATA =", fidelityData);

      if (fidelityData.ok && fidelityData.client) {
        setClientCard(fidelityData.client);
      }

      setClientBookings(data.bookings || []);
    } catch (error) {
      console.error("Erreur chargement réservations client :", error);
    }
  }, []);

  useEffect(() => {
    console.log("CLIENT DATA BOOKINGS =", clientData);

    const fallbackPhone = localStorage.getItem("zeltyo_last_phone");
    const identifier = clientData?.id || clientData?.phone || fallbackPhone;

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
      : clientPoints > 0 && cyclePoints === 0
      ? 0
      : rewardGoal - cyclePoints;

  const rewardAvailable = clientRewards > 0 || clientPoints >= rewardGoal;

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

  const currentCardId = window.location.pathname.split("/card/")[1];

  const cardUrl = `https://zeltyo-clients.netlify.app/card/${
    currentCardId || client?.loyaltyId || client?.id
  }`;

  const saveClientSubscription = async (newSubscriptionId) => {
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
          country: client.country,
          city: client.city,
          zoneId: client.zoneId,
          businessId: selectedBusiness?.id || activeBusinessId || "",
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
      const status = await enableOneSignalNotifications();

      setOneSignalReady(true);
      setPermission(Boolean(status.permission));
      setOptedIn(Boolean(status.optedIn));
      setSubscriptionId(status.subscriptionId || null);

      if (status.subscriptionId) {
        await saveClientSubscription(status.subscriptionId);
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
              ZoneLine={ZoneLine}
            />

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
                id: selectedBusiness?.id || activeBusinessId || "",
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
          />
        )}

        {activeTab === "commerce" && (
          <div id="commerce-section">
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

function copperButtonSmall() {
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
}

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

export { copperButtonSmall, ghostButtonSmall };
