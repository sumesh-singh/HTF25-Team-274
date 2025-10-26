import { PrismaClient } from "@prisma/client";
import logger from "../utils/logger";
import Redis from "ioredis";

const prisma = new PrismaClient();

export class SystemHealthService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
  }

  async checkDatabaseHealth(): Promise<{
    isHealthy: boolean;
    responseTime: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      // Simple query to check database connectivity
      await prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;

      return {
        isHealthy: true,
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.error("Database health check failed:", error);

      return {
        isHealthy: false,
        responseTime,
        error:
          error instanceof Error ? error.message : "Unknown database error",
      };
    }
  }

  async checkRedisHealth(): Promise<{
    isHealthy: boolean;
    responseTime: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      // Simple ping to check Redis connectivity
      await this.redis.ping();
      const responseTime = Date.now() - startTime;

      return {
        isHealthy: true,
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.error("Redis health check failed:", error);

      return {
        isHealthy: false,
        responseTime,
        error: error instanceof Error ? error.message : "Unknown Redis error",
      };
    }
  }

  async getSystemMetrics(): Promise<{
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
    activeConnections: number;
    errorRate: number;
    averageResponseTime: number;
  }> {
    try {
      // Get system uptime
      const uptime = process.uptime();

      // Get memory usage
      const memoryUsage = process.memoryUsage();

      // Get CPU usage
      const cpuUsage = process.cpuUsage();

      // Get active connections (this would be from your socket.io instance)
      // For now, we'll use a placeholder
      const activeConnections = await this.getActiveSocketConnections();

      // Get error rate from logs or monitoring system
      // This is a simplified implementation
      const errorRate = await this.calculateErrorRate();

      // Get average response time
      const averageResponseTime = await this.calculateAverageResponseTime();

      return {
        uptime,
        memoryUsage,
        cpuUsage,
        activeConnections,
        errorRate,
        averageResponseTime,
      };
    } catch (error) {
      logger.error("Error getting system metrics:", error);
      throw new Error("Failed to retrieve system metrics");
    }
  }

  private async getActiveSocketConnections(): Promise<number> {
    try {
      // This would integrate with your socket.io instance
      // For now, return a placeholder value
      const connectionCount = await this.redis.get("socket:active_connections");
      return connectionCount ? parseInt(connectionCount, 10) : 0;
    } catch (error) {
      logger.error("Error getting active connections:", error);
      return 0;
    }
  }

  private async calculateErrorRate(): Promise<number> {
    try {
      // This would calculate error rate from your logging system
      // For now, return a placeholder value
      const errorCount = await this.redis.get("metrics:error_count:24h");
      const totalRequests = await this.redis.get("metrics:total_requests:24h");

      if (!errorCount || !totalRequests) return 0;

      const errors = parseInt(errorCount, 10);
      const total = parseInt(totalRequests, 10);

      return total > 0 ? (errors / total) * 100 : 0;
    } catch (error) {
      logger.error("Error calculating error rate:", error);
      return 0;
    }
  }

  private async calculateAverageResponseTime(): Promise<number> {
    try {
      // This would calculate average response time from your monitoring
      // For now, return a placeholder value
      const avgResponseTime = await this.redis.get(
        "metrics:avg_response_time:24h"
      );
      return avgResponseTime ? parseFloat(avgResponseTime) : 150;
    } catch (error) {
      logger.error("Error calculating average response time:", error);
      return 150;
    }
  }

  async getDetailedHealthCheck(): Promise<{
    overall: "healthy" | "degraded" | "unhealthy";
    services: {
      database: {
        status: "healthy" | "unhealthy";
        responseTime: number;
        error?: string;
      };
      redis: {
        status: "healthy" | "unhealthy";
        responseTime: number;
        error?: string;
      };
      system: {
        status: "healthy" | "degraded" | "unhealthy";
        uptime: number;
        memoryUsage: number; // percentage
        cpuUsage: number; // percentage
      };
    };
    timestamp: Date;
  }> {
    try {
      const [dbHealth, redisHealth, systemMetrics] = await Promise.all([
        this.checkDatabaseHealth(),
        this.checkRedisHealth(),
        this.getSystemMetrics(),
      ]);

      // Calculate memory usage percentage
      const memoryUsagePercent =
        (systemMetrics.memoryUsage.heapUsed /
          systemMetrics.memoryUsage.heapTotal) *
        100;

      // Calculate CPU usage percentage (simplified)
      const cpuUsagePercent =
        (systemMetrics.cpuUsage.user + systemMetrics.cpuUsage.system) / 1000000; // Convert microseconds to percentage

      // Determine system status
      let systemStatus: "healthy" | "degraded" | "unhealthy" = "healthy";
      if (memoryUsagePercent > 90 || cpuUsagePercent > 90) {
        systemStatus = "unhealthy";
      } else if (memoryUsagePercent > 70 || cpuUsagePercent > 70) {
        systemStatus = "degraded";
      }

      // Determine overall status
      let overallStatus: "healthy" | "degraded" | "unhealthy" = "healthy";
      if (
        !dbHealth.isHealthy ||
        !redisHealth.isHealthy ||
        systemStatus === "unhealthy"
      ) {
        overallStatus = "unhealthy";
      } else if (
        systemStatus === "degraded" ||
        dbHealth.responseTime > 1000 ||
        redisHealth.responseTime > 100
      ) {
        overallStatus = "degraded";
      }

      return {
        overall: overallStatus,
        services: {
          database: {
            status: dbHealth.isHealthy ? "healthy" : "unhealthy",
            responseTime: dbHealth.responseTime,
            error: dbHealth.error,
          },
          redis: {
            status: redisHealth.isHealthy ? "healthy" : "unhealthy",
            responseTime: redisHealth.responseTime,
            error: redisHealth.error,
          },
          system: {
            status: systemStatus,
            uptime: systemMetrics.uptime,
            memoryUsage: Math.round(memoryUsagePercent * 100) / 100,
            cpuUsage: Math.round(cpuUsagePercent * 100) / 100,
          },
        },
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error("Error performing detailed health check:", error);

      return {
        overall: "unhealthy",
        services: {
          database: {
            status: "unhealthy",
            responseTime: 0,
            error: "Health check failed",
          },
          redis: {
            status: "unhealthy",
            responseTime: 0,
            error: "Health check failed",
          },
          system: {
            status: "unhealthy",
            uptime: process.uptime(),
            memoryUsage: 0,
            cpuUsage: 0,
          },
        },
        timestamp: new Date(),
      };
    }
  }

  // Method to record metrics (would be called from middleware)
  async recordMetric(
    type: "request" | "error",
    responseTime?: number
  ): Promise<void> {
    try {
      const today = new Date().toISOString().split("T")[0];
      const key = `metrics:${type}_count:${today}`;

      await this.redis.incr(key);
      await this.redis.expire(key, 86400 * 7); // Keep for 7 days

      if (type === "request" && responseTime) {
        // Update average response time
        const avgKey = `metrics:avg_response_time:${today}`;
        const currentAvg = await this.redis.get(avgKey);
        const currentCount = await this.redis.get(
          `metrics:request_count:${today}`
        );

        if (currentAvg && currentCount) {
          const count = parseInt(currentCount, 10);
          const avg = parseFloat(currentAvg);
          const newAvg = (avg * (count - 1) + responseTime) / count;
          await this.redis.set(avgKey, newAvg.toString());
        } else {
          await this.redis.set(avgKey, responseTime.toString());
        }

        await this.redis.expire(avgKey, 86400 * 7);
      }
    } catch (error) {
      logger.error("Error recording metric:", error);
    }
  }
}

export const systemHealthService = new SystemHealthService();
