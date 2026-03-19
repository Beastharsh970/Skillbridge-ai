import { Router } from "express";
import { authenticate } from "../middleware/auth";
import {
  createInterviewQuestions,
  addMoreQuestions,
  getInterviewQuestions,
  getInterviewQuestionsById,
} from "../controllers/interviewController";

const router = Router();

router.post("/questions", authenticate, createInterviewQuestions);
router.post("/questions/add-more", authenticate, addMoreQuestions);
router.get("/questions", authenticate, getInterviewQuestions);
router.get("/questions/:id", authenticate, getInterviewQuestionsById);

export default router;
