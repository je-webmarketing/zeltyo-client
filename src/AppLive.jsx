import { useMemo, useState, useEffect } from "react";
import { buildApiUrl } from "./config/api";

const STORAGE_AUTH = "zeltyo_merchant_auth";

export default function App() {
  const [businessName, setBusinessName] = useState("Mon Commerce");
  const [rewardGoal, setRewardGoal] = useState(10);
  const [rewardLabel, setRewardLabel] = useState("1 boisson offerte");
  const [primaryColor, setPrimaryColor] = useState("#0f766e");
  const [search, setSearch] = useState("");
  const [scanId, setScanId] = useState("CL-1001");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [notification, setNotification] = useState("");
 const [showForgot, setShowForgot] = useState(false);
const [forgotEmail, setForgotEmail] = useState(""); 
  const poweredByLabel = "Zeltyo by JE-Webmarketing";
const poweredByUrl = "https://ericjarry34.systeme.io/je-webmarketing";

 const [currentUser, setCurrentUser] = useState({
  name: "Sophie Admin",
  role: "Administrateur",
});

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({
    email: "admin@moncommerce.ch",
    password: "admin123",
  });

  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [promo, setPromo] = useState({
    title: "",
    code: "",
    description: "",
    channel: "Instagram",
  });

  const [locationSettings, setLocationSettings] = useState({
  country: "CH",
  city: "Genève",
  zoneLabel: "Genève Centre",
  latitude: "46.2044",
  longitude: "6.1432",
  radiusKm: "1.5",
});

  const [customers, setCustomers] = useState([
    {
      id: "CL-1001",
      name: "Sophie Martin",
      email: "sophie@email.com",
      phone: "+41791234567",
      points: 4,
      visits: 2,
      rewardsAvailable: 0,
      tier: "Bronze",
      lastVisit: "29/03/2026",
    },
    {
      id: "CL-1002",
      name: "Nadia Lopez",
      email: "nadia@email.com",
      phone: "+41797654321",
      points: 8,
      visits: 4,
      rewardsAvailable: 0,
      tier: "Argent",
      lastVisit: "28/03/2026",
    },
    {
      id: "CL-1003",
      name: "Lucas Bernard",
      email: "lucas@email.com",
      phone: "+41795554433",
      points: 12,
      visits: 6,
      rewardsAvailable: 1,
      tier: "Or",
      lastVisit: "27/03/2026",
    },
  ]);

  const [promotions, setPromotions] = useState([
    {
      id: 1,
      title: "Offre fidélité printemps",
      code: "PRINTEMPS10",
      description: "10% de remise pour les clients fidèles sur présentation de leur carte.",
      channel: "Instagram",
      status: "Active",
      createdBy: "Sophie Admin",
      createdAt: "29/03/2026 09:15",
    },
    {
      id: 2,
      title: "Récompense boisson offerte",
      code: "CAFE10",
      description: "Une boisson offerte après 10 points cumulés.",
      channel: "En boutique",
      status: "Active",
      createdBy: "Sophie Admin",
      createdAt: "28/03/2026 16:40",
    },
  ]);

  const [employees, setEmployees] = useState([
    {
      id: "EMP-1",
      name: "Sophie Admin",
      role: "admin",
      status: "Actif",
      lastAction: "Création promotion",
      email: "admin@moncommerce.ch",
      password: "admin123",
    },
    {
      id: "EMP-2",
      name: "Nadia Employée",
      role: "employee",
      status: "Actif",
      lastAction: "Validation visite client",
      email: "nadia@moncommerce.ch",
      password: "employe123",
    },
    {
      id: "EMP-3",
      name: "Lucas Employé",
      role: "employee",
      status: "Actif",
      lastAction: "Ajout client",
      email: "lucas@moncommerce.ch",
      password: "employe123",
    },
  ]);

  const [activityLog, setActivityLog] = useState([
    {
      id: 1,
      actor: "Sophie Admin",
      role: "admin",
      action: "A créé une promotion",
      detail: "Offre fidélité printemps",
      date: "29/03/2026 09:15",
    },
    {
      id: 2,
      actor: "Nadia Employée",
      role: "employee",
      action: "A validé une visite",
      detail: "Client CL-1002",
      date: "29/03/2026 10:10",
    },
    {
      id: 3,
      actor: "Lucas Employé",
      role: "employee",
      action: "A ajouté un client",
      detail: "Client CL-1004",
      date: "29/03/2026 11:05",
    },
  ]);

  const [newEmployee, setNewEmployee] = useState({
    name: "",
    email: "",
    role: "employee",
  });

  function applyBusinessConfig(businessId) {
  const config = BUSINESS_CONFIG[businessId];
  if (!config) return;

  setBusinessName(config.name);
  setRewardGoal(config.rewardGoal);
  setRewardLabel(config.rewardLabel);
  setPrimaryColor(config.primaryColor);
  setLocationSettings({
    country: config.country,
    city: config.city,
    zoneLabel: config.zoneLabel,
    latitude: config.latitude,
    longitude: config.longitude,
    radiusKm: config.radiusKm,
  });
}

  async function handleLogin() {
  try {
    const response = await fetch(buildApiUrl("/auth/merchant-login"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: loginForm.email,
        password: loginForm.password,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      showNotification(data.error || "Identifiants incorrects");
      return;
    }

    localStorage.setItem(STORAGE_AUTH, JSON.stringify(data));

    setCurrentUser({
      name: data.user.name,
      role:
  data.user.role === "merchant_admin"
    ? "admin"
    : "employee",
      email: data.user.email,
      businessId: data.user.businessId,
    });

    applyBusinessConfig(data.user.businessId);

    setIsAuthenticated(true);
    setNotification("");
  } catch (error) {
    console.error("Erreur login:", error);
    showNotification("Erreur de connexion au serveur");
  }
}

  function handleLogout() {
  localStorage.removeItem(STORAGE_AUTH);
  setIsAuthenticated(false);
  setLoginForm({ email: "", password: "" });
  setNotification("");
}

  function getNowLabel() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  function addLog(action, detail) {
    setActivityLog((prev) => [
      {
        id: Date.now(),
        actor: currentUser.name,
        role: currentUser.role,
        action,
        detail,
        date: getNowLabel(),
      },
      ...prev,
    ]);

    setEmployees((prev) =>
      prev.map((employee) =>
        employee.name === currentUser.name
          ? {
              ...employee,
              lastAction: detail,
            }
          : employee
      )
    );
  }

  function showNotification(message) {
    setNotification(message);
    setTimeout(() => setNotification(""), 2200);
  }

  function getTier(points) {
    if (points >= 20) return "Or";
    if (points >= 10) return "Argent";
    return "Bronze";
  }

  function addCustomer() {
    if (!newCustomer.name.trim()) return;

    const id = `CL-${1000 + customers.length + 1}`;

    const customer = {
      id,
      name: newCustomer.name,
      email: newCustomer.email,
      phone: newCustomer.phone,
      points: 0,
      visits: 0,
      rewardsAvailable: 0,
      tier: "Bronze",
      lastVisit: "Nouveau",
    };

    setCustomers([customer, ...customers]);
    setNewCustomer({ name: "", email: "", phone: "" });
    addLog("A ajouté un client", `${customer.name} (${customer.id})`);
    showNotification(`Client ajouté par ${currentUser.name}`);
  }

  function rewardVisit() {
    const selectedCustomer = customers.find((customer) => customer.id === scanId);
    if (!selectedCustomer) return;

    console.log("CLIENT AVANT AJOUT =", customerFound);

    setCustomers((prev) =>
      prev.map((customer) => {
        if (customer.id !== scanId) return customer;

        const nextPoints = customer.points + 1;
        const rewardReached = nextPoints % Number(rewardGoal || 1) === 0;

        return {
          ...customer,
          points: nextPoints,
          visits: customer.visits + 1,
          rewardsAvailable: rewardReached
            ? customer.rewardsAvailable + 1
            : customer.rewardsAvailable,
          tier: getTier(nextPoints),
          lastVisit: "Aujourd'hui",
        };
      })
    );

    addLog("A validé une visite", `${selectedCustomer.name} (${selectedCustomer.id})`);

    if ((selectedCustomer.points + 1) % Number(rewardGoal || 1) === 0) {
      showNotification(`🎉 Récompense débloquée pour ${selectedCustomer.name}`);
    } else {
      showNotification(`+1 point ajouté pour ${selectedCustomer.name}`);
    }
  }

  function useReward(customerId) {
    const customerFound = customers.find((c) => c.id === customerId);
    if (!customerFound || customerFound.rewardsAvailable <= 0) return;

    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id !== customerId) return c;
        return {
          ...c,
          rewardsAvailable: c.rewardsAvailable - 1,
        };
      })
    );

    addLog("A utilisé une récompense", `${customerFound.name} (${customerFound.id})`);
    showNotification(`Récompense utilisée pour ${customerFound.name}`);
  }

  function addPromotion() {
    if (currentUser.role !== "admin") {
      showNotification("Seul l’administrateur peut créer une promotion");
      return;
    }

    if (!promo.title.trim() || !promo.description.trim()) return;

    const newPromo = {
      id: Date.now(),
      title: promo.title,
      code: promo.code || `PROMO${promotions.length + 1}`,
      description: promo.description,
      channel: promo.channel,
      status: "Active",
      createdBy: currentUser.name,
      createdAt: getNowLabel(),
    };

    setPromotions([newPromo, ...promotions]);
    setPromo({
      title: "",
      code: "",
      description: "",
      channel: "Instagram",
    });

    addLog("A créé une promotion", `Promotion créée : ${newPromo.title}`);
    showNotification("Promotion publiée avec succès");
  }

  function addEmployee() {
    if (currentUser.role !== "admin") {
      showNotification("Seul l’administrateur peut ajouter un membre de l’équipe");
      return;
    }

    if (!newEmployee.name.trim() || !newEmployee.email.trim()) {
      showNotification("Nom et email requis pour ajouter un membre");
      return;
    }

    const employee = {
      id: `EMP-${employees.length + 1}`,
      name: newEmployee.name.trim(),
      email: newEmployee.email.trim(),
      password: newEmployee.role === "admin" ? "admin123" : "employe123",
      role: newEmployee.role,
      status: "Actif",
      lastAction: "Compte créé",
    };

    setEmployees((prev) => [...prev, employee]);
    addLog(
      "A ajouté un membre de l’équipe",
      `${employee.name} — ${employee.role === "admin" ? "Administrateur" : "Employé"}`
    );
    setNewEmployee({ name: "", email: "", role: "employee" });
    showNotification("Membre ajouté avec succès");
  }

  function togglePromotionStatus(promoId) {
    if (currentUser.role !== "admin") {
      showNotification("Seul l’administrateur peut modifier une promotion");
      return;
    }

    const targetPromo = promotions.find((p) => p.id === promoId);
    if (!targetPromo) return;

    setPromotions((prev) =>
      prev.map((p) =>
        p.id === promoId
          ? {
              ...p,
              status: p.status === "Active" ? "Pause" : "Active",
            }
          : p
      )
    );

    addLog(
      "A modifié une promotion",
      `${targetPromo.title} → ${targetPromo.status === "Active" ? "Pause" : "Active"}`
    );
    showNotification("Statut de la promotion mis à jour");
  }

  function generateMessage(customer) {
    const remaining = rewardGoal - (customer.points % rewardGoal || rewardGoal);

    if (customer.rewardsAvailable > 0) {
      return `Bonjour ${customer.name} 👋\n\n🎉 Bonne nouvelle !\n\nVous avez ${customer.rewardsAvailable} récompense(s) disponible(s) :\n👉 ${rewardLabel}\n\nPassez en profiter dès aujourd’hui !`;
    }

    return `Bonjour ${customer.name} 👋\n\nVous avez actuellement ${customer.points} point(s).\n\nEncore ${remaining} point(s) avant votre récompense :\n🎁 ${rewardLabel}\n\nÀ très vite chez ${businessName} !`;
  }

  function openWhatsApp(customer) {
    const message = generateMessage(customer);
    const phone = (customer.phone || "").replace("+", "");
    if (!phone) {
      showNotification("Numéro de téléphone manquant pour ce client");
      return;
    }
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    addLog("A préparé une relance WhatsApp", `${customer.name} (${customer.id})`);
    window.open(url, "_blank");
  }

  const filteredCustomers = useMemo(() => {
  const businessId = currentUser?.businessId || "";
  const q = search.toLowerCase().trim();

  const businessCustomers = customers.filter(
    (customer) => String(customer.businessId) === String(businessId)
  );

  if (!q) return businessCustomers;

  return businessCustomers.filter(
    (customer) =>
      customer.name?.toLowerCase().includes(q) ||
      customer.email?.toLowerCase().includes(q) ||
      customer.id?.toLowerCase().includes(q) ||
      customer.loyaltyId?.toLowerCase().includes(q)
  );
}, [customers, search, currentUser?.businessId]);

  const totalClients = customers.length;
  const totalPoints = customers.reduce((sum, c) => sum + c.points, 0);
  const totalVisits = customers.reduce((sum, c) => sum + c.visits, 0);
  const totalRewards = customers.reduce((sum, c) => sum + c.rewardsAvailable, 0);
  const activePromos = promotions.filter((p) => p.status === "Active").length;

  const topCustomers = [...customers].sort((a, b) => b.points - a.points).slice(0, 3);

  const clientsToRelance = customers.filter((c) => {
    const remaining = rewardGoal - (c.points % rewardGoal || rewardGoal);
    return remaining <= 2 && c.rewardsAvailable === 0;
  });

  const inactiveClients = customers.filter((c) => {
    if (c.lastVisit === "Aujourd'hui" || c.lastVisit === "Nouveau") return false;

    const last = new Date(c.lastVisit.split("/").reverse().join("-"));
    const now = new Date();
    const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));

    return diffDays >= 7;
  });



 
const COLORS = {
  bg: "#050505",
  surface: "#111111",
  surfaceSoft: "#161616",
  border: "#2A2A2A",
  gold: "#D4AF37",
  goldLight: "#F2D06B",
  red: "#C94B32",
  redLight: "#E06A4C",
  text: "#F7F4EA",
  textSoft: "#CFC7B0",
  green: "#22c55e",
  greenBg: "rgba(34,197,94,0.14)",
  blueBg: "rgba(59,130,246,0.14)",
  orangeBg: "rgba(201,75,50,0.14)",
};

const sendSmart = async (type) => {
  try {
    const rawAuth = localStorage.getItem(STORAGE_AUTH);
    if (!rawAuth) {
      alert("Session invalide");
      return;
    }

    const token = JSON.parse(rawAuth)?.token;

   const response = await fetch(
  buildApiUrl("/automation-segmented/send-smart-promo"),
  {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Erreur envoi");
      return;
    }

    alert(`Promo envoyée à ${data.count} clients 🚀`);
  } catch (err) {
    console.error(err);
    alert("Erreur réseau");
  }
};

const sendPromo = async () => {
  try {


const rawAuth = localStorage.getItem(STORAGE_AUTH);
if (!rawAuth) {
  alert("Vous devez être connecté");
  return;
}



const auth = JSON.parse(rawAuth);
const token = auth?.token;

if (!token) {
  alert("Session invalide");
  return;
}

const response = await fetch(
  buildApiUrl("/notifications-advanced/send-to-subscription"),
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      subscriptionId: "a67b1b72-bc4c-431b-a3b8-9bf9d79d3079",
      message: "🔥 Promo du jour : Croissant + café à -20% ☕🥐",
    }),
  }
);

    const data = await response.json();
    console.log("Réponse promo :", data);

    if (!response.ok) {
      alert("Erreur lors de l'envoi");
      return;
    }

    alert("Promo envoyée 🚀");
  } catch (error) {
    console.error(error);
    alert("Erreur réseau");
  }
};

const BUSINESS_CONFIG = {
  "BUS-2": {
    name: "Barber Club",
    rewardGoal: 6,
    rewardLabel: "1 coupe -50%",
    primaryColor: "#D4AF37",
    country: "CH",
    city: "Lausanne",
    zoneLabel: "Lausanne Centre",
    latitude: "46.5197",
    longitude: "6.6323",
    radiusKm: "2",
  },
  "BUS-1": {
    name: "Le Café du Centre",
    rewardGoal: 10,
    rewardLabel: "1 boisson offerte",
    primaryColor: "#D4AF37",
    country: "CH",
    city: "Genève",
    zoneLabel: "Genève Centre",
    latitude: "46.2044",
    longitude: "6.1432",
    radiusKm: "1.5",
  },
};

useEffect(() => {
  const raw = localStorage.getItem(STORAGE_AUTH);
  if (!raw) return;

  try {
    const auth = JSON.parse(raw);

    if (auth?.token && auth?.user) {
      setCurrentUser({
        name: auth.user.name,
        role:
  auth.user.role === "merchant_admin"
    ? "admin"
    : "employee",
        email: auth.user.email,
        businessId: auth.user.businessId,
      });

applyBusinessConfig(auth.user.businessId);

      setIsAuthenticated(true);
    }
  } catch (error) {
    console.error("Erreur lecture session:", error);
    localStorage.removeItem(STORAGE_AUTH);
  }
}, []);

  if (!isAuthenticated) {


    return (
      <div
  style={{
    minHeight: "100vh",
    background: "linear-gradient(135deg, #050505, #111111)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    fontFamily: "Inter, Arial, sans-serif",
  }}
>
        <div
          style={{
            width: "100%",
            maxWidth: "980px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "20px",
          }}
        >
          <div
  style={{
    background: "linear-gradient(135deg, #111111, #0B0B0B)",
    color: COLORS.text,
    borderRadius: "28px",
    padding: "34px",
    boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
    border: `1px solid ${COLORS.border}`,
  }}
>
            <div
  style={{
    display: "inline-block",
    padding: "8px 14px",
    borderRadius: "999px",
    background: "rgba(212,175,55,0.12)",
    border: `1px solid ${COLORS.gold}`,
    marginBottom: "16px",
    fontSize: "13px",
    fontWeight: 700,
    color: COLORS.goldLight,
  }}
>
  Connexion sécurisée
</div>
            <h1 style={{ fontSize: "42px", margin: "0 0 12px 0", lineHeight: 1.05 }}>
              {businessName}
            </h1>
            <p style={{ lineHeight: 1.7, fontSize: "17px", margin: 0, color: COLORS.textSoft }}>
              Chaque membre de l’équipe se connecte avec son propre accès. L’administrateur garde le contrôle sur les promotions, les rôles et le suivi des actions.
            </p>
          <div
  style={{
    marginTop: "22px",
    background: "#111111",
    borderRadius: "18px",
    padding: "18px",
    lineHeight: 1.9,
    border: `1px solid ${COLORS.border}`,
    color: COLORS.textSoft,
  }}
>
              <div><strong>Démo administrateur</strong> : admin@barberclub.ch / Zeltyo123!</div>
              <div><strong>Démo employé</strong> : employee@barberclub.ch / Zeltyo123!</div>
            </div>
          </div>

          <div
  style={{
    background: COLORS.surface,
    borderRadius: "28px",
    padding: "30px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
    border: `1px solid ${COLORS.border}`,
    color: COLORS.text,
  }}
>
<div style={{
  display: "flex",
  alignItems: "center",
  gap: "18px"
}}>
  <div
  style={{
    padding: "10px",
    borderRadius: "22px",
    background: "linear-gradient(135deg, #FFD700, #B8962E)",
    boxShadow: "0 0 20px rgba(212,175,55,0.35)",
  }}
>
    <img
     src="/logo.png"
  alt="Zeltyo"
  style={{
    width: "90px",
    height: "90px",
    borderRadius: "18px",
    padding: "14px",
    objectFit: "contain",
    display: "block",
  }}
/>
  </div>

  <div>
    <div style={{ fontSize: "22px", fontWeight: "900" }}>Zeltyo</div>
    <div style={{ fontSize: "13px", color: "#64748b" }}>
      Fidélisez vos clients automatiquement
    </div>

    <div style={{
      display: "inline-block",
      marginTop: "6px",
      padding: "4px 10px",
      fontSize: "11px",
      borderRadius: "999px",
      background: "#000",
      color: "#facc15",
      fontWeight: "700"
    }}>
      Version Pro
    </div>
  </div>
</div>
            <h2 style={{ marginTop: 0, fontSize: "32px", marginBottom: "12px" }}>Connexion</h2>
            <p style={{ color: COLORS.textSoft, lineHeight: 1.6, marginBottom: "18px" }}>
              Connectez-vous en tant qu’administrateur ou employé pour accéder aux fonctions adaptées à votre rôle.
            </p>

            {notification && (
              <div
                style={{
                  background: "#fee2e2",
                  color: "#991b1b",
                  padding: "12px",
                  borderRadius: "12px",
                  marginBottom: "14px",
                  fontWeight: 700,
                }}
              >
                {notification}
              </div>
            )}

            <input
              style={{
                width: "100%",
                padding: "14px 14px",
                borderRadius: "14px",
                border: "1px solid #cbd5e1",
                marginBottom: "12px",
                boxSizing: "border-box",
                fontSize: "15px",
                outline: "none",
                background: "#ffffff",
              }}
              placeholder="Email"
              value={loginForm.email}
              onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
            />
            <input
              type="password"
              style={{
                width: "100%",
                padding: "14px 14px",
                borderRadius: "14px",
                border: "1px solid #cbd5e1",
                marginBottom: "14px",
                boxSizing: "border-box",
                fontSize: "15px",
                outline: "none",
                background: "#ffffff",
              }}
              placeholder="Mot de passe"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
            />
            <button
  style={{
    width: "100%",
    border: "none",
    background: "linear-gradient(135deg, #D4AF37, #F2D06B)",
    color: "#111111",
    padding: "14px 16px",
    borderRadius: "14px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 12px 24px rgba(212,175,55,0.20)",
  }}
  onClick={handleLogin}
>
  Se connecter
</button>

<div
  style={{
    marginTop: "12px",
    textAlign: "center",
  }}
>
  <button
    type="button"
    onClick={() => setShowForgot(true)}
    style={{
      background: "transparent",
      border: "none",
      color: COLORS.goldLight,
      fontSize: "14px",
      fontWeight: 700,
      cursor: "pointer",
      textDecoration: "underline",
    }}
  >
    Mot de passe oublié ?
  </button>
</div>

{showForgot && (
  <div
    style={{
      marginTop: "16px",
      padding: "16px",
      borderRadius: "14px",
      background: "#111",
      border: `1px solid ${COLORS.border}`,
    }}
  >
    <div style={{ marginBottom: "10px", fontWeight: 700 }}>
      Réinitialiser le mot de passe
    </div>

    <input
  style={{
    width: "100%",
    padding: "14px 14px",
    borderRadius: "14px",
    border: `1px solid ${COLORS.border}`,
    marginBottom: "12px",
    boxSizing: "border-box",
    fontSize: "15px",
    outline: "none",
    background: "#ffffff",
    color: "#111111",
  }}
  placeholder="Votre email"
  value={forgotEmail}
  onChange={(e) => setForgotEmail(e.target.value)}
/>

<button
  style={{
    width: "100%",
    border: "none",
    background: "linear-gradient(135deg, #D4AF37, #F2D06B)",
    color: "#111111",
    padding: "14px 16px",
    borderRadius: "14px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 12px 24px rgba(212,175,55,0.16)",
  }}
  onClick={async () => {
  try {
   const response = await fetch(buildApiUrl("/auth/forgot-password"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: forgotEmail }),
    });

    const data = await response.json();

    if (!response.ok) {
      showNotification("Erreur serveur");
      return;
    }

    showNotification("Lien envoyé");
setShowForgot(false);
setForgotEmail("");
console.log("FORGOT PASSWORD RESPONSE:", data);
window.location.href = `/reset-password?token=${data.resetToken}`;
  } catch (error) {
    console.error(error);
    showNotification("Erreur de connexion");
  }
}}
>
  Envoyer le lien
</button>
  </div>
)}

<div
  style={{
    marginTop: "16px",
    textAlign: "center",
    color: COLORS.textSoft,
    fontSize: "13px",
    lineHeight: 1.7,
  }}
>
  <div>{poweredByLabel}</div>
  <a
    href={poweredByUrl}
    target="_blank"
    rel="noreferrer"
    style={{
      color: COLORS.goldLight,
      textDecoration: "none",
      fontWeight: 700,
    }}
  >
    je-webmarketing.com
  </a>
</div>
</div>
        </div>
      </div>
    );
  }

  
const styles = {
  page: {
    minHeight: "100vh",
    background: COLORS.bg,
    padding: "24px",
    fontFamily: "Inter, Arial, sans-serif",
    color: COLORS.text,
  },
  container: {
    maxWidth: "1320px",
    margin: "0 auto",
  },
  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "20px",
    padding: "18px 22px",
    background: COLORS.surface,
    borderRadius: "20px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
    border: `1px solid ${COLORS.border}`,
  },
  topActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  buttonGhost: {
    border: `1px solid ${COLORS.border}`,
    background: COLORS.surfaceSoft,
    color: COLORS.text,
    padding: "12px 16px",
    borderRadius: "12px",
    fontWeight: 600,
    cursor: "pointer",
  },
  buttonPrimary: {
    border: "none",
    background: "linear-gradient(135deg, #D4AF37, #F2D06B)",
    color: "#111111",
    padding: "12px 16px",
    borderRadius: "12px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 12px 24px rgba(212,175,55,0.18)",
  },
  hero: {
    background: "linear-gradient(135deg, #111111, #0B0B0B)",
    borderRadius: "28px",
    padding: "34px",
    color: COLORS.text,
    marginBottom: "20px",
    boxShadow: "0 18px 40px rgba(0,0,0,0.28)",
    border: `1px solid ${COLORS.border}`,
  },
  heroBadge: {
    display: "inline-block",
    padding: "8px 14px",
    borderRadius: "999px",
    background: "rgba(212,175,55,0.12)",
    border: `1px solid ${COLORS.gold}`,
    marginBottom: "16px",
    fontSize: "13px",
    fontWeight: 700,
    color: COLORS.goldLight,
  },
  heroTitle: {
    fontSize: "46px",
    lineHeight: 1.05,
    margin: "0 0 10px 0",
    fontWeight: 800,
    color: COLORS.goldLight,
  },
  heroText: {
    margin: 0,
    maxWidth: "900px",
    lineHeight: 1.6,
    fontSize: "18px",
    color: COLORS.textSoft,
  },
  nav: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
    flexWrap: "wrap",
  },
  navBtn: (active) => ({
    border: active ? "none" : `1px solid ${COLORS.border}`,
    background: active
      ? "linear-gradient(135deg, #D4AF37, #F2D06B)"
      : COLORS.surface,
    color: active ? "#111111" : COLORS.text,
    padding: "12px 18px",
    borderRadius: "14px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: active ? "0 10px 24px rgba(212,175,55,0.18)" : "none",
  }),
  grid5: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "16px",
    marginBottom: "20px",
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
    gap: "18px",
    marginBottom: "20px",
  },
  grid3: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "16px",
    marginBottom: "20px",
  },
  card: {
    background: COLORS.surface,
    borderRadius: "22px",
    padding: "24px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
    border: `1px solid ${COLORS.border}`,
  },
  cardTitle: {
    fontSize: "28px",
    fontWeight: 800,
    margin: "0 0 18px 0",
    color: COLORS.goldLight,
  },
  sectionTitle: {
    fontSize: "20px",
    fontWeight: 800,
    margin: "0 0 16px 0",
    color: COLORS.goldLight,
  },
  input: {
    width: "100%",
    padding: "14px 14px",
    borderRadius: "14px",
    border: `1px solid ${COLORS.border}`,
    marginBottom: "12px",
    boxSizing: "border-box",
    fontSize: "15px",
    outline: "none",
    background: COLORS.surfaceSoft,
    color: COLORS.text,
  },
  textarea: {
    width: "100%",
    padding: "14px 14px",
    borderRadius: "14px",
    border: `1px solid ${COLORS.border}`,
    marginBottom: "12px",
    boxSizing: "border-box",
    fontSize: "15px",
    minHeight: "120px",
    resize: "vertical",
    fontFamily: "inherit",
    outline: "none",
    background: COLORS.surfaceSoft,
    color: COLORS.text,
  },
  buttonFull: {
    width: "100%",
    border: "none",
    background: "linear-gradient(135deg, #D4AF37, #F2D06B)",
    color: "#111111",
    padding: "14px 16px",
    borderRadius: "14px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 12px 24px rgba(212,175,55,0.16)",
  },
  buttonSecondary: {
    width: "100%",
    border: `1px solid ${COLORS.gold}`,
    background: COLORS.surfaceSoft,
    color: COLORS.goldLight,
    padding: "12px 14px",
    borderRadius: "12px",
    fontWeight: 700,
    cursor: "pointer",
    marginTop: "10px",
  },
  buttonWhatsapp: {
    width: "100%",
    border: "none",
    background: "#25D366",
    color: "white",
    padding: "12px 14px",
    borderRadius: "12px",
    fontWeight: 700,
    cursor: "pointer",
    marginTop: "8px",
  },
  buttonReward: {
    width: "100%",
    border: "none",
    background: "linear-gradient(135deg, #C94B32, #E06A4C)",
    color: "white",
    padding: "12px 14px",
    borderRadius: "12px",
    fontWeight: 700,
    cursor: "pointer",
    marginTop: "10px",
  },
  helper: {
    marginTop: "14px",
    color: COLORS.textSoft,
    lineHeight: 1.6,
    fontSize: "14px",
  },
  previewBox: {
    background: "#0B0B0B",
    borderRadius: "18px",
    padding: "22px",
    color: COLORS.text,
    minHeight: "140px",
    border: `1px solid ${COLORS.border}`,
  },
  customerGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "16px",
  },
  customerCard: {
    border: `1px solid ${COLORS.border}`,
    borderRadius: "18px",
    padding: "18px",
    background: COLORS.surfaceSoft,
  },
  rowBetween: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    marginBottom: "10px",
    flexWrap: "wrap",
  },
  badge: {
    display: "inline-block",
    background: COLORS.surfaceSoft,
    color: COLORS.text,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: 700,
  },
  badgeGreen: {
    display: "inline-block",
    background: COLORS.greenBg,
    color: "#86efac",
    border: `1px solid ${COLORS.border}`,
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: 700,
  },
  badgeBlue: {
    display: "inline-block",
    background: COLORS.blueBg,
    color: "#93c5fd",
    border: `1px solid ${COLORS.border}`,
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: 700,
  },
  badgeOrange: {
    display: "inline-block",
    background: COLORS.orangeBg,
    color: "#fca5a5",
    border: `1px solid ${COLORS.border}`,
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: 700,
  },
  searchWrap: {
    display: "grid",
    gridTemplateColumns: "1.5fr 1fr",
    gap: "16px",
    marginBottom: "18px",
  },
  kpiLine: {
    color: COLORS.textSoft,
    lineHeight: 1.9,
    fontSize: "15px",
  },
  promoCard: {
    border: `1px solid ${COLORS.border}`,
    borderRadius: "16px",
    padding: "16px",
    marginBottom: "12px",
    background: COLORS.surfaceSoft,
  },
  promoTitle: {
    fontSize: "18px",
    fontWeight: 800,
    marginBottom: "8px",
    color: COLORS.text,
  },
  muted: {
    color: COLORS.textSoft,
    fontSize: "14px",
  },
  notif: {
    background: "linear-gradient(135deg, #D4AF37, #F2D06B)",
    color: "#111111",
    padding: "12px",
    borderRadius: "12px",
    marginBottom: "16px",
    textAlign: "center",
    fontWeight: "bold",
  },
  fakeQrWrap: {
    margin: "14px 0",
    background: "#0B0B0B",
    border: `1px solid ${COLORS.border}`,
    borderRadius: "16px",
    padding: "14px",
    textAlign: "center",
  },
  tableLike: {
    display: "grid",
    gap: "12px",
  },
};
  const socialPreview = `🎁 ${promo.title || "Votre offre fidélité"}\n\n${promo.description || "Décrivez ici votre promotion en quelques lignes claires et rassurantes."}\n\nPrésentez votre carte fidélité chez ${businessName}.\nCode : ${promo.code || "PROMO10"}`;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.topbar}>
  <div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "18px",
    background: "#111111",
    padding: "14px 18px",
    borderRadius: "20px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
    border: "1px solid #2A2A2A",
  }}
>
  <div
    style={{
      padding: "8px",
      borderRadius: "20px",
      background: "linear-gradient(135deg, #FFD700, #B8962E)",
      boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <img
      src="/logo.png"
      alt="Zeltyo"
      style={{
        width: "72px",
        height: "72px",
        borderRadius: "16px",
        background: "#000",
        padding: "10px",
        objectFit: "contain",
        display: "block",
      }}
    />
  </div>

  <div>
   <div
  style={{
    fontSize: "28px",
    fontWeight: "900",
    lineHeight: 1,
    color: "#F2D06B",
  }}
>
  Zeltyo
</div>

    <div
  style={{
    fontSize: "15px",
    color: "#CFC7B0",
    marginTop: "8px",
    fontWeight: "500",
  }}
>
  Fidélisez vos clients automatiquement
</div>

    <div
      style={{
        display: "inline-block",
        marginTop: "10px",
        padding: "6px 12px",
        fontSize: "12px",
        borderRadius: "999px",
        background: "#000",
        color: "#facc15",
        fontWeight: "800",
        letterSpacing: "0.3px",
      }}
    >
      Version Pro
    </div>
  </div>
</div>

          <div style={styles.topActions}>
            <select
              style={{ ...styles.input, marginBottom: 0, minWidth: "220px" }}
              value={currentUser?.name || ""}
              onChange={(e) => {
                const selected = employees.find((emp) => emp.name === e.target.value);
                if (selected) {
                  setCurrentUser({ name: selected.name, role: selected.role, email: selected.email });
                }
              }}
            >
              {employees.map((employee) => (
                <option key={employee.id} value={employee.name}>
                  {employee.name} — {employee.role === "admin" ? "Administrateur" : "Employé"}
                </option>
              ))}
            </select>
            <span style={currentUser.role === "admin" ? styles.badgeGreen : styles.badgeBlue}>
              {currentUser.role === "admin" ? "Mode administrateur" : "Mode employé"}
            </span>
            <button style={styles.buttonGhost} onClick={handleLogout}>Déconnexion</button>
          </div>
        </div>

      
        <div style={styles.hero}>
          <div style={styles.heroBadge}>Application autonome</div>
          <h2 style={styles.heroTitle}>{businessName}</h2>
          <p style={styles.heroText}>
            Le commerce peut gérer lui-même ses clients, ses récompenses et ses promotions. L’administrateur garde une vue complète sur les actions réalisées par les employés pour vérifier la bonne exécution au quotidien.
          </p>
        </div>

        {notification && <div style={styles.notif}>{notification}</div>}

        <div style={styles.nav}>
          <button style={styles.navBtn(activeTab === "dashboard")} onClick={() => setActiveTab("dashboard")}>
            Tableau de bord
          </button>
          <button style={styles.navBtn(activeTab === "clients")} onClick={() => setActiveTab("clients")}>
            Clients
          </button>
          <button style={styles.navBtn(activeTab === "promos")} onClick={() => setActiveTab("promos")}>
            Promotions
          </button>
          <button style={styles.navBtn(activeTab === "team")} onClick={() => setActiveTab("team")}>
            Équipe & contrôle
          </button>
          <button style={styles.navBtn(activeTab === "settings")} onClick={() => setActiveTab("settings")}>
            Paramètres
          </button>
        </div>

        
<div style={{ padding: 20 }}>
  <button
  onClick={currentUser.role === "admin" ? sendPromo : undefined}
  disabled={currentUser.role !== "admin"}
  style={{
    padding: "12px 18px",
    background: currentUser.role === "admin" ? "#D4AF37" : "#3A3A3A",
    color: currentUser.role === "admin" ? "#111111" : "#999999",
    border: "none",
    borderRadius: 10,
    fontWeight: "bold",
    cursor: currentUser.role === "admin" ? "pointer" : "not-allowed",
    opacity: currentUser.role === "admin" ? 1 : 0.7,
  }}
  title={
    currentUser.role === "admin"
      ? "Envoyer une promotion"
      : "Réservé à l’administrateur"
  }
>
  🔥 Envoyer promo
</button>
{currentUser.role !== "admin" && (
  <div
    style={{
      marginTop: "8px",
      color: "#CFC7B0",
      fontSize: "13px",
    }}
  >
    Seul l’administrateur peut envoyer une promotion push.
  </div>
)}
</div>

        {activeTab === "dashboard" && (
          <>
            <div style={styles.grid5}>
              <StatCard label="Clients actifs" value={totalClients} />
              <StatCard label="Points cumulés" value={totalPoints} />
              <StatCard label="Visites enregistrées" value={totalVisits} />
              <StatCard label="Récompenses disponibles" value={totalRewards} />
              <StatCard label="Promotions actives" value={activePromos} />
            </div>

            <div style={styles.grid2}>
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Ajouter un client</h3>
                <input
                  style={styles.input}
                  placeholder="Nom du client"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                />
                <input
                  style={styles.input}
                  placeholder="Email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                />
                <input
                  style={styles.input}
                  placeholder="Téléphone"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                />
                <button style={styles.buttonFull} onClick={addCustomer}>
                  Créer une carte fidélité
                </button>
                <p style={styles.helper}>
                  Cette action est disponible pour l’équipe. L’administrateur pourra vérifier qui a ajouté chaque client dans l’onglet de contrôle.
                </p>
              </div>

              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Valider une visite</h3>
                <select style={styles.input} value={scanId} onChange={(e) => setScanId(e.target.value)}>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} — {customer.id}
                    </option>
                  ))}
                </select>
                <button style={styles.buttonFull} onClick={rewardVisit}>
                  Ajouter 1 point après validation
                </button>
                <p style={styles.helper}>
                  L’employé peut gérer la fidélité en caisse. Chaque validation remonte automatiquement dans le journal d’activité.
                </p>
              </div>
            </div>

            <div style={styles.grid3}>
              <div style={styles.card}>
                <h3 style={styles.sectionTitle}>Top clients fidélité</h3>
                {topCustomers.map((customer) => (
                  <div key={customer.id} style={styles.promoCard}>
                    <div style={styles.rowBetween}>
                      <strong>{customer.name}</strong>
                      <span style={styles.badgeGreen}>{customer.tier}</span>
                    </div>
                    <div style={styles.kpiLine}>
                      <div>Points : <strong>{customer.points}</strong></div>
                      <div>Visites : <strong>{customer.visits}</strong></div>
                      <div>Dernière visite : <strong>{customer.lastVisit}</strong></div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={styles.card}>
                <h3 style={styles.cardTitle}>🔥 Clients à relancer</h3>
                {clientsToRelance.length === 0 && <p style={styles.muted}>Aucun client à relancer pour le moment</p>}
                {clientsToRelance.map((customer) => (
                  <div key={customer.id} style={styles.promoCard}>
                    <div style={styles.rowBetween}>
                      <strong>{customer.name}</strong>
                      <span style={styles.badgeOrange}>
                        {rewardGoal - (customer.points % rewardGoal || rewardGoal)} point(s)
                      </span>
                    </div>
                    <button style={styles.buttonWhatsapp} onClick={() => openWhatsApp(customer)}>
                      Relancer via WhatsApp
                    </button>
                  </div>
                ))}
              </div>

              <div style={styles.card}>
                <h3 style={styles.cardTitle}>⏳ Clients inactifs</h3>
                {inactiveClients.length === 0 && <p style={styles.muted}>Aucun client inactif</p>}
                {inactiveClients.map((customer) => (
                  <div key={customer.id} style={styles.promoCard}>
                    <div style={styles.rowBetween}>
                      <strong>{customer.name}</strong>
                      <span style={styles.badge}>Inactif</span>
                    </div>
                    <button style={styles.buttonWhatsapp} onClick={() => openWhatsApp(customer)}>
                      Relancer client inactif
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === "clients" && (
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Base clients</h3>

            <div style={styles.searchWrap}>
              <input
                style={styles.input}
                placeholder="Rechercher un client par nom, email ou identifiant"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div style={styles.previewBox}>
                <strong>Vue rapide</strong>
                <p style={{ marginBottom: 0 }}>Clients affichés : {filteredCustomers.length}</p>
              </div>
            </div>

            <div style={styles.customerGrid}>
              {filteredCustomers.map((customer) => (
                <div key={customer.id} style={styles.customerCard}>
                  <div style={styles.rowBetween}>
                    <div>
                      <div style={{ fontWeight: 800 }}>{customer.name}</div>
                      <div style={styles.muted}>{customer.id}</div>
                    </div>
                    <span style={styles.badge}>{customer.tier}</span>
                  </div>

                  <div style={styles.fakeQrWrap}>
                    <FakeQr value={customer.id} />
                    <div style={{ marginTop: "10px", fontSize: "12px", color: "#64748b" }}>
                      Carte fidélité digitale
                    </div>
                  </div>

                  <div style={styles.kpiLine}>
                    <div>Email : <strong>{customer.email || "Non renseigné"}</strong></div>
                    <div>Téléphone : <strong>{customer.phone || "Non renseigné"}</strong></div>
                    <div>Points : <strong>{customer.points}</strong></div>
                    <div>Visites : <strong>{customer.visits}</strong></div>
                    <div>Récompenses : <strong>{customer.rewardsAvailable}</strong></div>
                    <div>Dernière visite : <strong>{customer.lastVisit}</strong></div>
                  </div>

                  <button
  style={{
    ...styles.buttonReward,
    opacity: Number(customer.points || 0) >= Number(rewardGoal || 10) ? 1 : 0.45,
    cursor:
      Number(customer.points || 0) >= Number(rewardGoal || 10)
        ? "pointer"
        : "not-allowed",
  }}
  onClick={() => useReward(customer.id)}
  disabled={Number(customer.points || 0) < Number(rewardGoal || 10)}
>
  {Number(customer.points || 0) >= Number(rewardGoal || 10)
    ? "🎁 Utiliser la récompense"
    : `Encore ${Number(rewardGoal || 10) - Number(customer.points || 0)} point(s)`}
</button>

                  <button
                    style={styles.buttonSecondary}
                    onClick={() => {
                      navigator.clipboard.writeText(generateMessage(customer));
                      addLog("A copié un message client", `${customer.name} (${customer.id})`);
                      showNotification("Message client copié");
                    }}
                  >
                    Copier message client
                  </button>

                  <button style={styles.buttonWhatsapp} onClick={() => openWhatsApp(customer)}>
                    Envoyer via WhatsApp
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "promos" && (
  <div style={styles.grid2}>
    <div
      style={{
        ...styles.card,
        gridColumn: "1 / -1",
      }}
    >
      <h3 style={styles.cardTitle}>Segmentation intelligente</h3>

      <div style={{ display: "flex", gap: "10px", marginBottom: "12px", flexWrap: "wrap" }}>
        <button
          onClick={currentUser.role === "admin" ? () => sendSmart("inactive") : undefined}
          disabled={currentUser.role !== "admin"}
          style={styles.buttonGhost}
        >
          🔁 Inactifs
        </button>

        <button
          onClick={currentUser.role === "admin" ? () => sendSmart("vip") : undefined}
          disabled={currentUser.role !== "admin"}
          style={styles.buttonGhost}
        >
          💎 VIP
        </button>

        <button
          onClick={currentUser.role === "admin" ? () => sendSmart("near_reward") : undefined}
          disabled={currentUser.role !== "admin"}
          style={styles.buttonGhost}
        >
          🎁 Presque récompense
        </button>
      </div>

      <p style={styles.helper}>
        Envoyez une promotion ciblée selon le comportement client : clients inactifs, VIP ou proches d’une récompense.
      </p>
    </div>

    <div style={styles.card}>
              <h3 style={styles.cardTitle}>Gérer les promotions</h3>
              <div style={{ marginBottom: "14px" }}>
                <span style={currentUser.role === "admin" ? styles.badgeGreen : styles.badgeOrange}>
                  {currentUser.role === "admin"
                    ? "Vous pouvez créer et modifier les promotions"
                    : "Mode employé : consultation uniquement"}
                </span>
              </div>
              <input
                style={styles.input}
                placeholder="Titre de l'offre"
                value={promo.title}
                onChange={(e) => setPromo({ ...promo, title: e.target.value })}
                disabled={currentUser.role !== "admin"}
              />
              <input
                style={styles.input}
                placeholder="Code promotionnel"
                value={promo.code}
                onChange={(e) => setPromo({ ...promo, code: e.target.value })}
                disabled={currentUser.role !== "admin"}
              />
              <select
                style={styles.input}
                value={promo.channel}
                onChange={(e) => setPromo({ ...promo, channel: e.target.value })}
                disabled={currentUser.role !== "admin"}
              >
                <option>Instagram</option>
                <option>Facebook</option>
                <option>WhatsApp</option>
                <option>Email</option>
                <option>En boutique</option>
              </select>
              <textarea
                style={styles.textarea}
                placeholder="Description claire et orientée bénéfice"
                value={promo.description}
                onChange={(e) => setPromo({ ...promo, description: e.target.value })}
                disabled={currentUser.role !== "admin"}
              />
              <button style={styles.buttonFull} onClick={addPromotion}>
                Publier la promotion
              </button>
              <p style={styles.helper}>
                Le client est autonome pour gérer ses promotions. L’administrateur garde le contrôle sur la création, la mise en pause et le suivi de chaque offre.
              </p>
            </div>

            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Aperçu du message</h3>
              <div style={styles.previewBox}>
                <div style={{ whiteSpace: "pre-line", lineHeight: 1.7 }}>{socialPreview}</div>
              </div>
            </div>

            <div style={{ ...styles.card, gridColumn: "1 / -1" }}>
              <h3 style={styles.cardTitle}>Promotions publiées</h3>
              {promotions.map((promotion) => (
                <div key={promotion.id} style={styles.promoCard}>
                  <div style={styles.rowBetween}>
                    <div>
                      <div style={styles.promoTitle}>{promotion.title}</div>
                      <div style={styles.muted}>
                        Canal : {promotion.channel} • Code : {promotion.code}
                      </div>
                      <div style={styles.muted}>
                        Créée par : {promotion.createdBy} • {promotion.createdAt}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <span style={promotion.status === "Active" ? styles.badgeGreen : styles.badgeOrange}>
                        {promotion.status}
                      </span>
                      <button
                        style={{ ...styles.buttonGhost, padding: "8px 12px" }}
                        onClick={() => togglePromotionStatus(promotion.id)}
                      >
                        {promotion.status === "Active" ? "Mettre en pause" : "Réactiver"}
                      </button>
                    </div>
                  </div>
                  <p style={{ marginBottom: 0, lineHeight: 1.7 }}>{promotion.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "team" && (
          <div style={styles.grid2}>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Équipe</h3>
              <div style={{ marginBottom: "18px" }}>
                <span style={currentUser.role === "admin" ? styles.badgeGreen : styles.badgeOrange}>
                  {currentUser.role === "admin"
                    ? "Vous pouvez ajouter un employé ou un administrateur"
                    : "Mode employé : consultation uniquement"}
                </span>
              </div>

              <input
                style={styles.input}
                placeholder="Nom du membre"
                value={newEmployee.name}
                onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                disabled={currentUser.role !== "admin"}
              />
              <input
                style={styles.input}
                placeholder="Email du membre"
                value={newEmployee.email}
                onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                disabled={currentUser.role !== "admin"}
              />
              <select
                style={styles.input}
                value={newEmployee.role}
                onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
                disabled={currentUser.role !== "admin"}
              >
                <option value="employee">Employé</option>
                <option value="admin">Administrateur</option>
              </select>
              <button style={styles.buttonFull} onClick={addEmployee}>
                Ajouter un employé ou un administrateur
              </button>

              <div style={{ ...styles.tableLike, marginTop: "20px" }}>
                {employees.map((employee) => (
                  <div key={employee.id} style={styles.promoCard}>
                    <div style={styles.rowBetween}>
                      <div>
                        <div style={{ fontWeight: 800 }}>{employee.name}</div>
                        <div style={styles.muted}>{employee.id} • {employee.email}</div>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <span style={employee.role === "admin" ? styles.badgeGreen : styles.badgeBlue}>
                          {employee.role === "admin" ? "Administrateur" : "Employé"}
                        </span>
                        <span style={styles.badge}>{employee.status}</span>
                      </div>
                    </div>
                    <div style={styles.kpiLine}>
                      Dernière action connue : <strong>{employee.lastAction}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Journal de contrôle</h3>
              <p style={styles.helper}>
                Cet espace permet à l’administrateur de vérifier la bonne exécution : qui a ajouté un client, validé une visite, créé une promotion, préparé une relance ou ajouté un nouveau membre.
              </p>
              <div style={styles.tableLike}>
                {activityLog.map((item) => (
                  <div key={item.id} style={styles.promoCard}>
                    <div style={styles.rowBetween}>
                      <div>
                        <div style={{ fontWeight: 800 }}>{item.actor}</div>
                        <div style={styles.muted}>{item.date}</div>
                      </div>
                      <span style={item.role === "admin" ? styles.badgeGreen : styles.badgeBlue}>
                        {item.role === "admin" ? "Admin" : "Employé"}
                      </span>
                    </div>
                    <div style={styles.kpiLine}>
                      <div>{item.action}</div>
                      <div><strong>{item.detail}</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div style={styles.grid2}>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Paramètres du programme</h3>
              <input
                style={styles.input}
                placeholder="Nom du commerce"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
              <input
                style={styles.input}
                type="number"
                placeholder="Objectif de points"
                value={rewardGoal}
                onChange={(e) => setRewardGoal(e.target.value)}
              />
              <input
                style={styles.input}
                placeholder="Libellé de la récompense"
                value={rewardLabel}
                onChange={(e) => setRewardLabel(e.target.value)}
              />
              <input
                style={styles.input}
                placeholder="Couleur principale"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
              />

<h3 style={{ ...styles.sectionTitle, marginTop: "24px" }}>
  Zone géographique
</h3>

<input
  style={styles.input}
  placeholder="Pays"
  value={locationSettings.country}
  onChange={(e) =>
    setLocationSettings({ ...locationSettings, country: e.target.value })
  }
/>

<input
  style={styles.input}
  placeholder="Ville"
  value={locationSettings.city}
  onChange={(e) =>
    setLocationSettings({ ...locationSettings, city: e.target.value })
  }
/>

<input
  style={styles.input}
  placeholder="Nom de la zone"
  value={locationSettings.zoneLabel}
  onChange={(e) =>
    setLocationSettings({ ...locationSettings, zoneLabel: e.target.value })
  }
/>

<input
  style={styles.input}
  placeholder="Latitude"
  value={locationSettings.latitude}
  onChange={(e) =>
    setLocationSettings({ ...locationSettings, latitude: e.target.value })
  }
/>

<input
  style={styles.input}
  placeholder="Longitude"
  value={locationSettings.longitude}
  onChange={(e) =>
    setLocationSettings({ ...locationSettings, longitude: e.target.value })
  }
/>

<input
  style={styles.input}
  type="number"
  step="0.1"
  placeholder="Rayon en km"
  value={locationSettings.radiusKm}
  onChange={(e) =>
    setLocationSettings({ ...locationSettings, radiusKm: e.target.value })
  }
/>

<p style={styles.helper}>
  Définissez la zone du commerce et le rayon d’action marketing. Ce périmètre
  pourra ensuite servir pour les campagnes locales, les notifications ciblées
  et l’ajustement du rayon selon la densité de la zone.
</p>

              <button style={styles.buttonFull}>Enregistrer les réglages</button>
            </div>

            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Aperçu marque</h3>
              <div
                style={{
                  borderRadius: "22px",
                  padding: "24px",
                  color: "white",
                  background: `linear-gradient(135deg, ${primaryColor}, #14b8a6)`,
                  minHeight: "220px",
                }}
              >
                <div style={styles.heroBadge}>Carte de fidélité</div>
                <h4 style={{ fontSize: "32px", margin: "10px 0" }}>{businessName}</h4>
                <p style={{ lineHeight: 1.7 }}>
                  {rewardGoal} points = {rewardLabel}
                </p>
                <p style={{ lineHeight: 1.7, opacity: 0.95 }}>
                  Interface claire, programme rassurant et usage simple pour l’équipe, avec supervision côté administrateur.
                </p>
                <p style={{ lineHeight: 1.7, opacity: 0.95, marginBottom: 0 }}>
  Zone : {locationSettings.zoneLabel} • {locationSettings.city} •{" "}
  {locationSettings.country} • Rayon : {locationSettings.radiusKm} km
</p>
              </div>
            </div>
          </div>
        )}
        <div
  style={{
    marginTop: "28px",
    textAlign: "center",
    color: COLORS.textSoft,
    fontSize: "13px",
    lineHeight: 1.8,
    paddingBottom: "10px",
  }}
>
  <div>{poweredByLabel}</div>
  <a
    href={poweredByUrl}
    target="_blank"
    rel="noreferrer"
    style={{
      color: COLORS.goldLight,
      textDecoration: "none",
      fontWeight: 700,
    }}
  >
    je-webmarketing.com
  </a>
</div>
      </div>
    </div>
  );
}

function FakeQr({ value }) {
  const cells = Array.from({ length: 81 }, (_, i) => {
    const seed = (value + i).split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return seed % 2 === 0;
  });

  return (
    <div
      style={{
        width: "120px",
        height: "120px",
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "repeat(9, 1fr)",
        gap: "2px",
        background: "#fff",
        padding: "8px",
        borderRadius: "12px",
        boxSizing: "border-box",
      }}
    >
      {cells.map((filled, index) => (
        <div
          key={index}
          style={{
            background: filled ? "#111827" : "#ffffff",
            border: "1px solid #e5e7eb",
            width: "100%",
            height: "100%",
          }}
        />
      ))}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div
      style={{
        background: "#111111",
        borderRadius: "20px",
        padding: "22px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
        border: "1px solid #2A2A2A",
      }}
    >
      <div style={{ color: "#CFC7B0", fontSize: "14px", marginBottom: "10px" }}>
        {label}
      </div>
      <div style={{ fontSize: "34px", fontWeight: 800, color: "#F2D06B" }}>
        {value}
      </div>
    </div>
  );
}
