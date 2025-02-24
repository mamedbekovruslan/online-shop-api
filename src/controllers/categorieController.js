import { pool } from "../config/db.js";

export const getCategories = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM categories");
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
