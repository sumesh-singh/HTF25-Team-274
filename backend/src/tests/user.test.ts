import request from "supertest";
import app from "@/app";
import prisma from "@/lib/prisma";
import { authService } from "@/services/authService";

describe("User Profile Management", () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Create a test user and get auth token
    const testUser = {
      email: "testuser@example.com",
      password: "TestPassword123!",
      firstName: "Test",
      lastName: "User",
    };

    try {
      const authResult = await authService.register(testUser);
      authToken = authResult.accessToken;
      userId = authResult.user.id;
    } catch (error) {
      // User might already exist, try to login
      const loginResult = await authService.login({
        email: testUser.email,
        password: testUser.password,
      });
      authToken = loginResult.accessToken;
      userId = loginResult.user.id;
    }
  });

  afterAll(async () => {
    // Clean up test data
    if (userId) {
      await prisma.user
        .delete({
          where: { id: userId },
        })
        .catch(() => {
          // User might already be deleted
        });
    }
    await prisma.$disconnect();
  });

  describe("GET /api/v1/users/profile", () => {
    it("should get current user profile", async () => {
      const response = await request(app)
        .get("/api/v1/users/profile")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe("testuser@example.com");
      expect(response.body.data.user.firstName).toBe("Test");
      expect(response.body.data.user.lastName).toBe("User");
    });

    it("should return 401 without auth token", async () => {
      const response = await request(app)
        .get("/api/v1/users/profile")
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("AUTH_TOKEN_MISSING");
    });
  });

  describe("PUT /api/v1/users/profile", () => {
    it("should update user profile", async () => {
      const updateData = {
        bio: "Updated bio for testing",
        location: "Test City",
        timezone: "America/New_York",
      };

      const response = await request(app)
        .put("/api/v1/users/profile")
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.bio).toBe(updateData.bio);
      expect(response.body.data.user.location).toBe(updateData.location);
      expect(response.body.data.user.timezone).toBe(updateData.timezone);
    });

    it("should validate profile update data", async () => {
      const invalidData = {
        firstName: "A", // Too short
        bio: "A".repeat(501), // Too long
      };

      const response = await request(app)
        .put("/api/v1/users/profile")
        .set("Authorization", `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("GET /api/v1/users/preferences", () => {
    it("should get user preferences", async () => {
      const response = await request(app)
        .get("/api/v1/users/preferences")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.preferences).toBeDefined();
      expect(typeof response.body.data.preferences.emailNotifications).toBe(
        "boolean"
      );
      expect(typeof response.body.data.preferences.pushNotifications).toBe(
        "boolean"
      );
    });
  });

  describe("PUT /api/v1/users/preferences", () => {
    it("should update user preferences", async () => {
      const preferencesData = {
        emailNotifications: false,
        pushNotifications: true,
        sessionReminders: false,
      };

      const response = await request(app)
        .put("/api/v1/users/preferences")
        .set("Authorization", `Bearer ${authToken}`)
        .send(preferencesData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.preferences.emailNotifications).toBe(false);
      expect(response.body.data.preferences.pushNotifications).toBe(true);
      expect(response.body.data.preferences.sessionReminders).toBe(false);
    });
  });

  describe("GET /api/v1/users/profile/completeness", () => {
    it("should calculate profile completeness", async () => {
      const response = await request(app)
        .get("/api/v1/users/profile/completeness")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.completeness).toBeDefined();
      expect(typeof response.body.data.completeness.score).toBe("number");
      expect(Array.isArray(response.body.data.completeness.missingFields)).toBe(
        true
      );
      expect(Array.isArray(response.body.data.completeness.suggestions)).toBe(
        true
      );
    });
  });

  describe("GET /api/v1/users/search", () => {
    it("should search users", async () => {
      const response = await request(app)
        .get("/api/v1/users/search")
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta.pagination).toBeDefined();
      expect(typeof response.body.meta.pagination.total).toBe("number");
    });

    it("should search users with filters", async () => {
      const response = await request(app)
        .get("/api/v1/users/search")
        .query({
          search: "Test",
          minRating: 0,
          page: 1,
          limit: 5,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe("GET /api/v1/users/:id", () => {
    it("should get user by ID", async () => {
      const response = await request(app)
        .get(`/api/v1/users/${userId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.id).toBe(userId);
      // Credit balance should not be exposed to others
      expect(response.body.data.user.creditBalance).toBe(0);
    });

    it("should return 404 for non-existent user", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000";
      const response = await request(app)
        .get(`/api/v1/users/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("USER_NOT_FOUND");
    });
  });
});
