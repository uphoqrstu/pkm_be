const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const upload = require("../middlewares/upload");

router.get("/", productController.getAllProducts);

// Tambahkan upload.single("image_file") untuk create
router.post("/", upload.single("image_file"), productController.createProduct);

// Tambahkan upload.single("image_file") untuk update
router.put("/:id", upload.single("image_file"), productController.updateProduct);

router.delete("/:id", productController.deleteProduct);

module.exports = router;
