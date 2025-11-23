    const db = require("../config/db");

    exports.getProducts = (category) => {
    return new Promise((resolve, reject) => {
        let query = `
        SELECT id, category, name,
        IFNULL(description, '') AS description,
        IFNULL(long_description, '') AS long_description,
        price, image, is_active
        FROM products
        `;

        if (category) {
        query += ` WHERE category = ?`;
        }

        db.query(query, [category], (err, results) => {
        if (err) reject(err);
        resolve(results);
        });
    });
    };
