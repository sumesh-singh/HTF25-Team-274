import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "@jest/globals";
import matchingService from "@/services/matchingService";
import prisma from "@/lib/prisma";
import { SkillCategory, MatchInteractionType } from "@prisma/client";

describe("Matching Service", () => {
  let testUsers: any[] = [];
  let testSkills: any[] = [];

  beforeAll(async () => {
    // Create test skills
    const skillsData = [
      { name: "JavaScript", category: SkillCategory.TECHNOLOGY },
      { name: "React", category: SkillCategory.TECHNOLOGY },
      { name: "Node.js", category: SkillCategory.TECHNOLOGY },
      { name: "Python", category: SkillCategory.TECHNOLOGY },
      { name: "UI/UX Design", category: SkillCategory.DESIGN },
    ];

    for (const skillData of skillsData) {
      const skill = await prisma.skill.upsert({
        where: { name: skillData.name },
        update: {},
        create: skillData,
      });
      testSkills.push(skill);
    }

    // Create test users
    const usersData = [
      {
        email: "teacher@test.com",
        passwordHash: "hashedpassword",
        firstName: "John",
        lastName: "Teacher",
        isVerified: true,
        rating: 4.8,
        totalSessions: 25,
      },
      {
        email: "learner@test.com",
        passwordHash: "hashedpassword",
        firstName: "Jane",
        lastName: "Learner",
        isVerified: true,
        rating: 4.2,
        totalSessions: 10,
      },
    ];

    for (const userData of usersData) {
      const user = await prisma.user.create({
        data: userData,
      });
      testUsers.push(user);
    }

    // Add skills to users
    // Teacher can teach JavaScript and React, wants to learn Python
    await prisma.userSkill.create({
      data: {
        userId: testUsers[0].id,
        skillId: testSkills[0].id, // JavaScript
        proficiencyLevel: 90,
        canTeach: true,
        wantsToLearn: false,
      },
    });

    await prisma.userSkill.create({
      data: {
        userId: testUsers[0].id,
        skillId: testSkills[1].id, // React
        proficiencyLevel: 85,
        canTeach: true,
        wantsToLearn: false,
      },
    });

    await prisma.userSkill.create({
      data: {
        userId: testUsers[0].id,
        skillId: testSkills[3].id, // Python
        proficiencyLevel: 30,
        canTeach: false,
        wantsToLearn: true,
      },
    });

    // Learner wants to learn JavaScript and React, can teach UI/UX Design
    await prisma.userSkill.create({
      data: {
        userId: testUsers[1].id,
        skillId: testSkills[0].id, // JavaScript
        proficiencyLevel: 20,
        canTeach: false,
        wantsToLearn: true,
      },
    });

    await prisma.userSkill.create({
      data: {
        userId: testUsers[1].id,
        skillId: testSkills[1].id, // React
        proficiencyLevel: 15,
        canTeach: false,
        wantsToLearn: true,
      },
    });

    await prisma.userSkill.create({
      data: {
        userId: testUsers[1].id,
        skillId: testSkills[4].id, // UI/UX Design
        proficiencyLevel: 80,
        canTeach: true,
        wantsToLearn: false,
      },
    });

    // Add availability for both users
    const availabilityData = [
      {
        userId: testUsers[0].id,
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "17:00",
        timezone: "UTC",
      },
      {
        userId: testUsers[0].id,
        dayOfWeek: 3,
        startTime: "09:00",
        endTime: "17:00",
        timezone: "UTC",
      },
      {
        userId: testUsers[1].id,
        dayOfWeek: 1,
        startTime: "10:00",
        endTime: "18:00",
        timezone: "UTC",
      },
      {
        userId: testUsers[1].id,
        dayOfWeek: 3,
        startTime: "14:00",
        endTime: "20:00",
        timezone: "UTC",
      },
    ];

    for (const availability of availabilityData) {
      await prisma.availability.create({ data: availability });
    }
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.userSkill.deleteMany({
      where: { userId: { in: testUsers.map((u) => u.id) } },
    });
    await prisma.availability.deleteMany({
      where: { userId: { in: testUsers.map((u) => u.id) } },
    });
    await prisma.matchInteraction.deleteMany({
      where: { userId: { in: testUsers.map((u) => u.id) } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: testUsers.map((u) => u.id) } },
    });
    await prisma.skill.deleteMany({
      where: { id: { in: testSkills.map((s) => s.id) } },
    });
  });

  describe("calculateMatchScore", () => {
    it("should calculate match score between two users", async () => {
      const currentUser = await matchingService.getUserWithDetails(
        testUsers[1].id
      ); // Learner
      const targetUser = await matchingService.getUserWithDetails(
        testUsers[0].id
      ); // Teacher

      expect(currentUser).toBeTruthy();
      expect(targetUser).toBeTruthy();

      const matchScore = await matchingService.calculateMatchScore(
        currentUser!,
        targetUser!
      );

      expect(matchScore).toBeDefined();
      expect(matchScore.userId).toBe(testUsers[0].id);
      expect(matchScore.score).toBeGreaterThan(0);
      expect(matchScore.breakdown).toBeDefined();
      expect(matchScore.breakdown.skillComplementarity).toBeGreaterThan(0);
      expect(matchScore.explanation).toContain("match");
    });

    it("should have higher skill complementarity for users with matching teach/learn skills", async () => {
      const currentUser = await matchingService.getUserWithDetails(
        testUsers[1].id
      ); // Learner
      const targetUser = await matchingService.getUserWithDetails(
        testUsers[0].id
      ); // Teacher

      const matchScore = await matchingService.calculateMatchScore(
        currentUser!,
        targetUser!
      );

      // Should have high skill complementarity since teacher can teach what learner wants to learn
      expect(matchScore.breakdown.skillComplementarity).toBeGreaterThan(0.5);
    });
  });

  describe("getMatchSuggestions", () => {
    it("should return match suggestions for a user", async () => {
      const suggestions = await matchingService.getMatchSuggestions(
        testUsers[1].id,
        undefined,
        10
      );

      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);

      const suggestion = suggestions[0];
      expect(suggestion.user).toBeDefined();
      expect(suggestion.score).toBeGreaterThan(0);
      expect(suggestion.explanation).toBeDefined();
    });

    it("should filter suggestions based on criteria", async () => {
      const filters = {
        skillCategories: [SkillCategory.TECHNOLOGY],
        minRating: 4.0,
      };

      const suggestions = await matchingService.getMatchSuggestions(
        testUsers[1].id,
        filters,
        10
      );

      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);

      // All suggestions should meet the filter criteria
      suggestions.forEach((suggestion) => {
        expect(suggestion.user.rating).toBeGreaterThanOrEqual(4.0);
      });
    });
  });

  describe("recordMatchInteraction", () => {
    it("should record a favorite interaction", async () => {
      await matchingService.recordMatchInteraction(
        testUsers[1].id,
        testUsers[0].id,
        MatchInteractionType.FAVORITE,
        0.85,
        "Great match!"
      );

      const interaction = await prisma.matchInteraction.findUnique({
        where: {
          userId_targetUserId: {
            userId: testUsers[1].id,
            targetUserId: testUsers[0].id,
          },
        },
      });

      expect(interaction).toBeTruthy();
      expect(interaction!.type).toBe(MatchInteractionType.FAVORITE);
      expect(interaction!.explanation).toBe("Great match!");
    });
  });

  describe("getFavoritedMatches", () => {
    beforeEach(async () => {
      // Ensure we have a favorite interaction
      await matchingService.recordMatchInteraction(
        testUsers[1].id,
        testUsers[0].id,
        MatchInteractionType.FAVORITE,
        0.85,
        "Great match!"
      );
    });

    it("should return favorited matches for a user", async () => {
      const favoriteMatches = await matchingService.getFavoritedMatches(
        testUsers[1].id
      );

      expect(favoriteMatches).toBeDefined();
      expect(Array.isArray(favoriteMatches)).toBe(true);
      expect(favoriteMatches.length).toBeGreaterThan(0);

      const match = favoriteMatches[0];
      expect(match.user.id).toBe(testUsers[0].id);
      expect(match.score).toBeGreaterThan(0);
    });
  });
});
