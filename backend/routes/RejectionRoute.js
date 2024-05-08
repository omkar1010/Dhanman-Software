import express from "express";
import {
  getRejections,
  getRejectionById,
  createRejection,
  updateRejection,
  deleteRejection
} from "../controllers/Rejection.js";
import { verifyUser } from "../middleware/AuthUser.js";


const router = express.Router();

router.get("/Rejections",verifyUser, getRejections);
router.get("/Rejections/:id",verifyUser, getRejectionById);
router.post("/Rejections",verifyUser, createRejection);
router.patch("/Rejections/:id",verifyUser, updateRejection);
router.delete("/Rejections/:id",verifyUser, deleteRejection);

export default router;
