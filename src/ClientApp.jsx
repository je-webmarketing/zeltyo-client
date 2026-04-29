import { useMemo, useState, useEffect, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  initOneSignal,
  getOneSignalStatus,
  enableOneSignalNotifications,
} from "./lib/onesignal";
import { buildApiUrl } from "./config/api";
import BookingForm from "./components/BookingForm";


const STORAGE_MERCHANT_CONTACT = "zeltyo_merchant_contact";
const STORAGE_PROGRAM_SETTINGS = "zeltyo_program_settings";
const STORAGE_PROMOTIONS = "zeltyo_promotions";
const STORAGE_CUSTOMERS = "zeltyo_customers";
const STORAGE_MENU = "zeltyo_menu";
const STORAGE_MENU_IMAGE = "merchant_menu_image";

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
  try {
    const rawMerchantContact = localStorage.getItem(STORAGE_MERCHANT_CONTACT);
    const rawProgramSettings = localStorage.getItem(STORAGE_PROGRAM_SETTINGS);
    const rawPromotions = localStorage.getItem(STORAGE_PROMOTIONS);

    if (rawMerchantContact) {
      setMerchantContact(JSON.parse(rawMerchantContact));
    }

    if (rawProgramSettings) {
      setProgramSettings(JSON.parse(rawProgramSettings));
    }

    if (rawPromotions) {
      setMerchantPromotions(JSON.parse(rawPromotions));
    }
  } catch (error) {
    console.error("Erreur lecture données commerçant côté client :", error);
  }
}, []);

  const [geoState, setGeoState] = useState({
    loading: false,
    error: "",
    coords: null,
  });

 
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

const dynamicBusiness = useMemo(() => {
  if (!merchantContact && !programSettings) return null;

  const activePromotions = merchantPromotions.filter(
    (p) => p.status === "Active"
  );

  const name = merchantContact?.shopName || "Mon Commerce";
  const address = merchantContact?.address || "";
  const city =
    merchantContact?.city ||
    programSettings?.locationSettings?.city ||
    "";
  const country =
    merchantContact?.country ||
    programSettings?.locationSettings?.country ||
    "";

  const lat = programSettings?.locationSettings?.latitude
    ? Number(programSettings.locationSettings.latitude)
    : null;

  const lng = programSettings?.locationSettings?.longitude
    ? Number(programSettings.locationSettings.longitude)
    : null;

  const hasCoordinates = lat && lng;

  const businessQuery = encodeURIComponent(
    [name, address, city, country].filter(Boolean).join(", ")
  );

  // ✅ MAP URL (fix)
  const googleMapsUrl = hasCoordinates
    ? `https://www.google.com/maps?q=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${businessQuery}`;

  // ✅ AVIS GOOGLE (fix réel)
  const reviewUrl = `https://www.google.com/search?q=${businessQuery}`;

  return {
    id: programSettings?.businessId || "BUS-DYNAMIC",
    name,
    address,
    city,
    country,
    zoneId: "dynamic-zone",
    zoneLabel: programSettings?.locationSettings?.zoneLabel || "",
    radiusKm: Number(programSettings?.locationSettings?.radiusKm || 0),
    displayRadiusKm: Number(programSettings?.locationSettings?.radiusKm || 20),
    rewardGoal: Number(programSettings?.rewardGoal || 10),
    rewardLabel: programSettings?.rewardLabel || "1 récompense",
    points: 0,
    promo: activePromotions[0]?.title || "Aucune promotion active",
    color: programSettings?.primaryColor || "#D4AF37",
    description: "Retrouvez vos avantages fidélité et vos offres en cours.",
    lat,
    lng,
    hasCoordinates,
    googleMapsUrl,
    reviewUrl,

    offers: activePromotions.map((promo, index) => ({
      id: promo.id || `PROMO-${index + 1}`,
      title: promo.title,
      description: promo.description,
      type: "flash",
      discountLabel: promo.code || "Offre",
      validToday: true,
      limited: false,
      ctaLabel: promo.ctaLabel || "",
      ctaUrl: promo.ctaUrl || "",
      businessId: "BUS-DYNAMIC",
      businessName: name,
      city,
      zoneLabel: programSettings?.locationSettings?.zoneLabel || "",
      googleMapsUrl,
      distanceKm:
        geoState.coords && lat && lng
          ? getDistanceKm(
              geoState.coords.lat,
              geoState.coords.lng,
              lat,
              lng
            )
          : Infinity,
      isNearby: true,
    })),
  };
}, [merchantContact, programSettings, merchantPromotions, geoState.coords]);

const selectedBusiness = dynamicBusiness || {
  offers: [],
};
if (!selectedBusiness) {
  return (
    <div style={{ color: "#fff", padding: 20 }}>
      Chargement...
    </div>
  );
}


const selectedBusinessDistance =
  geoState.coords &&
  selectedBusiness?.lat != null &&
  selectedBusiness?.lng != null
    ? getDistanceKm(
        geoState.coords.lat,
        geoState.coords.lng,
        selectedBusiness.lat,
        selectedBusiness.lng
      )
    : null;

const nearbyOffers = selectedBusiness?.offers || [];

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

useEffect(() => {
  try {
    const savedMenu = JSON.parse(localStorage.getItem(STORAGE_MENU) || "[]");
    const savedMenuImage = localStorage.getItem(STORAGE_MENU_IMAGE) || "";

    setMenuItems(Array.isArray(savedMenu) ? savedMenu : []);
    setMenuImage(savedMenuImage);
  } catch {
    setMenuItems([]);
    setMenuImage("");
  }
}, []);


if (!selectedBusiness) {
  return <div style={{ color: "#fff", padding: 20 }}>Aucun commerce</div>;
}

const client = {
  id: clientData?.id || "",
  loyaltyId: clientData?.loyaltyId || clientData?.id || "",
  name: clientData?.name || "Client",
  phone: clientData?.phone || "",
  email: clientData?.email || "",
  country: selectedBusiness.country,
  region: selectedBusiness.region,
  city: selectedBusiness.city,
  zoneId: selectedBusiness.zoneId,
  zoneLabel: selectedBusiness.zoneLabel,
  radiusKm: selectedBusiness.radiusKm,
  points: Number(clientData?.points || 0),
  visits: Number(clientData?.visits || 0),
  rewardsAvailable: Number(clientData?.rewardsAvailable || 0),
};

    const loadClientBookings = useCallback(async (clientId) => {
  try {
    if (!clientId) return;

    const response = await fetch(buildApiUrl(`/bookings/by-client/${clientId}`));
    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || "Erreur chargement réservations client");
    }

    setClientBookings(data.bookings || []);
  } catch (error) {
    console.error("Erreur chargement réservations client :", error);
  }
}, []);   

const clientPoints = Number(client?.points || 0);
const clientVisits = Number(client?.visits || 0);
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

useEffect(() => {
  if (clientData?.id) {
    loadClientBookings(clientData.id);
  }
}, [clientData?.id, loadClientBookings]);

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
  console.log("cardUrl =", cardUrl);
  console.log("clientData =", clientData);
console.log("clientPoints =", clientPoints);

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
      console.log("DeferredPrompt =", deferredPrompt);

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
            <a href={selectedBusiness.reviewUrl} target="_blank">
  <button style={reviewButton()}>⭐ Voir les avis</button>
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
    padding: 0,
    borderRadius: 22,
    background: "transparent",
    boxShadow: "none",
  }}
>
  <img
    src="/icon-512.png"
    alt="Zeltyo"
    style={{
      width: 145,
height: 145,
      borderRadius: 22,
      background: "transparent",
      padding: 0,
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

         {/* MENU IMAGE */}
{menuImage && (
  <div style={{ marginTop: "20px" }}>
    <h3 style={{ fontSize: "18px", fontWeight: 900 }}>
      📸 Notre carte
    </h3>

    <img
      src={menuImage}
      alt="Menu"
      style={{
        width: "100%",
        borderRadius: "16px",
        marginTop: "10px",
      }}
    />
  </div>
)}

{/* MENU PRODUITS */}
{menuItems.length > 0 && (
  <div style={{ marginTop: "24px" }}>
    <h3 style={{ fontSize: "18px", fontWeight: 900 }}>
      🍽️ Nos produits
    </h3>

    {menuItems
      .filter((item) => item.active)
      .map((item) => (
        <div
          key={item.id}
          style={{
            padding: "12px",
            borderBottom: "1px solid #333",
          }}
        >
          <div style={{ fontWeight: 800 }}>{item.name}</div>
          <div style={{ color: "#aaa" }}>{item.description}</div>
          <div style={{ fontWeight: 700 }}>
            {Number(item.price).toFixed(2)} €
          </div>
        </div>
      ))}
  </div>
)} 

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

           {locationMode === "auto" && geoState.coords && (
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
      Commerce détecté
    </div>

    <div
      style={{
        padding: 14,
        borderRadius: 16,
        background: "rgba(217,122,50,0.12)",
        border: `1px solid rgba(217,122,50,0.35)`,
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
          <div style={{ fontWeight: 800 }}>{selectedBusiness.name}</div>
          <div style={{ color: COLORS.textSoft, fontSize: 13 }}>
            {selectedBusiness.city} •{" "}
            {selectedBusiness.zoneLabel || "Zone non renseignée"}
          </div>
        </div>

        <div
          style={{
            color: COLORS.copperLight,
            fontWeight: 800,
            whiteSpace: "nowrap",
          }}
        >
          {selectedBusinessDistance !== null
            ? getDistanceLabel(selectedBusinessDistance)
            : "Distance non disponible"}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <a
          href={selectedBusiness.googleMapsUrl}
          target="_blank"
          rel="noreferrer"
          style={{ textDecoration: "none" }}
        >
          <button style={ghostButton()}>Itinéraire</button>
        </a>
      </div>
    </div>
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

          <a
  href="#commerce"
  style={{ textDecoration: "none" }}
>
  <button style={copperButton()}>
    Voir le commerce
  </button>
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
                   <a href="#commerce" style={{ textDecoration: "none" }}>
  <button style={copperButton()}>
    Voir le commerce
  </button>
</a>
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

                  {offer.ctaUrl && (
  <div style={{ marginBottom: 14 }}>
    <button
      style={copperButton()}
      onClick={() => window.open(offer.ctaUrl, "_blank")}
    >
      {offer.ctaLabel || "Voir l'offre"}
    </button>
  </div>
)}

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
                      <a href="#commerce" style={{ textDecoration: "none" }}>
  <button style={copperButton()}>
    Voir le commerce
  </button>
</a>
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

<div style={inputStyle()}>
  {selectedBusiness.country || "Non renseigné"}
</div>

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

<div style={inputStyle()}>
  {selectedBusiness.city || "Non renseigné"}
</div>

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

<div style={inputStyle()}>
  {selectedBusiness.zoneLabel || "Zone non renseignée"}
</div>

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
  <ZoneLine
    label="Pays"
    value={selectedBusiness.country || "Non renseigné"}
  />
  <ZoneLine
    label="Ville"
    value={selectedBusiness.city || "Non renseigné"}
  />
  <ZoneLine
    label="Secteur"
    value={selectedBusiness.zoneLabel || "Zone non renseignée"}
  />
  <ZoneLine
    label="Rayon"
    value={`${selectedBusiness.radiusKm || 0} km`}
  />
</div>
          <div
  style={{
    padding: "14px",
    borderRadius: "14px",
    border: `1px solid ${COLORS.border}`,
    background: COLORS.surfaceSoft,
    color: COLORS.text,
    fontWeight: 700,
  }}
>
  {selectedBusiness.name}
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
      marginBottom: 14,
      color: COLORS.goldLight,
      fontSize: 22,
    }}
  >
    Créer ma carte fidélité
  </h3>

  <div style={{ display: "grid", gap: 12 }}>
    <input
      type="text"
      placeholder="Nom"
      value={name}
      onChange={(e) => setName(e.target.value)}
      style={inputStyle()}
    />

    <input
      type="email"
      placeholder="Email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      style={inputStyle()}
    />

    <input
      type="text"
      placeholder="Téléphone"
      value={phone}
      onChange={(e) => setPhone(e.target.value)}
      style={inputStyle()}
    />

    <button onClick={createClient} style={copperButton()}>
      Créer une carte fidélité
    </button>
  </div>
</div>

<BookingForm
  selectedBusiness={{
    ...selectedBusiness,
    id: "BUS-2",
    menu: menuItems,
    phone: merchantContact?.phone || "",
  }}
  clientData={client}
/>

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
      marginBottom: 14,
      color: COLORS.goldLight,
      fontSize: 22,
    }}
  >
    Mes réponses de réservation
  </h3>

  {clientBookings.length === 0 ? (
    <p style={{ color: COLORS.textSoft }}>
      Aucune réponse de réservation pour le moment.
    </p>
  ) : (
    <div style={{ display: "grid", gap: 12 }}>
      {clientBookings.map((booking) => {
        const statusLabel =
          booking.status === "pending"
            ? "En attente"
            : booking.status === "confirmed"
            ? "Confirmée"
            : booking.status === "cancelled"
            ? "Refusée"
            : booking.status;

        return (
          <div
            key={booking.id}
            style={{
              border: `1px solid ${COLORS.border}`,
              borderRadius: 16,
              padding: 14,
              background: COLORS.surfaceSoft,
            }}
          >
            <div
              style={{
                fontWeight: 800,
                color: COLORS.text,
                marginBottom: 6,
              }}
            >
              Demande du {booking.date} à {booking.time}
            </div>

            <div
              style={{
                color:
                  booking.status === "pending"
                    ? COLORS.copperLight
                    : booking.status === "confirmed"
                    ? COLORS.success
                    : COLORS.redLight,
                fontWeight: 800,
                marginBottom: 8,
              }}
            >
              Statut : {statusLabel}
            </div>

            {booking.merchantResponse ? (
              <div style={{ color: COLORS.textSoft, marginBottom: 6 }}>
                Réponse du commerçant :{" "}
                <strong style={{ color: COLORS.text }}>
                  {booking.merchantResponse}
                </strong>
              </div>
            ) : null}

            {booking.proposedDate || booking.proposedTime ? (
              <div style={{ color: COLORS.textSoft, marginBottom: 6 }}>
                Nouveau créneau proposé :{" "}
                <strong style={{ color: COLORS.text }}>
                  {booking.proposedDate || "-"} {booking.proposedTime ? `à ${booking.proposedTime}` : ""}
                </strong>
              </div>
            ) : null}

            {booking.note ? (
              <div style={{ color: COLORS.textSoft }}>
                Votre note : {booking.note}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  )}
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
                {clientPoints} / {rewardGoal}
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
              {clientRewardRemaining === 0
                ? "Récompense atteinte"
                : `${clientRewardRemaining} point(s) restants`}
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
                width: `${Math.min(clientProgress, 100)}%`,
                background: "linear-gradient(90deg, #D97A32, #F2A65A)",
                height: "100%",
                borderRadius: 999,
                boxShadow: "0 0 14px rgba(217,122,50,0.35)",
              }}
            />
          </div>

          {rewardAvailable && (
  <div
    style={{
      marginBottom: 14,
      padding: 14,
      borderRadius: 16,
      background: "rgba(212,175,55,0.14)",
      border: `1px solid ${COLORS.gold}`,
      color: COLORS.goldLight,
      fontWeight: 900,
      textAlign: "center",
    }}
  >
    🎁 Récompense disponible !
  </div>
)}

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
                {selectedBusiness.city} • {selectedBusiness.country}
              </div>

              <div style={{ color: COLORS.textSoft, lineHeight: 1.6 }}>
  {selectedBusiness.zoneLabel || "Zone non renseignée"} • Rayon{" "}
  {selectedBusiness.radiusKm} km
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
              {clientPoints} points
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
                  value={`${clientPoints}/${rewardGoal}`}
                />
                <MiniStat
                  label="Restants"
                  value={clientRewardRemaining=== 0 ? "0" : String(clientRewardRemaining)}
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
                    width: `${Math.min(clientProgress, 100)}%`,
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
                {clientRewardRemaining === 0
                  ? "Votre récompense premium est disponible."
                  : `${clientRewardRemaining} point(s) encore pour débloquer votre récompense.`}
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
      console.log("DeferredPrompt =", deferredPrompt);

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
  {selectedBusiness.city} • {selectedBusiness.country} •{" "}
  {selectedBusiness.zoneLabel || "Zone non renseignée"} • Rayon{" "}
  {selectedBusiness.radiusKm} km
</p>

          {selectedBusinessDistance !== null ? (
  <p style={{ color: COLORS.textSoft, marginTop: 0 }}>
    Distance estimée depuis vous • {formatDistance(selectedBusinessDistance)}
  </p>
) : (
  <p style={{ color: COLORS.textSoft, marginTop: 0 }}>
    Distance non disponible
  </p>
)}

{selectedBusiness.hasCoordinates ? (
  <iframe
    src={`https://www.google.com/maps?q=${selectedBusiness.lat},${selectedBusiness.lng}&z=15&output=embed`}
    width="100%"
    height="220"
    style={{
      border: 0,
      borderRadius: 16,
      marginTop: 12,
    }}
    loading="lazy"
    title={`map-${selectedBusiness.id}`}
  />
) : (
  <iframe
    src={`https://www.google.com/maps?q=${encodeURIComponent(
      selectedBusiness.address
    )}&output=embed`}
    width="100%"
    height="220"
    style={{
      border: 0,
      borderRadius: 16,
      marginTop: 12,
    }}
    loading="lazy"
    title={`map-${selectedBusiness.id}`}
  />
)}

       <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>

  {/* 🔥 GOOGLE MAPS */}
  <a
    href={selectedBusiness.googleMapsUrl}
    target="_blank"
    rel="noreferrer"
    style={{ textDecoration: "none" }}
  >
    <button style={copperButton()}>
      📍 Voir sur Google Maps
    </button>
  </a>

  {/* 🔥 AVIS GOOGLE */}
  <a
    href={selectedBusiness.reviewUrl}
    target="_blank"
    rel="noreferrer"
    style={{ textDecoration: "none" }}
  >
    <button style={reviewButton()}>
      ⭐ Laisser un avis
    </button>
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

         {selectedBusiness.reviewUrl ? (
  <a
    href={selectedBusiness.reviewUrl}
    target="_blank"
    rel="noreferrer"
  >
    <button style={reviewButton()}>⭐ Laisser un avis</button>
  </a>
) : (
  <button style={{ ...ghostButton(), cursor: "not-allowed", opacity: 0.6 }}>
    Lien d’avis indisponible
  </button>
)}
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