const bcrypt = require("bcrypt");
const db = require("../config/db");

// Helper: cek password, handle hash & plain-text
async function checkPassword(inputPassword, storedPassword) {
  if (!storedPassword) return false;

  // Kalau sudah bcrypt-hash (biasanya mulai dengan $2b$ atau $2a$)
  if (storedPassword.startsWith("$2")) {
    try {
      return await bcrypt.compare(inputPassword, storedPassword);
    } catch (e) {
      console.error("BCRYPT COMPARE ERROR:", e);
      return false;
    }
  }

  // Fallback: plain-text (legacy)
  return inputPassword === storedPassword;
}

// Helper: upgrade password plain-text jadi hash (dipakai di login & changePassword)
async function upgradePasswordIfNeeded(admin, plainPassword) {
  if (!admin.password || admin.password.startsWith("$2")) {
    // sudah hash / kosong → tidak perlu upgrade
    return;
  }

  try {
    const hashed = await bcrypt.hash(plainPassword, 10);
    await db.query("UPDATE admins SET password = ? WHERE id = ?", [
      hashed,
      admin.id,
    ]);
    console.log(`Password admin id=${admin.id} di-upgrade ke bcrypt hash`);
  } catch (err) {
    console.error("Gagal upgrade password ke hash:", err);
  }
}

// ==========================
// LOGIN
// ==========================
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // pakai kolom name seperti code lama
    const [rows] = await db.query("SELECT * FROM admins WHERE name = ?", [
      username,
    ]);

    if (rows.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "Username tidak ditemukan" });
    }

    const admin = rows[0];

    const isValid = await checkPassword(password, admin.password);
    if (!isValid) {
      return res
        .status(401)
        .json({ success: false, message: "Password salah" });
    }

    // Kalau sebelumnya password di DB masih plain, upgrade ke hash
    await upgradePasswordIfNeeded(admin, password);

    res.json({
      success: true,
      message: "Login berhasil",
      data: {
        id: admin.id,
        username: admin.name,
        email: admin.email,
      },
      // TODO: ganti dengan JWT beneran kalau mau
      token: "dummy-token",
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan server" });
  }
};

// ==========================
// CHANGE PASSWORD
// ==========================
exports.changePassword = async (req, res) => {
  const { username, currentPassword, newPassword } = req.body;

  if (!username || !currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Data tidak lengkap",
    });
  }

  try {
    const [rows] = await db.query("SELECT * FROM admins WHERE name = ?", [
      username,
    ]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });
    }

    const admin = rows[0];

    // validasi password lama (support hash & plain)
    const match = await checkPassword(currentPassword, admin.password);
    if (!match) {
      return res
        .status(400)
        .json({ success: false, message: "Password lama salah" });
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
    res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan server" });
  }
};
