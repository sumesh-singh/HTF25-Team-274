import { Request, Response } from "express";
import { MatchInteractionType } from "@prisma/client";
import matchingService, { MatchFilters } from "@/services/matchingService";
import logger from "@/utils/logger";
import { ApiResponse } from "@/types";

export class MatchController {
  /**
   * Get match suggestions for the authenticated user
   */
  async getMatchSuggestions(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 20;

      const suggestions = await matchingService.getMatchSuggestions(
        userId,
        undefined,
        limit
      );

      const response: ApiResponse = {
        success: true,
        data: {
          matches: suggestions,
          count: suggestions.length,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req.headers["x-request-id"] as string) || "unknown",
        },
      };

      res.json(response);
    } catch (error) {
      logger.error("Error getting match suggestions:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "MATCH_SUGGESTIONS_ERROR",
          message: "Failed to get match suggestions",
          details: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
          requestId: (req.headers["x-request-id"] as string) || "unknown",
        },
      });
    }
  }

  /**
   * Filter matches based on criteria
   */
  async filterMatches(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const filters: MatchFilters = req.body;
      const limit = parseInt(req.query.limit as string) || 20;

      const matches = await matchingService.filterMatches(
        userId,
        filters,
        limit
      );

      const response: ApiResponse = {
        success: true,
        data: {
          matches,
          count: matches.length,
          filters,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req.headers["x-request-id"] as string) || "unknown",
        },
      };

      res.json(response);
    } catch (error) {
      logger.error("Error filtering matches:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "MATCH_FILTER_ERROR",
          message: "Failed to filter matches",
          details: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
          requestId: (req.headers["x-request-id"] as string) || "unknown",
        },
      });
    }
  }

  /**
   * Favorite a match
   */
  async favoriteMatch(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const targetUserId = req.params.id;

      // Get current user details for match scoring
      const currentUser = await matchingService.getUserWithDetails(userId);
      const targetUser = await matchingService.getUserWithDetails(targetUserId);

      if (!currentUser || !targetUser) {
        return res.status(404).json({
          success: false,
          error: {
            code: "USER_NOT_FOUND",
            message: "User not found",
            timestamp: new Date().toISOString(),
            requestId: (req.headers["x-request-id"] as string) || "unknown",
          },
        });
      }

      // Calculate match score for recording
      const matchScore = await matchingService.calculateMatchScore(
        currentUser,
        targetUser
      );

      // Record the favorite interaction
      await matchingService.recordMatchInteraction(
        userId,
        targetUserId,
        MatchInteractionType.FAVORITE,
        matchScore.score,
        matchScore.explanation
      );

      const response: ApiResponse = {
        success: true,
        data: {
          message: "Match favorited successfully",
          matchId: targetUserId,
          score: matchScore.score,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req.headers["x-request-id"] as string) || "unknown",
        },
      };

      res.json(response);
    } catch (error) {
      logger.error("Error favoriting match:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "FAVORITE_MATCH_ERROR",
          message: "Failed to favorite match",
          details: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
          requestId: (req.headers["x-request-id"] as string) || "unknown",
        },
      });
    }
  }

  /**
   * Pass on a match
   */
  async passMatch(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const targetUserId = req.params.id;

      // Record the pass interaction
      await matchingService.recordMatchInteraction(
        userId,
        targetUserId,
        MatchInteractionType.PASS
      );

      const response: ApiResponse = {
        success: true,
        data: {
          message: "Match passed successfully",
          matchId: targetUserId,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req.headers["x-request-id"] as string) || "unknown",
        },
      };

      res.json(response);
    } catch (error) {
      logger.error("Error passing match:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "PASS_MATCH_ERROR",
          message: "Failed to pass match",
          details: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
          requestId: (req.headers["x-request-id"] as string) || "unknown",
        },
      });
    }
  }

  /**
   * Block a match
   */
  async blockMatch(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const targetUserId = req.params.id;

      // Record the block interaction
      await matchingService.recordMatchInteraction(
        userId,
        targetUserId,
        MatchInteractionType.BLOCK
      );

      const response: ApiResponse = {
        success: true,
        data: {
          message: "Match blocked successfully",
          matchId: targetUserId,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req.headers["x-request-id"] as string) || "unknown",
        },
      };

      res.json(response);
    } catch (error) {
      logger.error("Error blocking match:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "BLOCK_MATCH_ERROR",
          message: "Failed to block match",
          details: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
          requestId: (req.headers["x-request-id"] as string) || "unknown",
        },
      });
    }
  }

  /**
   * Get favorited matches
   */
  async getFavoritedMatches(req: Request, res: Response) {
    try {
      const userId = req.user!.id;

      const favoriteMatches = await matchingService.getFavoritedMatches(userId);

      const response: ApiResponse = {
        success: true,
        data: {
          matches: favoriteMatches,
          count: favoriteMatches.length,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req.headers["x-request-id"] as string) || "unknown",
        },
      };

      res.json(response);
    } catch (error) {
      logger.error("Error getting favorited matches:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "GET_FAVORITES_ERROR",
          message: "Failed to get favorited matches",
          details: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
          requestId: (req.headers["x-request-id"] as string) || "unknown",
        },
      });
    }
  }
}

export default new MatchController();
