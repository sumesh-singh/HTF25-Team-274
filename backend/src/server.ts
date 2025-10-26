import app from "./app";
import config from "@/config";
import logger from "@/utils/logger";
import { connectDatabase, disconnectDatabase } from "@/lib/prisma";
import { scheduler } from "@/utils/scheduler";
import { createServer } from "http";
import { initializeSocket, closeSocket } from "@/lib/socket";

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

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize Socket.io
    await initializeSocket(httpServer);

    // Start server
    const server = httpServer.listen(config.port, () => {
      logger.info(`🚀 SkillSync API server running on port ${config.port}`);
      logger.info(`📝 Environment: ${config.nodeEnv}`);
      logger.info(`🌐 CORS Origin: ${config.corsOrigin}`);
      logger.info(`🔌 Socket.io server initialized`);
    });

    return server;
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

let server: any;

startServer()
  .then((httpServer) => {
    server = httpServer;
  })
  .catch((error) => {
    logger.error("Failed to start server:", error);
    process.exit(1);
  });

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info("HTTP server closed.");

    // Stop scheduled tasks
    scheduler.stop();

    // Close Socket.io connections
    try {
      await closeSocket();
    } catch (error) {
      logger.error("Error closing Socket.io:", error);
    }

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
