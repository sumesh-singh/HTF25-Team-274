import { createClient } from "redis";
import config from "@/config";
import logger from "@/utils/logger";

class OnlinePresenceService {
  private redisClient: any;
  private readonly PRESENCE_KEY_PREFIX = "presence:";
  private readonly PRESENCE_EXPIRY = 300; // 5 minutes

  constructor() {
    this.initializeRedis();
  }

  private async initializeRedis() {
    try {
      this.redisClient = createClient({ url: config.redis.url });
      await this.redisClient.connect();
      logger.info("Redis client connected for online presence service");
    } catch (error) {
      logger.error("Failed to connect Redis for presence service:", error);
    }
  }

  async setUserOnline(userId: string): Promise<void> {
    try {
      if (!this.redisClient) {
        await this.initializeRedis();
      }

      const key = `${this.PRESENCE_KEY_PREFIX}${userId}`;
      await this.redisClient.setEx(key, this.PRESENCE_EXPIRY, "online");

      logger.debug(`User ${userId} set as online`);
    } catch (error) {
      logger.error("Error setting user online:", error);
    }
  }

  async setUserOffline(userId: string): Promise<void> {
    try {
      if (!this.redisClient) {
        await this.initializeRedis();
      }

      const key = `${this.PRESENCE_KEY_PREFIX}${userId}`;
      await this.redisClient.del(key);

      logger.debug(`User ${userId} set as offline`);
    } catch (error) {
      logger.error("Error setting user offline:", error);
    }
  }

  async isUserOnline(userId: string): Promise<boolean> {
    try {
      if (!this.redisClient) {
        await this.initializeRedis();
      }

      const key = `${this.PRESENCE_KEY_PREFIX}${userId}`;
      const status = await this.redisClient.get(key);

      return status === "online";
    } catch (error) {
      logger.error("Error checking user online status:", error);
      return false;
    }
  }

  async getOnlineUsers(userIds: string[]): Promise<string[]> {
    try {
      if (!this.redisClient || userIds.length === 0) {
        return [];
      }

      const keys = userIds.map((id) => `${this.PRESENCE_KEY_PREFIX}${id}`);
      const statuses = await this.redisClient.mGet(keys);

      const onlineUsers: string[] = [];
      statuses.forEach((status: string | null, index: number) => {
        if (status === "online") {
          onlineUsers.push(userIds[index]);
        }
      });

      return onlineUsers;
    } catch (error) {
      logger.error("Error getting online users:", error);
      return [];
    }
  }

  async updateUserActivity(userId: string): Promise<void> {
    try {
      if (!this.redisClient) {
        await this.initializeRedis();
      }

      const key = `${this.PRESENCE_KEY_PREFIX}${userId}`;
      const exists = await this.redisClient.exists(key);

      if (exists) {
        // Extend the expiry time
        await this.redisClient.expire(key, this.PRESENCE_EXPIRY);
      }
    } catch (error) {
      logger.error("Error updating user activity:", error);
    }
  }

  async cleanup(): Promise<void> {
    try {
      if (this.redisClient) {
        await this.redisClient.quit();
        logger.info("Online presence service Redis client disconnected");
      }
    } catch (error) {
      logger.error("Error cleaning up presence service:", error);
    }
  }
}

export const onlinePresenceService = new OnlinePresenceService();
