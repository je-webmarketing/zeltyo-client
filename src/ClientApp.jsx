import { useMemo, useState, useEffect, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  initOneSignal,
  getOneSignalStatus,
  enableOneSignalNotifications,
} from "./lib/onesignal";
import { buildApiUrl } from "./config/api";

const STORAGE_SELECTED_BUSINESS = "zeltyo_selected_business_id";
const STORAGE_SELECTED_ZONE = "zeltyo_selected_zone";
const STORAGE_LOCATION_MODE = "zeltyo_location_mode";
const STORAGE_SELECTED_COUNTRY = "zeltyo_selected_country";
const STORAGE_SELECTED_CITY = "zeltyo_selected_city";
const STORAGE_SELECTED_SECTOR = "zeltyo_selected_sector";

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

const ZONES = [
  {
    id: "geneve-centre",
    country: "CH",
    region: "Genève",
    city: "Genève",
    label: "Genève Centre",
    radiusKm: 1.5,
  },
  {
    id: "lausanne-centre",
    country: "CH",
    region: "Vaud",
    city: "Lausanne",
    label: "Lausanne Centre",
    radiusKm: 2,
  },
  {
    id: "lyon-centre",
    country: "FR",
    region: "Rhône",
    city: "Lyon",
    label: "Lyon Centre",
    radiusKm: 3,
  },
  {
    id: "montpellier-centre",
    country: "FR",
    region: "Hérault",
    city: "Montpellier",
    label: "Montpellier Centre",
    radiusKm: 3,
  },
  {
    id: "paris-centre",
    country: "FR",
    region: "Paris",
    city: "Paris",
    label: "Paris Centre",
    radiusKm: 2,
  },
];

const BUSINESSES = [
  {
    id: "BUS-1",
    name: "Le Café du Centre",
    country: "CH",
    region: "Genève",
    city: "Genève",
    zoneId: "geneve-centre",
    zoneLabel: "Genève Centre",
    radiusKm: 1.5,
    displayRadiusKm: 20,
    rewardGoal: 10,
    rewardLabel: "1 boisson offerte",
    points: 8,
    promo: "Petit-déjeuner -10%",
    color: "#D4AF37",
    description: "Cumulez vos points et débloquez votre récompense premium.",
    address: "12 rue du Centre, Genève",
    lat: 46.2044,
    lng: 6.1432,
    googleMapsUrl: "https://www.google.com/maps?q=46.2044,6.1432",
    reviewUrl:
      "https://search.google.com/local/writereview?placeid=TON_PLACE_ID_1",
    offers: [
      {
        id: "OFF-1",
        title: "Petit-déjeuner -10%",
        description:
          "Profitez d’une remise matinale sur votre formule café + viennoiserie.",
        type: "flash",
        discountLabel: "-10%",
        validToday: true,
        limited: true,
      },
      {
        id: "OFF-2",
        title: "Boisson fidélité",
        description:
          "À partir de 10 passages, une boisson offerte vous attend.",
        type: "reward",
        discountLabel: "Offert",
        validToday: true,
        limited: false,
      },
    ],
  },
  {
    id: "BUS-2",
    name: "Barber Club",
    country: "CH",
    region: "Vaud",
    city: "Lausanne",
    zoneId: "lausanne-centre",
    zoneLabel: "Lausanne Centre",
    radiusKm: 2,
    displayRadiusKm: 20,
    rewardGoal: 6,
    rewardLabel: "1 coupe -50%",
    points: 0,
    promo: "Soin barbe offert",
    color: "#C94B32",
    description: "Profitez d’avantages fidélité exclusifs à chaque passage.",
    address: "8 avenue Centrale, Lausanne",
    lat: 46.5197,
    lng: 6.6323,
    googleMapsUrl: "https://www.google.com/maps?q=46.5197,6.6323",
    reviewUrl:
      "https://search.google.com/local/writereview?placeid=TON_PLACE_ID_2",
    offers: [
      {
        id: "OFF-3",
        title: "Soin barbe offert",
        description: "Pour toute coupe réservée aujourd’hui.",
        type: "flash",
        discountLabel: "Offert",
        validToday: true,
        limited: true,
      },
      {
        id: "OFF-4",
        title: "Coupe fidélité",
        description: "À partir de 6 passages, une coupe à -50%.",
        type: "reward",
        discountLabel: "-50%",
        validToday: true,
        limited: false,
      },
    ],
  },
  {
    id: "BUS-3",
    name: "Boulangerie Signature",
    country: "FR",
    region: "Rhône",
    city: "Lyon",
    zoneId: "lyon-centre",
    zoneLabel: "Lyon Centre",
    radiusKm: 3,
    displayRadiusKm: 20,
    rewardGoal: 8,
    rewardLabel: "1 formule offerte",
    points: 5,
    promo: "Viennoiserie offerte dès 15€",
    color: "#D4AF37",
    description: "Des avantages gourmands à chaque visite dans votre quartier.",
    address: "25 rue de la République, Lyon",
    lat: 45.764,
    lng: 4.8357,
    googleMapsUrl: "https://www.google.com/maps?q=45.764,4.8357",
    reviewUrl:
      "https://search.google.com/local/writereview?placeid=TON_PLACE_ID_3",
    offers: [
      {
        id: "OFF-5",
        title: "Viennoiserie offerte",
        description: "Recevez une viennoiserie offerte dès 15€ d’achat.",
        type: "flash",
        discountLabel: "Offert",
        validToday: true,
        limited: false,
      },
    ],
  },
  {
    id: "BUS-4",
    name: "Maison Gourmande",
    country: "FR",
    region: "Hérault",
    city: "Montpellier",
    zoneId: "montpellier-centre",
    zoneLabel: "Montpellier Centre",
    radiusKm: 3,
    displayRadiusKm: 20,
    rewardGoal: 10,
    rewardLabel: "1 pâtisserie offerte",
    points: 3,
    promo: "Formule déjeuner -15%",
    color: "#D4AF37",
    description: "Des offres gourmandes au cœur de Montpellier.",
    address: "18 place de la Comédie, Montpellier",
    lat: 43.6083,
    lng: 3.8794,
    googleMapsUrl: "https://www.google.com/maps?q=43.6083,3.8794",
    reviewUrl:
      "https://search.google.com/local/writereview?placeid=TON_PLACE_ID_4",
    offers: [
      {
        id: "OFF-6",
        title: "Formule déjeuner -15%",
        description: "Une remise immédiate sur votre formule du midi.",
        type: "flash",
        discountLabel: "-15%",
        validToday: true,
        limited: false,
      },
    ],
  },
  {
    id: "BUS-5",
    name: "Café Lumière",
    country: "FR",
    region: "Paris",
    city: "Paris",
    zoneId: "paris-centre",
    zoneLabel: "Paris Centre",
    radiusKm: 2,
    displayRadiusKm: 20,
    rewardGoal: 12,
    rewardLabel: "1 brunch offert",
    points: 7,
    promo: "Café spécialité -20%",
    color: "#C94B32",
    description: "Une fidélité premium au cœur de Paris.",
    address: "10 rue de Rivoli, Paris",
    lat: 48.8566,
    lng: 2.3522,
    googleMapsUrl: "https://www.google.com/maps?q=48.8566,2.3522",
    reviewUrl:
      "https://search.google.com/local/writereview?placeid=TON_PLACE_ID_5",
    offers: [
      {
        id: "OFF-7",
        title: "Café spécialité -20%",
        description: "Profitez d’une remise sur votre café signature.",
        type: "exclusive",
        discountLabel: "-20%",
        validToday: true,
        limited: false,
      },
    ],
  },
];

function toRad(value) {
  return (value * Math.PI) / 180;
}

function getDistanceKm(lat1, lng1, lat2, lng2) {
  if (
    !Number.isFinite(lat1) ||
    !Number.isFinite(lng1) ||
    !Number.isFinite(lat2) ||
    !Number.isFinite(lng2)
  ) {
    return Infinity;
  }

  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
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
  if (offer.validToday && offer.limited) return "🔥 Aujourd’hui seulement";
  if (offer.validToday) return "Aujourd’hui";
  if (offer.limited) return "Limité";
  return "Disponible";
}

export default function ClientApp() {
  const initialZoneId =
    localStorage.getItem(STORAGE_SELECTED_ZONE) || "geneve-centre";
  const initialZone =
    ZONES.find((z) => z.id === initialZoneId) || ZONES[0] || null;

  const [selectedZone, setSelectedZone] = useState(initialZone?.id || "");
  const [selectedCountry, setSelectedCountry] = useState(
    localStorage.getItem(STORAGE_SELECTED_COUNTRY) ||
      initialZone?.country ||
      "CH"
  );
  const [selectedCity, setSelectedCity] = useState(
    localStorage.getItem(STORAGE_SELECTED_CITY) || initialZone?.city || ""
  );
  const [selectedSector, setSelectedSector] = useState(
    localStorage.getItem(STORAGE_SELECTED_SECTOR) || initialZone?.id || ""
  );

  const [selectedBusinessId, setSelectedBusinessId] = useState(() => {
    return localStorage.getItem(STORAGE_SELECTED_BUSINESS) || "BUS-1";
  });

  const [locationMode, setLocationMode] = useState(() => {
    return localStorage.getItem(STORAGE_LOCATION_MODE) || "auto";
  });

  const [deferredPrompt, setDeferredPrompt] = useState(null);

  const [oneSignalReady, setOneSignalReady] = useState(false);
  const [permission, setPermission] = useState(false);
  const [optedIn, setOptedIn] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState(null);
  const [offerFilter, setOfferFilter] = useState("all");
  const [showAllOffers, setShowAllOffers] = useState(false);

  useEffect(() => {
  const handler = (e) => {
    e.preventDefault();
    console.log("beforeinstallprompt capturé ✅");
    setDeferredPrompt(e);
  };

  window.addEventListener("beforeinstallprompt", handler);

  return () => {
    window.removeEventListener("beforeinstallprompt", handler);
  };
}, []);

  const [geoState, setGeoState] = useState({
    loading: false,
    error: "",
    coords: null,
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_SELECTED_ZONE, selectedZone);
  }, [selectedZone]);

  useEffect(() => {
    localStorage.setItem(STORAGE_SELECTED_BUSINESS, selectedBusinessId);
  }, [selectedBusinessId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_LOCATION_MODE, locationMode);
  }, [locationMode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_SELECTED_COUNTRY, selectedCountry);
  }, [selectedCountry]);

  useEffect(() => {
    localStorage.setItem(STORAGE_SELECTED_CITY, selectedCity);
  }, [selectedCity]);

  useEffect(() => {
    localStorage.setItem(STORAGE_SELECTED_SECTOR, selectedSector);
  }, [selectedSector]);

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

        if (error.code === 1) {
          message = "Vous avez refusé l'accès à la position.";
        } else if (error.code === 2) {
          message = "Position indisponible actuellement.";
        } else if (error.code === 3) {
          message = "La demande de géolocalisation a expiré.";
        }

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
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
  let isMounted = true;

  async function bootOneSignal() {
    try {
      await initOneSignal();
      const status = await getOneSignalStatus();

      if (!isMounted) return;

      setOneSignalReady(true);
      setPermission(Boolean(status.permission));
      setOptedIn(Boolean(status.optedIn));
      setSubscriptionId(status.subscriptionId || null);

      console.log("Permission OneSignal :", status.permission);
      console.log("OneSignal optedIn :", status.optedIn);
      console.log("OneSignal subscriptionId :", status.subscriptionId);
      console.log("OneSignal token :", status.token);
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
    if (locationMode === "auto") {
      requestUserLocation();
    }
  }, [locationMode, requestUserLocation]);

  const businessesWithDistance = useMemo(() => {
    if (!geoState.coords) return [];

    return BUSINESSES.map((business) => {
      const distanceKm = getDistanceKm(
        geoState.coords.lat,
        geoState.coords.lng,
        business.lat,
        business.lng
      );

      return {
        ...business,
        distanceKm,
        isNearby: distanceKm <= (business.displayRadiusKm || 20),
      };
    }).sort((a, b) => a.distanceKm - b.distanceKm);
  }, [geoState.coords]);

  const nearbyBusinesses = useMemo(() => {
    return businessesWithDistance.filter((business) => business.isNearby);
  }, [businessesWithDistance]);

  const nearbyOffers = useMemo(() => {
    const source = businessesWithDistance.length
      ? businessesWithDistance
      : BUSINESSES.map((business) => ({
          ...business,
          distanceKm: Infinity,
          isNearby: false,
        }));

    return source
      .flatMap((business) =>
        (business.offers || []).map((offer) => ({
          ...offer,
          businessId: business.id,
          businessName: business.name,
          city: business.city,
          zoneLabel: business.zoneLabel,
          googleMapsUrl: business.googleMapsUrl,
          distanceKm: business.distanceKm,
          isNearby:
            Number.isFinite(business.distanceKm) &&
            business.distanceKm <= (business.displayRadiusKm || 20),
        }))
      )
      .sort((a, b) => {
        const aDistance = Number.isFinite(a.distanceKm) ? a.distanceKm : 999999;
        const bDistance = Number.isFinite(b.distanceKm) ? b.distanceKm : 999999;
        return aDistance - bDistance;
      });
  }, [businessesWithDistance]);

  const filteredOffers = useMemo(() => {
    if (offerFilter === "all") return nearbyOffers;
    return nearbyOffers.filter((offer) => offer.type === offerFilter);
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

  const availableCountries = useMemo(() => {
    return [...new Set(ZONES.map((z) => z.country))];
  }, []);

  const availableCities = useMemo(() => {
    return [
      ...new Set(
        ZONES.filter((z) => z.country === selectedCountry).map((z) => z.city)
      ),
    ];
  }, [selectedCountry]);

  const availableSectors = useMemo(() => {
    return ZONES.filter(
      (z) => z.country === selectedCountry && z.city === selectedCity
    );
  }, [selectedCountry, selectedCity]);

  const selectedZoneMeta = useMemo(() => {
    return ZONES.find((z) => z.id === selectedZone) || ZONES[0] || null;
  }, [selectedZone]);

  const visibleBusinesses = useMemo(() => {
    return BUSINESSES.filter((b) => b.zoneId === selectedZone);
  }, [selectedZone]);

  const autoSelectedBusiness = useMemo(() => {
    if (locationMode !== "auto") return null;
    if (!geoState.coords) return null;
    if (nearbyBusinesses.length > 0) return nearbyBusinesses[0];
    if (businessesWithDistance.length > 0) return businessesWithDistance[0];
    return null;
  }, [locationMode, geoState.coords, nearbyBusinesses, businessesWithDistance]);

  useEffect(() => {
    if (locationMode !== "manual") return;

    if (!availableCountries.includes(selectedCountry)) {
      const nextCountry = availableCountries[0] || "";
      setSelectedCountry(nextCountry);
    }
  }, [locationMode, availableCountries, selectedCountry]);

  useEffect(() => {
    if (locationMode !== "manual") return;
    if (!selectedCountry) return;

    if (!availableCities.includes(selectedCity)) {
      const nextCity = availableCities[0] || "";
      setSelectedCity(nextCity);
    }
  }, [locationMode, selectedCountry, availableCities, selectedCity]);

  useEffect(() => {
    if (locationMode !== "manual") return;
    if (!selectedCountry || !selectedCity) return;

    const sectorExists = availableSectors.some((z) => z.id === selectedSector);
    if (!sectorExists) {
      const nextSector = availableSectors[0]?.id || "";
      setSelectedSector(nextSector);
    }
  }, [
    locationMode,
    selectedCountry,
    selectedCity,
    availableSectors,
    selectedSector,
  ]);

  useEffect(() => {
    if (locationMode !== "manual") return;
    if (!selectedSector) return;

    if (selectedZone !== selectedSector) {
      setSelectedZone(selectedSector);
    }
  }, [locationMode, selectedSector, selectedZone]);

  useEffect(() => {
    if (locationMode !== "manual") return;
    if (!visibleBusinesses.length) return;

    const exists = visibleBusinesses.some((b) => b.id === selectedBusinessId);
    if (!exists) {
      setSelectedBusinessId(visibleBusinesses[0].id);
    }
  }, [locationMode, visibleBusinesses, selectedBusinessId]);

  useEffect(() => {
    if (!autoSelectedBusiness || locationMode !== "auto") return;

    if (autoSelectedBusiness.zoneId !== selectedZone) {
      setSelectedZone(autoSelectedBusiness.zoneId);
    }

    if (autoSelectedBusiness.id !== selectedBusinessId) {
      setSelectedBusinessId(autoSelectedBusiness.id);
    }

    const zoneMeta = ZONES.find((z) => z.id === autoSelectedBusiness.zoneId);
    if (zoneMeta) {
      if (zoneMeta.country !== selectedCountry) {
        setSelectedCountry(zoneMeta.country);
      }
      if (zoneMeta.city !== selectedCity) {
        setSelectedCity(zoneMeta.city);
      }
      if (zoneMeta.id !== selectedSector) {
        setSelectedSector(zoneMeta.id);
      }
    }
  }, [
    autoSelectedBusiness,
    locationMode,
    selectedZone,
    selectedBusinessId,
    selectedCountry,
    selectedCity,
    selectedSector,
  ]);

  useEffect(() => {
    setShowAllOffers(false);
  }, [selectedBusinessId, selectedZone, offerFilter]);

  const selectedBusiness =
    BUSINESSES.find((b) => b.id === selectedBusinessId) ||
    visibleBusinesses[0] ||
    BUSINESSES[0] ||
    null;

  const progress = selectedBusiness
    ? (selectedBusiness.points / selectedBusiness.rewardGoal) * 100
    : 0;

  if (!selectedBusiness) {
    return <div style={{ color: "#fff", padding: 20 }}>Aucun commerce</div>;
  }

  const client = {
    id: "client-demo-1",
    loyaltyId: "CL-1001",
    name: "Julie",
    phone: "0600000000",
    country: selectedBusiness.country,
    region: selectedBusiness.region,
    city: selectedBusiness.city,
    zoneId: selectedBusiness.zoneId,
    zoneLabel: selectedBusiness.zoneLabel,
    radiusKm: selectedBusiness.radiusKm,
  };

  const cardUrl = `https://zeltyo.netlify.app/card/${client.id}?business=${selectedBusiness.id}&zone=${selectedBusiness.zoneId}`;

  const saveClientSubscription = async (newSubscriptionId) => {
    try {
      console.log("Envoi au backend...");
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
          businessId: selectedBusiness.id,
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
      await initOneSignal();
      const status = await enableOneSignalNotifications();

      const isLocalhost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

if (isLocalhost) {
  alert("OneSignal n'est pas disponible en localhost avec votre configuration actuelle. Testez cette fonction sur Netlify.");
  return;
}

      console.log("Permission OneSignal :", status.permission);
      console.log("OneSignal optedIn :", status.optedIn);
      console.log("OneSignal subscriptionId :", status.subscriptionId);
      console.log("OneSignal token :", status.token);

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

  const rewardRemaining = Math.max(
    selectedBusiness.rewardGoal - selectedBusiness.points,
    0
  );

  const selectedBusinessDistance =
    geoState.coords &&
    Number.isFinite(selectedBusiness.lat) &&
    Number.isFinite(selectedBusiness.lng)
      ? getDistanceKm(
          geoState.coords.lat,
          geoState.coords.lng,
          selectedBusiness.lat,
          selectedBusiness.lng
        )
      : null;

  const visibleOfferCards = useMemo(() => {
    const list = filteredOffers.filter((o) => o.id !== featuredOffer?.id);
    return showAllOffers ? list : list.slice(0, 4);
  }, [filteredOffers, featuredOffer, showAllOffers]);

  const hiddenOffersCount = Math.max(
    filteredOffers.filter((o) => o.id !== featuredOffer?.id).length -
      visibleOfferCards.length,
    0
  );

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
        <div
          style={{
            position: "sticky",
            top: 10,
            zIndex: 20,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              padding: 10,
              borderRadius: 18,
              background: "rgba(11,11,11,0.86)",
              backdropFilter: "blur(10px)",
              border: `1px solid ${COLORS.border}`,
              boxShadow: "0 10px 24px rgba(0,0,0,0.28)",
            }}
          >
            <a href="#offres" style={{ textDecoration: "none" }}>
              <button style={copperButtonSmall()}>Offres</button>
            </a>
            <a href="#carte" style={{ textDecoration: "none" }}>
              <button style={ghostButtonSmall()}>Carte</button>
            </a>
            <a href="#commerce" style={{ textDecoration: "none" }}>
              <button style={ghostButtonSmall()}>Commerce</button>
            </a>
            <a href="#avis" style={{ textDecoration: "none" }}>
              <button style={ghostButtonSmall()}>Avis</button>
            </a>
            <button
              onClick={() =>
                alert("Mes cartes arrive bientôt ✅\nVous pourrez retrouver toutes vos cartes fidélité ici.")
              }
              style={ghostButtonSmall()}
            >
              💳 Mes cartes
            </button>
          </div>
        </div>

        <div
          style={{
            background: "linear-gradient(180deg, #111111, #0B0B0B)",
            border: `1px solid ${COLORS.border}`,
            borderRadius: 28,
            padding: 22,
            boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
            marginBottom: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 18,
            }}
          >
            <div
              style={{
                padding: 10,
                borderRadius: 22,
                background: "linear-gradient(135deg, #FFD700, #B8962E)",
                boxShadow: "0 0 20px rgba(212,175,55,0.35)",
              }}
            >
              <img
                src="/icon-512.png"
                alt="Zeltyo"
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: 18,
                  background: "#000",
                  padding: 12,
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </div>

            <div>
              <div
                style={{
                  fontSize: 34,
                  fontWeight: 900,
                  color: COLORS.goldLight,
                  lineHeight: 1,
                }}
              >
                Zeltyo
              </div>
              <div
                style={{
                  color: COLORS.textSoft,
                  fontSize: 15,
                  marginTop: 8,
                }}
              >
                Votre espace fidélité premium
              </div>
            </div>
          </div>

          <div
            style={{
              display: "inline-block",
              padding: "8px 14px",
              borderRadius: 999,
              background: "rgba(212,175,55,0.12)",
              border: `1px solid ${COLORS.gold}`,
              color: COLORS.goldLight,
              fontWeight: 700,
              fontSize: 13,
              marginBottom: 18,
            }}
          >
            Carte fidélité digitale
          </div>

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
              Commerce actif : {selectedBusiness.name}
            </span>

            <button
              onClick={() =>
                alert("Mes cartes arrive bientôt ✅\nVous pourrez retrouver toutes vos cartes fidélité ici.")
              }
              style={copperButton()}
            >
              💳 Voir mes cartes
            </button>
          </div>
        </div>

        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 22,
            padding: 18,
            marginBottom: 18,
            boxShadow: "0 10px 24px rgba(0,0,0,0.28)",
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: 12,
              color: COLORS.goldLight,
              fontSize: 22,
            }}
          >
            Géolocalisation intelligente
          </h3>

          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={() => setLocationMode("auto")}
                style={{
                  ...(locationMode === "auto" ? copperButton() : ghostButton()),
                  opacity: locationMode === "auto" ? 1 : 0.9,
                }}
              >
                Mode automatique
              </button>

              <button
                onClick={() => setLocationMode("manual")}
                style={{
                  ...ghostButton(),
                  border:
                    locationMode === "manual"
                      ? `1px solid ${COLORS.copper}`
                      : `1px solid ${COLORS.border}`,
                }}
              >
                Choix manuel
              </button>

              <button onClick={requestUserLocation} style={ghostButton()}>
                Actualiser la position
              </button>
            </div>

            {locationMode === "auto" && (
              <div
                style={{
                  padding: 12,
                  borderRadius: 14,
                  background: COLORS.surfaceSoft,
                  border: `1px solid ${COLORS.border}`,
                  display: "grid",
                  gap: 6,
                }}
              >
                <ZoneLine label="Mode" value="Détection automatique" />
                <ZoneLine
                  label="Statut"
                  value={
                    geoState.loading
                      ? "Recherche..."
                      : geoState.error
                      ? geoState.error
                      : geoState.coords
                      ? "Position détectée"
                      : "En attente"
                  }
                />
                {geoState.coords ? (
                  <>
                    <ZoneLine
                      label="Latitude"
                      value={geoState.coords.lat.toFixed(5)}
                    />
                    <ZoneLine
                      label="Longitude"
                      value={geoState.coords.lng.toFixed(5)}
                    />
                    <ZoneLine
                      label="Précision"
                      value={`${Math.round(geoState.coords.accuracy || 0)} m`}
                    />
                  </>
                ) : null}
              </div>
            )}

            {locationMode === "auto" &&
              geoState.coords &&
              businessesWithDistance.length > 0 && (
                <div
                  style={{
                    marginTop: 4,
                    display: "grid",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      color: COLORS.textSoft,
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    Commerces proches
                  </div>

                  {(nearbyBusinesses.length > 0
                    ? nearbyBusinesses
                    : businessesWithDistance.slice(0, 3)
                  ).map((business) => (
                    <div
                      key={business.id}
                      style={{
                        padding: 14,
                        borderRadius: 16,
                        background:
                          business.id === selectedBusiness.id
                            ? "rgba(217,122,50,0.12)"
                            : COLORS.surfaceSoft,
                        border:
                          business.id === selectedBusiness.id
                            ? `1px solid rgba(217,122,50,0.35)`
                            : `1px solid ${COLORS.border}`,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 800 }}>{business.name}</div>
                          <div
                            style={{ color: COLORS.textSoft, fontSize: 13 }}
                          >
                            {business.city} • {business.zoneLabel}
                          </div>
                        </div>

                        <div
                          style={{
                            color: COLORS.copperLight,
                            fontWeight: 800,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {getDistanceLabel(business.distanceKm)}
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: 10,
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          onClick={() => {
                            const zoneMeta = ZONES.find(
                              (z) => z.id === business.zoneId
                            );
                            setLocationMode("manual");
                            setSelectedZone(business.zoneId);
                            setSelectedBusinessId(business.id);
                            if (zoneMeta) {
                              setSelectedCountry(zoneMeta.country);
                              setSelectedCity(zoneMeta.city);
                              setSelectedSector(zoneMeta.id);
                            }
                          }}
                          style={copperButton()}
                        >
                          Choisir
                        </button>

                        <a
                          href={business.googleMapsUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ textDecoration: "none" }}
                        >
                          <button style={ghostButton()}>Itinéraire</button>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </div>

        <div
          id="offres"
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 22,
            padding: 18,
            marginBottom: 18,
            boxShadow: "0 10px 24px rgba(0,0,0,0.28)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "center",
              flexWrap: "wrap",
              marginBottom: 8,
            }}
          >
            <h3
              style={{
                margin: 0,
                color: COLORS.goldLight,
                fontSize: 22,
              }}
            >
              Offres autour de moi
            </h3>

            <a href="#commerce" style={{ textDecoration: "none" }}>
              <button style={ghostButtonSmall()}>Voir le commerce</button>
            </a>
          </div>

          {featuredOffer ? (
            <div
              style={{
                background:
                  "linear-gradient(145deg, rgba(212,175,55,0.16), rgba(255,255,255,0.03) 24%, #0B0B0B 72%)",
                border: "1px solid rgba(212,175,55,0.30)",
                borderRadius: 26,
                padding: 20,
                marginBottom: 18,
                boxShadow:
                  "0 16px 36px rgba(0,0,0,0.35), 0 0 30px rgba(212,175,55,0.18)",
                animation: "pulseGold 2.5s infinite",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -40,
                  right: -40,
                  width: 140,
                  height: 140,
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle, rgba(212,175,55,0.18), transparent 65%)",
                  pointerEvents: "none",
                }}
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 16,
                  flexWrap: "wrap",
                  alignItems: "flex-start",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div
                    style={{
                      display: "inline-block",
                      padding: "8px 12px",
                      borderRadius: 999,
                      background: "rgba(212,175,55,0.12)",
                      border: `1px solid ${COLORS.gold}`,
                      color: COLORS.goldLight,
                      fontWeight: 800,
                      fontSize: 12,
                      marginBottom: 12,
                    }}
                  >
                    Offre star
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: COLORS.textSoft,
                      marginBottom: 6,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                    }}
                  >
                    🔥 Offre la plus intéressante autour de vous
                  </div>

                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 900,
                      color: COLORS.goldLight,
                      marginBottom: 6,
                      lineHeight: 1.1,
                    }}
                  >
                    {featuredOffer.title}
                  </div>

                  <div
                    style={{
                      color: COLORS.text,
                      fontWeight: 700,
                      fontSize: 16,
                      marginBottom: 6,
                    }}
                  >
                    {featuredOffer.businessName}
                  </div>

                  <div
                    style={{
                      color: COLORS.textSoft,
                      lineHeight: 1.6,
                      marginBottom: 14,
                    }}
                  >
                    {featuredOffer.description}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                      marginBottom: 16,
                    }}
                  >
                    <span
                      style={{
                        padding: "7px 10px",
                        borderRadius: 999,
                        background: "rgba(212,175,55,0.12)",
                        border: `1px solid ${COLORS.gold}`,
                        color: COLORS.goldLight,
                        fontWeight: 800,
                        fontSize: 12,
                      }}
                    >
                      {getOfferBadge(featuredOffer.type)}
                    </span>

                    <span
                      style={{
                        padding: "7px 10px",
                        borderRadius: 999,
                        background: "rgba(201,75,50,0.12)",
                        border: "1px solid rgba(201,75,50,0.35)",
                        color: "#f5b09f",
                        fontWeight: 800,
                        fontSize: 12,
                      }}
                    >
                      {getOfferUrgencyLabel(featuredOffer)}
                    </span>

                    <span
                      style={{
                        padding: "7px 10px",
                        borderRadius: 999,
                        background: "rgba(255,255,255,0.04)",
                        border: `1px solid ${COLORS.border}`,
                        color: COLORS.text,
                        fontWeight: 700,
                        fontSize: 12,
                      }}
                    >
                      {Number.isFinite(featuredOffer.distanceKm)
                        ? getDistanceLabel(featuredOffer.distanceKm)
                        : featuredOffer.zoneLabel || "Dans votre zone"}
                    </span>
                  </div>

                  <div
                    style={{
                      color:
                        featuredOffer.type === "flash"
                          ? "#f5b09f"
                          : COLORS.copperLight,
                      fontWeight: 900,
                      fontSize: 18,
                      marginBottom: 16,
                    }}
                  >
                    {featuredOffer.discountLabel}
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button
                      onClick={() => {
                        const business = BUSINESSES.find(
                          (b) => b.id === featuredOffer.businessId
                        );
                        if (!business) return;
                        const zoneMeta = ZONES.find(
                          (z) => z.id === business.zoneId
                        );
                        setLocationMode("manual");
                        setSelectedZone(business.zoneId);
                        setSelectedBusinessId(business.id);
                        if (zoneMeta) {
                          setSelectedCountry(zoneMeta.country);
                          setSelectedCity(zoneMeta.city);
                          setSelectedSector(zoneMeta.id);
                        }
                      }}
                      style={copperButton()}
                    >
                      Voir le commerce
                    </button>

                    <a
                      href={featuredOffer.googleMapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ textDecoration: "none" }}
                    >
                      <button style={ghostButton()}>Itinéraire</button>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <p
            style={{
              marginTop: 0,
              marginBottom: 16,
              color: COLORS.textSoft,
              lineHeight: 1.6,
              fontSize: 14,
            }}
          >
            Découvrez les opportunités disponibles autour de vous, classées par
            proximité.
          </p>

          <div
            style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}
          >
            <button
              onClick={() => setOfferFilter("all")}
              style={{
                ...(offerFilter === "all" ? copperButton() : ghostButton()),
                padding: "10px 14px",
              }}
            >
              Toutes
            </button>

            <button
              onClick={() => setOfferFilter("flash")}
              style={{
                ...(offerFilter === "flash" ? copperButton() : ghostButton()),
                padding: "10px 14px",
              }}
            >
              Offres flash
            </button>

            <button
              onClick={() => setOfferFilter("reward")}
              style={{
                ...(offerFilter === "reward" ? copperButton() : ghostButton()),
                padding: "10px 14px",
              }}
            >
              Récompenses
            </button>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            {filteredOffers.length === 0 ? (
              <div
                style={{
                  padding: 16,
                  borderRadius: 16,
                  background: COLORS.surfaceSoft,
                  border: `1px solid ${COLORS.border}`,
                  color: COLORS.textSoft,
                }}
              >
                Aucune offre disponible pour le moment.
              </div>
            ) : (
              visibleOfferCards.map((offer) => (
                <div
                  key={offer.id}
                  style={{
                    padding: 16,
                    borderRadius: 18,
                    background: offer.isNearby
                      ? "rgba(217,122,50,0.10)"
                      : COLORS.surfaceSoft,
                    border: offer.isNearby
                      ? "1px solid rgba(217,122,50,0.30)"
                      : `1px solid ${COLORS.border}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                      marginBottom: 10,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          color: COLORS.goldLight,
                          fontWeight: 800,
                          fontSize: 20,
                          marginBottom: 4,
                        }}
                      >
                        {offer.title}
                      </div>

                      <div
                        style={{
                          color: COLORS.text,
                          fontWeight: 700,
                          marginBottom: 4,
                        }}
                      >
                        {offer.businessName}
                      </div>

                      <div
                        style={{
                          color: COLORS.textSoft,
                          fontSize: 13,
                        }}
                      >
                        {offer.city} • {offer.zoneLabel}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gap: 8,
                        justifyItems: "end",
                      }}
                    >
                      <span
                        style={{
                          padding: "7px 10px",
                          borderRadius: 999,
                          background: "rgba(212,175,55,0.12)",
                          border: `1px solid ${COLORS.gold}`,
                          color: COLORS.goldLight,
                          fontWeight: 800,
                          fontSize: 12,
                        }}
                      >
                        {getOfferBadge(offer.type)}
                      </span>

                      <span
                        style={{
                          padding: "7px 10px",
                          borderRadius: 999,
                          background: "rgba(201,75,50,0.12)",
                          border: "1px solid rgba(201,75,50,0.35)",
                          color: "#f5b09f",
                          fontWeight: 800,
                          fontSize: 12,
                        }}
                      >
                        {getOfferUrgencyLabel(offer)}
                      </span>

                      <span
                        style={{
                          padding: "7px 10px",
                          borderRadius: 999,
                          background: "rgba(255,255,255,0.04)",
                          border: `1px solid ${COLORS.border}`,
                          color: COLORS.text,
                          fontWeight: 700,
                          fontSize: 12,
                        }}
                      >
                        {Number.isFinite(offer.distanceKm)
                          ? getDistanceLabel(offer.distanceKm)
                          : offer.zoneLabel || "Dans votre zone"}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      color: COLORS.textSoft,
                      lineHeight: 1.6,
                      marginBottom: 14,
                    }}
                  >
                    {offer.description}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        color:
                          offer.type === "flash"
                            ? "#f5b09f"
                            : COLORS.copperLight,
                        fontWeight: 800,
                        fontSize: 14,
                      }}
                    >
                      {offer.discountLabel}
                    </div>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button
                        onClick={() => {
                          const business = BUSINESSES.find(
                            (b) => b.id === offer.businessId
                          );
                          if (!business) return;
                          const zoneMeta = ZONES.find(
                            (z) => z.id === business.zoneId
                          );
                          setLocationMode("manual");
                          setSelectedZone(business.zoneId);
                          setSelectedBusinessId(business.id);
                          if (zoneMeta) {
                            setSelectedCountry(zoneMeta.country);
                            setSelectedCity(zoneMeta.city);
                            setSelectedSector(zoneMeta.id);
                          }
                        }}
                        style={copperButton()}
                      >
                        Voir le commerce
                      </button>

                      <a
                        href={offer.googleMapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ textDecoration: "none" }}
                      >
                        <button style={ghostButton()}>Itinéraire</button>
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {filteredOffers.filter((o) => o.id !== featuredOffer?.id).length > 4 ? (
            <div style={{ marginTop: 16 }}>
              <button
                onClick={() => setShowAllOffers((prev) => !prev)}
                style={copperButton()}
              >
                {showAllOffers
                  ? "Voir moins"
                  : hiddenOffersCount > 0
                  ? `Voir plus (${hiddenOffersCount})`
                  : "Voir toutes les offres"}
              </button>
            </div>
          ) : null}
        </div>

        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 22,
            padding: 18,
            marginBottom: 18,
            boxShadow: "0 10px 24px rgba(0,0,0,0.28)",
          }}
        >
          <label
            style={{
              display: "block",
              fontSize: 13,
              color: COLORS.textSoft,
              marginBottom: 8,
              fontWeight: 700,
            }}
          >
            Pays
          </label>

          <select
            value={selectedCountry}
            onChange={(e) => {
              const nextCountry = e.target.value;
              const nextCities = [
                ...new Set(
                  ZONES.filter((z) => z.country === nextCountry).map(
                    (z) => z.city
                  )
                ),
              ];
              const nextCity = nextCities[0] || "";
              const nextSectorMeta =
                ZONES.find(
                  (z) => z.country === nextCountry && z.city === nextCity
                ) || null;

              setLocationMode("manual");
              setSelectedCountry(nextCountry);
              setSelectedCity(nextCity);
              setSelectedSector(nextSectorMeta?.id || "");
              setSelectedZone(nextSectorMeta?.id || "");
              setSelectedBusinessId("");
            }}
            style={inputStyle()}
          >
            {availableCountries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>

          <label
            style={{
              display: "block",
              fontSize: 13,
              color: COLORS.textSoft,
              marginTop: 14,
              marginBottom: 8,
              fontWeight: 700,
            }}
          >
            Ville
          </label>

          <select
            value={selectedCity}
            onChange={(e) => {
              const nextCity = e.target.value;
              const nextSectorMeta =
                ZONES.find(
                  (z) => z.country === selectedCountry && z.city === nextCity
                ) || null;

              setLocationMode("manual");
              setSelectedCity(nextCity);
              setSelectedSector(nextSectorMeta?.id || "");
              setSelectedZone(nextSectorMeta?.id || "");
              setSelectedBusinessId("");
            }}
            style={inputStyle()}
          >
            {availableCities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>

          <label
            style={{
              display: "block",
              fontSize: 13,
              color: COLORS.textSoft,
              marginTop: 14,
              marginBottom: 8,
              fontWeight: 700,
            }}
          >
            Secteur
          </label>

          <select
            value={selectedSector}
            onChange={(e) => {
              setLocationMode("manual");
              setSelectedSector(e.target.value);
              setSelectedZone(e.target.value);
              setSelectedBusinessId("");
            }}
            style={inputStyle()}
          >
            {availableSectors.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.label}
              </option>
            ))}
          </select>

          {selectedZoneMeta && (
            <div
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 14,
                background: COLORS.surfaceSoft,
                border: `1px solid ${COLORS.border}`,
                display: "grid",
                gap: 6,
              }}
            >
              <ZoneLine label="Pays" value={selectedZoneMeta.country} />
              <ZoneLine label="Ville" value={selectedZoneMeta.city} />
              <ZoneLine label="Secteur" value={selectedZoneMeta.label} />
              <ZoneLine label="Rayon" value={`${selectedZoneMeta.radiusKm} km`} />
            </div>
          )}

          <label
            style={{
              display: "block",
              fontSize: 13,
              color: COLORS.textSoft,
              marginTop: 14,
              marginBottom: 8,
              fontWeight: 700,
            }}
          >
            Commerce
          </label>

          <select
            value={selectedBusiness.id}
            onChange={(e) => {
              setLocationMode("manual");
              setSelectedBusinessId(e.target.value);
            }}
            style={inputStyle()}
          >
            {visibleBusinesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div
          id="carte"
          style={{
            background: "linear-gradient(135deg, #111111, #161616)",
            border: `1px solid ${COLORS.border}`,
            borderRadius: 24,
            padding: 22,
            marginBottom: 18,
            boxShadow: "0 12px 28px rgba(0,0,0,0.32)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 14,
                  color: COLORS.textSoft,
                  marginBottom: 6,
                }}
              >
                Progression fidélité
              </div>
              <div
                style={{
                  fontSize: 30,
                  fontWeight: 900,
                  color: COLORS.goldLight,
                }}
              >
                {selectedBusiness.points} / {selectedBusiness.rewardGoal}
              </div>
            </div>

            <div
              style={{
                padding: "8px 12px",
                borderRadius: 999,
                background: "rgba(212,175,55,0.12)",
                border: `1px solid ${COLORS.gold}`,
                color: COLORS.goldLight,
                fontWeight: 700,
                fontSize: 13,
                whiteSpace: "nowrap",
              }}
            >
              {rewardRemaining === 0
                ? "Récompense atteinte"
                : `${rewardRemaining} point(s) restants`}
            </div>
          </div>

          <div
            style={{
              background: "#222",
              height: 14,
              borderRadius: 999,
              overflow: "hidden",
              marginBottom: 14,
              border: `1px solid ${COLORS.border}`,
            }}
          >
            <div
              style={{
                width: `${Math.min(progress, 100)}%`,
                background: "linear-gradient(90deg, #D97A32, #F2A65A)",
                height: "100%",
                borderRadius: 999,
                boxShadow: "0 0 14px rgba(217,122,50,0.35)",
              }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gap: 12,
            }}
          >
            <InfoCard
              label="Récompense"
              value={selectedBusiness.rewardLabel}
            />
            <InfoCard
              label="Offre du moment"
              value={selectedBusiness.promo}
              accent="red"
            />
          </div>
        </div>

        <div
          style={{
            background:
              "linear-gradient(145deg, rgba(212,175,55,0.18), rgba(255,255,255,0.02) 24%, #0A0A0A 72%)",
            border: "1px solid rgba(212,175,55,0.32)",
            borderRadius: 32,
            padding: 24,
            marginBottom: 18,
            boxShadow:
              "0 18px 40px rgba(0,0,0,0.46), 0 0 26px rgba(212,175,55,0.08), inset 0 1px 0 rgba(255,255,255,0.03)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -60,
              right: -60,
              width: 180,
              height: 180,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(212,175,55,0.18), transparent 65%)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 16,
              flexWrap: "wrap",
              marginBottom: 18,
              position: "relative",
              zIndex: 1,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: COLORS.textSoft,
                  textTransform: "uppercase",
                  letterSpacing: 1.4,
                  marginBottom: 8,
                }}
              >
                Carte client premium
              </div>

              <div
                style={{
                  fontSize: 30,
                  fontWeight: 900,
                  color: COLORS.goldLight,
                  marginBottom: 6,
                }}
              >
                {client.name}
              </div>

              <div
                style={{
                  color: COLORS.text,
                  fontWeight: 700,
                  fontSize: 16,
                  marginBottom: 4,
                }}
              >
                {selectedBusiness.name}
              </div>

              <div style={{ color: COLORS.textSoft, lineHeight: 1.6 }}>
                {selectedBusiness.city} • {selectedBusiness.region} •{" "}
                {selectedBusiness.country}
              </div>

              <div style={{ color: COLORS.textSoft, lineHeight: 1.6 }}>
                {selectedZoneMeta?.label} • Rayon {selectedBusiness.radiusKm} km
              </div>

              {selectedBusinessDistance != null ? (
                <div style={{ color: COLORS.textSoft, lineHeight: 1.6 }}>
                  Distance estimée • {formatDistance(selectedBusinessDistance)}
                </div>
              ) : null}
            </div>

            <div
              style={{
                padding: "9px 14px",
                borderRadius: 999,
                background: "rgba(217,122,50,0.12)",
                border: `1px solid ${COLORS.copper}`,
                color: COLORS.copperLight,
                fontWeight: 800,
                fontSize: 14,
                boxShadow: "0 0 12px rgba(217,122,50,0.12)",
              }}
            >
              {selectedBusiness.points} points
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 0.9fr",
              gap: 16,
              alignItems: "stretch",
              position: "relative",
              zIndex: 1,
            }}
          >
            <div
              style={{
                background: "rgba(255,255,255,0.02)",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 20,
                padding: 18,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: COLORS.textSoft,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 8,
                }}
              >
                Identifiant fidélité
              </div>

              <div
                style={{
                  fontSize: 24,
                  fontWeight: 900,
                  color: COLORS.goldLight,
                  letterSpacing: 1.2,
                  marginBottom: 14,
                }}
              >
                {client.loyaltyId}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  marginBottom: 12,
                  flexWrap: "wrap",
                }}
              >
                <MiniStat
                  label="Points"
                  value={`${selectedBusiness.points}/${selectedBusiness.rewardGoal}`}
                />
                <MiniStat
                  label="Restants"
                  value={rewardRemaining === 0 ? "0" : String(rewardRemaining)}
                />
              </div>

              <div
                style={{
                  background: "#1A1A1A",
                  height: 12,
                  borderRadius: 999,
                  overflow: "hidden",
                  border: `1px solid ${COLORS.border}`,
                  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.35)",
                }}
              >
                <div
                  style={{
                    width: `${Math.min(progress, 100)}%`,
                    background: "linear-gradient(90deg, #D97A32, #F2A65A)",
                    height: "100%",
                    borderRadius: 999,
                    boxShadow: "0 0 16px rgba(217,122,50,0.28)",
                  }}
                />
              </div>

              <div
                style={{
                  marginTop: 14,
                  color: COLORS.textSoft,
                  lineHeight: 1.5,
                  fontSize: 14,
                }}
              >
                {rewardRemaining === 0
                  ? "Votre récompense premium est disponible."
                  : `${rewardRemaining} point(s) encore pour débloquer votre récompense.`}
              </div>
            </div>

            <div
              style={{
                background: COLORS.blackCard,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 20,
                padding: 16,
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                minHeight: 230,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: COLORS.textSoft,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 12,
                }}
              >
                QR fidélité
              </div>

              <div
                style={{
                  background: "#ffffff",
                  padding: 12,
                  borderRadius: 18,
                  boxShadow: "0 12px 24px rgba(0,0,0,0.25)",
                  marginBottom: 12,
                }}
              >
                <QRCodeSVG
                  value={cardUrl}
                  size={120}
                  bgColor="#FFFFFF"
                  fgColor="#111111"
                  level="H"
                  includeMargin={false}
                />
              </div>

              <div
                style={{
                  color: COLORS.textSoft,
                  fontSize: 12,
                  lineHeight: 1.5,
                  maxWidth: 160,
                }}
              >
                Présentez ce QR code en caisse pour identifier votre carte.
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            background: "linear-gradient(180deg, #101010, #0B0B0B)",
            border: `1px solid ${COLORS.border}`,
            borderRadius: 24,
            padding: 20,
            marginBottom: 18,
            boxShadow: "0 12px 28px rgba(0,0,0,0.30)",
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: 8,
              color: COLORS.goldLight,
              fontSize: 22,
            }}
          >
            Notifications premium
          </h3>

          <p
            style={{
              marginTop: 0,
              marginBottom: 16,
              color: COLORS.textSoft,
              lineHeight: 1.6,
              fontSize: 14,
            }}
          >
            Recevez vos offres, récompenses et rappels utiles au bon moment.
          </p>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={handleEnableNotifications} style={copperButton()}>
              Recevoir mes offres
            </button>

           {deferredPrompt && (
  <button
    onClick={async () => {
  try {
    if (!deferredPrompt) {
      alert(
        "Installation non proposée pour le moment. Vérifiez le manifest, le service worker ou utilisez le menu du navigateur."
      );
      return;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    console.log("Choix installation :", choice);
    setDeferredPrompt(null);
  } catch (error) {
    console.error("Erreur installation :", error);
    alert("Impossible de lancer l'installation pour le moment.");
  }
}}
    style={ghostButton()}
  >
    Installer Zeltyo
  </button>
)}
          </div>

          <div
            style={{
              marginTop: 18,
              display: "grid",
              gap: 10,
            }}
          >
            <PremiumStatusCard
              label="OneSignal"
              value={oneSignalReady ? "Prêt" : "Chargement"}
              highlight={oneSignalReady}
            />
            <PremiumStatusCard
              label="Notifications"
              value={permission ? "Activées" : "Non activées"}
              highlight={permission}
            />
            <PremiumStatusCard
              label="Offres et récompenses"
              value={optedIn ? "Réception active" : "En attente d’activation"}
              highlight={optedIn}
            />
            <PremiumStatusCard
              label="Subscription ID"
              value={subscriptionId || "aucun"}
              highlight={Boolean(subscriptionId)}
            />
            <PremiumStatusCard
              label="Installation"
              value={
                deferredPrompt
                  ? "Disponible"
                  : "Déjà installée ou non proposée"
              }
              highlight={Boolean(deferredPrompt)}
            />
          </div>
        </div>

        <div
          id="commerce"
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 22,
            padding: 18,
            marginBottom: 18,
            boxShadow: "0 10px 24px rgba(0,0,0,0.28)",
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: 14,
              color: COLORS.goldLight,
              fontSize: 22,
            }}
          >
            📍 Localisation du commerce
          </h3>

          <p style={{ color: COLORS.text, fontWeight: 700, marginBottom: 6 }}>
            {selectedBusiness.name}
          </p>

          <p style={{ color: COLORS.textSoft, marginTop: 0 }}>
            {selectedBusiness.address}
          </p>

          <p style={{ color: COLORS.textSoft, marginTop: 0 }}>
            {selectedBusiness.city} • {selectedBusiness.region} •{" "}
            {selectedBusiness.country} • {selectedZoneMeta?.label} • Rayon{" "}
            {selectedBusiness.radiusKm} km
          </p>

          {selectedBusinessDistance != null ? (
            <p style={{ color: COLORS.textSoft, marginTop: 0 }}>
              Distance estimée depuis vous • {formatDistance(selectedBusinessDistance)}
            </p>
          ) : null}

          <iframe
            src={`https://www.google.com/maps?q=${selectedBusiness.lat},${selectedBusiness.lng}&z=15&output=embed`}
            width="100%"
            height="220"
            style={{
              border: 0,
              borderRadius: 16,
              marginTop: 12,
            }}
            allowFullScreen=""
            loading="lazy"
            title={`map-${selectedBusiness.id}`}
          />

          <div style={{ marginTop: 14 }}>
            <a
              href={selectedBusiness.googleMapsUrl}
              target="_blank"
              rel="noreferrer"
            >
              <button style={copperButton()}>Voir sur Google Maps</button>
            </a>
          </div>
        </div>

        <div
          id="avis"
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 22,
            padding: 18,
            boxShadow: "0 10px 24px rgba(0,0,0,0.28)",
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: 14,
              color: COLORS.goldLight,
              fontSize: 22,
            }}
          >
            Avis Google
          </h3>

          <p style={{ color: COLORS.textSoft, lineHeight: 1.6 }}>
            Donnez votre avis après votre passage et aidez votre commerce préféré
            à gagner en visibilité.
          </p>

          <a
            href={selectedBusiness.reviewUrl}
            target="_blank"
            rel="noreferrer"
          >
            <button style={reviewButton()}>⭐ Laisser un avis</button>
          </a>
        </div>
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
        background: highlight
          ? "rgba(217,122,50,0.10)"
          : "rgba(255,255,255,0.03)",
        border: `1px solid ${
          highlight ? "rgba(217,122,50,0.30)" : COLORS.border
        }`,
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