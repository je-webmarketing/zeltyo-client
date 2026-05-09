import { useState } from "react";

export default function ClientBookingsSection({ COLORS, clientBookings = [] }) {
  const [showHistory, setShowHistory] = useState(false);

  const activeBookings = clientBookings.filter(
    (booking) =>
      booking.status !== "completed" &&
      booking.status !== "archived" &&
      booking.status !== "cancelled"
  );

  const historyBookings = clientBookings.filter(
    (booking) =>
      booking.status === "completed" ||
      booking.status === "archived" ||
      booking.status === "cancelled"
  );

  function getStatusLabel(status) {
    if (status === "confirmed") return "Confirmée";
    if (status === "cancelled") return "Refusée";
    if (status === "archived") return "Archivée";
    if (status === "completed") return "Terminée";
    return "En attente";
  }

  function getStatusColor(status) {
    if (status === "confirmed") return "#22c55e";
    if (status === "cancelled") return "#ef4444";
    if (status === "archived") return "#94a3b8";
    if (status === "completed") return "#3b82f6";
    return "#F2A65A";
  }

  function BookingCard({ booking, faded = false }) {
    return (
      <div
        style={{
          border: "1px solid #2A2A2A",
          borderRadius: 16,
          padding: 14,
          background: faded ? "#111111" : "#161616",
          opacity: faded ? 0.84 : 1,
        }}
      >
        <div style={{ color: "#F2D06B", fontWeight: 800, marginBottom: 6 }}>
          Réservation du {booking.date} à {booking.time}
        </div>

        <div
          style={{
            color: getStatusColor(booking.status),
            fontWeight: 900,
            marginBottom: 8,
          }}
        >
          Statut : {getStatusLabel(booking.status)}
        </div>

        {booking.merchantResponse ? (
          <div style={{ color: "#F7F4EA" }}>
            Message commerçant : {booking.merchantResponse}
          </div>
        ) : null}

        {booking.proposedDate || booking.proposedTime ? (
          <div style={{ color: "#CFC7B0", marginTop: 6 }}>
            Nouveau créneau : {booking.proposedDate} {booking.proposedTime}
          </div>
        ) : null}
      </div>
    );
  }

  return (
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

      {clientBookings.length > 0 && (
        <button
          onClick={() => setShowHistory(!showHistory)}
          style={{
            background: "transparent",
            border: `1px solid ${COLORS.border}`,
            color: COLORS.goldLight,
            borderRadius: 10,
            padding: "8px 14px",
            cursor: "pointer",
            marginBottom: 14,
            fontWeight: 700,
          }}
        >
          {showHistory ? "Masquer l’historique" : "Afficher l’historique"}
        </button>
      )}

      {activeBookings.length === 0 ? (
        <p style={{ color: "#CFC7B0" }}>
          Aucune réservation active pour le moment.
        </p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {activeBookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}

      {showHistory && historyBookings.length > 0 && (
        <div style={{ marginTop: 22 }}>
          <h4 style={{ color: COLORS.goldLight, marginBottom: 12, fontSize: 18 }}>
            Historique
          </h4>

          <div style={{ display: "grid", gap: 12 }}>
            {historyBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} faded />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}