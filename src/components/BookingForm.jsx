import { useEffect, useState } from "react";
import { buildApiUrl } from "../config/api";

export default function BookingForm({ selectedBusiness, clientData }) {
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
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

 const isAppointmentMode = bookingForm.requestType === "appointment"; 

  useEffect(() => {
    if (Array.isArray(selectedBusiness?.menu)) {
      setMenuItems(selectedBusiness.menu.filter((item) => item.active !== false));
    } else {
      setMenuItems([]);
    }
  }, [selectedBusiness?.menu]);

  function handleChange(field, value) {
    setBookingForm((prev) => ({ ...prev, [field]: value }));
  }

  function showError(text) {
    setStatus("error");
    setMessage(text);
  }

  function showSuccess(text) {
    setStatus("success");
    setMessage(text);
  }

  function addToCart(item) {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { ...item, qty: 1 }];
    });
  }

  function removeFromCart(itemId) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === itemId ? { ...item, qty: item.qty - 1 } : item
        )
        .filter((item) => item.qty > 0)
    );
  }

  function increaseCartItem(itemId) {
    setCart((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, qty: item.qty + 1 } : item
      )
    );
  }

  const totalPrice = cart.reduce(
    (sum, item) => sum + Number(item.price || 0) * item.qty,
    0
  );

  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);

  function validateForm() {
    const cleanName = bookingForm.clientName.trim();
    const cleanPhone = bookingForm.clientPhone.trim();

    if (!cleanName || !cleanPhone) {
      return "Merci de remplir le nom et le téléphone.";
    }

    if (!bookingForm.date || !bookingForm.time) {
      return isAppointmentMode
        ? "Merci de choisir une date et une heure de rendez-vous."
        : "Merci de remplir date et heure.";
    }

    if (bookingForm.requestType === "pickup" && cart.length === 0) {
      return "Merci d’ajouter au moins un produit à la commande.";
    }

    if (bookingForm.requestType === "delivery") {
      if (!bookingForm.deliveryAddress.trim() || !bookingForm.deliveryTime) {
        return "Merci de remplir adresse + heure de livraison.";
      }

      if (cart.length === 0) {
        return "Merci d’ajouter au moins un produit à la commande.";
      }
    }

    return "";
  }

  function buildBookingPayload() {
    const hasOrder =
      bookingForm.requestType === "pickup" ||
      bookingForm.requestType === "delivery";

    const type = isAppointmentMode ? "appointment" : bookingForm.requestType;

    return {
      businessId: selectedBusiness?.id || selectedBusiness?._id || "",
      clientId: clientData?.id || "",
      clientName: bookingForm.clientName.trim(),
      clientPhone: bookingForm.clientPhone.trim(),
      type,
      area:
        bookingForm.requestType === "reservation" && !isAppointmentMode
          ? bookingForm.area
          : "",
      partySize:
        bookingForm.requestType === "reservation" && !isAppointmentMode
          ? Number(bookingForm.partySize)
          : 1,
      date: bookingForm.date,
      time:
        bookingForm.requestType === "pickup"
          ? bookingForm.pickupTime || bookingForm.time
          : bookingForm.requestType === "delivery"
          ? bookingForm.deliveryTime || bookingForm.time
          : bookingForm.time,
      deliveryAddress:
        bookingForm.requestType === "delivery"
          ? bookingForm.deliveryAddress.trim()
          : "",
      note: bookingForm.note,
      items: hasOrder
        ? cart.map((item) => ({
            id: item.id,
            name: item.name,
            price: Number(item.price || 0),
            qty: item.qty,
            category: item.category || "",
          }))
        : [],
      totalPrice: hasOrder ? totalPrice : 0,
    };
  }

  async function submitBooking() {
    if (status === "loading") return;

    const error = validateForm();

    if (error) {
      showError(error);
      return;
    }

    try {
      setStatus("loading");
      setMessage("Envoi de votre demande...");

      const response = await fetch(buildApiUrl("/bookings"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildBookingPayload()),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        showError(data?.error || "Erreur serveur. Merci de réessayer.");
        return;
      }

      const cleanPhone = String(bookingForm.clientPhone || "").replace(/\D/g, "");
      localStorage.setItem("zeltyo_last_phone", cleanPhone);

      showSuccess("Demande envoyée au commerçant ✅");

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
      console.error("Erreur réservation :", error);
      showError(error.message || "Erreur réseau. Merci de vérifier votre connexion.");
    }
  }

  function sendCartWhatsApp() {
    const phone =
      selectedBusiness?.phone ||
      selectedBusiness?.merchantPhone ||
      selectedBusiness?.contactPhone ||
      "";

    const cleanPhone = phone.replace(/\D/g, "");

    if (!cleanPhone) {
      showError("Numéro WhatsApp du commerçant manquant.");
      return;
    }

    if (cart.length === 0) {
      showError("Ajoute au moins un produit au panier.");
      return;
    }

    const message = `Bonjour 👋

Je souhaite commander :

${cart
  .map(
    (item) =>
      `• ${item.name} x${item.qty} — ${(
        Number(item.price || 0) * item.qty
      ).toFixed(2)} €`
  )
  .join("\n")}

Total : ${totalPrice.toFixed(2)} €

Nom : ${bookingForm.clientName || clientData?.name || ""}
Téléphone : ${bookingForm.clientPhone || clientData?.phone || ""}

Commerce : ${selectedBusiness?.name || "Commerce"}

Merci 👍`;

    window.open(
      `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  }

  return (
    <div>
      {message ? (
        <div
          style={{
            padding: "14px",
            marginBottom: "14px",
            borderRadius: "12px",
            textAlign: "center",
            fontWeight: 900,
            color: status === "error" ? "#fecaca" : "#86efac",
            background:
              status === "error"
                ? "rgba(239,68,68,0.16)"
                : "rgba(34,197,94,0.16)",
            border:
              status === "error"
                ? "1px solid rgba(239,68,68,0.45)"
                : "1px solid rgba(34,197,94,0.45)",
          }}
        >
          {message}
        </div>
      ) : null}

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

      {!isAppointmentMode ? (
    <select
  value={bookingForm.requestType}
  onChange={(e) => handleChange("requestType", e.target.value)}
  style={inputStyle()}
>
  <option value="appointment">Prise de rendez-vous</option>
  <option value="reservation">Réservation sur place</option>
  <option value="pickup">À emporter</option>
  <option value="delivery">Livraison</option>
</select>
      ) : (
        <div
          style={{
            ...inputStyle(),
            color: "#F2D06B",
            fontWeight: 900,
          }}
        >
          Prise de rendez-vous
        </div>
      )}

      <input
        type="date"
        value={bookingForm.date}
        onChange={(e) => handleChange("date", e.target.value)}
        style={inputStyle()}
      />

      {isAppointmentMode ? (
        <>
          <input
            type="time"
            value={bookingForm.time}
            onChange={(e) => handleChange("time", e.target.value)}
            style={inputStyle()}
          />

          <textarea
            placeholder="Motif du rendez-vous : coupe, devis, consultation..."
            value={bookingForm.note}
            onChange={(e) => handleChange("note", e.target.value)}
            style={{ ...inputStyle(), minHeight: 90, resize: "vertical" }}
          />
        </>
      ) : (
        <>
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
                onChange={(e) =>
                  handleChange("deliveryAddress", e.target.value)
                }
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
            <input
              type="time"
              value={bookingForm.pickupTime}
              onChange={(e) => handleChange("pickupTime", e.target.value)}
              style={inputStyle()}
            />
          )}

          {(bookingForm.requestType === "pickup" ||
            bookingForm.requestType === "delivery") && (
            <>
              <div style={{ marginTop: 20, marginBottom: 12 }}>
                <strong style={{ color: "#F2D06B" }}>
                  Carte du commerçant
                </strong>

                {menuItems.length === 0 ? (
                  <p style={{ marginTop: 10, color: "#CFC7B0" }}>
                    Aucun produit disponible
                  </p>
                ) : (
                  <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                    {menuItems.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          border: "1px solid #2A2A2A",
                          borderRadius: 14,
                          padding: 14,
                          background: "#161616",
                          textAlign: "center",
                        }}
                      >
                        <div style={{ fontWeight: 900, color: "#F7F4EA" }}>
                          {item.name}
                        </div>

                        {item.description ? (
                          <div
                            style={{
                              color: "#CFC7B0",
                              marginTop: 6,
                              fontSize: 13,
                            }}
                          >
                            {item.description}
                          </div>
                        ) : null}

                        <div
                          style={{
                            marginTop: 8,
                            fontWeight: 900,
                            color: "#F2A65A",
                          }}
                        >
                          {Number(item.price || 0).toFixed(2)} €
                        </div>

                        <button
                          type="button"
                          onClick={() => addToCart(item)}
                          style={orangeButtonStyle()}
                        >
                          Ajouter au panier
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div style={cartBoxStyle()}>
                  <strong style={{ color: "#F2D06B", fontSize: 18 }}>
                    Votre commande
                  </strong>

                  {cart.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr auto",
                        gap: 10,
                        color: "#F7F4EA",
                        borderBottom: "1px solid #2A2A2A",
                        padding: "10px 0",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 800 }}>{item.name}</div>
                        <div style={{ color: "#CFC7B0", fontSize: 13 }}>
                          {Number(item.price || 0).toFixed(2)} € / unité
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div style={{ marginBottom: 6, fontWeight: 800 }}>
                          {(Number(item.price || 0) * item.qty).toFixed(2)} €
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                        >
                          -
                        </button>

                        <span style={{ margin: "0 8px", fontWeight: 900 }}>
                          {item.qty}
                        </span>

                        <button
                          type="button"
                          onClick={() => increaseCartItem(item.id)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}

                  <div
                    style={{
                      marginTop: 14,
                      fontWeight: 900,
                      color: "#F2A65A",
                      fontSize: 18,
                    }}
                  >
                    Total : {totalPrice.toFixed(2)} €
                  </div>

                  <button
                    type="button"
                    onClick={sendCartWhatsApp}
                    style={whatsappButtonStyle()}
                  >
                    Commander via WhatsApp
                  </button>

                  <button
                    type="button"
                    onClick={() => setCart([])}
                    style={darkButtonStyle()}
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
            style={{ ...inputStyle(), minHeight: 90, resize: "vertical" }}
          />
        </>
      )}

      <button
        type="button"
        onClick={submitBooking}
        disabled={status === "loading"}
        style={{
          ...orangeButtonStyle(),
          width: "100%",
          opacity: status === "loading" ? 0.7 : 1,
          cursor: status === "loading" ? "not-allowed" : "pointer",
        }}
      >
        {status === "loading" ? "Envoi..." : "Envoyer la demande"}
      </button>

      {cart.length > 0 && (
        <div
          onClick={() =>
            window.scrollTo({
              top: document.body.scrollHeight,
              behavior: "smooth",
            })
          }
          style={floatingCartStyle()}
        >
          🛒 {totalQty} article(s) — {totalPrice.toFixed(2)} €
        </div>
      )}
    </div>
  );
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

function orangeButtonStyle() {
  return {
    marginTop: "12px",
    background: "linear-gradient(135deg, #D97A32, #F2A65A)",
    color: "#111111",
    border: "none",
    padding: "12px 14px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: 900,
  };
}

function whatsappButtonStyle() {
  return {
    marginTop: "12px",
    background: "#25D366",
    color: "#111111",
    border: "none",
    padding: "12px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: 900,
    width: "100%",
  };
}

function darkButtonStyle() {
  return {
    marginTop: "10px",
    background: "#1A1A1A",
    color: "#fff",
    border: "1px solid #333",
    padding: "10px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    width: "100%",
    fontWeight: 800,
  };
}

function cartBoxStyle() {
  return {
    marginTop: "20px",
    marginBottom: "12px",
    padding: "16px",
    borderRadius: "16px",
    background: "#161616",
    border: "1px solid #2A2A2A",
  };
}

function floatingCartStyle() {
  return {
    position: "fixed",
    bottom: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "linear-gradient(135deg, #D97A32, #F2A65A)",
    color: "#111",
    padding: "14px 20px",
    borderRadius: "999px",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
    zIndex: 9999,
  };
}