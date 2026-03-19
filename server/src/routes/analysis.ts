import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { performGapAnalysis, getAnalyses, getAnalysisById, parseJD, gapAnalysisFromJD } from "../controllers/analysisController";

const router = Router();

router.post("/gap", authenticate, performGapAnalysis);
router.post("/parse-jd", authenticate, parseJD);
router.post("/gap-from-jd", authenticate, gapAnalysisFromJD);
router.get("/", authenticate, getAnalyses);
router.get("/:id", authenticate, getAnalysisById);

export default router;
