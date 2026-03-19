import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { createRoadmap, getRoadmaps, getRoadmapById } from "../controllers/roadmapController";

const router = Router();

router.post("/", authenticate, createRoadmap);
router.get("/", authenticate, getRoadmaps);
router.get("/:id", authenticate, getRoadmapById);

export default router;
