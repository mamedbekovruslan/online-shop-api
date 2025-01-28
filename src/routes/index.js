import express from "express";
import { getUsers } from "../controllers/userController.js";

export const router = express.Router();

router.get("/users", getUsers);
