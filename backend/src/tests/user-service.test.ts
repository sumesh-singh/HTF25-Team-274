import { UserService } from "@/services/userService";
import prisma from "@/lib/prisma";

describe("UserService", () => {
  let userService: UserService;
  let testUserId: string;

  beforeAll(async () => {
    userService = new UserService();

    // Create a test user
    const testUser = await prisma.user.create({
      data: {
        email: "userservice.test@example.com",
        passwordHash: "hashedpassword",
        firstName: "UserService",
        lastName: "Test",
        bio: "Test bio",
        location: "Test Location",
        timezone: "UTC",
      },
    });
    testUserId = testUser.id;
  });

  afterAll(async () => {
    // Clean up
    if (testUserId) {
      await prisma.user
        .delete({
          where: { id: testUserId },
        })
        .catch(() => {
          // User might already be deleted
        });
    }
    await prisma.$disconnect();
  });

  describe("getUserProfile", () => {
    it("should get user profile by ID", async () => {
      const user = await userService.getUserProfile(testUserId);

      expect(user).toBeDefined();
      expect(user?.id).toBe(testUserId);
      expect(user?.email).toBe("userservice.test@example.com");
      expect(user?.firstName).toBe("UserService");
      expect(user?.lastName).toBe("Test");
      expect(user?.bio).toBe("Test bio");
      expect(user?.location).toBe("Test Location");
    });

    it("should return null for non-existent user", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000";
      const user = await userService.getUserProfile(fakeId);

      expect(user).toBeNull();
    });
  });

  describe("updateProfile", () => {
    it("should update user profile", async () => {
      const updateData = {
        bio: "Updated bio",
        location: "Updated Location",
        timezone: "America/New_York",
      };

      const updatedUser = await userService.updateProfile(
        testUserId,
        updateData
      );

      expect(updatedUser.bio).toBe(updateData.bio);
      expect(updatedUser.location).toBe(updateData.location);
      expect(updatedUser.timezone).toBe(updateData.timezone);
    });
  });

  describe("calculateProfileCompleteness", () => {
    it("should calculate profile completeness score", async () => {
      const completeness = await userService.calculateProfileCompleteness(
        testUserId
      );

      expect(completeness).toBeDefined();
      expect(typeof completeness.score).toBe("number");
      expect(completeness.score).toBeGreaterThanOrEqual(0);
      expect(completeness.score).toBeLessThanOrEqual(100);
      expect(Array.isArray(completeness.missingFields)).toBe(true);
      expect(Array.isArray(completeness.suggestions)).toBe(true);
      expect(typeof completeness.totalFields).toBe("number");
      expect(typeof completeness.completedFields).toBe("number");
    });
  });

  describe("getUserPreferences", () => {
    it("should get user preferences (create default if not exist)", async () => {
      const preferences = await userService.getUserPreferences(testUserId);

      expect(preferences).toBeDefined();
      expect(typeof preferences.emailNotifications).toBe("boolean");
      expect(typeof preferences.pushNotifications).toBe("boolean");
      expect(typeof preferences.sessionReminders).toBe("boolean");
      expect(typeof preferences.matchSuggestions).toBe("boolean");
      expect(typeof preferences.messageNotifications).toBe("boolean");
      expect(typeof preferences.creditNotifications).toBe("boolean");
      expect(typeof preferences.systemNotifications).toBe("boolean");
    });
  });

  describe("updateUserPreferences", () => {
    it("should update user preferences", async () => {
      const preferencesData = {
        emailNotifications: false,
        pushNotifications: true,
        sessionReminders: false,
        matchSuggestions: true,
      };

      const updatedPreferences = await userService.updateUserPreferences(
        testUserId,
        preferencesData
      );

      expect(updatedPreferences.emailNotifications).toBe(false);
      expect(updatedPreferences.pushNotifications).toBe(true);
      expect(updatedPreferences.sessionReminders).toBe(false);
      expect(updatedPreferences.matchSuggestions).toBe(true);
    });
  });

  describe("searchUsers", () => {
    it("should search users with basic filters", async () => {
      const filters = {
        page: 1,
        limit: 10,
      };

      const result = await userService.searchUsers(filters);

      expect(result).toBeDefined();
      expect(Array.isArray(result.users)).toBe(true);
      expect(result.pagination).toBeDefined();
      expect(typeof result.pagination.total).toBe("number");
      expect(typeof result.pagination.page).toBe("number");
      expect(typeof result.pagination.limit).toBe("number");
      expect(typeof result.pagination.totalPages).toBe("number");
      expect(typeof result.pagination.hasNext).toBe("boolean");
      expect(typeof result.pagination.hasPrev).toBe("boolean");
    });

    it("should search users with text search", async () => {
      const filters = {
        search: "UserService",
        page: 1,
        limit: 10,
      };

      const result = await userService.searchUsers(filters);

      expect(result).toBeDefined();
      expect(Array.isArray(result.users)).toBe(true);
      // Should find our test user
      const foundUser = result.users.find((u) => u.id === testUserId);
      expect(foundUser).toBeDefined();
    });
  });
});
