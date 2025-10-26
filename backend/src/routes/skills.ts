import { Router } from "express";
import Joi from "joi";
import {
  validateRequest,
  skillSchemas,
  commonSchemas,
} from "@/middleware/validation";
import { authenticateToken, optionalAuth } from "@/middleware/auth";
import { skillsController } from "@/controllers/skillsController";
import { skillVerificationController } from "@/controllers/skillVerificationController";

const router = Router();

// GET /api/v1/skills - Get all skills with filtering
router.get(
  "/",
  optionalAuth,
  validateRequest({ query: skillSchemas.searchSkills }),
  skillsController.getAllSkills.bind(skillsController)
);

// GET /api/v1/skills/categories - Get skill categories
router.get(
  "/categories",
  skillsController.getSkillCategories.bind(skillsController)
);

// POST /api/v1/skills/request - Request new skill
router.post(
  "/request",
  authenticateToken,
  validateRequest({ body: skillSchemas.requestSkill }),
  skillsController.requestNewSkill.bind(skillsController)
);

// GET /api/v1/skills/search/users - Search users by skills
router.get(
  "/search/users",
  optionalAuth,
  validateRequest({ query: skillSchemas.searchUsersBySkills }),
  skillsController.searchUsersBySkills.bind(skillsController)
);

// GET /api/v1/skills/users/:id - Get user skills
router.get(
  "/users/:id",
  optionalAuth,
  validateRequest({ params: commonSchemas.params.id }),
  skillsController.getUserSkills.bind(skillsController)
);

// POST /api/v1/skills/users/skills - Add user skill
router.post(
  "/users/skills",
  authenticateToken,
  validateRequest({ body: skillSchemas.addUserSkill }),
  skillsController.addUserSkill.bind(skillsController)
);

// PUT /api/v1/skills/users/skills/:id - Update user skill
router.put(
  "/users/skills/:id",
  authenticateToken,
  validateRequest({
    params: commonSchemas.params.id,
    body: skillSchemas.updateUserSkill,
  }),
  skillsController.updateUserSkill.bind(skillsController)
);

// DELETE /api/v1/skills/users/skills/:id - Remove user skill
router.delete(
  "/users/skills/:id",
  authenticateToken,
  validateRequest({ params: commonSchemas.params.id }),
  skillsController.removeUserSkill.bind(skillsController)
);

// POST /api/v1/skills/users/skills/:id/verify - Request skill verification
router.post(
  "/users/skills/:id/verify",
  authenticateToken,
  validateRequest({
    params: commonSchemas.params.id,
    body: skillSchemas.requestVerification,
  }),
  skillVerificationController.requestVerification.bind(
    skillVerificationController
  )
);

// Skill Verification Routes
// GET /api/v1/skills/verifications/requests - Get verification requests to review
router.get(
  "/verifications/requests",
  authenticateToken,
  skillVerificationController.getVerificationRequests.bind(
    skillVerificationController
  )
);

// GET /api/v1/skills/verifications/history - Get verification history
router.get(
  "/verifications/history",
  authenticateToken,
  skillVerificationController.getVerificationHistory.bind(
    skillVerificationController
  )
);

// GET /api/v1/skills/verifications/stats - Get verification statistics
router.get(
  "/verifications/stats",
  authenticateToken,
  skillVerificationController.getVerificationStats.bind(
    skillVerificationController
  )
);

// PUT /api/v1/skills/verifications/:id/respond - Respond to verification request
router.put(
  "/verifications/:id/respond",
  authenticateToken,
  validateRequest({
    params: commonSchemas.params.id,
    body: skillSchemas.respondToVerification,
  }),
  skillVerificationController.respondToVerification.bind(
    skillVerificationController
  )
);

// GET /api/v1/skills/:skillId/verification-status - Get skill verification status
router.get(
  "/:skillId/verification-status",
  authenticateToken,
  validateRequest({
    params: Joi.object({ skillId: Joi.string().uuid().required() }),
  }),
  skillVerificationController.getSkillVerificationStatus.bind(
    skillVerificationController
  )
);

// GET /api/v1/skills/:skillId/potential-verifiers - Get potential verifiers for a skill
router.get(
  "/:skillId/potential-verifiers",
  authenticateToken,
  validateRequest({
    params: Joi.object({ skillId: Joi.string().uuid().required() }),
  }),
  skillVerificationController.getPotentialVerifiers.bind(
    skillVerificationController
  )
);

export default router;
