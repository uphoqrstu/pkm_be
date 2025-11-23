const db = require("../config/db");

// Model untuk mengambil admin berdasarkan username
const getAdminByUsername = (username) => {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT * FROM admin WHERE username = ?",
      [username],
      (err, results) => {
        if (err) return reject(err);
        resolve(results[0]); // ambil row pertama
      }
    );
  });
};

// Model untuk membuat admin baru (kalau kamu butuh)
const createAdmin = (data) => {
  return new Promise((resolve, reject) => {
    db.query(
      "INSERT INTO admin (username, password, nama) VALUES (?, ?, ?)",
      [data.username, data.password, data.nama],
      (err, results) => {
        if (err) return reject(err);
        resolve(results);
      }
    );
  });
};

module.exports = {
  getAdminByUsername,
  createAdmin,
};
