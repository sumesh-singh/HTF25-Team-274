import app from "./app";
import config from "@/config";
import logger from "@/utils/logger";
import { connectDatabase, disconnectDatabase } from "@/lib/prisma";
import { scheduler } from "@/utils/scheduler";

// Handle uncaught exceptions
process.on("uncaughtException", (error: Error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Initialize database connection and start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Start scheduled tasks
    scheduler.start();

    // Start server
    const server = app.listen(config.port, () => {
      logger.info(`🚀 SkillSync API server running on port ${config.port}`);
      logger.info(`📝 Environment: ${config.nodeEnv}`);
      logger.info(`🌐 CORS Origin: ${config.corsOrigin}`);
    });

    return server;
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

const server = await startServer();

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info("HTTP server closed.");

    // Stop scheduled tasks
    scheduler.stop();

    // Close database connections
    try {
      await disconnectDatabase();
    } catch (error) {
      logger.error("Error disconnecting database:", error);
    }

    logger.info("Graceful shutdown completed.");
    process.exit(0);
  });

  // Force close after 30 seconds
  setTimeout(() => {
    logger.error(
      "Could not close connections in time, forcefully shutting down"
    );
    process.exit(1);
  }, 30000);
};

// Listen for termination signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

export default server;
