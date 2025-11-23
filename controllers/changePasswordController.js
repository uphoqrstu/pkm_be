const bcrypt = require("bcrypt");
const db = require("../config/db");

exports.changePassword = async (req, res) => {
  const { username, currentPassword, newPassword } = req.body;

  try {
    const [rows] = await db.query("SELECT * FROM admins WHERE name = ?", [username]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "User tidak ditemukan" });
    }

    const admin = rows[0];

    // Bandingkan password lama dengan hash di database
    const match = await bcrypt.compare(currentPassword, admin.password);
    if (!match) {
      return res.status(400).json({ success: false, message: "Password lama salah" });
    }

    // Hash password baru
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password di database
    await db.query("UPDATE admins SET password = ? WHERE id = ?", [hashedPassword, admin.id]);

    res.json({ success: true, message: "Password berhasil diubah" });

  } catch (err) {
    console.error("CHANGE PASSWORD ERROR:", err);
    res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
  }
};
