const bcrypt = require("bcrypt");
const db = require("../config/db");

// ==========================
// LOGIN
// ==========================
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await db.query("SELECT * FROM admins WHERE name = ?", [username]);

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: "Username tidak ditemukan" });
    }

    const admin = rows[0];

    if (password !== admin.password) {
      return res.status(401).json({ success: false, message: "Password salah" });
    }

    res.json({
      success: true,
      message: "Login berhasil",
      data: {
        id: admin.id,
        username: admin.name,
        email: admin.email
      },
      token: "dummy-token"
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
  }
};


// ==========================
// CHANGE PASSWORD
// ==========================
exports.changePassword = async (req, res) => {
  const { username, currentPassword, newPassword } = req.body;

  try {
    const [rows] = await db.query("SELECT * FROM admins WHERE name = ?", [username]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "User tidak ditemukan" });
    }

    const admin = rows[0];

    // bandingkan password lama
    const match = await bcrypt.compare(currentPassword, admin.password);
    if (!match) {
      return res.status(400).json({ success: false, message: "Password lama salah" });
    }

    // hash password baru
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.query("UPDATE admins SET password = ? WHERE id = ?", [
      hashedPassword,
      admin.id,
    ]);

    res.json({ success: true, message: "Password berhasil diubah" });

  } catch (err) {
    console.error("CHANGE PASSWORD ERROR:", err);
    res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
  }
};