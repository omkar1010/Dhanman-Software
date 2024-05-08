import express from "express";
import {
  getDispatches,
  getDispatchById,
  createDispatch,
  updateDispatch,
  deleteDispatch
} from "../controllers/Dispatch.js";
import { verifyUser } from "../middleware/AuthUser.js";


const router = express.Router();

router.get("/dispatches",verifyUser, getDispatches);
router.get("/dispatches/:id",verifyUser, getDispatchById);
router.post("/dispatches",verifyUser, createDispatch);
router.patch("/dispatches/:id",verifyUser, updateDispatch);
router.delete("/dispatche/:id",verifyUser, deleteDispatch);

export default router;
