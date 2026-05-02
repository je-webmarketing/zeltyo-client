import { useMemo, useState, useEffect, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
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
import TopNavSection from "./components/TopNavSection";

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
        
          
 <TopNavSection
  COLORS={COLORS}
  selectedBusiness={selectedBusiness}
  copperButtonSmall={copperButtonSmall}
  ghostButtonSmall={ghostButtonSmall}
  reviewButton={reviewButton}
/>
       <HeroSection
  COLORS={COLORS}
  menuImage={menuImage}
  menuItems={menuItems}
/>

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
        />

        <BusinessZoneSection
  COLORS={COLORS}
  selectedBusiness={selectedBusiness}
  inputStyle={inputStyle}
  ZoneLine={ZoneLine}
/>
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
    id: "BUS-2",
    menu: menuItems,
    phone: merchantContact?.phone || "",
  }}
  clientData={client}
/>

<ClientBookingsSection
  COLORS={COLORS}
  clientBookings={clientBookings}
/>

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