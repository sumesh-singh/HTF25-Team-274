import request from "supertest";
import app from "@/app";
import { authService } from "@/services/authService";
import { oauthService } from "@/services/oauthService";
import { emailService } from "@/services/emailService";
import { mockPrisma } from "./setup";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import config from "@/config";

// Mock config
jest.mock("@/config", () => ({
  default: {
    jwt: {
      secret: "test-secret",
      refreshSecret: "test-refresh-secret",
      expiresIn: "15m",
      refreshExpiresIn: "7d",
    },
    email: {
      sendgridApiKey: "test-key",
      fromEmail: "test@example.com",
    },
    oauth: {
      google: {
        clientId: "test-google-client-id",
        clientSecret: "test-google-client-secret",
      },
      linkedin: {
        clientId: "test-linkedin-client-id",
        clientSecret: "test-linkedin-client-secret",
      },
    },
  },
}));

// Mock external services
jest.mock("@/services/emailService", () => ({
  emailService: {
    sendPasswordResetEmail: jest.fn(),
    sendEmailVerificationEmail: jest.fn(),
    sendWelcomeEmail: jest.fn(),
  },
}));
jest.mock("@/services/oauthService");
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");
jest.mock("crypto");

describe("Authentication Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("User Registration and Login Flows", () => {
    const validRegistrationData = {
      email: "test@example.com",
      password: "SecurePass123!",
      firstName: "John",
      lastName: "Doe",
    };

    const validLoginData = {
      email: "test@example.com",
      password: "SecurePass123!",
    };

    describe("Registration Flow", () => {
      it("should register a new user successfully", async () => {
        const mockUser = {
          id: "user-123",
          email: "test@example.com",
          firstName: "John",
          lastName: "Doe",
          avatar: null,
          bio: null,
          location: null,
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
        expect(authService.register).toHaveBeenCalledWith(
          validRegistrationData
        );
      });

      it("should validate email format during registration", async () => {
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

      it("should validate password strength during registration", async () => {
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

      it("should hash password during registration", async () => {
        const hashedPassword = "hashed-password-123";

        mockPrisma.user.findUnique.mockResolvedValue(null);
        (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
        mockPrisma.user.create.mockResolvedValue({
          id: "user-123",
          email: "test@example.com",
          firstName: "John",
          lastName: "Doe",
        });
        mockPrisma.userPreferences.create.mockResolvedValue({});
        mockPrisma.refreshToken.create.mockResolvedValue({});
        mockPrisma.notification.create.mockResolvedValue({});
        (jwt.sign as jest.Mock)
          .mockReturnValueOnce("access-token")
          .mockReturnValueOnce("refresh-token");

        await authService.register(validRegistrationData);

        expect(bcrypt.hash).toHaveBeenCalledWith("SecurePass123!", 12);
        expect(mockPrisma.user.create).toHaveBeenCalledWith({
          data: {
            email: "test@example.com",
            passwordHash: hashedPassword,
            firstName: "John",
            lastName: "Doe",
            creditBalance: 50,
          },
          select: expect.any(Object),
        });
      });

      it("should create user preferences and welcome notification", async () => {
        const mockUser = { id: "user-123", email: "test@example.com" };

        mockPrisma.user.findUnique.mockResolvedValue(null);
        (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-password");
        mockPrisma.user.create.mockResolvedValue(mockUser);
        mockPrisma.userPreferences.create.mockResolvedValue({});
        mockPrisma.refreshToken.create.mockResolvedValue({});
        mockPrisma.notification.create.mockResolvedValue({});
        (jwt.sign as jest.Mock)
          .mockReturnValueOnce("access-token")
          .mockReturnValueOnce("refresh-token");

        await authService.register(validRegistrationData);

        expect(mockPrisma.userPreferences.create).toHaveBeenCalledWith({
          data: {
            userId: "user-123",
            emailNotifications: true,
            pushNotifications: true,
            sessionReminders: true,
            matchSuggestions: true,
            messageNotifications: true,
            creditNotifications: true,
            systemNotifications: true,
          },
        });

        expect(mockPrisma.notification.create).toHaveBeenCalledWith({
          data: {
            userId: "user-123",
            type: "SYSTEM_UPDATE",
            title: "Welcome to SkillSync!",
            message:
              "Your account has been created successfully. You have received 50 starter credits.",
            data: { creditAmount: 50 },
          },
        });
      });
    });

    describe("Login Flow", () => {
      it("should login user with valid credentials", async () => {
        const mockUser = {
          id: "user-123",
          email: "test@example.com",
          firstName: "John",
          lastName: "Doe",
          avatar: null,
          bio: null,
          location: null,
          timezone: "UTC",
          isVerified: true,
          rating: 4.5,
          totalSessions: 10,
          creditBalance: 75,
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
        expect(authService.login).toHaveBeenCalledWith(validLoginData);
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

      it("should verify password during login", async () => {
        const mockUser = {
          id: "user-123",
          email: "test@example.com",
          passwordHash: "hashed-password",
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        mockPrisma.user.update.mockResolvedValue(mockUser);
        mockPrisma.refreshToken.create.mockResolvedValue({});
        (jwt.sign as jest.Mock)
          .mockReturnValueOnce("access-token")
          .mockReturnValueOnce("refresh-token");

        await authService.login(validLoginData);

        expect(bcrypt.compare).toHaveBeenCalledWith(
          "SecurePass123!",
          "hashed-password"
        );
        expect(mockPrisma.user.update).toHaveBeenCalledWith({
          where: { id: "user-123" },
          data: { lastActive: expect.any(Date) },
        });
      });

      it("should normalize email to lowercase", async () => {
        const mockUser = {
          id: "user-123",
          email: "test@example.com",
          passwordHash: "hashed-password",
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        mockPrisma.user.update.mockResolvedValue(mockUser);
        mockPrisma.refreshToken.create.mockResolvedValue({});
        (jwt.sign as jest.Mock)
          .mockReturnValueOnce("access-token")
          .mockReturnValueOnce("refresh-token");

        await authService.login({
          email: "TEST@EXAMPLE.COM",
          password: "SecurePass123!",
        });

        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
          where: { email: "test@example.com" },
          select: expect.any(Object),
        });
      });
    });
  });

  describe("JWT Token Generation and Verification", () => {
    describe("Token Generation", () => {
      it("should generate access and refresh tokens with correct payload", async () => {
        const userId = "user-123";
        const email = "test@example.com";

        (jwt.sign as jest.Mock)
          .mockReturnValueOnce("access-token")
          .mockReturnValueOnce("refresh-token");

        const mockUser = {
          id: userId,
          email: email,
          passwordHash: "hashed-password",
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        mockPrisma.user.update.mockResolvedValue(mockUser);
        mockPrisma.refreshToken.create.mockResolvedValue({});

        await authService.login({ email, password: "password" });

        expect(jwt.sign).toHaveBeenCalledWith(
          { userId, email },
          config.jwt.secret,
          { expiresIn: config.jwt.expiresIn }
        );
        expect(jwt.sign).toHaveBeenCalledWith(
          { userId, email, type: "refresh" },
          config.jwt.refreshSecret,
          { expiresIn: config.jwt.refreshExpiresIn }
        );
      });

      it("should generate tokens with correct expiration times", async () => {
        const mockUser = {
          id: "user-123",
          email: "test@example.com",
          passwordHash: "hashed-password",
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        mockPrisma.user.update.mockResolvedValue(mockUser);
        mockPrisma.refreshToken.create.mockResolvedValue({});
        (jwt.sign as jest.Mock)
          .mockReturnValueOnce("access-token")
          .mockReturnValueOnce("refresh-token");

        await authService.login({
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
        mockPrisma.user.findUnique.mockResolvedValue(mockUser);

        const result = await authService.verifyToken("valid-jwt-token");

        expect(jwt.verify).toHaveBeenCalledWith(
          "valid-jwt-token",
          config.jwt.secret
        );
        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
          where: { id: "user-123" },
          select: expect.any(Object),
        });
        expect(result).toEqual(mockUser);
      });

      it("should return null for invalid JWT tokens", async () => {
        (jwt.verify as jest.Mock).mockImplementation(() => {
          throw new Error("Invalid token");
        });

        const result = await authService.verifyToken("invalid-token");

        expect(result).toBeNull();
      });

      it("should return null for expired JWT tokens", async () => {
        (jwt.verify as jest.Mock).mockImplementation(() => {
          const error = new Error("Token expired");
          error.name = "TokenExpiredError";
          throw error;
        });

        const result = await authService.verifyToken("expired-token");

        expect(result).toBeNull();
      });

      it("should return null if user not found", async () => {
        const mockDecodedToken = { userId: "non-existent-user" };

        (jwt.verify as jest.Mock).mockReturnValue(mockDecodedToken);
        mockPrisma.user.findUnique.mockResolvedValue(null);

        const result = await authService.verifyToken("valid-token");

        expect(result).toBeNull();
      });
    });

    describe("Refresh Token Flow", () => {
      it("should refresh tokens with valid refresh token", async () => {
        const mockDecodedToken = {
          userId: "user-123",
          email: "test@example.com",
          type: "refresh",
        };

        const mockStoredToken = {
          id: "token-id",
          token: "old-refresh-token",
          expiresAt: new Date(Date.now() + 86400000), // 1 day from now
          user: {
            id: "user-123",
            email: "test@example.com",
          },
        };

        (jwt.verify as jest.Mock).mockReturnValue(mockDecodedToken);
        mockPrisma.refreshToken.findUnique.mockResolvedValue(mockStoredToken);
        mockPrisma.refreshToken.update.mockResolvedValue({});
        (jwt.sign as jest.Mock)
          .mockReturnValueOnce("new-access-token")
          .mockReturnValueOnce("new-refresh-token");

        const result = await authService.refreshToken("old-refresh-token");

        expect(jwt.verify).toHaveBeenCalledWith(
          "old-refresh-token",
          config.jwt.refreshSecret
        );
        expect(mockPrisma.refreshToken.findUnique).toHaveBeenCalledWith({
          where: { token: "old-refresh-token" },
          include: { user: true },
        });
        expect(result.accessToken).toBe("new-access-token");
        expect(result.refreshToken).toBe("new-refresh-token");
      });

      it("should reject expired refresh tokens", async () => {
        const mockStoredToken = {
          id: "token-id",
          token: "expired-refresh-token",
          expiresAt: new Date(Date.now() - 86400000), // 1 day ago
          user: { id: "user-123", email: "test@example.com" },
        };

        (jwt.verify as jest.Mock).mockReturnValue({ userId: "user-123" });
        mockPrisma.refreshToken.findUnique.mockResolvedValue(mockStoredToken);

        await expect(
          authService.refreshToken("expired-refresh-token")
        ).rejects.toThrow("Invalid or expired refresh token");

        expect(mockPrisma.refreshToken.update).not.toHaveBeenCalled();
      });

      it("should reject non-existent refresh tokens", async () => {
        (jwt.verify as jest.Mock).mockReturnValue({ userId: "user-123" });
        mockPrisma.refreshToken.findUnique.mockResolvedValue(null);

        await expect(
          authService.refreshToken("non-existent-token")
        ).rejects.toThrow("Invalid or expired refresh token");
      });
    });
  });

  describe("Password Reset Functionality", () => {
    describe("Password Reset Request", () => {
      it("should generate password reset token and send email", async () => {
        const resetToken = "reset-token-123";
        const hashedToken = "hashed-reset-token";

        const mockUser = {
          id: "user-123",
          email: "test@example.com",
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        (crypto.randomBytes as jest.Mock).mockReturnValue({
          toString: jest.fn().mockReturnValue(resetToken),
        });
        (crypto.createHash as jest.Mock).mockReturnValue({
          update: jest.fn().mockReturnThis(),
          digest: jest.fn().mockReturnValue(hashedToken),
        });
        mockPrisma.user.update.mockResolvedValue({});
        (emailService.sendPasswordResetEmail as jest.Mock).mockResolvedValue(
          undefined
        );

        const result = await authService.generatePasswordResetToken(
          "test@example.com"
        );

        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
          where: { email: "test@example.com" },
        });
        expect(crypto.randomBytes).toHaveBeenCalledWith(32);
        expect(mockPrisma.user.update).toHaveBeenCalledWith({
          where: { id: "user-123" },
          data: {
            passwordResetToken: hashedToken,
            passwordResetExpires: expect.any(Date),
          },
        });
        expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
          "test@example.com",
          resetToken
        );
        expect(result).toBe(resetToken);
      });

      it("should throw error for non-existent user", async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);

        await expect(
          authService.generatePasswordResetToken("nonexistent@example.com")
        ).rejects.toThrow("User not found");

        expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
      });

      it("should handle email sending failure", async () => {
        const mockUser = { id: "user-123", email: "test@example.com" };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        (crypto.randomBytes as jest.Mock).mockReturnValue({
          toString: jest.fn().mockReturnValue("reset-token"),
        });
        (crypto.createHash as jest.Mock).mockReturnValue({
          update: jest.fn().mockReturnThis(),
          digest: jest.fn().mockReturnValue("hashed-token"),
        });
        mockPrisma.user.update.mockResolvedValue({});
        (emailService.sendPasswordResetEmail as jest.Mock).mockRejectedValue(
          new Error("Email service unavailable")
        );

        await expect(
          authService.generatePasswordResetToken("test@example.com")
        ).rejects.toThrow("Failed to send password reset email");
      });
    });

    describe("Password Reset Completion", () => {
      it("should reset password with valid token", async () => {
        const resetToken = "reset-token-123";
        const hashedToken = "hashed-reset-token";
        const newPassword = "NewSecurePass123!";
        const hashedPassword = "hashed-new-password";

        const mockUser = {
          id: "user-123",
          email: "test@example.com",
          passwordResetToken: hashedToken,
          passwordResetExpires: new Date(Date.now() + 600000), // 10 minutes from now
        };

        (crypto.createHash as jest.Mock).mockReturnValue({
          update: jest.fn().mockReturnThis(),
          digest: jest.fn().mockReturnValue(hashedToken),
        });
        mockPrisma.user.findFirst.mockResolvedValue(mockUser);
        (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
        mockPrisma.user.update.mockResolvedValue({});
        mockPrisma.refreshToken.deleteMany.mockResolvedValue({});

        await authService.resetPassword(resetToken, newPassword);

        expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
          where: {
            passwordResetToken: hashedToken,
            passwordResetExpires: { gt: expect.any(Date) },
          },
        });
        expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 12);
        expect(mockPrisma.user.update).toHaveBeenCalledWith({
          where: { id: "user-123" },
          data: {
            passwordHash: hashedPassword,
            passwordResetToken: null,
            passwordResetExpires: null,
          },
        });
        expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
          where: { userId: "user-123" },
        });
      });

      it("should reject invalid or expired reset tokens", async () => {
        const hashedToken = "hashed-invalid-token";

        (crypto.createHash as jest.Mock).mockReturnValue({
          update: jest.fn().mockReturnThis(),
          digest: jest.fn().mockReturnValue(hashedToken),
        });
        mockPrisma.user.findFirst.mockResolvedValue(null);

        await expect(
          authService.resetPassword("invalid-token", "NewPassword123!")
        ).rejects.toThrow("Invalid or expired reset token");

        expect(mockPrisma.user.update).not.toHaveBeenCalled();
        expect(mockPrisma.refreshToken.deleteMany).not.toHaveBeenCalled();
      });

      it("should invalidate all refresh tokens after password reset", async () => {
        const mockUser = {
          id: "user-123",
          email: "test@example.com",
          passwordResetToken: "hashed-token",
          passwordResetExpires: new Date(Date.now() + 600000),
        };

        (crypto.createHash as jest.Mock).mockReturnValue({
          update: jest.fn().mockReturnThis(),
          digest: jest.fn().mockReturnValue("hashed-token"),
        });
        mockPrisma.user.findFirst.mockResolvedValue(mockUser);
        (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-password");
        mockPrisma.user.update.mockResolvedValue({});
        mockPrisma.refreshToken.deleteMany.mockResolvedValue({});

        await authService.resetPassword("valid-token", "NewPassword123!");

        expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
          where: { userId: "user-123" },
        });
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

        mockPrisma.user.findUnique.mockResolvedValue(null);
        (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-password");
        mockPrisma.user.create.mockResolvedValue(mockUser);
        mockPrisma.userPreferences.create.mockResolvedValue({});
        mockPrisma.refreshToken.create.mockResolvedValue({});
        mockPrisma.notification.create.mockResolvedValue({});
        (jwt.sign as jest.Mock)
          .mockReturnValueOnce("access-token")
          .mockReturnValueOnce("refresh-token");

        jest
          .spyOn(authService, "generateEmailVerificationToken")
          .mockResolvedValue("verification-token");

        await authService.register({
          email: "test@example.com",
          password: "SecurePass123!",
          firstName: "John",
          lastName: "Doe",
        });

        expect(authService.generateEmailVerificationToken).toHaveBeenCalledWith(
          "test@example.com"
        );
      });

      it("should verify email with valid token", async () => {
        const verificationToken = "verification-token-123";
        const hashedToken = "hashed-verification-token";

        const mockUser = {
          id: "user-123",
          email: "test@example.com",
          emailVerificationToken: hashedToken,
          emailVerificationExpires: new Date(Date.now() + 86400000), // 24 hours from now
        };

        (crypto.createHash as jest.Mock).mockReturnValue({
          update: jest.fn().mockReturnThis(),
          digest: jest.fn().mockReturnValue(hashedToken),
        });
        mockPrisma.user.findFirst.mockResolvedValue(mockUser);
        mockPrisma.user.update.mockResolvedValue({});

        await authService.verifyEmail(verificationToken);

        expect(mockPrisma.user.update).toHaveBeenCalledWith({
          where: { id: "user-123" },
          data: {
            isVerified: true,
            emailVerificationToken: null,
            emailVerificationExpires: null,
          },
        });
      });

      it("should reject invalid verification tokens", async () => {
        const hashedToken = "hashed-invalid-token";

        (crypto.createHash as jest.Mock).mockReturnValue({
          update: jest.fn().mockReturnThis(),
          digest: jest.fn().mockReturnValue(hashedToken),
        });
        mockPrisma.user.findFirst.mockResolvedValue(null);

        await expect(authService.verifyEmail("invalid-token")).rejects.toThrow(
          "Invalid or expired verification token"
        );

        expect(mockPrisma.user.update).not.toHaveBeenCalled();
      });
    });
  });

  describe("OAuth Integration Flows", () => {
    describe("Google OAuth", () => {
      it("should handle Google OAuth login successfully", async () => {
        const mockGoogleUser = {
          id: "google-123",
          email: "test@gmail.com",
          verified_email: true,
          name: "John Doe",
          given_name: "John",
          family_name: "Doe",
          picture: "https://example.com/avatar.jpg",
          locale: "en",
        };

        const mockAuthResponse = {
          user: {
            id: "user-123",
            email: "test@gmail.com",
            firstName: "John",
            lastName: "Doe",
          },
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
        expect(response.body.data.refreshToken).toBe("jwt-refresh-token");
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
        const mockAuthResponse = {
          user: { id: "user-123", email: "test@gmail.com" },
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
      });
    });

    describe("LinkedIn OAuth", () => {
      it("should handle LinkedIn OAuth login successfully", async () => {
        const mockAuthResponse = {
          user: {
            id: "user-123",
            email: "test@linkedin.com",
            firstName: "Jane",
            lastName: "Smith",
          },
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
        const mockAuthResponse = {
          user: { id: "user-123", email: "test@linkedin.com" },
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

  describe("Authentication Middleware and Protected Routes", () => {
    it("should return current user when authenticated", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
      };

      jest.spyOn(authService, "verifyToken").mockResolvedValue(mockUser as any);

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

  describe("Token Cleanup and Maintenance", () => {
    it("should clean up expired refresh tokens", async () => {
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 5 });

      await authService.cleanupExpiredTokens();

      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: { lt: expect.any(Date) },
        },
      });
    });

    it("should logout user by removing refresh token", async () => {
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      await authService.logout("refresh-token-123");

      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { token: "refresh-token-123" },
      });
    });

    it("should handle logout gracefully even if token doesn't exist", async () => {
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 0 });

      await expect(
        authService.logout("non-existent-token")
      ).resolves.not.toThrow();

      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { token: "non-existent-token" },
      });
    });
  });
});
