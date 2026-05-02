export default function NotificationsSection({
  COLORS,
  deferredPrompt,
  setDeferredPrompt,
  oneSignalReady,
  permission,
  optedIn,
  subscriptionId,
  handleEnableNotifications,
  copperButton,
  ghostButton,
  PremiumStatusCard,
}) {
  return (
    <div
      style={{
        background: "linear-gradient(180deg, #101010, #0B0B0B)",
        border: `1px solid ${COLORS.border}`,
        borderRadius: 24,
        padding: 20,
        marginBottom: 18,
        boxShadow: "0 12px 28px rgba(0,0,0,0.30)",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: 8, color: COLORS.goldLight, fontSize: 22 }}>
        Notifications premium
      </h3>

      <p style={{ marginTop: 0, marginBottom: 16, color: COLORS.textSoft, lineHeight: 1.6, fontSize: 14 }}>
        Recevez vos offres, récompenses et rappels utiles au bon moment.
      </p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button onClick={handleEnableNotifications} style={copperButton()}>
          Recevoir mes offres
        </button>

        {deferredPrompt && (
          <button
            onClick={async () => {
              try {
                console.log("DeferredPrompt =", deferredPrompt);

                if (!deferredPrompt) {
                  alert(
                    "Installation non proposée pour le moment. Vérifiez le manifest, le service worker ou utilisez le menu du navigateur."
                  );
                  return;
                }

                await deferredPrompt.prompt();
                const choice = await deferredPrompt.userChoice;
                console.log("Choix installation :", choice);
                setDeferredPrompt(null);
              } catch (error) {
                console.error("Erreur installation :", error);
                alert("Impossible de lancer l'installation pour le moment.");
              }
            }}
            style={ghostButton()}
          >
            Installer Zeltyo
          </button>
        )}
      </div>

      <div style={{ marginTop: 18, display: "grid", gap: 10 }}>
        <PremiumStatusCard label="OneSignal" value={oneSignalReady ? "Prêt" : "Chargement"} highlight={oneSignalReady} />
        <PremiumStatusCard label="Notifications" value={permission ? "Activées" : "Non activées"} highlight={permission} />
        <PremiumStatusCard label="Offres et récompenses" value={optedIn ? "Réception active" : "En attente d’activation"} highlight={optedIn} />
        <PremiumStatusCard label="Subscription ID" value={subscriptionId || "aucun"} highlight={Boolean(subscriptionId)} />
        <PremiumStatusCard label="Installation" value={deferredPrompt ? "Disponible" : "Déjà installée ou non proposée"} highlight={Boolean(deferredPrompt)} />
      </div>
    </div>
  );
}