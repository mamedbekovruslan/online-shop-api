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

export const addProduct = async (req, res) => {
  const { name, category_id, price, quantity, photo } = req.body;

  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "Invalid name" });
  }

  if (isNaN(category_id) || !Number.isInteger(Number(category_id))) {
    return res.status(400).json({ error: "Invalid category_id" });
  }

  if (isNaN(price) || price <= 0) {
    return res.status(400).json({ error: "Invalid price" });
  }

  if (isNaN(quantity) || quantity <= 0) {
    return res.status(400).json({ error: "Invalid quantity" });
  }

  try {
    const query = `
      INSERT INTO products (name, category_id, price, quantity, photo)
      VALUES ($1, $2, $3, $4, $5) RETURNING *;
    `;
    const values = [name, category_id, price, quantity, photo];

    console.log("Query to execute:", query);
    console.log("Values:", values);

    const result = await pool.query(query, values);
    console.log("Product added successfully:", result.rows[0]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error adding product:", err);
    res
      .status(500)
      .json({ error: "Error adding product", details: err.message });
  }
};

export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, category_id, price, quantity, photo } = req.body;

  if (!name || !category_id || !price || !quantity || !photo) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const query = `
      UPDATE products 
      SET name = $1, category_id = $2, price = $3, quantity = $4, photo = $5
      WHERE id = $6 RETURNING *;
    `;
    const values = [name, category_id, price, quantity, photo, id];

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error updating product", details: err.message });
  }
};

export const patchProduct = async (req, res) => {
  const { id } = req.params;
  const fields = [];
  const values = [];

  Object.entries(req.body).forEach(([key, value], index) => {
    fields.push(`${key} = $${index + 1}`);
    values.push(value);
  });

  if (fields.length === 0) {
    return res.status(400).json({ error: "No fields provided for update" });
  }

  try {
    const query = `UPDATE products SET ${fields.join(", ")} WHERE id = $${
      values.length + 1
    } RETURNING *;`;
    values.push(id);

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error updating product", details: err.message });
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
