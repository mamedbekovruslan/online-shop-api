import express from "express";
import {
  registerUser,
  loginUser,
  getUsers,
  deleteUser,
  updateUser,
  verifyToken,
  verifyAdmin,
  addUser,
} from "../controllers/userController.js";
import {
  deleteProduct,
  getProducts,
  addProduct,
  updateProduct,
  patchProduct,
  placeOrder,
  getProductById,
} from "../controllers/productController.js";
import { getCategories } from "../controllers/categorieController.js";

export const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/categories", getCategories);
router.get("/products", getProducts);
router.get("/products/:id", getProductById);
router.delete("/products/:id", deleteProduct);
router.post("/products", addProduct);
router.put("/products/:id", updateProduct);
router.patch("/products/:id", patchProduct);
router.post("/order", placeOrder);
router.get("/users", verifyToken, verifyAdmin, getUsers);
router.delete("/users/:id", verifyToken, verifyAdmin, deleteUser);
router.put("/users/:id", verifyToken, verifyAdmin, updateUser);
router.post("/users", verifyToken, verifyAdmin, addUser);
