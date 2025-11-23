const db = require("../config/db");
const fs = require("fs");
const path = require("path");

// GET semua produk (option: filter category)
exports.getAllProducts = async (req, res) => {
  const category = req.query.category;
  let sql = "SELECT * FROM products";
  const params = [];

  if (category) {
    sql += " WHERE category = ?";
    params.push(category);
  }

  try {
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil data produk" });
  }
};

/// controllers/productController.js
exports.createProduct = async (req, res) => {
  const { name, category, description, long_description, price, is_active } = req.body;
  const file = req.file; // <-- multer menyimpan file di sini

  if (!name || !category || !description || !price) {
    return res.status(400).json({ success: false, message: "Data produk tidak lengkap" });
  }

  if (!file) {
    return res.status(400).json({ success: false, message: "Gambar produk wajib diupload" });
  }

  try {
    const imageFilename = file.filename; // nama file yang disimpan di server

    const [result] = await db.query(
      `INSERT INTO products 
        (name, category, description, long_description, price, image, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [name, category, description, long_description || "", price, imageFilename, is_active ? 1 : 0]
    );

    res.json({ success: true, productId: result.insertId });
  } catch (err) {
    console.error("CREATE PRODUCT ERROR:", err);
    res.status(500).json({ success: false, message: "Gagal menambahkan produk" });
  }
};

// GET product by ID
exports.getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query("SELECT * FROM products WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ message: "Produk tidak ditemukan" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil produk" });
  }
};

// PUT update product
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, category, description, price, is_active } = req.body;
  let image = req.body.image || null;

  // Jika ada file upload baru, pakai file tersebut
  if (req.file) {
    image = req.file.filename;

    // Opsional: hapus file lama dari folder uploads
    try {
      const [rows] = await db.query("SELECT image FROM products WHERE id=?", [id]);
      if (rows.length && rows[0].image) {
        const oldImagePath = path.join(__dirname, "..", "uploads", rows[0].image);
        if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
      }
    } catch (err) {
      console.warn("Gagal menghapus file lama:", err);
    }
  }

  if (!name || !category || !description || !price) {
    return res.status(400).json({ success: false, message: "Data produk tidak lengkap" });
  }

  try {
    await db.query(
      "UPDATE products SET name=?, category=?, description=?, price=?, image=?, is_active=? WHERE id=?",
      [name, category, description, price, image, is_active === "1" || is_active === "true" ? 1 : 0, id]
    );

    res.json({ success: true, message: "Produk berhasil diupdate" });
  } catch (err) {
    console.error("UPDATE PRODUCT ERROR:", err);
    res.status(500).json({ success: false, message: "Gagal update produk" });
  }
};

// DELETE product → nonaktifkan saja
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    // Nonaktifkan produk
    await db.query("UPDATE products SET is_active = 0 WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Produk telah dinonaktifkan. Tidak bisa dijual lagi, tapi datanya tetap aman."
    });
  } catch (err) {
    console.error("ERROR NONAKTIFKAN PRODUK:", err);
    res.status(500).json({ success: false, message: "Gagal menonaktifkan produk" });
  }
};
