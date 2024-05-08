import express from "express";
import {
  getProductions,
  getProductionById,
  createProduction,
  updateProduction,
  deleteProduction,
} from "../controllers/Productions.js";
import { verifyUser } from "../middleware/AuthUser.js";

const router = express.Router();

router.get("/productions", verifyUser, getProductions);
router.get("/production/:id", verifyUser, getProductionById);
router.post("/production", verifyUser, createProduction);
router.patch("/production/:id", verifyUser, updateProduction);
router.delete("/production/:id", verifyUser, deleteProduction);

export default router;
