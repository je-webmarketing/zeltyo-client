export default function CommerceSection({
  COLORS,
  selectedBusiness,
  selectedBusinessDistance,
  formatDistance,
  copperButton,
  ghostButton,
  reviewButton,
}) {
  return (
    <>
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
        <h3 style={{ marginTop: 0, marginBottom: 14, color: COLORS.goldLight, fontSize: 22 }}>
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

        <iframe
          src={
            selectedBusiness.hasCoordinates
              ? `https://www.google.com/maps?q=${selectedBusiness.lat},${selectedBusiness.lng}&z=15&output=embed`
              : `https://www.google.com/maps?q=${encodeURIComponent(
                  selectedBusiness.address || selectedBusiness.name
                )}&output=embed`
          }
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

        <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a
            href={selectedBusiness.googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: "none" }}
          >
            <button style={copperButton()}>📍 Voir sur Google Maps</button>
          </a>

          <a
            href={selectedBusiness.reviewUrl}
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: "none" }}
          >
            <button style={reviewButton()}>⭐ Laisser un avis</button>
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
        <h3 style={{ marginTop: 0, marginBottom: 14, color: COLORS.goldLight, fontSize: 22 }}>
          Avis Google
        </h3>

        <p style={{ color: COLORS.textSoft, lineHeight: 1.6 }}>
          Donnez votre avis après votre passage et aidez votre commerce préféré
          à gagner en visibilité.
        </p>

        {selectedBusiness.reviewUrl ? (
          <a href={selectedBusiness.reviewUrl} target="_blank" rel="noreferrer">
            <button style={reviewButton()}>⭐ Laisser un avis</button>
          </a>
        ) : (
          <button style={{ ...ghostButton(), cursor: "not-allowed", opacity: 0.6 }}>
            Lien d’avis indisponible
          </button>
        )}
      </div>
    </>
  );
}