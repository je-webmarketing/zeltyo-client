export default function GeoSection({
  COLORS,
  locationMode,
  setLocationMode,
  requestUserLocation,
  geoState,
  selectedBusiness,
  selectedBusinessDistance,
  getDistanceLabel,
  copperButton,
  ghostButton,
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
                <ZoneLine label="Latitude" value={geoState.coords.lat.toFixed(5)} />
                <ZoneLine label="Longitude" value={geoState.coords.lng.toFixed(5)} />
                <ZoneLine
                  label="Précision"
                  value={`${Math.round(geoState.coords.accuracy || 0)} m`}
                />
              </>
            ) : null}
          </div>
        )}

        {locationMode === "auto" && geoState.coords && (
          <div style={{ marginTop: 4, display: "grid", gap: 10 }}>
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
                border: "1px solid rgba(217,122,50,0.35)",
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
  );
}