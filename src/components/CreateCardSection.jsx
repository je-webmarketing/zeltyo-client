export default function CreateCardSection({
  COLORS,
  name,
  setName,
  email,
  setEmail,
  phone,
  setPhone,
  createClient,
  inputStyle,
  copperButton,
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
        Créer ma carte fidélité
      </h3>

      <div style={{ display: "grid", gap: 12 }}>
        <input
          type="text"
          placeholder="Nom"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle()}
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle()}
        />

        <input
          type="text"
          placeholder="Téléphone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={inputStyle()}
        />

        <button onClick={createClient} style={copperButton()}>
          Créer une carte fidélité
        </button>
      </div>
    </div>
  );
}