import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cron from "node-cron";

import notificationsRouter from "./routes/notifications.js";
import automationRoutes from "./routes/automation.js";
import clientsRouter from "./routes/clients.js";
import automationSegmentedRouter, {
  runSegmentedAutomation,
} from "./routes/automationSegmented.js";
import { sendPush } from "./services/onesignal.js";
import notificationsAdvanced from "./routes/notificationsAdvanced.js";
import authRoutes from "./routes/auth.js";
import { purgeOldBookings } from "./services/bookingStore.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

console.log("✅ ZELTYO BACKEND V2 chargé");

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  process.env.CLIENT_APP_URL,
  process.env.MERCHANT_APP_URL,
].filter(Boolean);

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://zeltyo.netlify.app"
    ],
    credentials: true,
  })
);

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "zeltyo-backend",
    version: "V2_SEGMENTS",
  });
});

app.use("/auth", authRoutes);
app.use("/notifications-advanced", notificationsAdvanced);

app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "Zeltyo backend OK",
    version: "V2_SEGMENTS",
  });
});

app.get("/test-push", async (req, res) => {
  try {
    const result = await sendPush({
      title: "Test Zeltyo",
      message: "La notification push fonctionne 🚀",
      externalIds: ["0600000000"],
    });

    res.json({
      ok: true,
      result,
    });
  } catch (error) {
    console.error("❌ Erreur test push :", error);
    res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
});

app.use("/notifications", notificationsRouter);
app.use("/automation", automationRoutes);
app.use("/clients", clientsRouter);
app.use("/automation-segmented", automationSegmentedRouter);

cron.schedule("0 10 * * *", async () => {
  console.log("⏰ Lancement automatique daily 10h");

  try {
    const inactiveResults = await runSegmentedAutomation("inactive");
    console.log("✅ Inactifs :", inactiveResults.length);

    const loyalResults = await runSegmentedAutomation("loyal");
    console.log("✅ Loyal :", loyalResults.length);

    const vipResults = await runSegmentedAutomation("vip");
    console.log("✅ VIP :", vipResults.length);
  } catch (error) {
    console.error("❌ Erreur cron daily :", error);
  }
});

app.listen(port, () => {
  console.log(`✅ Backend lancé sur le port ${port}`);
});

setInterval(async () => {
  try {
    await purgeOldBookings();
  } catch (error) {
    console.error("Erreur purge bookings :", error);
  }
}, 1000 * 60 * 10);