import jwt from "jsonwebtoken";
import { Socket } from "socket.io";
import config from "@/config";
import logger from "@/utils/logger";
import prisma from "@/lib/prisma";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

export const authenticateSocket = async (
  socket: AuthenticatedSocket,
  next: (err?: Error) => void
) => {
  try {
    const token =
      socket.handshake.auth.token ||
      socket.handshake.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return next(new Error("Authentication token required"));
    }

    // Verify JWT token
    const decoded = jwt.verify(token, config.jwt.secret) as { userId: string };

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        isVerified: true,
        lastActive: true,
      },
    });

    if (!user) {
      return next(new Error("User not found"));
    }

    // Update last active timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActive: new Date() },
    });

    // Attach user info to socket
    socket.userId = user.id;
    socket.user = user;

    logger.debug(`Socket authenticated for user: ${user.email}`);
    next();
  } catch (error) {
    logger.error("Socket authentication error:", error);
    next(new Error("Authentication failed"));
  }
};
