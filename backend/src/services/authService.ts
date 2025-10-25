import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import config from "@/config";
import logger from "@/utils/logger";
import { emailService } from "@/services/emailService";
import { User, AuthResponse, LoginRequest, RegisterRequest } from "@/types";

export class AuthService {
  // Generate JWT tokens
  private generateTokens(userId: string, email: string) {
    const accessToken = jwt.sign({ userId, email }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    } as SignOptions);

    const refreshToken = jwt.sign(
      { userId, email, type: "refresh" },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn } as SignOptions
    );

    return { accessToken, refreshToken };
  }

  // Hash password
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  // Verify password
  private async verifyPassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // Register new user
  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
      });

      if (existingUser) {
        throw new Error("User with this email already exists");
      }

      // Hash password
      const passwordHash = await this.hashPassword(data.password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: data.email.toLowerCase(),
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          creditBalance: 50, // Starter credits
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          bio: true,
          location: true,
          timezone: true,
          isVerified: true,
          rating: true,
          totalSessions: true,
          creditBalance: true,
          joinedAt: true,
          lastActive: true,
        },
      });

      // Create default user preferences
      await prisma.userPreferences.create({
        data: {
          userId: user.id,
          emailNotifications: true,
          pushNotifications: true,
          sessionReminders: true,
          matchSuggestions: true,
          messageNotifications: true,
          creditNotifications: true,
          systemNotifications: true,
        },
      });

      // Generate tokens
      const { accessToken, refreshToken } = this.generateTokens(
        user.id,
        user.email
      );

      // Store refresh token
      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      // Create welcome notification
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: "SYSTEM_UPDATE",
          title: "Welcome to SkillSync!",
          message:
            "Your account has been created successfully. You have received 50 starter credits.",
          data: { creditAmount: 50 },
        },
      });

      // Send email verification (don't block registration if email fails)
      try {
        await this.generateEmailVerificationToken(user.email);
      } catch (emailError) {
        logger.error("Failed to send verification email:", emailError);
      }

      logger.info(`New user registered: ${user.email}`);

      return {
        user: user as User,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      logger.error("Registration error:", error);
      throw error;
    }
  }

  // Login user
  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          firstName: true,
          lastName: true,
          avatar: true,
          bio: true,
          location: true,
          timezone: true,
          isVerified: true,
          rating: true,
          totalSessions: true,
          creditBalance: true,
          joinedAt: true,
          lastActive: true,
        },
      });

      if (!user) {
        throw new Error("Invalid email or password");
      }

      // Verify password
      const isValidPassword = await this.verifyPassword(
        data.password,
        user.passwordHash
      );
      if (!isValidPassword) {
        throw new Error("Invalid email or password");
      }

      // Update last active
      await prisma.user.update({
        where: { id: user.id },
        data: { lastActive: new Date() },
      });

      // Generate tokens
      const { accessToken, refreshToken } = this.generateTokens(
        user.id,
        user.email
      );

      // Store refresh token
      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      // Remove password hash from response
      const { passwordHash, ...userWithoutPassword } = user;

      logger.info(`User logged in: ${user.email}`);

      return {
        user: userWithoutPassword as User,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      logger.error("Login error:", error);
      throw error;
    }
  }

  // Refresh access token
  async refreshToken(
    refreshToken: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as any;

      // Check if refresh token exists in database
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new Error("Invalid or expired refresh token");
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } =
        this.generateTokens(storedToken.user.id, storedToken.user.email);

      // Update refresh token in database
      await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: {
          token: newRefreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      logger.error("Token refresh error:", error);
      throw error;
    }
  }

  // Logout user
  async logout(refreshToken: string): Promise<void> {
    try {
      // Remove refresh token from database
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });

      logger.info("User logged out successfully");
    } catch (error) {
      logger.error("Logout error:", error);
      throw error;
    }
  }

  // Generate password reset token
  async generatePasswordResetToken(email: string): Promise<string> {
    try {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      // Store hashed token in user record
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: hashedToken,
          passwordResetExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        },
      });

      // Send password reset email
      try {
        await emailService.sendPasswordResetEmail(email, resetToken);
      } catch (emailError) {
        logger.error("Failed to send password reset email:", emailError);
        throw new Error("Failed to send password reset email");
      }

      logger.info(`Password reset token generated for user: ${email}`);

      return resetToken;
    } catch (error) {
      logger.error("Password reset token generation error:", error);
      throw error;
    }
  }

  // Reset password
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      // Find user with valid reset token
      const user = await prisma.user.findFirst({
        where: {
          passwordResetToken: hashedToken,
          passwordResetExpires: { gt: new Date() },
        },
      });

      if (!user) {
        throw new Error("Invalid or expired reset token");
      }

      // Hash new password
      const passwordHash = await this.hashPassword(newPassword);

      // Update user password and clear reset token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          passwordResetToken: null,
          passwordResetExpires: null,
        },
      });

      // Invalidate all refresh tokens for this user
      await prisma.refreshToken.deleteMany({
        where: { userId: user.id },
      });

      logger.info(`Password reset successful for user: ${user.email}`);
    } catch (error) {
      logger.error("Password reset error:", error);
      throw error;
    }
  }

  // Verify JWT token
  async verifyToken(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as any;

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          bio: true,
          location: true,
          timezone: true,
          isVerified: true,
          rating: true,
          totalSessions: true,
          creditBalance: true,
          joinedAt: true,
          lastActive: true,
        },
      });

      return user as User | null;
    } catch (error) {
      logger.error("Token verification error:", error);
      return null;
    }
  }

  // Generate email verification token
  async generateEmailVerificationToken(email: string): Promise<string> {
    try {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        throw new Error("User not found");
      }

      if (user.isVerified) {
        throw new Error("Email is already verified");
      }

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto
        .createHash("sha256")
        .update(verificationToken)
        .digest("hex");

      // Store hashed token in user record
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerificationToken: hashedToken,
          emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      });

      // Send verification email
      try {
        await emailService.sendEmailVerificationEmail(email, verificationToken);
      } catch (emailError) {
        logger.error("Failed to send email verification email:", emailError);
        throw new Error("Failed to send verification email");
      }

      logger.info(`Email verification token generated for user: ${email}`);

      return verificationToken;
    } catch (error) {
      logger.error("Email verification token generation error:", error);
      throw error;
    }
  }

  // Verify email with token
  async verifyEmail(token: string): Promise<void> {
    try {
      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      // Find user with valid verification token
      const user = await prisma.user.findFirst({
        where: {
          emailVerificationToken: hashedToken,
          emailVerificationExpires: { gt: new Date() },
        },
      });

      if (!user) {
        throw new Error("Invalid or expired verification token");
      }

      // Update user as verified and clear verification token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isVerified: true,
          emailVerificationToken: null,
          emailVerificationExpires: null,
        },
      });

      logger.info(`Email verified successfully for user: ${user.email}`);
    } catch (error) {
      logger.error("Email verification error:", error);
      throw error;
    }
  }

  // Resend email verification
  async resendEmailVerification(email: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        throw new Error("User not found");
      }

      if (user.isVerified) {
        throw new Error("Email is already verified");
      }

      await this.generateEmailVerificationToken(email);
    } catch (error) {
      logger.error("Resend email verification error:", error);
      throw error;
    }
  }

  // Clean up expired refresh tokens
  async cleanupExpiredTokens(): Promise<void> {
    try {
      const result = await prisma.refreshToken.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      });

      logger.info(`Cleaned up ${result.count} expired refresh tokens`);
    } catch (error) {
      logger.error("Token cleanup error:", error);
    }
  }
}

export const authService = new AuthService();
