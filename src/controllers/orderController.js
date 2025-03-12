import { pool } from "../config/db.js";

export const placeOrder = async (req, res) => {
  const { items } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: "Данные заказа неполные" });
  }

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const customerName = req.user?.username || "Гость";
    const customerEmail = req.user?.email || "-";
    const orderDate = new Date().toISOString();
    const status = "pending";

    const orderInsert = `
      INSERT INTO orders (customer_name, customer_email, order_date, total, status)
      VALUES ($1, $2, $3, $4, $5) RETURNING id;
    `;

    const orderResult = await client.query(orderInsert, [
      customerName,
      customerEmail,
      orderDate,
      total,
      status,
    ]);

    const orderId = orderResult.rows[0].id;

    for (const item of items) {
      const { id: product_id, quantity, price } = item;

      const insertItemQuery = `
        INSERT INTO order_items (order_id, product_id, quantity, price)
        VALUES ($1, $2, $3, $4);
      `;

      await client.query(insertItemQuery, [
        orderId,
        product_id,
        quantity,
        price,
      ]);

      const updateProductQuery = `
        UPDATE products SET quantity = quantity - $1 WHERE id = $2;
      `;

      await client.query(updateProductQuery, [quantity, product_id]);
    }

    await client.query("COMMIT");
    res.status(201).json({ message: "Заказ успешно создан", orderId });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Ошибка при оформлении заказа:", error.message);
    console.error("📦 Полная ошибка:", error);
    res.status(500).json({ message: error });
  } finally {
    client.release();
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const userEmail = req.user?.email;

    const result = await pool.query(
      `SELECT * FROM orders WHERE customer_email = $1 ORDER BY order_date DESC`,
      [userEmail]
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Ошибка при получении заказов:", err);
    res.status(500).json({ message: "Ошибка сервера при получении заказов" });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM orders ORDER BY order_date DESC`
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Ошибка при получении всех заказов:", err);
    res.status(500).json({ message: "Ошибка сервера при получении заказов" });
  }
};

export const getAllOrdersWithItems = async (req, res) => {
  try {
    const ordersQuery = `
      SELECT * FROM orders ORDER BY order_date DESC
    `;
    const ordersResult = await pool.query(ordersQuery);
    const orders = ordersResult.rows;

    const itemsQuery = `
      SELECT oi.order_id, oi.product_id, oi.quantity, oi.price, p.name
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
    `;
    const itemsResult = await pool.query(itemsQuery);
    const items = itemsResult.rows;

    const groupedItems = items.reduce((acc, item) => {
      if (!acc[item.order_id]) acc[item.order_id] = [];
      acc[item.order_id].push(item);
      return acc;
    }, {});

    const result = orders.map((order) => ({
      ...order,
      items: groupedItems[order.id] || [],
    }));

    res.status(200).json(result);
  } catch (err) {
    console.error("Ошибка при получении заказов:", err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};
