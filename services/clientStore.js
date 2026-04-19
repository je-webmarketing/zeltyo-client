import { db } from "./firebaseAdmin.js";

const clientsCollection = db.collection("clients");

const FALLBACK_CLIENTS = [
  {
    id: "client-1",
    loyaltyId: "ZEL-client-1",
    name: "Client Test",
    email: "client@test.com",
    phone: "0600000000",
    subscriptionId: "a67b1b72-bc4c-431b-a3b8-9bf9d79d3079",
    points: 5,
    rewardGoal: 10,
    visits: 2,
    totalSpent: 40,
    lastVisitAt: "2024-03-01T10:00:00.000Z",
    rewardNotified: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    segment: "inactive",
  },
];

function getSegment(client) {
  const visits = Number(client.visits ?? 0);
  const totalSpent = Number(client.totalSpent ?? 0);
  const rewardGoal = Number(client.rewardGoal ?? 10);
  const points = Number(client.points ?? 0);
  const lastVisitAt = client.lastVisitAt ? new Date(client.lastVisitAt) : null;

  let daysSinceLastVisit = 0;
  if (lastVisitAt && !Number.isNaN(lastVisitAt.getTime())) {
    daysSinceLastVisit = Math.floor(
      (Date.now() - lastVisitAt.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  if (daysSinceLastVisit >= 30 && visits > 0) return "inactive";
  if (visits >= 10 || totalSpent >= 200) return "vip";
  if (points >= rewardGoal - 2 && points < rewardGoal) return "near_reward";
  if (visits >= 3) return "loyal";
  return "nouveau";
}

async function getAllClientsFromFirestore() {
  const snapshot = await clientsCollection.get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

export async function getAllClients() {
  try {
    const clients = await getAllClientsFromFirestore();
    if (!clients.length) {
      console.warn("Firestore vide, fallback clients utilisé.");
      return FALLBACK_CLIENTS;
    }
    return clients;
  } catch (error) {
    console.error("getAllClients Firestore error:", error?.message || error);
    console.warn("Fallback clients utilisé.");
    return FALLBACK_CLIENTS;
  }
}

export async function saveAllClients(clients) {
  try {
    const batch = db.batch();

    for (const client of clients) {
      const docId = client.id || client.phone;
      if (!docId) continue;

      const ref = clientsCollection.doc(docId);
      batch.set(
        ref,
        {
          ...client,
          id: client.id || docId,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }

    await batch.commit();
    return clients;
  } catch (error) {
    console.error("saveAllClients Firestore error:", error?.message || error);
    console.warn("saveAllClients ignoré, fallback local conservé.");
    return clients;
  }
}

export async function upsertClient(clientData) {
  const clients = await getAllClients();

  const existing = clients.find(
    (c) =>
      c.id === clientData.id ||
      (clientData.phone && c.phone === clientData.phone) ||
      (clientData.subscriptionId &&
        c.subscriptionId === clientData.subscriptionId)
  );

  const now = new Date().toISOString();

  let client;

  if (existing) {
    client = {
      ...existing,
      ...clientData,
      email: clientData.email ?? existing.email ?? "",
      loyaltyId: clientData.loyaltyId ?? existing.loyaltyId ?? existing.id,
      updatedAt: now,
    };
  } else {
    const newId =
      clientData.id ||
      clientData.phone ||
      `client-${Math.random().toString(36).slice(2, 10)}`;

    const newLoyaltyId =
      clientData.loyaltyId || `ZEL-${Math.random().toString(36).slice(2, 10)}`;

    client = {
      id: newId,
      loyaltyId: newLoyaltyId,
      name: clientData.name || "",
      email: clientData.email || "",
      phone: clientData.phone || "",
      subscriptionId: clientData.subscriptionId || "",
      points: Number(clientData.points || 0),
      rewardGoal: Number(clientData.rewardGoal || 10),
      visits: Number(clientData.visits || 0),
      totalSpent: Number(clientData.totalSpent || 0),
      lastVisitAt: clientData.lastVisitAt || null,
      rewardNotified: false,
      createdAt: now,
      updatedAt: now,
      segment: "nouveau",
    };
  }

  try {
    await clientsCollection.doc(client.id).set(client, { merge: true });
    return await getAllClients();
  } catch (error) {
    console.error("upsertClient Firestore error:", error?.message || error);
    return [...clients.filter((c) => c.id !== client.id), client];
  }
}

export async function refreshClientSegments() {
  const clients = await getAllClients();

  const updatedClients = clients.map((client) => ({
    ...client,
    rewardGoal: Number(client.rewardGoal ?? 10),
    points: Number(client.points ?? 0),
    visits: Number(client.visits ?? 0),
    totalSpent: Number(client.totalSpent ?? 0),
    segment: getSegment(client),
    updatedAt: new Date().toISOString(),
  }));

  await saveAllClients(updatedClients);
  return updatedClients;
}