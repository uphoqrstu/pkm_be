const db = require("../config/db");

// GET /api/orders
exports.listOrders = async (req, res) => {
  try {
    const [orders] = await db.query(`
      SELECT id, total, status, waktu, table_number
      FROM orders ORDER BY waktu DESC
    `);

    for (let order of orders) {
      const [items] = await db.query(`
        SELECT 
          oi.product_id,
          p.name AS product_name,
          oi.qty,
          oi.total
        FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = ?
      `, [order.id]);

      order.items = items;
    }

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil data orders" });
  }
};

// POST /api/pesanan
exports.createPesanan = async (req, res) => {
  const { items, total, table_number } = req.body;

  if (!items || items.length === 0 || total <= 0) {
    return res.status(400).json({ success: false, message: "Items kosong atau total tidak valid" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(`
      INSERT INTO orders (total, status, waktu, table_number)
      VALUES (?, 'Pending', NOW(), ?)
    `, [total, table_number || null]);

    const orderID = result.insertId;

    for (let it of items) {
      let qty = it.qty <= 0 ? 1 : it.qty;
      let price = it.total / qty;

      await conn.query(`
        INSERT INTO order_items (order_id, product_id, qty, price, total)
        VALUES (?, ?, ?, ?, ?)
      `, [orderID, it.product_id, qty, price, it.total]);
    }

    await conn.commit();

    res.json({
      success: true,
      message: "Pesanan berhasil disimpan",
      order_id: orderID
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: "Gagal menyimpan pesanan" });
  } finally {
    conn.release();
  }
};

// POST /api/orders/:id/complete
exports.completeOrder = async (req, res) => {
  const id = req.params.id;

  try {
    const [result] = await db.query(`
      UPDATE orders SET status = 'Selesai' WHERE id = ?
    `, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Pesanan tidak ditemukan" });
    }

    res.json({ success: true, message: "Status pesanan diubah menjadi Selesai" });
  } catch {
    res.status(500).json({ success: false, message: "Gagal mengubah status" });
  }
};

// GET /api/reports/daily
exports.dailyReport = async (req, res) => {
  try {
    const [[report]] = await db.query(`
      SELECT IFNULL(SUM(total),0) AS total_penjualan,
             COUNT(*) AS total_transaksi
      FROM orders
      WHERE DATE(waktu) = CURDATE() AND status = 'Selesai'
    `);

    res.json(report);
  } catch {
    res.status(500).json({ error: "Gagal mengambil laporan harian" });
  }
};

// GET /api/reports/monthly
exports.monthlyReport = async (req, res) => {
  try {
    const [[report]] = await db.query(`
      SELECT IFNULL(SUM(total),0) AS total_penjualan,
             COUNT(*) AS total_transaksi
      FROM orders
      WHERE YEAR(waktu) = YEAR(CURDATE()) 
      AND MONTH(waktu) = MONTH(CURDATE())
      AND status = 'Selesai'
    `);

    res.json(report);
  } catch {
    res.status(500).json({ error: "Gagal mengambil laporan bulanan" });
  }
};
