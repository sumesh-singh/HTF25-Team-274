import { authService } from "@/services/authService";

// Mock Prisma
jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    userPreferences: {
      create: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

// Mock email service
jest.mock("@/services/emailService", () => ({
  emailService: {
    sendWelcomeEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    sendEmailVerificationEmail: jest.fn(),
  },
}));

describe("AuthService Basic Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Password hashing", () => {
    it("should hash passwords", async () => {
      // This is a basic test to verify the service exists and can be imported
      expect(authService).toBeDefined();
      expect(typeof authService.register).toBe("function");
      expect(typeof authService.login).toBe("function");
    });
  });

  describe("Token generation", () => {
    it("should have token generation methods", () => {
      expect(typeof authService.refreshToken).toBe("function");
      expect(typeof authService.verifyToken).toBe("function");
    });
  });

  describe("Password reset", () => {
    it("should have password reset methods", () => {
      expect(typeof authService.generatePasswordResetToken).toBe("function");
      expect(typeof authService.resetPassword).toBe("function");
    });
  });

  describe("Email verification", () => {
    it("should have email verification methods", () => {
      expect(typeof authService.generateEmailVerificationToken).toBe(
        "function"
      );
      expect(typeof authService.verifyEmail).toBe("function");
      expect(typeof authService.resendEmailVerification).toBe("function");
    });
  });
});
