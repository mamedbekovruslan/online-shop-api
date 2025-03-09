import { pool } from "../config/db.js";
import multer from "multer";
import path from "path";
import fs from "fs";

// Директория для загрузок
const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase(); // Получаем расширение
    const filename = `${Date.now()}${ext}`; // Генерируем имя с расширением
    console.log("Исходное имя файла:", file.originalname);
    console.log("Файл сохранён как:", filename);
    cb(null, filename);
  },
});

export const upload = multer({ storage });

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
    console.error("Error fetching products:", err);
    res.status(500).json({ error: "Error fetching products" });
  }
};

export const getProductById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("SELECT * FROM products WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Товар не найден" });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM products WHERE id = $1", [id]);
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({ error: "Error deleting product" });
  }
};

// Добавление товара с фото
export const addProduct = async (req, res) => {
  console.log("🔹 Данные из запроса:", req.body);
  console.log("🔹 Загруженный файл:", req.file);
  try {
    const { name, category_id, price, quantity } = req.body;
    const photo = req.file ? `/uploads/${req.file.filename}` : null;

    if (!name || !category_id || !price || !quantity) {
      return res.status(400).json({ error: "Все поля должны быть заполнены" });
    }

    const query = `
      INSERT INTO products (name, category_id, price, quantity, photo)
      VALUES ($1, $2, $3, $4, $5) RETURNING *;
    `;
    const values = [name, category_id, price, quantity, photo];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Ошибка добавления товара:", err);
    res
      .status(500)
      .json({ error: "Ошибка добавления товара", details: err.message });
  }
};

// Обновление товара
export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, category_id, price, quantity } = req.body;
  const photo = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const query = `
      UPDATE products 
      SET name = $1, category_id = $2, price = $3, quantity = $4, photo = COALESCE($5, photo)
      WHERE id = $6 RETURNING *;
    `;
    const values = [name, category_id, price, quantity, photo, id];

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Товар не найден" });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Ошибка обновления товара", details: err.message });
  }
};

export const patchProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = [];
    const values = [];

    // Проверяем текстовые поля
    Object.entries(req.body).forEach(([key, value], index) => {
      if (value) {
        updates.push(`${key} = $${values.length + 1}`);
        values.push(value);
      }
    });

    // Если загружено новое изображение
    if (req.file) {
      updates.push(`photo = $${values.length + 1}`);
      values.push(`/uploads/${req.file.filename}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "Нет данных для обновления" });
    }

    values.push(id);
    const query = `UPDATE products SET ${updates.join(", ")} WHERE id = $${
      values.length
    } RETURNING *;`;

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Товар не найден" });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Ошибка обновления товара:", err);
    res
      .status(500)
      .json({ error: "Ошибка обновления товара", details: err.message });
  }
};

export const placeOrder = async (req, res) => {
  const { items } = req.body; // [{ id, quantity }]

  try {
    for (const item of items) {
      const productQuery = "SELECT quantity FROM products WHERE id = $1";
      const productResult = await pool.query(productQuery, [item.id]);

      if (productResult.rows.length === 0) {
        return res
          .status(404)
          .json({ error: `Product with ID ${item.id} not found` });
      }

      const currentQuantity = productResult.rows[0].quantity;
      const newQuantity = currentQuantity - item.quantity;

      const updateQuery = "UPDATE products SET quantity = $1 WHERE id = $2";
      await pool.query(updateQuery, [Math.max(newQuantity, 0), item.id]); // Устанавливаем 0, если значение отрицательное
    }

    res.status(200).json({ message: "Order placed successfully" });
  } catch (err) {
    console.error("Error placing order:", err);
    res
      .status(500)
      .json({ error: "Error placing order", details: err.message });
  }
};
