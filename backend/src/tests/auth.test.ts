import request from "supertest";
import app from "@/app";
import { authService } from "@/services/authService";
import { mockPrisma } from "./setup";

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
});
