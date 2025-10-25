import { Request, Response } from "express";
import { oauthService } from "@/services/oauthService";
import { ApiResponse } from "@/types";
import logger from "@/utils/logger";

export class OAuthController {
  // GET /api/v1/auth/google/url - Get Google OAuth URL
  async getGoogleAuthUrl(req: Request, res: Response<ApiResponse>) {
    try {
      const { redirectUri } = req.query;

      if (!redirectUri || typeof redirectUri !== "string") {
        return res.status(400).json({
          success: false,
          error: {
            code: "MISSING_REDIRECT_URI",
            message: "Redirect URI is required",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] as string,
          },
        });
      }

      const authUrl = oauthService.getGoogleAuthUrl(redirectUri);

      res.json({
        success: true,
        data: {
          authUrl,
          provider: "google",
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error: any) {
      logger.error("Google OAuth URL generation error:", error);

      res.status(500).json({
        success: false,
        error: {
          code: "OAUTH_URL_GENERATION_FAILED",
          message: error.message,
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }

  // GET /api/v1/auth/linkedin/url - Get LinkedIn OAuth URL
  async getLinkedInAuthUrl(req: Request, res: Response<ApiResponse>) {
    try {
      const { redirectUri } = req.query;

      if (!redirectUri || typeof redirectUri !== "string") {
        return res.status(400).json({
          success: false,
          error: {
            code: "MISSING_REDIRECT_URI",
            message: "Redirect URI is required",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] as string,
          },
        });
      }

      const authUrl = oauthService.getLinkedInAuthUrl(redirectUri);

      res.json({
        success: true,
        data: {
          authUrl,
          provider: "linkedin",
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error: any) {
      logger.error("LinkedIn OAuth URL generation error:", error);

      res.status(500).json({
        success: false,
        error: {
          code: "OAUTH_URL_GENERATION_FAILED",
          message: error.message,
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }

  // POST /api/v1/auth/google/callback - Handle Google OAuth callback
  async googleCallback(req: Request, res: Response<ApiResponse>) {
    try {
      const { code, redirectUri } = req.body;

      if (!code || !redirectUri) {
        return res.status(400).json({
          success: false,
          error: {
            code: "MISSING_OAUTH_DATA",
            message: "Authorization code and redirect URI are required",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] as string,
          },
        });
      }

      // Exchange code for access token
      const accessToken = await oauthService.exchangeGoogleCode(
        code,
        redirectUri
      );

      // Login user with Google
      const result = await oauthService.googleLogin(accessToken);

      res.json({
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error: any) {
      logger.error("Google OAuth callback error:", error);

      const statusCode = error.message.includes("Invalid") ? 401 : 400;

      res.status(statusCode).json({
        success: false,
        error: {
          code: "GOOGLE_OAUTH_FAILED",
          message: error.message,
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }

  // POST /api/v1/auth/linkedin/callback - Handle LinkedIn OAuth callback
  async linkedinCallback(req: Request, res: Response<ApiResponse>) {
    try {
      const { code, redirectUri } = req.body;

      if (!code || !redirectUri) {
        return res.status(400).json({
          success: false,
          error: {
            code: "MISSING_OAUTH_DATA",
            message: "Authorization code and redirect URI are required",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] as string,
          },
        });
      }

      // Exchange code for access token
      const accessToken = await oauthService.exchangeLinkedInCode(
        code,
        redirectUri
      );

      // Login user with LinkedIn
      const result = await oauthService.linkedinLogin(accessToken);

      res.json({
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error: any) {
      logger.error("LinkedIn OAuth callback error:", error);

      const statusCode = error.message.includes("Invalid") ? 401 : 400;

      res.status(statusCode).json({
        success: false,
        error: {
          code: "LINKEDIN_OAUTH_FAILED",
          message: error.message,
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }

  // POST /api/v1/auth/google/token - Direct token login (for mobile apps)
  async googleTokenLogin(req: Request, res: Response<ApiResponse>) {
    try {
      const { accessToken } = req.body;

      if (!accessToken) {
        return res.status(400).json({
          success: false,
          error: {
            code: "MISSING_ACCESS_TOKEN",
            message: "Google access token is required",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] as string,
          },
        });
      }

      const result = await oauthService.googleLogin(accessToken);

      res.json({
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error: any) {
      logger.error("Google token login error:", error);

      const statusCode = error.message.includes("Invalid") ? 401 : 400;

      res.status(statusCode).json({
        success: false,
        error: {
          code: "GOOGLE_TOKEN_LOGIN_FAILED",
          message: error.message,
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }

  // POST /api/v1/auth/linkedin/token - Direct token login (for mobile apps)
  async linkedinTokenLogin(req: Request, res: Response<ApiResponse>) {
    try {
      const { accessToken } = req.body;

      if (!accessToken) {
        return res.status(400).json({
          success: false,
          error: {
            code: "MISSING_ACCESS_TOKEN",
            message: "LinkedIn access token is required",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] as string,
          },
        });
      }

      const result = await oauthService.linkedinLogin(accessToken);

      res.json({
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error: any) {
      logger.error("LinkedIn token login error:", error);

      const statusCode = error.message.includes("Invalid") ? 401 : 400;

      res.status(statusCode).json({
        success: false,
        error: {
          code: "LINKEDIN_TOKEN_LOGIN_FAILED",
          message: error.message,
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }
}

export const oauthController = new OAuthController();
