import express from "express";
import cors from "cors";
import { router } from "./src/routes/index.js";
import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT || 3000;

const app = express();

// Middleware
app.use(
  cors({
    origin: "*", // Разрешает запросы со всех доменов (для теста, потом можно ограничить)
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// Основной маршрут
app.use("/api", router);

// Базовая проверка для сервера
app.get("/", (req, res) => {
  res.status(200).json({ message: "API is running successfully!" });
});

// Глобальная обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
