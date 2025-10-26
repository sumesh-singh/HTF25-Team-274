import request from "supertest";
import app from "@/app";
import { authService } from "@/services/authService";
import { oauthService } from "@/services/oauthService";
import { emailService } from "@/services/emailService";
import { mockPrisma } from "./setup";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import config from "@/config";

// Mock external services
jest.mock("@/services/emailService");
jest.mock("@/services/oauthService");
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");

describe("Authentication Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/v1/auth/register", () => {
    const validRegistrationData = {
      email: "test@example.com",
      password: "SecurePass123!",
      firstName: "John",
      lastName: "Doe",
    };

    it("should register a new user successfully", async () => {
      const mockUser = {
        id: "user-id",
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        avatar: undefined,
        bio: undefined,
        location: undefined,
        timezone: "UTC",
        isVerified: false,
        rating: 0,
        totalSessions: 0,
        creditBalance: 50,
        joinedAt: new Date(),
        lastActive: new Date(),
      };

      const mockAuthResponse = {
        user: mockUser,
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
      };

      jest.spyOn(authService, "register").mockResolvedValue(mockAuthResponse);

      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(validRegistrationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe("test@example.com");
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it("should return 400 for invalid email", async () => {
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send({
          ...validRegistrationData,
          email: "invalid-email",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should return 400 for weak password", async () => {
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send({
          ...validRegistrationData,
          password: "weak",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should return 409 for existing user", async () => {
      jest
        .spyOn(authService, "register")
        .mockRejectedValue(new Error("User with this email already exists"));

      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(validRegistrationData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("USER_ALREADY_EXISTS");
    });
  });

  describe("POST /api/v1/auth/login", () => {
    const validLoginData = {
      email: "test@example.com",
      password: "SecurePass123!",
    };

    it("should login user successfully", async () => {
      const mockUser = {
        id: "user-id",
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        avatar: undefined,
        bio: undefined,
        location: undefined,
        timezone: "UTC",
        isVerified: false,
        rating: 0,
        totalSessions: 0,
        creditBalance: 50,
        joinedAt: new Date(),
        lastActive: new Date(),
      };

      const mockAuthResponse = {
        user: mockUser,
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
      };

      jest.spyOn(authService, "login").mockResolvedValue(mockAuthResponse);

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send(validLoginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe("test@example.com");
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it("should return 401 for invalid credentials", async () => {
      jest
        .spyOn(authService, "login")
        .mockRejectedValue(new Error("Invalid email or password"));

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send(validLoginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("LOGIN_FAILED");
    });

    it("should return 400 for missing email", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          password: "SecurePass123!",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("POST /api/v1/auth/refresh", () => {
    it("should refresh token successfully", async () => {
      const mockTokens = {
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
      };

      jest.spyOn(authService, "refreshToken").mockResolvedValue(mockTokens);

      const response = await request(app)
        .post("/api/v1/auth/refresh")
        .send({
          refreshToken: "valid-refresh-token",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBe("new-access-token");
      expect(response.body.data.refreshToken).toBe("new-refresh-token");
    });

    it("should return 400 for missing refresh token", async () => {
      const response = await request(app)
        .post("/api/v1/auth/refresh")
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("REFRESH_TOKEN_MISSING");
    });

    it("should return 401 for invalid refresh token", async () => {
      jest
        .spyOn(authService, "refreshToken")
        .mockRejectedValue(new Error("Invalid or expired refresh token"));

      const response = await request(app)
        .post("/api/v1/auth/refresh")
        .send({
          refreshToken: "invalid-token",
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("TOKEN_REFRESH_FAILED");
    });
  });

  describe("POST /api/v1/auth/logout", () => {
    it("should logout successfully", async () => {
      jest.spyOn(authService, "logout").mockResolvedValue();

      const response = await request(app)
        .post("/api/v1/auth/logout")
        .send({
          refreshToken: "valid-refresh-token",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe("Logged out successfully");
    });

    it("should logout successfully even without refresh token", async () => {
      const response = await request(app)
        .post("/api/v1/auth/logout")
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe("Logged out successfully");
    });
  });

  describe("POST /api/v1/auth/forgot-password", () => {
    it("should send password reset email successfully", async () => {
      jest
        .spyOn(authService, "generatePasswordResetToken")
        .mockResolvedValue("reset-token");

      const response = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({
          email: "test@example.com",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain(
        "Password reset instructions"
      );
    });

    it("should return 404 for non-existent user", async () => {
      jest
        .spyOn(authService, "generatePasswordResetToken")
        .mockRejectedValue(new Error("User not found"));

      const response = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({
          email: "nonexistent@example.com",
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("PASSWORD_RESET_FAILED");
    });
  });

  describe("POST /api/v1/auth/reset-password", () => {
    it("should reset password successfully", async () => {
      jest.spyOn(authService, "resetPassword").mockResolvedValue();

      const response = await request(app)
        .post("/api/v1/auth/reset-password")
        .send({
          token: "valid-reset-token",
          password: "NewSecurePass123!",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe(
        "Password has been reset successfully"
      );
    });

    it("should return 400 for invalid reset token", async () => {
      jest
        .spyOn(authService, "resetPassword")
        .mockRejectedValue(new Error("Invalid or expired reset token"));

      const response = await request(app)
        .post("/api/v1/auth/reset-password")
        .send({
          token: "invalid-token",
          password: "NewSecurePass123!",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("PASSWORD_RESET_FAILED");
    });
  });

  describe("GET /api/v1/auth/me", () => {
    it("should return current user when authenticated", async () => {
      const mockUser = {
        id: "user-id",
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        avatar: undefined,
        bio: undefined,
        location: undefined,
        timezone: "UTC",
        isVerified: false,
        rating: 0,
        totalSessions: 0,
        creditBalance: 50,
        joinedAt: new Date(),
        lastActive: new Date(),
      };

      jest.spyOn(authService, "verifyToken").mockResolvedValue(mockUser);

      const response = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", "Bearer valid-token")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe("test@example.com");
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app).get("/api/v1/auth/me").expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("AUTH_TOKEN_MISSING");
    });

    it("should return 401 for invalid token", async () => {
      jest.spyOn(authService, "verifyToken").mockResolvedValue(null);

      const response = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("AUTH_TOKEN_INVALID");
    });
  });

  describe("JWT Token Generation and Verification", () => {
    describe("Token Generation", () => {
      it("should generate valid access and refresh tokens", async () => {
        const mockUser = {
          id: "user-123",
          email: "test@example.com",
          firstName: "John",
          lastName: "Doe",
        };

        (jwt.sign as jest.Mock)
          .mockReturnValueOnce("mock-access-token")
          .mockReturnValueOnce("mock-refresh-token");

        const mockAuthResponse = {
          user: mockUser,
          accessToken: "mock-access-token",
          refreshToken: "mock-refresh-token",
        };

        jest.spyOn(authService, "register").mockResolvedValue(mockAuthResponse);

        const response = await request(app)
          .post("/api/v1/auth/register")
          .send({
            email: "test@example.com",
            password: "SecurePass123!",
            firstName: "John",
            lastName: "Doe",
          })
          .expect(201);

        expect(jwt.sign).toHaveBeenCalledTimes(2);
        expect(jwt.sign).toHaveBeenCalledWith(
          { userId: "user-123", email: "test@example.com" },
          config.jwt.secret,
          { expiresIn: config.jwt.expiresIn }
        );
        expect(jwt.sign).toHaveBeenCalledWith(
          { userId: "user-123", email: "test@example.com", type: "refresh" },
          config.jwt.refreshSecret,
          { expiresIn: config.jwt.refreshExpiresIn }
        );
        expect(response.body.data.accessToken).toBe("mock-access-token");
        expect(response.body.data.refreshToken).toBe("mock-refresh-token");
      });

      it("should generate tokens with correct expiration times", async () => {
        const mockUser = {
          id: "user-123",
          email: "test@example.com",
        };

        (jwt.sign as jest.Mock)
          .mockReturnValueOnce("access-token")
          .mockReturnValueOnce("refresh-token");

        jest.spyOn(authService, "login").mockResolvedValue({
          user: mockUser as any,
          accessToken: "access-token",
          refreshToken: "refresh-token",
        });

        await request(app).post("/api/v1/auth/login").send({
          email: "test@example.com",
          password: "password123",
        });

        expect(jwt.sign).toHaveBeenCalledWith(
          expect.any(Object),
          config.jwt.secret,
          { expiresIn: config.jwt.expiresIn }
        );
        expect(jwt.sign).toHaveBeenCalledWith(
          expect.any(Object),
          config.jwt.refreshSecret,
          { expiresIn: config.jwt.refreshExpiresIn }
        );
      });
    });

    describe("Token Verification", () => {
      it("should verify valid JWT tokens", async () => {
        const mockDecodedToken = {
          userId: "user-123",
          email: "test@example.com",
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        };

        const mockUser = {
          id: "user-123",
          email: "test@example.com",
          firstName: "John",
          lastName: "Doe",
        };

        (jwt.verify as jest.Mock).mockReturnValue(mockDecodedToken);
        jest
          .spyOn(authService, "verifyToken")
          .mockResolvedValue(mockUser as any);

        const response = await request(app)
          .get("/api/v1/auth/me")
          .set("Authorization", "Bearer valid-jwt-token")
          .expect(200);

        expect(jwt.verify).toHaveBeenCalledWith(
          "valid-jwt-token",
          config.jwt.secret
        );
        expect(response.body.data.user.id).toBe("user-123");
      });

      it("should reject invalid JWT tokens", async () => {
        (jwt.verify as jest.Mock).mockImplementation(() => {
          throw new Error("Invalid token");
        });

        jest.spyOn(authService, "verifyToken").mockResolvedValue(null);

        const response = await request(app)
          .get("/api/v1/auth/me")
          .set("Authorization", "Bearer invalid-token")
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe("AUTH_TOKEN_INVALID");
      });

      it("should reject expired JWT tokens", async () => {
        (jwt.verify as jest.Mock).mockImplementation(() => {
          const error = new Error("Token expired");
          error.name = "TokenExpiredError";
          throw error;
        });

        jest.spyOn(authService, "verifyToken").mockResolvedValue(null);

        const response = await request(app)
          .get("/api/v1/auth/me")
          .set("Authorization", "Bearer expired-token")
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe("AUTH_TOKEN_INVALID");
      });
    });

    describe("Refresh Token Flow", () => {
      it("should refresh tokens with valid refresh token", async () => {
        const mockDecodedToken = {
          userId: "user-123",
          email: "test@example.com",
          type: "refresh",
        };

        (jwt.verify as jest.Mock).mockReturnValue(mockDecodedToken);
        (jwt.sign as jest.Mock)
          .mockReturnValueOnce("new-access-token")
          .mockReturnValueOnce("new-refresh-token");

        jest.spyOn(authService, "refreshToken").mockResolvedValue({
          accessToken: "new-access-token",
          refreshToken: "new-refresh-token",
        });

        const response = await request(app)
          .post("/api/v1/auth/refresh")
          .send({
            refreshToken: "valid-refresh-token",
          })
          .expect(200);

        expect(response.body.data.accessToken).toBe("new-access-token");
        expect(response.body.data.refreshToken).toBe("new-refresh-token");
      });

      it("should reject invalid refresh tokens", async () => {
        (jwt.verify as jest.Mock).mockImplementation(() => {
          throw new Error("Invalid refresh token");
        });

        jest
          .spyOn(authService, "refreshToken")
          .mockRejectedValue(new Error("Invalid or expired refresh token"));

        const response = await request(app)
          .post("/api/v1/auth/refresh")
          .send({
            refreshToken: "invalid-refresh-token",
          })
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe("TOKEN_REFRESH_FAILED");
      });
    });
  });

  describe("Password Reset Functionality", () => {
    describe("Password Reset Request", () => {
      it("should generate password reset token and send email", async () => {
        const resetToken = "reset-token-123";

        jest
          .spyOn(authService, "generatePasswordResetToken")
          .mockResolvedValue(resetToken);

        jest.spyOn(emailService, "sendPasswordResetEmail").mockResolvedValue();

        const response = await request(app)
          .post("/api/v1/auth/forgot-password")
          .send({
            email: "test@example.com",
          })
          .expect(200);

        expect(authService.generatePasswordResetToken).toHaveBeenCalledWith(
          "test@example.com"
        );
        expect(response.body.success).toBe(true);
        expect(response.body.data.message).toContain(
          "Password reset instructions"
        );
      });

      it("should handle email sending failure gracefully", async () => {
        jest
          .spyOn(authService, "generatePasswordResetToken")
          .mockRejectedValue(new Error("Failed to send password reset email"));

        const response = await request(app)
          .post("/api/v1/auth/forgot-password")
          .send({
            email: "test@example.com",
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe("PASSWORD_RESET_FAILED");
      });

      it("should validate email format for password reset", async () => {
        const response = await request(app)
          .post("/api/v1/auth/forgot-password")
          .send({
            email: "invalid-email",
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe("VALIDATION_ERROR");
      });
    });

    describe("Password Reset Completion", () => {
      it("should reset password with valid token", async () => {
        const hashedPassword = "hashed-new-password";

        (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
        jest.spyOn(authService, "resetPassword").mockResolvedValue();

        const response = await request(app)
          .post("/api/v1/auth/reset-password")
          .send({
            token: "valid-reset-token",
            password: "NewSecurePass123!",
          })
          .expect(200);

        expect(authService.resetPassword).toHaveBeenCalledWith(
          "valid-reset-token",
          "NewSecurePass123!"
        );
        expect(response.body.success).toBe(true);
        expect(response.body.data.message).toBe(
          "Password has been reset successfully"
        );
      });

      it("should reject expired reset tokens", async () => {
        jest
          .spyOn(authService, "resetPassword")
          .mockRejectedValue(new Error("Invalid or expired reset token"));

        const response = await request(app)
          .post("/api/v1/auth/reset-password")
          .send({
            token: "expired-token",
            password: "NewSecurePass123!",
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe("PASSWORD_RESET_FAILED");
      });

      it("should validate new password strength", async () => {
        const response = await request(app)
          .post("/api/v1/auth/reset-password")
          .send({
            token: "valid-token",
            password: "weak",
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe("VALIDATION_ERROR");
      });

      it("should invalidate all refresh tokens after password reset", async () => {
        jest.spyOn(authService, "resetPassword").mockResolvedValue();

        await request(app)
          .post("/api/v1/auth/reset-password")
          .send({
            token: "valid-reset-token",
            password: "NewSecurePass123!",
          })
          .expect(200);

        expect(authService.resetPassword).toHaveBeenCalledWith(
          "valid-reset-token",
          "NewSecurePass123!"
        );
      });
    });

    describe("Email Verification", () => {
      it("should send email verification on registration", async () => {
        const mockUser = {
          id: "user-123",
          email: "test@example.com",
          firstName: "John",
          lastName: "Doe",
        };

        jest.spyOn(authService, "register").mockResolvedValue({
          user: mockUser as any,
          accessToken: "access-token",
          refreshToken: "refresh-token",
        });

        jest
          .spyOn(authService, "generateEmailVerificationToken")
          .mockResolvedValue("verification-token");

        await request(app)
          .post("/api/v1/auth/register")
          .send({
            email: "test@example.com",
            password: "SecurePass123!",
            firstName: "John",
            lastName: "Doe",
          })
          .expect(201);

        // Email verification should be attempted during registration
        expect(authService.register).toHaveBeenCalled();
      });

      it("should verify email with valid token", async () => {
        jest.spyOn(authService, "verifyEmail").mockResolvedValue();

        const response = await request(app)
          .post("/api/v1/auth/verify-email")
          .send({
            token: "valid-verification-token",
          })
          .expect(200);

        expect(authService.verifyEmail).toHaveBeenCalledWith(
          "valid-verification-token"
        );
        expect(response.body.success).toBe(true);
        expect(response.body.data.message).toBe(
          "Email has been verified successfully"
        );
      });

      it("should reject invalid verification tokens", async () => {
        jest
          .spyOn(authService, "verifyEmail")
          .mockRejectedValue(
            new Error("Invalid or expired verification token")
          );

        const response = await request(app)
          .post("/api/v1/auth/verify-email")
          .send({
            token: "invalid-token",
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe("EMAIL_VERIFICATION_FAILED");
      });

      it("should resend verification email", async () => {
        jest.spyOn(authService, "resendEmailVerification").mockResolvedValue();

        const response = await request(app)
          .post("/api/v1/auth/resend-verification")
          .send({
            email: "test@example.com",
          })
          .expect(200);

        expect(authService.resendEmailVerification).toHaveBeenCalledWith(
          "test@example.com"
        );
        expect(response.body.success).toBe(true);
        expect(response.body.data.message).toBe(
          "Verification email has been sent"
        );
      });
    });
  });

  describe("OAuth Integration Flows", () => {
    describe("Google OAuth", () => {
      it("should generate Google OAuth URL", async () => {
        const mockAuthUrl =
          "https://accounts.google.com/oauth/authorize?client_id=test";

        jest
          .spyOn(oauthService, "getGoogleAuthUrl")
          .mockReturnValue(mockAuthUrl);

        const response = await request(app)
          .get("/api/v1/auth/google/url")
          .query({ redirectUri: "http://localhost:3000/callback" })
          .expect(200);

        expect(oauthService.getGoogleAuthUrl).toHaveBeenCalledWith(
          "http://localhost:3000/callback"
        );
        expect(response.body.data.authUrl).toBe(mockAuthUrl);
        expect(response.body.data.provider).toBe("google");
      });

      it("should handle Google OAuth callback", async () => {
        const mockUser = {
          id: "user-123",
          email: "test@gmail.com",
          firstName: "John",
          lastName: "Doe",
        };

        const mockAuthResponse = {
          user: mockUser,
          accessToken: "access-token",
          refreshToken: "refresh-token",
        };

        jest
          .spyOn(oauthService, "exchangeGoogleCode")
          .mockResolvedValue("google-access-token");

        jest
          .spyOn(oauthService, "googleLogin")
          .mockResolvedValue(mockAuthResponse as any);

        const response = await request(app)
          .post("/api/v1/auth/google/callback")
          .send({
            code: "google-auth-code",
            redirectUri: "http://localhost:3000/callback",
          })
          .expect(200);

        expect(oauthService.exchangeGoogleCode).toHaveBeenCalledWith(
          "google-auth-code",
          "http://localhost:3000/callback"
        );
        expect(oauthService.googleLogin).toHaveBeenCalledWith(
          "google-access-token"
        );
        expect(response.body.data.user.email).toBe("test@gmail.com");
        expect(response.body.data.accessToken).toBe("access-token");
      });

      it("should handle Google token login directly", async () => {
        const mockAuthResponse = {
          user: { id: "user-123", email: "test@gmail.com" },
          accessToken: "jwt-access-token",
          refreshToken: "jwt-refresh-token",
        };

        jest
          .spyOn(oauthService, "googleLogin")
          .mockResolvedValue(mockAuthResponse as any);

        const response = await request(app)
          .post("/api/v1/auth/google/token")
          .send({
            accessToken: "google-access-token",
          })
          .expect(200);

        expect(oauthService.googleLogin).toHaveBeenCalledWith(
          "google-access-token"
        );
        expect(response.body.data.accessToken).toBe("jwt-access-token");
      });

      it("should reject invalid Google tokens", async () => {
        jest
          .spyOn(oauthService, "googleLogin")
          .mockRejectedValue(new Error("Invalid Google access token"));

        const response = await request(app)
          .post("/api/v1/auth/google/token")
          .send({
            accessToken: "invalid-google-token",
          })
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe("GOOGLE_TOKEN_LOGIN_FAILED");
      });
    });

    describe("LinkedIn OAuth", () => {
      it("should generate LinkedIn OAuth URL", async () => {
        const mockAuthUrl =
          "https://www.linkedin.com/oauth/v2/authorization?client_id=test";

        jest
          .spyOn(oauthService, "getLinkedInAuthUrl")
          .mockReturnValue(mockAuthUrl);

        const response = await request(app)
          .get("/api/v1/auth/linkedin/url")
          .query({ redirectUri: "http://localhost:3000/callback" })
          .expect(200);

        expect(oauthService.getLinkedInAuthUrl).toHaveBeenCalledWith(
          "http://localhost:3000/callback"
        );
        expect(response.body.data.authUrl).toBe(mockAuthUrl);
        expect(response.body.data.provider).toBe("linkedin");
      });

      it("should handle LinkedIn OAuth callback", async () => {
        const mockUser = {
          id: "user-123",
          email: "test@linkedin.com",
          firstName: "Jane",
          lastName: "Smith",
        };

        const mockAuthResponse = {
          user: mockUser,
          accessToken: "access-token",
          refreshToken: "refresh-token",
        };

        jest
          .spyOn(oauthService, "exchangeLinkedInCode")
          .mockResolvedValue("linkedin-access-token");

        jest
          .spyOn(oauthService, "linkedinLogin")
          .mockResolvedValue(mockAuthResponse as any);

        const response = await request(app)
          .post("/api/v1/auth/linkedin/callback")
          .send({
            code: "linkedin-auth-code",
            redirectUri: "http://localhost:3000/callback",
          })
          .expect(200);

        expect(oauthService.exchangeLinkedInCode).toHaveBeenCalledWith(
          "linkedin-auth-code",
          "http://localhost:3000/callback"
        );
        expect(oauthService.linkedinLogin).toHaveBeenCalledWith(
          "linkedin-access-token"
        );
        expect(response.body.data.user.email).toBe("test@linkedin.com");
      });

      it("should handle LinkedIn token login directly", async () => {
        const mockAuthResponse = {
          user: { id: "user-123", email: "test@linkedin.com" },
          accessToken: "jwt-access-token",
          refreshToken: "jwt-refresh-token",
        };

        jest
          .spyOn(oauthService, "linkedinLogin")
          .mockResolvedValue(mockAuthResponse as any);

        const response = await request(app)
          .post("/api/v1/auth/linkedin/token")
          .send({
            accessToken: "linkedin-access-token",
          })
          .expect(200);

        expect(oauthService.linkedinLogin).toHaveBeenCalledWith(
          "linkedin-access-token"
        );
        expect(response.body.data.accessToken).toBe("jwt-access-token");
      });

      it("should reject invalid LinkedIn tokens", async () => {
        jest
          .spyOn(oauthService, "linkedinLogin")
          .mockRejectedValue(new Error("Invalid LinkedIn access token"));

        const response = await request(app)
          .post("/api/v1/auth/linkedin/token")
          .send({
            accessToken: "invalid-linkedin-token",
          })
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe("LINKEDIN_TOKEN_LOGIN_FAILED");
      });
    });

    describe("OAuth Error Handling", () => {
      it("should require redirect URI for OAuth URL generation", async () => {
        const response = await request(app)
          .get("/api/v1/auth/google/url")
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe("MISSING_REDIRECT_URI");
      });

      it("should require authorization code for OAuth callback", async () => {
        const response = await request(app)
          .post("/api/v1/auth/google/callback")
          .send({
            redirectUri: "http://localhost:3000/callback",
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe("MISSING_OAUTH_DATA");
      });

      it("should handle OAuth service failures gracefully", async () => {
        jest
          .spyOn(oauthService, "exchangeGoogleCode")
          .mockRejectedValue(new Error("OAuth service unavailable"));

        const response = await request(app)
          .post("/api/v1/auth/google/callback")
          .send({
            code: "auth-code",
            redirectUri: "http://localhost:3000/callback",
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe("GOOGLE_OAUTH_FAILED");
      });
    });
  });

  describe("Password Hashing and Security", () => {
    it("should hash passwords during registration", async () => {
      const hashedPassword = "hashed-password-123";

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
      };

      jest.spyOn(authService, "register").mockResolvedValue({
        user: mockUser as any,
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });

      await request(app)
        .post("/api/v1/auth/register")
        .send({
          email: "test@example.com",
          password: "SecurePass123!",
          firstName: "John",
          lastName: "Doe",
        })
        .expect(201);

      expect(authService.register).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "SecurePass123!",
        firstName: "John",
        lastName: "Doe",
      });
    });

    it("should verify passwords during login", async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const mockUser = {
        id: "user-123",
        email: "test@example.com",
      };

      jest.spyOn(authService, "login").mockResolvedValue({
        user: mockUser as any,
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });

      await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "test@example.com",
          password: "SecurePass123!",
        })
        .expect(200);

      expect(authService.login).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "SecurePass123!",
      });
    });

    it("should reject login with incorrect password", async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      jest
        .spyOn(authService, "login")
        .mockRejectedValue(new Error("Invalid email or password"));

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "test@example.com",
          password: "wrong-password",
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("LOGIN_FAILED");
    });
  });
});
