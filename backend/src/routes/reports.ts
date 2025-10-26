import { Router } from "express";
import { reportController } from "../controllers/reportController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// Apply authentication to all report routes
router.use(authenticateToken);

// Report management endpoints
router.post("/", reportController.createReport.bind(reportController));
router.get("/", reportController.getUserReports.bind(reportController));
router.get("/:reportId", reportController.getReportById.bind(reportController));

// User blocking endpoints
router.post("/block", reportController.blockUser.bind(reportController));
router.post("/unblock", reportController.unblockUser.bind(reportController));
router.get(
  "/blocked/users",
  reportController.getBlockedUsers.bind(reportController)
);

export default router;
