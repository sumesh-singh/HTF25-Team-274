import { Request, Response } from "express";
import { SkillVerificationStatus } from "@prisma/client";
import { skillVerificationService } from "@/services/skillVerificationService";
import { ApiResponse, AuthenticatedRequest } from "@/types";

export class SkillVerificationController {
  /**
   * POST /api/v1/skills/users/skills/:id/verify - Request skill verification
   */
  async requestVerification(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>
  ) {
    try {
      const { id: userSkillId } = req.params;
      const { verifierId, message } = req.body;
      const requesterId = req.user!.id;

      const verification = await skillVerificationService.requestVerification({
        userSkillId,
        requesterId,
        verifierId,
        message,
      });

      res.status(201).json({
        success: true,
        data: {
          verification,
          message: "Verification request sent successfully",
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error) {
      console.error("Error requesting skill verification:", error);

      if (error instanceof Error) {
        if (
          error.message ===
          "User skill not found or does not belong to requester"
        ) {
          res.status(404).json({
            success: false,
            error: {
              code: "USER_SKILL_NOT_FOUND",
              message: "The specified skill was not found in your profile",
              timestamp: new Date().toISOString(),
              requestId: req.headers["x-request-id"] as string,
            },
          });
          return;
        }

        if (error.message === "Cannot request verification from yourself") {
          res.status(400).json({
            success: false,
            error: {
              code: "INVALID_VERIFIER",
              message: "You cannot request verification from yourself",
              timestamp: new Date().toISOString(),
              requestId: req.headers["x-request-id"] as string,
            },
          });
          return;
        }

        if (
          error.message ===
          "Verification request already exists for this skill and verifier"
        ) {
          res.status(409).json({
            success: false,
            error: {
              code: "VERIFICATION_EXISTS",
              message:
                "You have already requested verification from this user for this skill",
              timestamp: new Date().toISOString(),
              requestId: req.headers["x-request-id"] as string,
            },
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to request skill verification",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }

  /**
   * PUT /api/v1/skills/verifications/:id/respond - Respond to verification request
   */
  async respondToVerification(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>
  ) {
    try {
      const { id: verificationId } = req.params;
      const { status, feedback } = req.body;
      const verifierId = req.user!.id;

      const verification = await skillVerificationService.respondToVerification(
        {
          verificationId,
          verifierId,
          status,
          feedback,
        }
      );

      res.json({
        success: true,
        data: {
          verification,
          message: `Verification ${status.toLowerCase()} successfully`,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error) {
      console.error("Error responding to verification:", error);

      if (
        error instanceof Error &&
        error.message === "Verification request not found or already processed"
      ) {
        res.status(404).json({
          success: false,
          error: {
            code: "VERIFICATION_NOT_FOUND",
            message: "Verification request not found or already processed",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] as string,
          },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to respond to verification request",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }

  /**
   * GET /api/v1/skills/verifications/requests - Get verification requests to review
   */
  async getVerificationRequests(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>
  ) {
    try {
      const verifierId = req.user!.id;
      const { status } = req.query;

      const verificationStatus = status
        ? (status as SkillVerificationStatus)
        : undefined;
      const requests = await skillVerificationService.getVerificationRequests(
        verifierId,
        verificationStatus
      );

      res.json({
        success: true,
        data: {
          requests,
          total: requests.length,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error) {
      console.error("Error getting verification requests:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve verification requests",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }

  /**
   * GET /api/v1/skills/verifications/history - Get verification history
   */
  async getVerificationHistory(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>
  ) {
    try {
      const requesterId = req.user!.id;
      const { status } = req.query;

      const verificationStatus = status
        ? (status as SkillVerificationStatus)
        : undefined;
      const history = await skillVerificationService.getVerificationHistory(
        requesterId,
        verificationStatus
      );

      res.json({
        success: true,
        data: {
          history,
          total: history.length,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error) {
      console.error("Error getting verification history:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve verification history",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }

  /**
   * GET /api/v1/skills/:skillId/verification-status - Get skill verification status
   */
  async getSkillVerificationStatus(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>
  ) {
    try {
      const { skillId } = req.params;
      const userId = req.user!.id;

      const status = await skillVerificationService.getSkillVerificationStatus(
        userId,
        skillId
      );

      res.json({
        success: true,
        data: status,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error) {
      console.error("Error getting skill verification status:", error);

      if (error instanceof Error && error.message === "User skill not found") {
        res.status(404).json({
          success: false,
          error: {
            code: "USER_SKILL_NOT_FOUND",
            message: "The specified skill was not found in your profile",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] as string,
          },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve skill verification status",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }

  /**
   * GET /api/v1/skills/:skillId/potential-verifiers - Get potential verifiers for a skill
   */
  async getPotentialVerifiers(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>
  ) {
    try {
      const { skillId } = req.params;
      const requesterId = req.user!.id;

      const verifiers = await skillVerificationService.getPotentialVerifiers(
        skillId,
        requesterId
      );

      res.json({
        success: true,
        data: {
          verifiers,
          total: verifiers.length,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error) {
      console.error("Error getting potential verifiers:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve potential verifiers",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }

  /**
   * GET /api/v1/skills/verifications/stats - Get verification statistics
   */
  async getVerificationStats(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>
  ) {
    try {
      const userId = req.user!.id;

      const stats = await skillVerificationService.getVerificationStats(userId);

      res.json({
        success: true,
        data: stats,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error) {
      console.error("Error getting verification stats:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve verification statistics",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }
}

export const skillVerificationController = new SkillVerificationController();
