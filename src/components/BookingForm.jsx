import { useState, useEffect } from "react";
import { buildApiUrl } from "../config/api";

export default function BookingForm({ selectedBusiness, clientData }) {
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);

  const [bookingForm, setBookingForm] = useState({
    requestType: "reservation",
    clientName: clientData?.name || "",
    clientPhone: clientData?.phone || "",
    area: "interieur",
    partySize: 2,
    date: "",
    time: "",
    deliveryAddress: "",
    deliveryTime: "",
    pickupTime: "",
    note: "",
  });

  useEffect(() => {
    console.log("MENU REÇU DANS BOOKING =", selectedBusiness?.menu);

    if (Array.isArray(selectedBusiness?.menu)) {
      setMenuItems(selectedBusiness.menu.filter((item) => item.active !== false));
    } else {
      setMenuItems([]);
    }
  }, [selectedBusiness?.menu]);

  function handleChange(field, value) {
    setBookingForm((prev) => ({ ...prev, [field]: value }));
  }

  function addToCart(item) {
    setCart((prev) => {
      const existing = prev.find((p) => p.id === item.id);

      if (existing) {
        return prev.map((p) =>
          p.id === item.id ? { ...p, qty: p.qty + 1 } : p
        );
      }

      return [...prev, { ...item, qty: 1 }];
    });
  }

  function removeFromCart(itemId) {
    setCart((prev) =>
      prev
        .map((p) => (p.id === itemId ? { ...p, qty: p.qty - 1 } : p))
        .filter((p) => p.qty > 0)
    );
  }

  const totalPrice = cart.reduce(
    (sum, item) => sum + Number(item.price || 0) * item.qty,
    0
  );

  async function handlePayment() {
    try {
      if (cart.length === 0) {
        alert("Panier vide");
        return;
      }

      setPaying(true);

      const response = await fetch(
        buildApiUrl("/stripe/create-checkout-session"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items: cart,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.url) {
        console.error("Erreur Stripe :", data);
        alert(data?.error || "Erreur Stripe");
        return;
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("Erreur paiement Stripe :", error);
      alert("Erreur Stripe");
    } finally {
      setPaying(false);
    }
  }

  async function submitBooking() {
    try {
      const cleanName = bookingForm.clientName.trim();
      const cleanPhone = bookingForm.clientPhone.trim();

      if (!cleanName || !cleanPhone) {
        alert("Merci de remplir le nom et le téléphone.");
        return;
      }

      if (bookingForm.requestType === "reservation") {
        if (!bookingForm.date || !bookingForm.time) {
          alert("Merci de remplir date et heure.");
          return;
        }
      }

      if (bookingForm.requestType === "pickup") {
        if (!bookingForm.date || !bookingForm.pickupTime) {
          alert("Merci de remplir date et heure de retrait.");
          return;
        }

        if (cart.length === 0) {
          alert("Merci d’ajouter au moins un produit à la commande.");
          return;
        }
      }

      if (bookingForm.requestType === "delivery") {
        if (
          !bookingForm.date ||
          !bookingForm.deliveryTime ||
          !bookingForm.deliveryAddress.trim()
        ) {
          alert("Merci de remplir adresse + heure de livraison.");
          return;
        }
      }

      setLoading(true);

      const response = await fetch(buildApiUrl("/bookings"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId: selectedBusiness?.id || "",
          clientId: clientData?.id || "",
          clientName: cleanName,
          clientPhone: cleanPhone,
          type: bookingForm.requestType,
          area: bookingForm.requestType === "reservation" ? bookingForm.area : "",
          partySize:
            bookingForm.requestType === "reservation"
              ? Number(bookingForm.partySize)
              : 1,
          date: bookingForm.date,
          time:
            bookingForm.requestType === "reservation"
              ? bookingForm.time
              : bookingForm.requestType === "pickup"
              ? bookingForm.pickupTime
              : bookingForm.deliveryTime,
          deliveryAddress:
            bookingForm.requestType === "delivery"
              ? bookingForm.deliveryAddress.trim()
              : "",
          note: bookingForm.note,
          items:
            bookingForm.requestType === "pickup"
              ? cart.map((item) => ({
                  id: item.id,
                  name: item.name,
                  price: Number(item.price || 0),
                  qty: item.qty,
                  category: item.category || "",
                }))
              : [],
          totalPrice: bookingForm.requestType === "pickup" ? totalPrice : 0,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data?.error || "Erreur serveur");
        return;
      }

      alert("Demande envoyée au commerçant ✅");

      setBookingForm((prev) => ({
        ...prev,
        date: "",
        time: "",
        deliveryAddress: "",
        deliveryTime: "",
        pickupTime: "",
        note: "",
      }));

      setCart([]);
    } catch (error) {
      console.error(error);
      alert("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  function inputStyle() {
    return {
      width: "100%",
      padding: "12px",
      marginBottom: "10px",
      borderRadius: "10px",
      border: "1px solid #333",
      background: "#111",
      color: "#fff",
      boxSizing: "border-box",
    };
  }

  return (
    <div>
      <input
        placeholder="Nom"
        value={bookingForm.clientName}
        onChange={(e) => handleChange("clientName", e.target.value)}
        style={inputStyle()}
      />

      <input
        placeholder="Téléphone"
        value={bookingForm.clientPhone}
        onChange={(e) => handleChange("clientPhone", e.target.value)}
        style={inputStyle()}
      />

      <select
        value={bookingForm.requestType}
        onChange={(e) => handleChange("requestType", e.target.value)}
        style={inputStyle()}
      >
        <option value="reservation">Réservation sur place</option>
        <option value="pickup">À emporter</option>
        <option value="delivery">Livraison</option>
      </select>

      <input
        type="date"
        value={bookingForm.date}
        onChange={(e) => handleChange("date", e.target.value)}
        style={inputStyle()}
      />

      {bookingForm.requestType === "reservation" && (
        <>
          <select
            value={bookingForm.area}
            onChange={(e) => handleChange("area", e.target.value)}
            style={inputStyle()}
          >
            <option value="interieur">Intérieur</option>
            <option value="terrasse">Terrasse</option>
          </select>

          <input
            type="number"
            min="1"
            value={bookingForm.partySize}
            onChange={(e) => handleChange("partySize", e.target.value)}
            style={inputStyle()}
          />

          <input
            type="time"
            value={bookingForm.time}
            onChange={(e) => handleChange("time", e.target.value)}
            style={inputStyle()}
          />
        </>
      )}

      {bookingForm.requestType === "delivery" && (
        <>
          <input
            placeholder="Adresse de livraison"
            value={bookingForm.deliveryAddress}
            onChange={(e) => handleChange("deliveryAddress", e.target.value)}
            style={inputStyle()}
          />

          <input
            type="time"
            value={bookingForm.deliveryTime}
            onChange={(e) => handleChange("deliveryTime", e.target.value)}
            style={inputStyle()}
          />
        </>
      )}

      {bookingForm.requestType === "pickup" && (
        <>
          <input
            type="time"
            value={bookingForm.pickupTime}
            onChange={(e) => handleChange("pickupTime", e.target.value)}
            style={inputStyle()}
          />

          <div style={{ marginTop: "20px", marginBottom: "12px" }}>
            <strong style={{ color: "#F2D06B" }}>Carte du commerçant</strong>

            {menuItems.length === 0 ? (
              <p style={{ marginTop: "10px", color: "#CFC7B0" }}>
                Aucun produit disponible
              </p>
            ) : (
              <div style={{ marginTop: "12px", display: "grid", gap: "10px" }}>
                {menuItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      border: "1px solid #2A2A2A",
                      borderRadius: "12px",
                      padding: "12px",
                      background: "#161616",
                    }}
                  >
                    <div style={{ fontWeight: 800, color: "#F7F4EA" }}>
                      {item.name}
                    </div>

                    {item.category && (
                      <div
                        style={{
                          display: "inline-block",
                          marginTop: "4px",
                          padding: "3px 8px",
                          borderRadius: "999px",
                          background: "rgba(242,208,107,0.12)",
                          border: "1px solid rgba(242,208,107,0.3)",
                          color: "#F2D06B",
                          fontSize: "11px",
                          fontWeight: 700,
                        }}
                      >
                        {item.category}
                      </div>
                    )}

                    {item.description ? (
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#CFC7B0",
                          marginTop: "4px",
                        }}
                      >
                        {item.description}
                      </div>
                    ) : null}

                    <div
                      style={{
                        marginTop: "6px",
                        fontWeight: 700,
                        color: "#F2A65A",
                      }}
                    >
                      {Number(item.price).toFixed(2)} €
                    </div>

                    <button
                      type="button"
                      onClick={() => addToCart(item)}
                      style={{
                        marginTop: "10px",
                        background:
                          "linear-gradient(135deg, #D97A32, #F2A65A)",
                        color: "#111111",
                        border: "none",
                        padding: "10px 12px",
                        borderRadius: "10px",
                        cursor: "pointer",
                        fontWeight: 800,
                      }}
                    >
                      Ajouter
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <div
              style={{
                marginTop: "20px",
                marginBottom: "12px",
                padding: "14px",
                borderRadius: "12px",
                background: "#161616",
                border: "1px solid #2A2A2A",
              }}
            >
              <strong style={{ color: "#F2D06B" }}>Votre commande</strong>

              <div style={{ marginTop: "12px", display: "grid", gap: "8px" }}>
                {cart.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "10px",
                      color: "#F7F4EA",
                    }}
                  >
                    <span>
                      {item.name} x{item.qty}
                    </span>

                    <span>
                      {(Number(item.price || 0) * item.qty).toFixed(2)} €
                    </span>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      style={{
                        background: "#1A1A1A",
                        color: "#F7F4EA",
                        border: "1px solid #2A2A2A",
                        padding: "6px 10px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontWeight: 700,
                      }}
                    >
                      -
                    </button>
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: "12px",
                  fontWeight: 800,
                  color: "#F2A65A",
                }}
              >
                Total : {totalPrice.toFixed(2)} €
              </div>

              <button
                type="button"
                onClick={handlePayment}
                disabled={paying}
                style={{
                  marginTop: "12px",
                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                  color: "#fff",
                  border: "none",
                  padding: "12px",
                  borderRadius: "10px",
                  cursor: paying ? "not-allowed" : "pointer",
                  fontWeight: 800,
                  width: "100%",
                  opacity: paying ? 0.7 : 1,
                }}
              >
                {paying ? "Redirection Stripe..." : "💳 Payer maintenant"}
              </button>

              <button
                type="button"
                onClick={() => setCart([])}
                style={{
                  marginTop: "10px",
                  background: "#1A1A1A",
                  color: "#fff",
                  border: "1px solid #333",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  width: "100%",
                  fontWeight: 700,
                }}
              >
                Vider le panier
              </button>
            </div>
          )}
        </>
      )}

      <textarea
        placeholder="Note"
        value={bookingForm.note}
        onChange={(e) => handleChange("note", e.target.value)}
        style={{
          ...inputStyle(),
          minHeight: "90px",
          resize: "vertical",
        }}
      />

      <button
        type="button"
        onClick={submitBooking}
        style={{
          ...inputStyle(),
          cursor: "pointer",
          fontWeight: 800,
        }}
      >
        {loading ? "Envoi..." : "Envoyer la demande"}
      </button>

      {cart.length > 0 && (
        <div
          onClick={() =>
            window.scrollTo({
              top: document.body.scrollHeight,
              behavior: "smooth",
            })
          }
          style={{
            position: "fixed",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "linear-gradient(135deg, #D97A32, #F2A65A)",
            color: "#111",
            padding: "14px 20px",
            borderRadius: "999px",
            fontWeight: 800,
            cursor: "pointer",
            boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          🛒 {cart.reduce((sum, item) => sum + item.qty, 0)} article(s) —{" "}
          {totalPrice.toFixed(2)} €
        </div>
      )}
    </div>
  );
}