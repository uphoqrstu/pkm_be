const db = require("../config/db");

exports.getAllCategories = async (req, res) => {
  try {
    const [results] = await db.query("SELECT DISTINCT category FROM products");
    res.json(results);
  } catch (err) {
    console.error("CATEGORY ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};
