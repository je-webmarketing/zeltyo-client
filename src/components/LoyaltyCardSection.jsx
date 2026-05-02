import { QRCodeSVG } from "qrcode.react";

export default function LoyaltyCardSection({
  COLORS,
  selectedBusiness,
  selectedBusinessDistance,
  formatDistance,
  cardUrl,
  client,
  clientPoints,
  rewardGoal,
  clientProgress,
  clientRewardRemaining,
  rewardAvailable,
  InfoCard,
  MiniStat,
}) {
  return (
    <>
      <div
        id="carte"
        style={{
          background: "linear-gradient(135deg, #111111, #161616)",
          border: `1px solid ${COLORS.border}`,
          borderRadius: 24,
          padding: 22,
          marginBottom: 18,
          boxShadow: "0 12px 28px rgba(0,0,0,0.32)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontSize: 14, color: COLORS.textSoft, marginBottom: 6 }}>
              Progression fidélité
            </div>
            <div style={{ fontSize: 30, fontWeight: 900, color: COLORS.goldLight }}>
              {clientPoints} / {rewardGoal}
            </div>
          </div>

          <div
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              background: "rgba(212,175,55,0.12)",
              border: `1px solid ${COLORS.gold}`,
              color: COLORS.goldLight,
              fontWeight: 700,
              fontSize: 13,
              whiteSpace: "nowrap",
            }}
          >
            {clientRewardRemaining === 0
              ? "Récompense atteinte"
              : `${clientRewardRemaining} point(s) restants`}
          </div>
        </div>

        <div
          style={{
            background: "#222",
            height: 14,
            borderRadius: 999,
            overflow: "hidden",
            marginBottom: 14,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <div
            style={{
              width: `${Math.min(clientProgress, 100)}%`,
              background: "linear-gradient(90deg, #D97A32, #F2A65A)",
              height: "100%",
              borderRadius: 999,
              boxShadow: "0 0 14px rgba(217,122,50,0.35)",
            }}
          />
        </div>

        {rewardAvailable && (
          <div
            style={{
              marginBottom: 14,
              padding: 14,
              borderRadius: 16,
              background: "rgba(212,175,55,0.14)",
              border: `1px solid ${COLORS.gold}`,
              color: COLORS.goldLight,
              fontWeight: 900,
              textAlign: "center",
            }}
          >
            🎁 Récompense disponible !
          </div>
        )}

        <div style={{ display: "grid", gap: 12 }}>
          <InfoCard label="Récompense" value={selectedBusiness.rewardLabel} />
          <InfoCard label="Offre du moment" value={selectedBusiness.promo} accent="red" />
        </div>
      </div>

      <div
        style={{
          background:
            "linear-gradient(145deg, rgba(212,175,55,0.18), rgba(255,255,255,0.02) 24%, #0A0A0A 72%)",
          border: "1px solid rgba(212,175,55,0.32)",
          borderRadius: 32,
          padding: 24,
          marginBottom: 18,
          boxShadow:
            "0 18px 40px rgba(0,0,0,0.46), 0 0 26px rgba(212,175,55,0.08), inset 0 1px 0 rgba(255,255,255,0.03)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -60,
            right: -60,
            width: 180,
            height: 180,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(212,175,55,0.18), transparent 65%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
            flexWrap: "wrap",
            marginBottom: 18,
            position: "relative",
            zIndex: 1,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                color: COLORS.textSoft,
                textTransform: "uppercase",
                letterSpacing: 1.4,
                marginBottom: 8,
              }}
            >
              Carte client premium
            </div>

            <div
              style={{
                fontSize: 30,
                fontWeight: 900,
                color: COLORS.goldLight,
                marginBottom: 6,
              }}
            >
              {client.name}
            </div>

            <div style={{ color: COLORS.text, fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
              {selectedBusiness.name}
            </div>

            <div style={{ color: COLORS.textSoft, lineHeight: 1.6 }}>
              {selectedBusiness.city} • {selectedBusiness.country}
            </div>

            <div style={{ color: COLORS.textSoft, lineHeight: 1.6 }}>
              {selectedBusiness.zoneLabel || "Zone non renseignée"} • Rayon{" "}
              {selectedBusiness.radiusKm} km
            </div>

            {selectedBusinessDistance != null ? (
              <div style={{ color: COLORS.textSoft, lineHeight: 1.6 }}>
                Distance estimée • {formatDistance(selectedBusinessDistance)}
              </div>
            ) : null}
          </div>

          <div
            style={{
              padding: "9px 14px",
              borderRadius: 999,
              background: "rgba(217,122,50,0.12)",
              border: `1px solid ${COLORS.copper}`,
              color: COLORS.copperLight,
              fontWeight: 800,
              fontSize: 14,
              boxShadow: "0 0 12px rgba(217,122,50,0.12)",
            }}
          >
            {clientPoints} points
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 0.9fr",
            gap: 16,
            alignItems: "stretch",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              border: `1px solid ${COLORS.border}`,
              borderRadius: 20,
              padding: 18,
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: COLORS.textSoft,
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 8,
              }}
            >
              Identifiant fidélité
            </div>

            <div
              style={{
                fontSize: 24,
                fontWeight: 900,
                color: COLORS.goldLight,
                letterSpacing: 1.2,
                marginBottom: 14,
              }}
            >
              {client.loyaltyId}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                marginBottom: 12,
                flexWrap: "wrap",
              }}
            >
              <MiniStat label="Points" value={`${clientPoints}/${rewardGoal}`} />
              <MiniStat
                label="Restants"
                value={clientRewardRemaining === 0 ? "0" : String(clientRewardRemaining)}
              />
            </div>

            <div
              style={{
                background: "#1A1A1A",
                height: 12,
                borderRadius: 999,
                overflow: "hidden",
                border: `1px solid ${COLORS.border}`,
                boxShadow: "inset 0 1px 2px rgba(0,0,0,0.35)",
              }}
            >
              <div
                style={{
                  width: `${Math.min(clientProgress, 100)}%`,
                  background: "linear-gradient(90deg, #D97A32, #F2A65A)",
                  height: "100%",
                  borderRadius: 999,
                  boxShadow: "0 0 16px rgba(217,122,50,0.28)",
                }}
              />
            </div>

            <div
              style={{
                marginTop: 14,
                color: COLORS.textSoft,
                lineHeight: 1.5,
                fontSize: 14,
              }}
            >
              {clientRewardRemaining === 0
                ? "Votre récompense premium est disponible."
                : `${clientRewardRemaining} point(s) encore pour débloquer votre récompense.`}
            </div>
          </div>

          <div
            style={{
              background: COLORS.blackCard,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 20,
              padding: 16,
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 230,
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: COLORS.textSoft,
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 12,
              }}
            >
              QR fidélité
            </div>

            <div
              style={{
                background: "#ffffff",
                padding: 12,
                borderRadius: 18,
                boxShadow: "0 12px 24px rgba(0,0,0,0.25)",
                marginBottom: 12,
              }}
            >
              <QRCodeSVG
                value={cardUrl}
                size={120}
                bgColor="#FFFFFF"
                fgColor="#111111"
                level="H"
                includeMargin={false}
              />
            </div>

            <div
              style={{
                color: COLORS.textSoft,
                fontSize: 12,
                lineHeight: 1.5,
                maxWidth: 160,
              }}
            >
              Présentez ce QR code en caisse pour identifier votre carte.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}