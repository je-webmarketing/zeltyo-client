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

  manualBusinessId,
  setManualBusinessId,
  STORAGE_SELECTED_BUSINESS,
  businesses = [],

  manualCountry,
  setManualCountry,
  manualCity,
  setManualCity,
  manualRegion,
  setManualRegion,
  manualZone,
  setManualZone,

  favoriteDestinations = [],
  addFavoriteDestination,
}) {
  const filteredBusinesses = businesses.filter((business) => {
    const countryOk =
      !manualCountry ||
      business.country?.toLowerCase().includes(manualCountry.toLowerCase());

    const cityOk =
      !manualCity ||
      business.city?.toLowerCase().includes(manualCity.toLowerCase());

    const regionOk =
  !manualRegion ||
  !business.region ||
  business.region.toLowerCase().includes(manualRegion.toLowerCase());

    const zoneOk =
      !manualZone ||
      business.zoneLabel?.toLowerCase().includes(manualZone.toLowerCase());

    return countryOk && cityOk && regionOk && zoneOk;
  });

  const destinationLabel = [
    manualCountry,
    manualRegion,
    manualCity,
    manualZone,
  ]
    .filter(Boolean)
    .join(" • ");

  const mapQuery = `${manualZone || ""} ${manualCity || ""} ${
    manualRegion || ""
  } ${manualCountry || ""}`.trim();

 console.log("ALL BUSINESSES =", businesses);

console.log("SEARCH =", {
  manualCountry,
  manualRegion,
  manualCity,
  manualZone,
});

console.log("FILTERED =", filteredBusinesses); 

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
            type="button"
            onClick={() => setLocationMode("auto")}
            style={copperButton()}
          >
            Mode automatique
          </button>

          <button
            type="button"
            onClick={() => setLocationMode("manual")}
            style={ghostButton()}
          >
            Choix manuel
          </button>

          <button
            type="button"
            onClick={requestUserLocation}
            style={{
              padding: "12px 18px",
              borderRadius: 14,
              border: `1px solid ${COLORS.border}`,
              background: "#F2A65A",
              color: "#111",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            📍 Actualiser la position
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

            {geoState.coords && (
              <>
                <ZoneLine
                  label="Latitude"
                  value={geoState.coords.lat.toFixed(5)}
                />
                <ZoneLine
                  label="Longitude"
                  value={geoState.coords.lng.toFixed(5)}
                />
                <ZoneLine
                  label="Précision"
                  value={`${Math.round(geoState.coords.accuracy || 0)} m`}
                />
              </>
            )}
          </div>
        )}

        {locationMode === "manual" && (
          <div
            style={{
              padding: 12,
              borderRadius: 14,
              background: COLORS.surfaceSoft,
              border: `1px solid ${COLORS.border}`,
              display: "grid",
              gap: 10,
            }}
          >
            <h3
              style={{
                margin: "4px 0 8px",
                color: COLORS.goldLight,
                textAlign: "center",
              }}
            >
              🌍 Explorer une autre zone
            </h3>

            <label style={{ color: COLORS.textSoft }}>Pays</label>
            <input
              type="text"
              placeholder="Ex : Suisse, France, Espagne..."
              value={manualCountry}
              onChange={(e) => {
                setManualCountry(e.target.value);
                setManualCity("");
                setManualRegion("");
                setManualZone("");
                setManualBusinessId("");
              }}
              style={inputStyle(COLORS)}
            />

            <label style={{ color: COLORS.textSoft }}>Ville</label>
            <input
              type="text"
              placeholder="Ex : Lausanne, Nice, Paris..."
              value={manualCity}
              onChange={(e) => {
                setManualCity(e.target.value);
                setManualZone("");
                setManualBusinessId("");
              }}
              style={inputStyle(COLORS)}
            />

            <label style={{ color: COLORS.textSoft }}>
              Département / Canton
            </label>
            <input
              type="text"
              placeholder="Ex : Orne, Vaud, Hérault, Genève..."
              value={manualRegion}
              onChange={(e) => {
                setManualRegion(e.target.value);
                setManualZone("");
                setManualBusinessId("");
              }}
              style={inputStyle(COLORS)}
            />

            <label style={{ color: COLORS.textSoft }}>Secteur</label>
            <input
              type="text"
              placeholder="Ex : Centre-ville, Bord de lac..."
              value={manualZone}
              onChange={(e) => {
                setManualZone(e.target.value);
                setManualBusinessId("");
              }}
              style={inputStyle(COLORS)}
            />

            <button
              type="button"
              style={copperButton()}
              onClick={() => setLocationMode("manual")}
            >
              🔍 Explorer cette destination
            </button>

            {destinationLabel && (
              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  borderRadius: 12,
                  background: COLORS.surfaceSoft,
                  border: `1px solid ${COLORS.border}`,
                  textAlign: "center",
                  color: COLORS.gold,
                  fontWeight: 900,
                  lineHeight: 1.5,
                }}
              >
                📍 Destination explorée :
                <br />
                {destinationLabel}
              </div>
            )}

            {manualCountry && manualCity && (
              <div
                style={{
                  marginTop: 14,
                  borderRadius: 18,
                  overflow: "hidden",
                  border: `1px solid ${COLORS.border}`,
                  background: COLORS.surfaceSoft,
                }}
              >
                <iframe
                  title="Carte de la destination"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(
                    mapQuery
                  )}&output=embed`}
                  width="100%"
                  height="240"
                  style={{ border: 0, display: "block" }}
                  loading="lazy"
                />

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    mapQuery
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ textDecoration: "none" }}
                >
                  <button
                    type="button"
                    style={{
                      width: "100%",
                      padding: "13px 16px",
                      border: "none",
                      background: "linear-gradient(135deg, #D97A32, #F2A65A)",
                      color: "#111",
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                  >
                    📍 Ouvrir cette destination dans Google Maps
                  </button>
                </a>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                if (!addFavoriteDestination || !destinationLabel) return;

                addFavoriteDestination({
                  country: manualCountry,
                  region: manualRegion,
                  city: manualCity,
                  zone: manualZone,
                });
              }}
              style={copperButton()}
            >
              ⭐ Ajouter cette destination à mes favoris
            </button>

            {favoriteDestinations.length > 0 && (
              <div
                style={{
                  marginTop: 16,
                  padding: 16,
                  borderRadius: 18,
                  background: COLORS.surfaceSoft,
                  border: `1px solid ${COLORS.border}`,
                }}
              >
                <h3 style={{ marginTop: 0, color: COLORS.gold }}>
                  ⭐ Destinations favorites
                </h3>

                {favoriteDestinations.map((dest, index) => (
                  <div
                    key={`${dest.country}-${dest.region}-${dest.city}-${dest.zone}-${index}`}
                    style={{
                      padding: 10,
                      marginBottom: 8,
                      borderRadius: 12,
                      background: COLORS.surface,
                      color: COLORS.textSoft,
                      fontWeight: 700,
                    }}
                  >
                    {[dest.country, dest.region, dest.city, dest.zone]
                      .filter(Boolean)
                      .join(" • ")}
                  </div>
                ))}
              </div>
            )}

            <div
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 12,
                background: COLORS.surfaceSoft,
                border: `1px solid ${COLORS.border}`,
                textAlign: "center",
              }}
            >
              <div style={{ fontWeight: 900, fontSize: 18 }}>
                {filteredBusinesses.length} commerce(s) trouvé(s)
              </div>

              {filteredBusinesses.length === 0 && (
                <div
                  style={{
                    marginTop: 12,
                    padding: 14,
                    borderRadius: 14,
                    background: COLORS.surfaceSoft,
                    border: `1px solid ${COLORS.border}`,
                    color: COLORS.textSoft,
                    textAlign: "center",
                    lineHeight: 1.6,
                  }}
                >
                  Aucun commerce partenaire n’est encore disponible dans cette
                  destination.
                  <br />
                  <br />
                  <button
                    type="button"
                    style={copperButton()}
                    onClick={() => {
                      alert(
                        "Merci ! Nous vous informerons dès qu'un commerce Zeltyo sera disponible dans cette zone."
                      );
                    }}
                  >
                    📩 Me prévenir quand Zeltyo arrive ici
                  </button>
                  <br />
                  <br />
                  Vous pouvez essayer une autre ville ou revenir plus tard.
                </div>
              )}
            </div>

            {filteredBusinesses.length > 0 && (
              <label style={{ color: COLORS.textSoft, textAlign: "center" }}>
                Commerce
              </label>
            )}

            {filteredBusinesses.length === 1 && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setManualBusinessId(filteredBusinesses[0].id);
                    localStorage.setItem(
                      STORAGE_SELECTED_BUSINESS,
                      filteredBusinesses[0].id
                    );
                    setLocationMode("manual");
                  }}
                  style={{
                    width: "100%",
                    padding: 16,
                    borderRadius: 16,
                    border: `1px solid ${COLORS.border}`,
                    background: "linear-gradient(135deg, #D97A32, #F2A65A)",
                    color: "#111",
                    fontWeight: 900,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  🏪 {filteredBusinesses[0].name}
                  <br />
                  <span style={{ fontSize: 13 }}>
                    📍 {filteredBusinesses[0].city || "Ville"} •{" "}
                    {filteredBusinesses[0].region || "Région"} •{" "}
                    {filteredBusinesses[0].zoneLabel || "Zone"}
                  </span>
                  <br />
                  <span style={{ fontSize: 13 }}>
                    📏 Rayon : {filteredBusinesses[0].radiusKm || "0"} km
                  </span>
                  <br />
                  <span style={{ fontSize: 13, fontWeight: 900 }}>
                    👉 Voir ce commerce
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setManualBusinessId(filteredBusinesses[0].id);
                    localStorage.setItem(
                      STORAGE_SELECTED_BUSINESS,
                      filteredBusinesses[0].id
                    );
                    setLocationMode("manual");
                  }}
                  style={{
                    marginTop: 12,
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: 14,
                    border: "none",
                    background: "linear-gradient(135deg, #D97A32, #F2A65A)",
                    color: "#111",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  🎁 Voir les offres de cette destination
                </button>
              </>
            )}

            {filteredBusinesses.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setManualBusinessId(filteredBusinesses[0].id);
                    localStorage.setItem(
                      STORAGE_SELECTED_BUSINESS,
                      filteredBusinesses[0].id
                    );
                    setLocationMode("manual");
                  }}
                  style={{
                    marginTop: 12,
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: 14,
                    border: "none",
                    background: "linear-gradient(135deg, #D97A32, #F2A65A)",
                    color: "#111",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  🎁 Voir les offres de cette destination
                </button>

                <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                  {filteredBusinesses.map((business) => (
                    <button
                      key={business.id}
                      type="button"
                      onClick={() => {
                        setManualBusinessId(business.id);
                        localStorage.setItem(
                          STORAGE_SELECTED_BUSINESS,
                          business.id
                        );
                      }}
                      style={{
                        padding: 14,
                        borderRadius: 14,
                        border: `1px solid ${COLORS.border}`,
                        background:
                          manualBusinessId === business.id
                            ? "linear-gradient(135deg, #D97A32, #F2A65A)"
                            : COLORS.surface,
                        color:
                          manualBusinessId === business.id
                            ? "#111"
                            : COLORS.text,
                        fontWeight: 900,
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      🏪 {business.name}
                      <br />
                      <span style={{ fontSize: 13, opacity: 0.8 }}>
                        {business.city || "Ville"} •{" "}
                        {business.region || "Région"} •{" "}
                        {business.zoneLabel || "Zone"} • Rayon :{" "}
                        {business.radiusKm || "0"} km
                      </span>
                    </button>
                  ))}
                </div>

                <select
                  value={manualBusinessId}
                  onChange={(e) => {
                    setManualBusinessId(e.target.value);
                    localStorage.setItem(
                      STORAGE_SELECTED_BUSINESS,
                      e.target.value
                    );
                  }}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: 12,
                    border: `1px solid ${COLORS.border}`,
                    background: COLORS.surface,
                    color: COLORS.text,
                    fontWeight: 700,
                    marginTop: 12,
                  }}
                >
                  <option value="">Choisir un commerce</option>

                  {filteredBusinesses.map((business) => (
                    <option key={business.id} value={business.id}>
                      {business.name} — {business.city || "Ville"} —{" "}
                      {business.region || "Région"} —{" "}
                      {business.zoneLabel || "Zone"}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
        )}

        {locationMode === "auto" && geoState.coords && selectedBusiness && (
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
                  <div style={{ fontWeight: 800 }}>
                    {selectedBusiness.name}
                  </div>
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

function inputStyle(COLORS) {
  return {
    width: "100%",
    padding: "12px",
    borderRadius: 12,
    border: `1px solid ${COLORS.border}`,
    background: COLORS.surface,
    color: COLORS.text,
    fontWeight: 700,
  };
}