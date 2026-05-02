export default function TopNavSection({
  COLORS,
  selectedBusiness,
  copperButtonSmall,
  ghostButtonSmall,
  reviewButton,
}) {
  return (
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

        <a
          href={selectedBusiness.reviewUrl}
          target="_blank"
          rel="noreferrer"
          style={{ textDecoration: "none" }}
        >
          <button style={reviewButton()}>⭐ Voir les avis</button>
        </a>

        <button
          onClick={() =>
            alert(
              "Mes cartes arrive bientôt ✅\nVous pourrez retrouver toutes vos cartes fidélité ici."
            )
          }
          style={ghostButtonSmall()}
        >
          💳 Mes cartes
        </button>
      </div>
    </div>
  );
}