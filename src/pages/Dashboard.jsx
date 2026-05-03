import { useEffect, useMemo, useState } from "react";

const API_BASE = "http://localhost:3001";

const BUSINESS = {
  name: "Zeltyo Coffee",
  address: "12 rue du centre, Genève",
  lat: 46.2044,
  lng: 6.1432,
  googleMapsUrl: "https://www.google.com/maps?q=46.2044,6.1432",
  reviewUrl: "https://g.page/r/TON-LIEN-AVIS",
};

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
  yellowBg: "rgba(212,175,55,0.12)",
  redBg: "rgba(201,75,50,0.14)",
};

export default function Dashboard() {
  const [clients, setClients] = useState([]);
  const [loadingCampaign, setLoadingCampaign] = useState(false);
  const [loadingVisitPhone, setLoadingVisitPhone] = useState(null);
  const [loadingRelaunchPhone, setLoadingRelaunchPhone] = useState(null);

  const fetchClients = async () => {
    try {
      const res = await fetch(`${API_BASE}/clients/segments`);
      const data = await res.json();
      setClients(data.clients || []);
    } catch (err) {
      console.error("Erreur fetch clients:", err);
    }
  };

  useEffect(() => {
    fetchClients();
    const interval = setInterval(fetchClients, 5000);
    return () => clearInterval(interval);
  }, []);

  const count = (segment) =>
    clients.filter((c) => c.segment === segment).length;

  const getClientScore = (client) => {
    return (client.visits || 0) * 10 + (client.totalSpent || 0);
  };

  const sortedClients = useMemo(() => {
    return [...clients].sort((a, b) => getClientScore(b) - getClientScore(a));
  }, [clients]);

  const formatDaysAgo = (date) => {
    if (!date) return "-";

    const diff =
      (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24);

    const days = Math.floor(diff);

    if (days <= 0) return "Aujourd’hui";
    if (days === 1) return "Hier";

    return `Il y a ${days} jours`;
  };

  const getDaysSinceLastVisit = (date) => {
    if (!date) return null;
    return Math.floor(
      (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  const getUrgency = (date) => {
    const days = getDaysSinceLastVisit(date);

    if (days === null) {
      return {
        label: "Aucune visite",
        color: COLORS.textSoft,
        bg: "#1E1E1E",
      };
    }

    if (days <= 2) {
      return {
        label: "🟢 Récent",
        color: "#86efac",
        bg: COLORS.greenBg,
      };
    }

    if (days <= 6) {
      return {
        label: "🟡 À surveiller",
        color: COLORS.goldLight,
        bg: COLORS.yellowBg,
      };
    }

    return {
      label: "🔴 Urgent",
      color: "#fca5a5",
      bg: COLORS.redBg,
    };
  };

  const getInactiveClients = () => {
    return clients
      .filter((c) => {
        const days = getDaysSinceLastVisit(c.lastVisitAt);
        return days !== null && days >= 7;
      })
      .sort((a, b) => getClientScore(b) - getClientScore(a));
  };

  const isTopClient = (client) => {
    const maxScore = Math.max(...clients.map(getClientScore), 0);
    return getClientScore(client) === maxScore && maxScore > 0;
  };

  const isAtRisk = (client) => {
    const days = getDaysSinceLastVisit(client.lastVisitAt);
    return days !== null && days >= 7;
  };

  const getSuggestion = () => {
    if (!clients.length) return null;

    const atRiskClients = clients
      .filter((c) => {
        const days = getDaysSinceLastVisit(c.lastVisitAt);
        return days !== null && days >= 7;
      })
      .sort((a, b) => getClientScore(b) - getClientScore(a));

    if (atRiskClients.length > 0) {
      return {
        type: "relaunch",
        client: atRiskClients[0],
      };
    }

    const topClient = [...clients].sort(
      (a, b) => getClientScore(b) - getClientScore(a)
    )[0];

    if (!topClient) return null;

    return {
      type: "reward",
      client: topClient,
    };
  };

  const suggestion = getSuggestion();
  const inactiveClients = getInactiveClients();
  const urgentCount = inactiveClients.length;

  const addVisit = async (phone) => {
    try {
      setLoadingVisitPhone(phone);

      await fetch(`${API_BASE}/clients/visit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
          amount: 20,
          points: 1,
        }),
      });

      await fetchClients();
    } catch (err) {
      console.error("Erreur ajout visite:", err);
      alert("Erreur ajout visite");
    } finally {
      setLoadingVisitPhone(null);
    }
  };

  const relaunchClient = async (phone) => {
    try {
      setLoadingRelaunchPhone(phone);

      await fetch(`${API_BASE}/clients/relaunch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone }),
      });

      alert("Relance envoyée");
      await fetchClients();
    } catch (err) {
      console.error("Erreur relance client:", err);
      alert("Erreur relance client");
    } finally {
      setLoadingRelaunchPhone(null);
    }
  };

  const runCampaign = async (type) => {
    try {
      setLoadingCampaign(true);

      await fetch(`${API_BASE}/automation-segmented/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type }),
      });

      alert("Notifications envoyées ✅");
      await fetchClients();
    } catch (err) {
      console.error("Erreur campagne:", err);
      alert("Erreur campagne");
    } finally {
      setLoadingCampaign(false);
    }
  };

  const sendTestNotification = async () => {
    try {
      await fetch(`${API_BASE}/notifications/test`, {
        method: "POST",
      });

      alert("Notification envoyée !");
    } catch (err) {
      console.error(err);
      alert("Erreur envoi notification");
    }
  };

  return (
    <div
      style={{
        padding: 24,
        fontFamily: "Arial, sans-serif",
        background: COLORS.bg,
        minHeight: "100vh",
        color: COLORS.text,
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            marginBottom: 8,
            color: COLORS.goldLight,
            fontSize: 42,
            fontWeight: 800,
            letterSpacing: 0.3,
          }}
        >
          Zeltyo Dashboard
        </h1>
        <p style={{ margin: 0, color: COLORS.textSoft, fontSize: 18 }}>
          Vue simple pour piloter la fidélité, les relances et les meilleurs clients.
        </p>
      </div>

      {suggestion && (
        <div
          style={{
            background: COLORS.yellowBg,
            padding: 18,
            borderRadius: 16,
            marginBottom: 22,
            border: `1px solid ${COLORS.gold}`,
            color: COLORS.text,
            boxShadow: "0 10px 24px rgba(0,0,0,0.25)",
          }}
        >
          {suggestion.type === "relaunch" && (
            <div>
              💡 Suggestion du jour : relancer{" "}
              <strong style={{ color: COLORS.goldLight }}>
                {suggestion.client.name}
              </strong>
            </div>
          )}

          {suggestion.type === "reward" && (
            <div>
              💡 Suggestion du jour : valoriser{" "}
              <strong style={{ color: COLORS.goldLight }}>
                {suggestion.client.name}
              </strong>
            </div>
          )}
        </div>
      )}

      <SectionCard>
        <div style={{ marginBottom: 16, fontWeight: "bold", fontSize: 26, color: COLORS.goldLight }}>
          Actions marketing
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            onClick={sendTestNotification}
            style={goldButton()}
          >
            🔔 Notification test
          </button>

          <button
            onClick={() => runCampaign("inactive")}
            disabled={loadingCampaign}
            style={redButton()}
          >
            🔁 Relancer inactifs
          </button>

          <button
            onClick={() => runCampaign("loyal")}
            disabled={loadingCampaign}
            style={goldButton()}
          >
            ❤️ Booster fidélité
          </button>

          <button
            onClick={() => runCampaign("vip")}
            disabled={loadingCampaign}
            style={accentButton()}
          >
            ⭐ Récompenser VIP
          </button>
        </div>
      </SectionCard>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <StatCard title="Nouveaux" value={count("nouveau")} />
        <StatCard title="Fidèles" value={count("loyal")} />
        <StatCard title="VIP" value={count("vip")} />
        <StatCard title="Inactifs" value={count("inactive")} />
        <StatCard title="Urgents" value={urgentCount} />
      </div>

      <SectionCard>
        <h2
          style={{
            marginTop: 0,
            marginBottom: 16,
            color: COLORS.goldLight,
            fontSize: 24,
          }}
        >
          À relancer aujourd’hui
        </h2>

        {inactiveClients.length === 0 ? (
          <p style={{ marginBottom: 0, color: COLORS.textSoft }}>
            Aucun client à relancer 👍
          </p>
        ) : (
          <ul style={{ paddingLeft: 20, marginBottom: 0 }}>
            {inactiveClients.map((c) => (
              <li key={c.id} style={{ marginBottom: 10, color: COLORS.text }}>
                <strong style={{ color: COLORS.goldLight }}>{c.name}</strong> ({c.phone}) —{" "}
                {formatDaysAgo(c.lastVisitAt)}
                <button
                  onClick={() => relaunchClient(c.phone)}
                  disabled={loadingRelaunchPhone === c.phone}
                  style={{ ...redButtonSmall(), marginLeft: 10 }}
                >
                  {loadingRelaunchPhone === c.phone
                    ? "Envoi..."
                    : "Relancer ce client"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard>
        <div
          style={{
            background: "linear-gradient(180deg, #111111, #0B0B0B)",
            border: `1px solid ${COLORS.border}`,
            borderRadius: 18,
            padding: 22,
            boxShadow: "0 10px 24px rgba(0,0,0,0.35)",
          }}
        >
          <h3 style={{ marginTop: 0, color: COLORS.goldLight, fontSize: 26 }}>
            📍 Mon commerce
          </h3>

          <p style={{ marginBottom: 8, fontSize: 24, fontWeight: 700, color: COLORS.text }}>
            {BUSINESS.name}
          </p>
          <p style={{ color: COLORS.textSoft, fontSize: 18 }}>{BUSINESS.address}</p>

          <iframe
  src={`https://www.google.com/maps?q=${BUSINESS.lat},${BUSINESS.lng}&z=15&output=embed`}
  width="100%"
  height="200"
  style={{
    border: 0,
    borderRadius: 12,
    marginTop: 12,
  }}
  allowFullScreen=""
  loading="lazy"
/>

          <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a href={BUSINESS.googleMapsUrl} target="_blank" rel="noreferrer">
              <button style={goldButton()}>Voir sur Google Maps</button>
            </a>

            <a href={BUSINESS.reviewUrl} target="_blank" rel="noreferrer">
              <button style={reviewButton()}>⭐ Laisser un avis</button>
            </a>
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <h2
          style={{
            marginTop: 0,
            color: COLORS.goldLight,
            fontSize: 24,
            marginBottom: 16,
          }}
        >
          Clients
        </h2>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              borderCollapse: "collapse",
              width: "100%",
              background: COLORS.surface,
              color: COLORS.text,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            <thead style={{ background: "#1A1A1A" }}>
              <tr>
                {[
                  "Nom",
                  "Téléphone",
                  "Visites",
                  "Points",
                  "Segment",
                  "Dernière visite",
                  "Urgence",
                  "Dépenses",
                  "Score",
                  "Statut",
                  "Action",
                ].map((label) => (
                  <th
                    key={label}
                    style={{
                      border: `1px solid ${COLORS.border}`,
                      padding: 14,
                      color: COLORS.goldLight,
                      fontWeight: 700,
                      textAlign: "left",
                    }}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {sortedClients.map((c) => {
                const urgency = getUrgency(c.lastVisitAt);

                return (
                  <tr key={c.id}>
                    <td style={tdStyle()}>{c.name}</td>
                    <td style={tdStyle()}>{c.phone}</td>
                    <td style={tdStyle()}>{c.visits}</td>
                    <td style={tdStyle()}>{c.points}</td>
                    <td style={tdStyle()}>{c.segment}</td>
                    <td style={tdStyle()}>{formatDaysAgo(c.lastVisitAt)}</td>
                    <td style={tdStyle()}>
                      <span
                        style={{
                          background: urgency.bg,
                          color: urgency.color,
                          padding: "5px 10px",
                          borderRadius: 999,
                          fontWeight: "bold",
                          fontSize: 12,
                          whiteSpace: "nowrap",
                          border: `1px solid ${COLORS.border}`,
                        }}
                      >
                        {urgency.label}
                      </span>
                    </td>
                    <td style={tdStyle()}>{c.totalSpent ?? 0} €</td>
                    <td style={tdStyle()}>{getClientScore(c)}</td>
                    <td style={tdStyle()}>
                      {isTopClient(c) && (
                        <span style={{ color: COLORS.goldLight, fontWeight: "bold" }}>
                          🏆 Top client
                        </span>
                      )}
                      {isAtRisk(c) && (
                        <span
                          style={{
                            color: "#fca5a5",
                            fontWeight: "bold",
                            marginLeft: isTopClient(c) ? 8 : 0,
                          }}
                        >
                          ⚠️ À relancer
                        </span>
                      )}
                    </td>
                    <td style={tdStyle()}>
                      <button
                        onClick={() => addVisit(c.phone)}
                        disabled={loadingVisitPhone === c.phone}
                        style={goldButtonSmall()}
                      >
                        {loadingVisitPhone === c.phone ? "Ajout..." : "+ visite"}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {sortedClients.length === 0 && (
                <tr>
                  <td
                    colSpan="11"
                    style={{
                      textAlign: "center",
                      padding: 24,
                      color: COLORS.textSoft,
                      border: `1px solid ${COLORS.border}`,
                    }}
                  >
                    Aucun client pour le moment
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

function SectionCard({ children }) {
  return (
    <div
      style={{
        background: COLORS.surface,
        borderRadius: 18,
        padding: 22,
        marginBottom: 24,
        border: `1px solid ${COLORS.border}`,
        boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
      }}
    >
      {children}
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div
      style={{
        padding: 22,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 18,
        textAlign: "center",
        background: COLORS.surface,
        boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
      }}
    >
      <h3
        style={{
          marginTop: 0,
          marginBottom: 10,
          fontSize: 18,
          color: COLORS.textSoft,
          fontWeight: 600,
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: 42,
          margin: 0,
          fontWeight: "bold",
          color: COLORS.goldLight,
          lineHeight: 1,
        }}
      >
        {value}
      </p>
    </div>
  );
}

function goldButton() {
  return {
    background: "linear-gradient(135deg, #D4AF37, #F2D06B)",
    color: "#111111",
    border: "none",
    padding: "11px 16px",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: "bold",
    boxShadow: "0 8px 18px rgba(212,175,55,0.25)",
  };
}

function accentButton() {
  return {
    background: "linear-gradient(135deg, #A14CFF, #D4AF37)",
    color: "#111111",
    border: "none",
    padding: "11px 16px",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: "bold",
    boxShadow: "0 8px 18px rgba(161,76,255,0.22)",
  };
}

function redButton() {
  return {
    background: "linear-gradient(135deg, #C94B32, #E06A4C)",
    color: "white",
    border: "none",
    padding: "11px 16px",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: "bold",
    boxShadow: "0 8px 18px rgba(201,75,50,0.22)",
  };
}

function reviewButton() {
  return {
    background: "linear-gradient(135deg, #C94B32, #D4AF37)",
    color: "#111111",
    border: "none",
    padding: "11px 16px",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: "bold",
    boxShadow: "0 8px 18px rgba(201,75,50,0.22)",
  };
}

function goldButtonSmall() {
  return {
    background: "linear-gradient(135deg, #D4AF37, #F2D06B)",
    color: "#111111",
    border: "none",
    padding: "8px 12px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: "bold",
  };
}

function redButtonSmall() {
  return {
    background: "linear-gradient(135deg, #C94B32, #E06A4C)",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: "bold",
  };
}

function tdStyle() {
  return {
    border: `1px solid ${COLORS.border}`,
    padding: 14,
    color: COLORS.text,
    background: COLORS.surface,
  };
}