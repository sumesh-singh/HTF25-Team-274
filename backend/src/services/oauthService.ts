import axios from "axios";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";
import config from "@/config";
import logger from "@/utils/logger";
import { User, AuthResponse } from "@/types";

export interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

export interface LinkedInUserInfo {
  id: string;
  firstName: {
    localized: {
      [key: string]: string;
    };
  };
  lastName: {
    localized: {
      [key: string]: string;
    };
  };
  profilePicture?: {
    "displayImage~": {
      elements: Array<{
        identifiers: Array<{
          identifier: string;
        }>;
      }>;
    };
  };
}

export interface LinkedInEmailInfo {
  elements: Array<{
    "handle~": {
      emailAddress: string;
    };
  }>;
}

export class OAuthService {
  // Generate JWT tokens (same as AuthService)
  private generateTokens(userId: string, email: string) {
    const accessToken = jwt.sign({ userId, email }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    const refreshToken = jwt.sign(
      { userId, email, type: "refresh" },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );

    return { accessToken, refreshToken };
  }

  // Google OAuth login
  async googleLogin(accessToken: string): Promise<AuthResponse> {
    try {
      // Get user info from Google
      const response = await axios.get(
        `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`
      );

      const googleUser: GoogleUserInfo = response.data;

      if (!googleUser.verified_email) {
        throw new Error("Google email is not verified");
      }

      // Check if user exists
      let user = await prisma.user.findUnique({
        where: { email: googleUser.email.toLowerCase() },
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

      // Create user if doesn't exist
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: googleUser.email.toLowerCase(),
            passwordHash: "", // OAuth users don't have passwords
            firstName: googleUser.given_name,
            lastName: googleUser.family_name,
            avatar: googleUser.picture,
            isVerified: true, // Google users are pre-verified
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

        // Create welcome notification
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: "SYSTEM_UPDATE",
            title: "Welcome to SkillSync!",
            message:
              "Your account has been created successfully via Google. You have received 50 starter credits.",
            data: { creditAmount: 50, provider: "google" },
          },
        });

        logger.info(`New user created via Google OAuth: ${user.email}`);
      } else {
        // Update last active and avatar if changed
        await prisma.user.update({
          where: { id: user.id },
          data: {
            lastActive: new Date(),
            avatar: googleUser.picture, // Update avatar in case it changed
          },
        });

        logger.info(`User logged in via Google OAuth: ${user.email}`);
      }

      // Generate tokens
      const { accessToken: jwtAccessToken, refreshToken } = this.generateTokens(
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

      return {
        user: user as User,
        accessToken: jwtAccessToken,
        refreshToken,
      };
    } catch (error: any) {
      logger.error("Google OAuth error:", error);

      if (error.response?.status === 401) {
        throw new Error("Invalid Google access token");
      }

      throw new Error("Google authentication failed");
    }
  }

  // LinkedIn OAuth login
  async linkedinLogin(accessToken: string): Promise<AuthResponse> {
    try {
      // Get user profile from LinkedIn
      const profileResponse = await axios.get(
        "https://api.linkedin.com/v2/people/~:(id,firstName,lastName,profilePicture(displayImage~:playableStreams))",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const linkedinUser: LinkedInUserInfo = profileResponse.data;

      // Get user email from LinkedIn
      const emailResponse = await axios.get(
        "https://api.linkedin.com/v2/emailAddresses?q=members&projection=(elements*(handle~))",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const emailData: LinkedInEmailInfo = emailResponse.data;
      const email = emailData.elements[0]?.["handle~"]?.emailAddress;

      if (!email) {
        throw new Error("Unable to get email from LinkedIn");
      }

      // Extract names
      const firstName =
        Object.values(linkedinUser.firstName.localized)[0] || "";
      const lastName = Object.values(linkedinUser.lastName.localized)[0] || "";

      // Extract profile picture
      let avatar = "";
      if (
        linkedinUser.profilePicture?.["displayImage~"]?.elements?.length > 0
      ) {
        avatar =
          linkedinUser.profilePicture["displayImage~"].elements[0]
            ?.identifiers?.[0]?.identifier || "";
      }

      // Check if user exists
      let user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
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

      // Create user if doesn't exist
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: email.toLowerCase(),
            passwordHash: "", // OAuth users don't have passwords
            firstName,
            lastName,
            avatar,
            isVerified: true, // LinkedIn users are pre-verified
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

        // Create welcome notification
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: "SYSTEM_UPDATE",
            title: "Welcome to SkillSync!",
            message:
              "Your account has been created successfully via LinkedIn. You have received 50 starter credits.",
            data: { creditAmount: 50, provider: "linkedin" },
          },
        });

        logger.info(`New user created via LinkedIn OAuth: ${user.email}`);
      } else {
        // Update last active and avatar if changed
        await prisma.user.update({
          where: { id: user.id },
          data: {
            lastActive: new Date(),
            avatar: avatar || user.avatar, // Update avatar only if we got one
          },
        });

        logger.info(`User logged in via LinkedIn OAuth: ${user.email}`);
      }

      // Generate tokens
      const { accessToken: jwtAccessToken, refreshToken } = this.generateTokens(
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

      return {
        user: user as User,
        accessToken: jwtAccessToken,
        refreshToken,
      };
    } catch (error: any) {
      logger.error("LinkedIn OAuth error:", error);

      if (error.response?.status === 401) {
        throw new Error("Invalid LinkedIn access token");
      }

      throw new Error("LinkedIn authentication failed");
    }
  }

  // Get Google OAuth URL
  getGoogleAuthUrl(redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: config.oauth.google.clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent",
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  // Get LinkedIn OAuth URL
  getLinkedInAuthUrl(redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: config.oauth.linkedin.clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "r_liteprofile r_emailaddress",
      state: Math.random().toString(36).substring(2, 15), // CSRF protection
    });

    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  }

  // Exchange Google authorization code for access token
  async exchangeGoogleCode(code: string, redirectUri: string): Promise<string> {
    try {
      const response = await axios.post("https://oauth2.googleapis.com/token", {
        client_id: config.oauth.google.clientId,
        client_secret: config.oauth.google.clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      });

      return response.data.access_token;
    } catch (error: any) {
      logger.error("Google token exchange error:", error);
      throw new Error("Failed to exchange Google authorization code");
    }
  }

  // Exchange LinkedIn authorization code for access token
  async exchangeLinkedInCode(
    code: string,
    redirectUri: string
  ): Promise<string> {
    try {
      const response = await axios.post(
        "https://www.linkedin.com/oauth/v2/accessToken",
        new URLSearchParams({
          client_id: config.oauth.linkedin.clientId,
          client_secret: config.oauth.linkedin.clientSecret,
          code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      return response.data.access_token;
    } catch (error: any) {
      logger.error("LinkedIn token exchange error:", error);
      throw new Error("Failed to exchange LinkedIn authorization code");
    }
  }
}

export const oauthService = new OAuthService();
