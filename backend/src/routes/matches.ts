import { Router } from "express";
import { validateRequest, commonSchemas } from "@/middleware/validation";
import { authenticateToken } from "@/middleware/auth";
import matchController from "@/controllers/matchController";

const router = Router();

// GET /api/v1/matches/suggestions - Get match suggestions
router.get(
  "/suggestions",
  authenticateToken,
  matchController.getMatchSuggestions
);

// POST /api/v1/matches/filter - Filter matches
router.post("/filter", authenticateToken, matchController.filterMatches);

// POST /api/v1/matches/:id/favorite - Favorite a match
router.post(
  "/:id/favorite",
  authenticateToken,
  validateRequest({ params: commonSchemas.params.id }),
  matchController.favoriteMatch
);

// POST /api/v1/matches/:id/pass - Pass on a match
router.post(
  "/:id/pass",
  authenticateToken,
  validateRequest({ params: commonSchemas.params.id }),
  matchController.passMatch
);

// POST /api/v1/matches/:id/block - Block a match
router.post(
  "/:id/block",
  authenticateToken,
  validateRequest({ params: commonSchemas.params.id }),
  matchController.blockMatch
);

// GET /api/v1/matches/favorites - Get favorited matches
router.get(
  "/favorites",
  authenticateToken,
  matchController.getFavoritedMatches
);

export default router;
