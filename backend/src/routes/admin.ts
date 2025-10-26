import { Router } from "express";
import { adminController } from "../controllers/adminController";
import { authenticateToken } from "../middleware/auth";
import { requireAdmin } from "../middleware/adminAuth";

const router = Router();

// Apply authentication and admin check to all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

// Analytics endpoints
router.get("/analytics", adminController.getAnalytics.bind(adminController));

// User management endpoints
router.get("/users", adminController.getAllUsers.bind(adminController));
router.get(
  "/users/:userId",
  adminController.getUserDetails.bind(adminController)
);

// Session management endpoints
router.get("/sessions", adminController.getAllSessions.bind(adminController));

// Skill management endpoints
router.get("/skills", adminController.getAllSkills.bind(adminController));
router.post("/skills", adminController.createSkill.bind(adminController));
router.put(
  "/skills/:skillId",
  adminController.updateSkill.bind(adminController)
);
router.delete(
  "/skills/:skillId",
  adminController.deleteSkill.bind(adminController)
);

// Report management endpoints
router.get("/reports", adminController.getAllReports.bind(adminController));
router.put(
  "/reports/:reportId",
  adminController.updateReportStatus.bind(adminController)
);

// Moderation endpoints
router.post(
  "/moderation/actions",
  adminController.createModerationAction.bind(adminController)
);
router.get(
  "/moderation/history/:userId",
  adminController.getModerationHistory.bind(adminController)
);

// System health endpoint
router.get("/health", adminController.getSystemHealth.bind(adminController));

export default router;
