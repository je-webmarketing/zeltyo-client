export default function ClientBookingsSection({
  COLORS,
  clientBookings,
}) {
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

      {clientBookings.length === 0 ? (
  <p style={{ color: "#CFC7B0" }}>
    Aucune réponse de réservation pour le moment.
  </p>
) : (
  <div style={{ display: "grid", gap: 12 }}>
    {clientBookings.map((booking) => {
      const statusLabel =
        booking.status === "confirmed"
          ? "Confirmée"
          : booking.status === "cancelled"
          ? "Refusée"
          : "En attente";

      const statusColor =
        booking.status === "confirmed"
          ? "#22c55e"
          : booking.status === "cancelled"
          ? "#ef4444"
          : "#F2A65A";

      return (
        <div
          key={booking.id}
          style={{
            border: "1px solid #2A2A2A",
            borderRadius: 16,
            padding: 14,
            background: "#161616",
          }}
        >
          <div
            style={{
              color: "#F2D06B",
              fontWeight: 800,
              marginBottom: 6,
            }}
          >
            Réservation du {booking.date} à {booking.time}
          </div>

          <div
            style={{
              color: statusColor,
              fontWeight: 900,
              marginBottom: 8,
            }}
          >
            Statut : {statusLabel}
          </div>

          {booking.merchantResponse ? (
            <div style={{ color: "#F7F4EA" }}>
              Message commerçant : {booking.merchantResponse}
            </div>
          ) : null}

          {booking.proposedDate || booking.proposedTime ? (
            <div
              style={{
                color: "#CFC7B0",
                marginTop: 6,
              }}
            >
              Nouveau créneau :
              {" "}
              {booking.proposedDate}
              {" "}
              {booking.proposedTime}
            </div>
          ) : null}
        </div>
      );
    })}
  </div>
)}
    </div>
  );
}