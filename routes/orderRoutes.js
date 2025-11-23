const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

// GET /api/orders
router.get("/orders", orderController.listOrders);

// POST /api/pesanan
router.post("/pesanan", orderController.createPesanan);

// POST /api/orders/:id/complete (Tetap dipakai backend lama)
router.post("/orders/:id/complete", orderController.completeOrder);

// ⭐ Tambahan supaya kompatibel dengan frontend
router.put("/orders/:id/complete", orderController.completeOrder);
router.put("/orders/:id", orderController.completeOrder);

// GET /api/reports/daily
router.get("/reports/daily", orderController.dailyReport);

// GET /api/reports/monthly
router.get("/reports/monthly", orderController.monthlyReport);

module.exports = router;
