import express from "express";
import { registerUser, loginUser } from "../controllers/userController.js";
import {
  deleteProduct,
  getProducts,
} from "../controllers/productController.js";
import { getCategories } from "../controllers/categorieController.js";

export const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/categories", getCategories);
router.get("/products", getProducts);
router.delete("/products/:id", deleteProduct); // Добавляем роут для удаления товара
