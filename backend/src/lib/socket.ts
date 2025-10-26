import { Server as SocketIOServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import { Server as HTTPServer } from "http";
import config from "@/config";
import logger from "@/utils/logger";
import { authenticateSocket } from "../middleware/socketAuth";
import { handleConnection } from "../services/socketService";

let io: SocketIOServer;
let redisClient: any;
let redisSubClient: any;

export const initializeSocket = async (
  server: HTTPServer
): Promise<SocketIOServer> => {
  try {
    // Create Redis clients for Socket.io adapter
    redisClient = createClient({ url: config.redis.url });
    redisSubClient = redisClient.duplicate();

    await Promise.all([redisClient.connect(), redisSubClient.connect()]);

    logger.info("Redis clients connected for Socket.io");

    // Initialize Socket.io server
    io = new SocketIOServer(server, {
      cors: {
        origin: config.corsOrigin,
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket", "polling"],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // Set up Redis adapter for scaling
    io.adapter(createAdapter(redisClient, redisSubClient));

    // Authentication middleware
    io.use(authenticateSocket);

    // Handle connections
    io.on("connection", handleConnection);

    logger.info("Socket.io server initialized with Redis adapter");
    return io;
  } catch (error) {
    logger.error("Failed to initialize Socket.io server:", error);
    throw error;
  }
};

export const getSocketIO = (): SocketIOServer => {
  if (!io) {
    throw new Error("Socket.io server not initialized");
  }
  return io;
};

export const closeSocket = async (): Promise<void> => {
  try {
    if (io) {
      io.close();
    }

    if (redisClient) {
      await redisClient.quit();
    }

    if (redisSubClient) {
      await redisSubClient.quit();
    }

    logger.info("Socket.io server and Redis clients closed");
  } catch (error) {
    logger.error("Error closing Socket.io server:", error);
  }
};
