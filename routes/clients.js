import express from "express";
import crypto from "crypto";
import {
  getAllClients,
  upsertClient,
  refreshClientSegments,
  saveAllClients,
} from "../services/clientStore.js";
import { sendNotificationToSubscription } from "../services/onesignal.js";

const router = express.Router();

console.log("✅ VERSION CLIENTS ROUTER V3");

console.log("✅ routes/clients.js chargé");

router.get("/", async (req, res) => {
  try {
    const clients = await getAllClients();
    return res.json({ ok: true, clients });
  } catch (error) {
    console.error("Erreur GET /clients :", error);
    return res.status(500).json({
      ok: false,
      error: "Erreur récupération clients",
    });
  }
});

router.get("/__debug", async (req, res) => {
  return res.json({
    ok: true,
    message: "clients router OK",
    routes: [
      "/",
      "/by-loyalty/:value",
      "/register-subscription",
      "/segments",
      "/visit",
      "/relaunch",
    ],
  });
});

router.get("/by-loyalty/:value", async (req, res) => {
  try {
    const { value } = req.params;
    const clients = await getAllClients();

    const client = clients.find(
      (c) => c.loyaltyId === value || c.id === value
    );

    if (!client) {
      return res.status(404).json({
        ok: false,
        error: "Client introuvable",
      });
    }

    return res.json({
      ok: true,
      client,
    });
  } catch (error) {
    console.error("Erreur GET /clients/by-loyalty/:value :", error);
    return res.status(500).json({
      ok: false,
      error: "Erreur récupération client",
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const { id, loyaltyId, name, email, phone } = req.body;

    if (!name || (!phone && !email)) {
      return res.status(400).json({
        ok: false,
        error: "name + phone ou email obligatoire",
      });
    }

    const clientsBefore = await getAllClients();

    const normalizedPhone = String(phone || "").trim();
    const normalizedEmail = String(email || "").trim().toLowerCase();

    const existingClient = clientsBefore.find((c) => {
      const cPhone = String(c.phone || "").trim();
      const cEmail = String(c.email || "").trim().toLowerCase();

      return (
        (id && c.id === id) ||
        (normalizedPhone && cPhone === normalizedPhone) ||
        (normalizedEmail && cEmail === normalizedEmail)
      );
    });

    const savedClient = await upsertClient({
      id: existingClient?.id || id || crypto.randomUUID(),
      loyaltyId: existingClient?.loyaltyId || loyaltyId || `CL-${Date.now()}`,
      name,
      email: normalizedEmail,
      phone: normalizedPhone,
      createdAt: existingClient?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return res.status(existingClient ? 200 : 201).json({
      ok: true,
      created: !existingClient,
      message: existingClient
        ? "Client existant mis à jour"
        : "Client créé",
      client: {
        id: savedClient.id,
        loyaltyId: savedClient.loyaltyId,
        name: savedClient.name,
        email: savedClient.email,
        phone: savedClient.phone,
      },
    });
  } catch (error) {
    console.error("Erreur POST /clients :", error);
    return res.status(500).json({
      ok: false,
      error: "Erreur création client",
    });
  }
});

router.post("/register-subscription", async (req, res) => {
  try {
    const { id, name, phone, subscriptionId } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({
        ok: false,
        error: "subscriptionId obligatoire",
      });
    }

    const clients = await upsertClient({
      id,
      name,
      phone,
      subscriptionId,
    });

    return res.json({
      ok: true,
      message: "Client enregistré",
      clients,
    });
  } catch (error) {
    console.error("Erreur POST /clients/register-subscription :", error);
    return res.status(500).json({
      ok: false,
      error: "Erreur enregistrement client",
    });
  }
});

router.get("/segments", async (req, res) => {
  try {
    const clients = await refreshClientSegments();
    return res.json({
      ok: true,
      route: "/clients/segments",
      clients,
    });
  } catch (error) {
    console.error("Erreur GET /clients/segments :", error);
    return res.status(500).json({
      ok: false,
      error: "Erreur segmentation clients",
    });
  }
});

router.post("/visit", async (req, res) => {
  try {
    const { id, phone, amount = 0, points = 1 } = req.body;

    if (!id && !phone) {
      return res.status(400).json({
        ok: false,
        error: "id ou phone obligatoire",
      });
    }

    const clients = await getAllClients();
    const index = clients.findIndex(
      (c) => c.id === id || (phone && c.phone === phone)
    );

    if (index === -1) {
      return res.status(404).json({
        ok: false,
        error: "Client introuvable",
      });
    }

    clients[index] = {
      ...clients[index],
      visits: (clients[index].visits ?? 0) + 1,
      points: (clients[index].points ?? 0) + points,
      totalSpent: (clients[index].totalSpent ?? 0) + amount,
      lastVisitAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveAllClients(clients);
    const refreshed = await refreshClientSegments();

    const updatedClient = refreshed.find(
      (c) => c.id === id || (phone && c.phone === phone)
    );

    if (updatedClient?.subscriptionId) {
      let message = null;

      if (
        updatedClient.points >= (updatedClient.rewardGoal ?? 10) &&
        !updatedClient.rewardNotified
      ) {
        message =
          "Votre récompense est prête 🎁 Présentez-vous pour en profiter.";
        updatedClient.rewardNotified = true;

        const allClients = await getAllClients();
        const updatedIndex = allClients.findIndex(
          (c) => c.id === updatedClient.id
        );

        if (updatedIndex !== -1) {
          allClients[updatedIndex] = {
            ...allClients[updatedIndex],
            rewardNotified: true,
            updatedAt: new Date().toISOString(),
          };
          await saveAllClients(allClients);
        }
      } else if (updatedClient.segment === "loyal") {
        message =
          "Merci pour votre fidélité 🙌 Encore quelques visites et une surprise vous attend.";
      } else if (updatedClient.segment === "vip") {
        message =
          "Vous faites partie de nos meilleurs clients ⭐ Un bonus VIP vous attend.";
      }

      if (message) {
        await sendNotificationToSubscription(
          updatedClient.subscriptionId,
          message
        );
      }
    }

    return res.json({
      ok: true,
      message: "Visite enregistrée",
      client: updatedClient,
      clients: await getAllClients(),
    });
  } catch (error) {
    console.error("Erreur POST /clients/visit :", error);
    return res.status(500).json({
      ok: false,
      error: "Erreur enregistrement visite",
    });
  }
});

router.post("/relaunch", async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        ok: false,
        error: "phone obligatoire",
      });
    }

    const clients = await getAllClients();
    const client = clients.find((c) => c.phone === phone);

    if (!client) {
      return res.status(404).json({
        ok: false,
        error: "Client introuvable",
      });
    }

    if (!client.subscriptionId) {
      return res.status(400).json({
        ok: false,
        error: "subscriptionId manquant",
      });
    }

    await sendNotificationToSubscription(
      client.subscriptionId,
      "On ne vous a pas vu depuis un moment 👀 Revenez profiter d’un avantage spécial."
    );

    return res.json({
      ok: true,
      message: "Relance envoyée",
      client: {
        id: client.id,
        name: client.name,
        phone: client.phone,
      },
    });
  } catch (error) {
    console.error("Erreur POST /clients/relaunch :", error);
    return res.status(500).json({
      ok: false,
      error: "Erreur relance client",
    });
  }
});

export default router;