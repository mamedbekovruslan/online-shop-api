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
  getProductById,
} from "../controllers/productController.js";
import { getCategories } from "../controllers/categorieController.js";
import multer from "multer";
import {
  getAllOrders,
  getAllOrdersWithItems,
  getMyOrders,
  placeOrder,
} from "../controllers/orderController.js";

const upload = multer({ dest: "uploads/" });

export const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/categories", getCategories);
router.get("/products", getProducts);
router.get("/products/:id", getProductById);
router.delete("/products/:id", deleteProduct);
router.post("/products", upload.single("photo"), addProduct);
router.put("/products/:id", upload.single("photo"), updateProduct);
router.patch("/products/:id", upload.single("photo"), patchProduct);
router.post("/order", verifyToken, placeOrder);
router.get("/orders", verifyToken, getMyOrders);
router.get("/orders/all", verifyToken, verifyAdmin, getAllOrdersWithItems);
router.get("/admin/orders", verifyToken, verifyAdmin, getAllOrders);
router.get("/users", verifyToken, verifyAdmin, getUsers);
router.delete("/users/:id", verifyToken, verifyAdmin, deleteUser);
router.put("/users/:id", verifyToken, verifyAdmin, updateUser);
router.post("/users", verifyToken, verifyAdmin, addUser);
