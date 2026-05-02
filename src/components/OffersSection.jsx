export default function OffersSection({
  COLORS,
  featuredOffer,
  filteredOffers,
  visibleOfferCards,
  hiddenOffersCount,
  showAllOffers,
  setShowAllOffers,
  offerFilter,
  setOfferFilter,
  getOfferBadge,
  getOfferUrgencyLabel,
  getDistanceLabel,
  copperButton,
  ghostButton,
}) {
  return (
    <div
      id="offres"
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 22,
        padding: 18,
        marginBottom: 18,
        boxShadow: "0 10px 24px rgba(0,0,0,0.28)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 8,
        }}
      >
        <h3 style={{ margin: 0, color: COLORS.goldLight, fontSize: 22 }}>
          Offres autour de moi
        </h3>

        <a href="#commerce" style={{ textDecoration: "none" }}>
          <button style={copperButton()}>Voir le commerce</button>
        </a>
      </div>

      {featuredOffer ? (
        <FeaturedOfferCard
          COLORS={COLORS}
          offer={featuredOffer}
          getOfferBadge={getOfferBadge}
          getOfferUrgencyLabel={getOfferUrgencyLabel}
          getDistanceLabel={getDistanceLabel}
          copperButton={copperButton}
          ghostButton={ghostButton}
        />
      ) : null}

      <p
        style={{
          marginTop: 0,
          marginBottom: 16,
          color: COLORS.textSoft,
          lineHeight: 1.6,
          fontSize: 14,
        }}
      >
        Découvrez les opportunités disponibles autour de vous, classées par
        proximité.
      </p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <button
          onClick={() => setOfferFilter("all")}
          style={{
            ...(offerFilter === "all" ? copperButton() : ghostButton()),
            padding: "10px 14px",
          }}
        >
          Toutes
        </button>

        <button
          onClick={() => setOfferFilter("flash")}
          style={{
            ...(offerFilter === "flash" ? copperButton() : ghostButton()),
            padding: "10px 14px",
          }}
        >
          Offres flash
        </button>

        <button
          onClick={() => setOfferFilter("reward")}
          style={{
            ...(offerFilter === "reward" ? copperButton() : ghostButton()),
            padding: "10px 14px",
          }}
        >
          Récompenses
        </button>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {filteredOffers.length === 0 ? (
          <div
            style={{
              padding: 16,
              borderRadius: 16,
              background: COLORS.surfaceSoft,
              border: `1px solid ${COLORS.border}`,
              color: COLORS.textSoft,
            }}
          >
            Aucune offre disponible pour le moment.
          </div>
        ) : (
          visibleOfferCards.map((offer) => (
            <OfferCard
              key={offer.id}
              COLORS={COLORS}
              offer={offer}
              getOfferBadge={getOfferBadge}
              getOfferUrgencyLabel={getOfferUrgencyLabel}
              getDistanceLabel={getDistanceLabel}
              copperButton={copperButton}
              ghostButton={ghostButton}
            />
          ))
        )}
      </div>

      {filteredOffers.filter((o) => o.id !== featuredOffer?.id).length > 4 ? (
        <div style={{ marginTop: 16 }}>
          <button onClick={() => setShowAllOffers((prev) => !prev)} style={copperButton()}>
            {showAllOffers
              ? "Voir moins"
              : hiddenOffersCount > 0
              ? `Voir plus (${hiddenOffersCount})`
              : "Voir toutes les offres"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function FeaturedOfferCard({
  COLORS,
  offer,
  getOfferBadge,
  getOfferUrgencyLabel,
  getDistanceLabel,
  copperButton,
  ghostButton,
}) {
  return (
    <div
      style={{
        background:
          "linear-gradient(145deg, rgba(212,175,55,0.16), rgba(255,255,255,0.03) 24%, #0B0B0B 72%)",
        border: "1px solid rgba(212,175,55,0.30)",
        borderRadius: 26,
        padding: 20,
        marginBottom: 18,
        boxShadow:
          "0 16px 36px rgba(0,0,0,0.35), 0 0 30px rgba(212,175,55,0.18)",
        animation: "pulseGold 2.5s infinite",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 140,
          height: 140,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(212,175,55,0.18), transparent 65%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div
            style={{
              display: "inline-block",
              padding: "8px 12px",
              borderRadius: 999,
              background: "rgba(212,175,55,0.12)",
              border: `1px solid ${COLORS.gold}`,
              color: COLORS.goldLight,
              fontWeight: 800,
              fontSize: 12,
              marginBottom: 12,
            }}
          >
            Offre star
          </div>

          <div
            style={{
              fontSize: 12,
              color: COLORS.textSoft,
              marginBottom: 6,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            🔥 Offre la plus intéressante autour de vous
          </div>

          <div
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: COLORS.goldLight,
              marginBottom: 6,
              lineHeight: 1.1,
            }}
          >
            {offer.title}
          </div>

          <div style={{ color: COLORS.text, fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
            {offer.businessName}
          </div>

          <div style={{ color: COLORS.textSoft, lineHeight: 1.6, marginBottom: 14 }}>
            {offer.description}
          </div>

          <OfferBadges
            COLORS={COLORS}
            offer={offer}
            getOfferBadge={getOfferBadge}
            getOfferUrgencyLabel={getOfferUrgencyLabel}
            getDistanceLabel={getDistanceLabel}
          />

          <div
            style={{
              color: offer.type === "flash" ? "#f5b09f" : COLORS.copperLight,
              fontWeight: 900,
              fontSize: 18,
              marginBottom: 16,
            }}
          >
            {offer.discountLabel}
          </div>

          <OfferActions offer={offer} copperButton={copperButton} ghostButton={ghostButton} />
        </div>
      </div>
    </div>
  );
}

function OfferCard({
  COLORS,
  offer,
  getOfferBadge,
  getOfferUrgencyLabel,
  getDistanceLabel,
  copperButton,
  ghostButton,
}) {
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 18,
        background: offer.isNearby ? "rgba(217,122,50,0.10)" : COLORS.surfaceSoft,
        border: offer.isNearby ? "1px solid rgba(217,122,50,0.30)" : `1px solid ${COLORS.border}`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 10,
        }}
      >
        <div>
          <div style={{ color: COLORS.goldLight, fontWeight: 800, fontSize: 20, marginBottom: 4 }}>
            {offer.title}
          </div>

          <div style={{ color: COLORS.text, fontWeight: 700, marginBottom: 4 }}>
            {offer.businessName}
          </div>

          <div style={{ color: COLORS.textSoft, fontSize: 13 }}>
            {offer.city} • {offer.zoneLabel}
          </div>
        </div>

        <OfferBadges
          COLORS={COLORS}
          offer={offer}
          getOfferBadge={getOfferBadge}
          getOfferUrgencyLabel={getOfferUrgencyLabel}
          getDistanceLabel={getDistanceLabel}
          compact
        />
      </div>

      <div style={{ color: COLORS.textSoft, lineHeight: 1.6, marginBottom: 14 }}>
        {offer.description}
      </div>

      {offer.ctaUrl && (
        <div style={{ marginBottom: 14 }}>
          <button style={copperButton()} onClick={() => window.open(offer.ctaUrl, "_blank")}>
            {offer.ctaLabel || "Voir l'offre"}
          </button>
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div
          style={{
            color: offer.type === "flash" ? "#f5b09f" : COLORS.copperLight,
            fontWeight: 800,
            fontSize: 14,
          }}
        >
          {offer.discountLabel}
        </div>

        <OfferActions offer={offer} copperButton={copperButton} ghostButton={ghostButton} />
      </div>
    </div>
  );
}

function OfferBadges({
  COLORS,
  offer,
  getOfferBadge,
  getOfferUrgencyLabel,
  getDistanceLabel,
  compact = false,
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        marginBottom: compact ? 0 : 16,
        justifyContent: compact ? "flex-end" : "flex-start",
      }}
    >
      <span
        style={{
          padding: "7px 10px",
          borderRadius: 999,
          background: "rgba(212,175,55,0.12)",
          border: `1px solid ${COLORS.gold}`,
          color: COLORS.goldLight,
          fontWeight: 800,
          fontSize: 12,
        }}
      >
        {getOfferBadge(offer.type)}
      </span>

      <span
        style={{
          padding: "7px 10px",
          borderRadius: 999,
          background: "rgba(201,75,50,0.12)",
          border: "1px solid rgba(201,75,50,0.35)",
          color: "#f5b09f",
          fontWeight: 800,
          fontSize: 12,
        }}
      >
        {getOfferUrgencyLabel(offer)}
      </span>

      <span
        style={{
          padding: "7px 10px",
          borderRadius: 999,
          background: "rgba(255,255,255,0.04)",
          border: `1px solid ${COLORS.border}`,
          color: COLORS.text,
          fontWeight: 700,
          fontSize: 12,
        }}
      >
        {Number.isFinite(offer.distanceKm)
          ? getDistanceLabel(offer.distanceKm)
          : offer.zoneLabel || "Dans votre zone"}
      </span>
    </div>
  );
}

function OfferActions({ offer, copperButton, ghostButton }) {
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      <a href="#commerce" style={{ textDecoration: "none" }}>
        <button style={copperButton()}>Voir le commerce</button>
      </a>

      <a href={offer.googleMapsUrl} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
        <button style={ghostButton()}>Itinéraire</button>
      </a>
    </div>
  );
}