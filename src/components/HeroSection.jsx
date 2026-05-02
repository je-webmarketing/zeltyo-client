export default function HeroSection({
  COLORS,
  menuImage,
  menuItems,
}) {
  return (
    <div
      style={{
        background: "linear-gradient(180deg, #111111, #0B0B0B)",
        border: `1px solid ${COLORS.border}`,
        borderRadius: 28,
        padding: 22,
        boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
        marginBottom: 18,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 18,
        }}
      >
        <div
          style={{
            padding: 0,
            borderRadius: 22,
            background: "transparent",
            boxShadow: "none",
          }}
        >
          <img
            src="/icon-512.png"
            alt="Zeltyo"
            style={{
              width: 145,
              height: 145,
              borderRadius: 22,
              background: "transparent",
              padding: 0,
              objectFit: "contain",
              display: "block",
            }}
          />
        </div>

        <div>
          <div
            style={{
              fontSize: 34,
              fontWeight: 900,
              color: COLORS.goldLight,
              lineHeight: 1,
            }}
          >
            Zeltyo
          </div>

          <div
            style={{
              color: COLORS.textSoft,
              fontSize: 15,
              marginTop: 8,
            }}
          >
            Votre espace fidélité premium
          </div>
        </div>
      </div>

      <div
        style={{
          display: "inline-block",
          padding: "8px 14px",
          borderRadius: 999,
          background: "rgba(212,175,55,0.12)",
          border: `1px solid ${COLORS.gold}`,
          color: COLORS.goldLight,
          fontWeight: 700,
          fontSize: 13,
          marginBottom: 18,
        }}
      >
        Carte fidélité digitale
      </div>

      {menuImage && (
        <div style={{ marginTop: "20px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 900 }}>
            📸 Notre carte
          </h3>

          <img
            src={menuImage}
            alt="Menu"
            style={{
              width: "100%",
              borderRadius: "16px",
              marginTop: "10px",
            }}
          />
        </div>
      )}

      {menuItems.length > 0 && (
        <div style={{ marginTop: "24px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 900 }}>
            🍽️ Nos produits
          </h3>

          {menuItems
            .filter((item) => item.active)
            .map((item) => (
              <div
                key={item.id}
                style={{
                  padding: "12px",
                  borderBottom: "1px solid #333",
                }}
              >
                <div style={{ fontWeight: 800 }}>{item.name}</div>
                <div style={{ color: "#aaa" }}>{item.description}</div>
                <div style={{ fontWeight: 700 }}>
                  {Number(item.price).toFixed(2)} €
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}