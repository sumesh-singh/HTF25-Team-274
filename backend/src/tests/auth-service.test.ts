import { authService } from "@/services/authService";
import { emailService } from "@/services/emailService";
import { mockPrisma } from "./setup";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import config from "@/config";

// Mock external dependencies
jest.mock("@/services/emailService");
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");
jest.mock("crypto");

describe("AuthService Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("User Registration", () => {
    const validRegistrationData = {
      email: "test@example.com",
      password: "SecurePass123!",
      firstName: "John",
      lastName: "Doe",
    };

    it("should register a new user successfully", async () => {
      const hashedPassword = "hashed-password-123";
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

      // Mock dependencies
      mockPrisma.user.findUnique.mockResolvedValue(null); // User doesn't exist
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockPrisma.user.create.mockResolvedValue(mockUser);
      mockPrisma.userPreferences.create.mockResolvedValue({});
      mockPrisma.refreshToken.create.mockResolvedValue({});
      mockPrisma.notification.create.mockResolvedValue({});
      (jwt.sign as jest.Mock)
        .mockReturnValueOnce("access-token")
        .mockReturnValueOnce("refresh-token");

      const result = await authService.register(validRegistrationData);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
      });
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
      expect(result.user.email).toBe("test@example.com");
      expect(result.accessToken).toBe("access-token");
      expect(result.refreshToken).toBe("refresh-token");
    });

    it("should throw error if user already exists", async () => {
      const existingUser = { id: "existing-user", email: "test@example.com" };
      mockPrisma.user.findUnique.mockResolvedValue(existingUser);

      await expect(authService.register(validRegistrationData)).rejects.toThrow(
        "User with this email already exists"
      );

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
      });
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it("should create user preferences and welcome notification", async () => {
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

    it("should attempt to send email verification", async () => {
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

      // Mock email verification token generation
      jest
        .spyOn(authService, "generateEmailVerificationToken")
        .mockResolvedValue("verification-token");

      await authService.register(validRegistrationData);

      expect(authService.generateEmailVerificationToken).toHaveBeenCalledWith(
        "test@example.com"
      );
    });
  });

  describe("User Login", () => {
    const validLoginData = {
      email: "test@example.com",
      password: "SecurePass123!",
    };

    it("should login user with valid credentials", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        passwordHash: "hashed-password",
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

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrisma.user.update.mockResolvedValue(mockUser);
      mockPrisma.refreshToken.create.mockResolvedValue({});
      (jwt.sign as jest.Mock)
        .mockReturnValueOnce("access-token")
        .mockReturnValueOnce("refresh-token");

      const result = await authService.login(validLoginData);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
        select: expect.any(Object),
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "SecurePass123!",
        "hashed-password"
      );
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: { lastActive: expect.any(Date) },
      });
      expect(result.user.email).toBe("test@example.com");
      expect(result.accessToken).toBe("access-token");
      expect(result.refreshToken).toBe("refresh-token");
    });

    it("should throw error for non-existent user", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.login(validLoginData)).rejects.toThrow(
        "Invalid email or password"
      );

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
        select: expect.any(Object),
      });
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it("should throw error for invalid password", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        passwordHash: "hashed-password",
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(validLoginData)).rejects.toThrow(
        "Invalid email or password"
      );

      expect(bcrypt.compare).toHaveBeenCalledWith(
        "SecurePass123!",
        "hashed-password"
      );
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
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

  describe("Token Management", () => {
    describe("Token Generation", () => {
      it("should generate access and refresh tokens with correct payload", async () => {
        const userId = "user-123";
        const email = "test@example.com";

        (jwt.sign as jest.Mock)
          .mockReturnValueOnce("access-token")
          .mockReturnValueOnce("refresh-token");

        // We need to test this through a method that uses token generation
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
    });

    describe("Token Refresh", () => {
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
        expect(mockPrisma.refreshToken.update).toHaveBeenCalledWith({
          where: { id: "token-id" },
          data: {
            token: "new-refresh-token",
            expiresAt: expect.any(Date),
          },
        });
        expect(result.accessToken).toBe("new-access-token");
        expect(result.refreshToken).toBe("new-refresh-token");
      });

      it("should throw error for expired refresh token", async () => {
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

      it("should throw error for non-existent refresh token", async () => {
        (jwt.verify as jest.Mock).mockReturnValue({ userId: "user-123" });
        mockPrisma.refreshToken.findUnique.mockResolvedValue(null);

        await expect(
          authService.refreshToken("non-existent-token")
        ).rejects.toThrow("Invalid or expired refresh token");
      });
    });

    describe("Token Verification", () => {
      it("should verify valid JWT token and return user", async () => {
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

      it("should return null for invalid JWT token", async () => {
        (jwt.verify as jest.Mock).mockImplementation(() => {
          throw new Error("Invalid token");
        });

        const result = await authService.verifyToken("invalid-token");

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
  });

  describe("Password Reset", () => {
    describe("Generate Reset Token", () => {
      it("should generate password reset token and send email", async () => {
        const mockUser = {
          id: "user-123",
          email: "test@example.com",
        };

        const resetToken = "reset-token-123";
        const hashedToken = "hashed-reset-token";

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        (crypto.randomBytes as jest.Mock).mockReturnValue({
          toString: jest.fn().mockReturnValue(resetToken),
        });
        (crypto.createHash as jest.Mock).mockReturnValue({
          update: jest.fn().mockReturnThis(),
          digest: jest.fn().mockReturnValue(hashedToken),
        });
        mockPrisma.user.update.mockResolvedValue({});
        (emailService.sendPasswordResetEmail as jest.Mock).mockResolvedValue();

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

    describe("Reset Password", () => {
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

      it("should throw error for invalid or expired token", async () => {
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
    });
  });

  describe("Email Verification", () => {
    describe("Generate Verification Token", () => {
      it("should generate email verification token and send email", async () => {
        const mockUser = {
          id: "user-123",
          email: "test@example.com",
          isVerified: false,
        };

        const verificationToken = "verification-token-123";
        const hashedToken = "hashed-verification-token";

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        (crypto.randomBytes as jest.Mock).mockReturnValue({
          toString: jest.fn().mockReturnValue(verificationToken),
        });
        (crypto.createHash as jest.Mock).mockReturnValue({
          update: jest.fn().mockReturnThis(),
          digest: jest.fn().mockReturnValue(hashedToken),
        });
        mockPrisma.user.update.mockResolvedValue({});
        (
          emailService.sendEmailVerificationEmail as jest.Mock
        ).mockResolvedValue();

        const result = await authService.generateEmailVerificationToken(
          "test@example.com"
        );

        expect(mockPrisma.user.update).toHaveBeenCalledWith({
          where: { id: "user-123" },
          data: {
            emailVerificationToken: hashedToken,
            emailVerificationExpires: expect.any(Date),
          },
        });
        expect(emailService.sendEmailVerificationEmail).toHaveBeenCalledWith(
          "test@example.com",
          verificationToken
        );
        expect(result).toBe(verificationToken);
      });

      it("should throw error if email is already verified", async () => {
        const mockUser = {
          id: "user-123",
          email: "test@example.com",
          isVerified: true,
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);

        await expect(
          authService.generateEmailVerificationToken("test@example.com")
        ).rejects.toThrow("Email is already verified");

        expect(emailService.sendEmailVerificationEmail).not.toHaveBeenCalled();
      });
    });

    describe("Verify Email", () => {
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

      it("should throw error for invalid or expired verification token", async () => {
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

  describe("Logout", () => {
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

  describe("Token Cleanup", () => {
    it("should clean up expired refresh tokens", async () => {
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 5 });

      await authService.cleanupExpiredTokens();

      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: { lt: expect.any(Date) },
        },
      });
    });
  });
});
