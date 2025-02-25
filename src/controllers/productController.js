// productController.js
import { pool } from "../config/db.js";

export const getProducts = async (req, res) => {
  const { category_id } = req.query;

  try {
    let query = "SELECT * FROM products";
    let params = [];

    if (category_id) {
      query += " WHERE category_id = $1";
      params = [category_id];
    }

    const result = await pool.query(query, params);
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Удаление товара
export const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM products WHERE id = $1", [id]);
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
