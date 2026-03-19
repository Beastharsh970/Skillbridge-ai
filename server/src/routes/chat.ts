import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { sendMessage, getChats, getChatById, deleteChat } from "../controllers/chatController";

const router = Router();

router.post("/send", authenticate, sendMessage);
router.get("/", authenticate, getChats);
router.get("/:id", authenticate, getChatById);
router.delete("/:id", authenticate, deleteChat);

export default router;
