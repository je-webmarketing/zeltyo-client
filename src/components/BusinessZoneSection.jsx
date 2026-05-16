export default function BusinessZoneSection({
  COLORS,
  selectedBusiness,
  inputStyle,
  ZoneLine,
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
        {selectedBusiness.country || "France"}
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
        {selectedBusiness.city || "Montpellier"}
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
        {selectedBusiness.zoneLabel || "Antigone"}
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
          value={selectedBusiness.country || "France"}
        />

        <ZoneLine
          label="Ville"
          value={selectedBusiness.city || "Montpellier"}
        />

        <ZoneLine
          label="Secteur"
          value={selectedBusiness.zoneLabel || "Antigone"}
        />

        <ZoneLine
          label="Rayon"
          value={`${selectedBusiness.radiusKm || 2} km`}
        />
      </div>

      <div
        style={{
          marginTop: 12,
          padding: "14px",
          borderRadius: "14px",
          border: `1px solid ${COLORS.border}`,
          background: COLORS.surfaceSoft,
          color: COLORS.text,
          fontWeight: 700,
        }}
      >
        {selectedBusiness.businessName || "Barber Club Antigone"}
      </div>
    </div>
  );
}