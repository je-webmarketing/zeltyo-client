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
                      {booking.proposedDate || "-"}{" "}
                      {booking.proposedTime
                        ? `à ${booking.proposedTime}`
                        : ""}
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
  );
}