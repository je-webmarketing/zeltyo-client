import express from "express";

const router = express.Router();

const menusByBusiness = {};

router.get("/__debug", (req, res) => {
  res.json({
    ok: true,
    message: "menu router OK",
  });
});

router.post("/", (req, res) => {
  try {
    const { businessId, menu } = req.body;

    if (!businessId) {
      return res.status(400).json({
        ok: false,
        error: "businessId obligatoire",
      });
    }

    menusByBusiness[businessId] = Array.isArray(menu) ? menu : [];

    return res.json({
      ok: true,
      message: "Menu enregistré",
      menu: menusByBusiness[businessId],
    });
  } catch (error) {
    console.error("Erreur POST /menu :", error);
    return res.status(500).json({
      ok: false,
      error: "Erreur enregistrement menu",
    });
  }
});

router.get("/:businessId", (req, res) => {
  try {
    const { businessId } = req.params;

    return res.json({
      ok: true,
      menu: menusByBusiness[businessId] || [],
    });
  } catch (error) {
    console.error("Erreur GET /menu/:businessId :", error);
    return res.status(500).json({
      ok: false,
      error: "Erreur récupération menu",
    });
  }
});

export default router;