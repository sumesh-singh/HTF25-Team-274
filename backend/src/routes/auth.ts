import { Router } from "express";
import { validateRequest, authSchemas } from "@/middleware/validation";
import { authenticateToken } from "@/middleware/auth";
import {
  authLimiter,
  passwordResetLimiter,
  emailVerificationLimiter,
  accountLockoutMiddleware,
} from "@/middleware/rateLimiting";
import { authController } from "@/controllers/authController";
import { oauthController } from "@/controllers/oauthController";

const router = Router();

// POST /api/v1/auth/register
router.post(
  "/register",
  authLimiter,
  validateRequest({ body: authSchemas.register }),
  authController.register.bind(authController)
);

// POST /api/v1/auth/login
router.post(
  "/login",
  authLimiter,
  accountLockoutMiddleware,
  validateRequest({ body: authSchemas.login }),
  authController.login.bind(authController)
);

// POST /api/v1/auth/refresh
router.post("/refresh", authController.refreshToken.bind(authController));

// POST /api/v1/auth/logout
router.post("/logout", authController.logout.bind(authController));

// POST /api/v1/auth/forgot-password
router.post(
  "/forgot-password",
  passwordResetLimiter,
  validateRequest({ body: authSchemas.forgotPassword }),
  authController.forgotPassword.bind(authController)
);

// POST /api/v1/auth/reset-password
router.post(
  "/reset-password",
  validateRequest({ body: authSchemas.resetPassword }),
  authController.resetPassword.bind(authController)
);

// POST /api/v1/auth/verify-email
router.post(
  "/verify-email",
  validateRequest({ body: authSchemas.verifyEmail }),
  authController.verifyEmail.bind(authController)
);

// POST /api/v1/auth/resend-verification
router.post(
  "/resend-verification",
  emailVerificationLimiter,
  validateRequest({ body: authSchemas.resendVerification }),
  authController.resendEmailVerification.bind(authController)
);

// GET /api/v1/auth/me - Get current user
router.get(
  "/me",
  authenticateToken,
  authController.getCurrentUser.bind(authController)
);

// OAuth Routes

// GET /api/v1/auth/google/url - Get Google OAuth URL
router.get(
  "/google/url",
  oauthController.getGoogleAuthUrl.bind(oauthController)
);

// POST /api/v1/auth/google/callback - Handle Google OAuth callback
router.post(
  "/google/callback",
  oauthController.googleCallback.bind(oauthController)
);

// POST /api/v1/auth/google/token - Direct Google token login
router.post(
  "/google/token",
  oauthController.googleTokenLogin.bind(oauthController)
);

// GET /api/v1/auth/linkedin/url - Get LinkedIn OAuth URL
router.get(
  "/linkedin/url",
  oauthController.getLinkedInAuthUrl.bind(oauthController)
);

// POST /api/v1/auth/linkedin/callback - Handle LinkedIn OAuth callback
router.post(
  "/linkedin/callback",
  oauthController.linkedinCallback.bind(oauthController)
);

// POST /api/v1/auth/linkedin/token - Direct LinkedIn token login
router.post(
  "/linkedin/token",
  oauthController.linkedinTokenLogin.bind(oauthController)
);

export default router;
