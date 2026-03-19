import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { uploadResume } from "../middleware/upload";
import * as userCtrl from "../controllers/userController";

const router = Router();

router.post("/upload-resume", authenticate, uploadResume, userCtrl.uploadResume);
router.post("/github", authenticate, userCtrl.connectGitHub);
router.put("/profile", authenticate, userCtrl.updateProfile);
router.put("/resume-data", authenticate, userCtrl.updateResumeData);
router.post("/resume-improve", authenticate, userCtrl.improveResumeEndpoint);
router.post("/resume-download", authenticate, userCtrl.downloadImprovedResume);

export default router;
