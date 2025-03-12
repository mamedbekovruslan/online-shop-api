import db from "../db.js";

export const placeOrder = async (req, res) => {
  const { items } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: "Данные заказа неполные" });
  }

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const customerName = req.user?.username || "Гость";
    const customerEmail = req.user?.email || "-";
    const orderDate = new Date().toISOString();
    const status = "новый";

    const orderResult = await client.query(
      `INSERT INTO orders (customer_name, customer_email, order_date, total, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [customerName, customerEmail, orderDate, total, status]
    );

    const orderId = orderResult.rows[0].id;

    for (const item of items) {
      const { id: product_id, quantity, price } = item;

      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [orderId, product_id, quantity, price]
      );

      await client.query(
        `UPDATE products SET quantity = quantity - $1 WHERE id = $2`,
        [quantity, product_id]
      );
    }

    await client.query("COMMIT");
    res.status(201).json({ message: "Заказ успешно создан", orderId });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Ошибка при оформлении заказа:", error);
    res.status(500).json({ message: "Ошибка сервера при оформлении заказа" });
  } finally {
    client.release();
  }
};
