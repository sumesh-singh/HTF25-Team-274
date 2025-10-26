import { Server } from "http";
import { AddressInfo } from "net";
import { io as Client, Socket as ClientSocket } from "socket.io-client";
import { initializeSocket, closeSocket } from "@/lib/socket";
import app from "@/app";
import { connectDatabase, disconnectDatabase } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import config from "@/config";

describe("Socket.io Real-time Communication", () => {
  let httpServer: Server;
  let clientSocket: ClientSocket;
  let serverAddress: string;
  let testUserId: string;
  let authToken: string;

  beforeAll(async () => {
    // Connect to test database
    await connectDatabase();

    // Create HTTP server
    httpServer = new Server(app);

    // Initialize Socket.io
    await initializeSocket(httpServer);

    // Start server on random port
    await new Promise<void>((resolve) => {
      httpServer.listen(() => {
        const port = (httpServer.address() as AddressInfo).port;
        serverAddress = `http://localhost:${port}`;
        resolve();
      });
    });

    // Create test user and auth token
    testUserId = "test-user-id-123";
    authToken = jwt.sign({ userId: testUserId }, config.jwt.secret);
  });

  afterAll(async () => {
    if (clientSocket) {
      clientSocket.disconnect();
    }
    await closeSocket();
    httpServer.close();
    await disconnectDatabase();
  });

  beforeEach(() => {
    // Create client socket with auth token
    clientSocket = Client(serverAddress, {
      auth: {
        token: authToken,
      },
    });
  });

  afterEach(() => {
    if (clientSocket) {
      clientSocket.disconnect();
    }
  });

  test("should connect with valid authentication", (done) => {
    clientSocket.on("connect", () => {
      expect(clientSocket.connected).toBe(true);
      done();
    });

    clientSocket.on("connect_error", (error) => {
      done(error);
    });
  });

  test("should reject connection without authentication", (done) => {
    const unauthenticatedClient = Client(serverAddress);

    unauthenticatedClient.on("connect_error", (error) => {
      expect(error.message).toContain("Authentication");
      unauthenticatedClient.disconnect();
      done();
    });

    unauthenticatedClient.on("connect", () => {
      unauthenticatedClient.disconnect();
      done(new Error("Should not connect without authentication"));
    });
  });

  test("should handle typing indicators", (done) => {
    const conversationId = "test-conversation-123";

    clientSocket.on("connect", () => {
      // Listen for typing indicator
      clientSocket.on("typing_indicator", (data) => {
        expect(data.conversationId).toBe(conversationId);
        expect(data.isTyping).toBe(true);
        done();
      });

      // Emit typing start
      clientSocket.emit("typing_start", conversationId);
    });
  });

  test("should handle user online/offline status", (done) => {
    clientSocket.on("connect", () => {
      // Listen for user online event
      clientSocket.on("user_online", (data) => {
        expect(data.userId).toBeDefined();
        done();
      });

      // Simulate another user connecting (this would normally come from another client)
      setTimeout(() => {
        clientSocket.emit("user_online", { userId: "another-user-123" });
      }, 100);
    });
  });

  test("should handle conversation room joining", (done) => {
    const conversationId = "test-conversation-456";

    clientSocket.on("connect", () => {
      // Listen for successful join
      clientSocket.on("user_joined_conversation", (data) => {
        expect(data.conversationId).toBe(conversationId);
        done();
      });

      // Join conversation
      clientSocket.emit("join_conversation", conversationId);
    });
  });

  test("should handle message read receipts", (done) => {
    const conversationId = "test-conversation-789";

    clientSocket.on("connect", () => {
      // Listen for read receipt
      clientSocket.on("messages_read", (data) => {
        expect(data.conversationId).toBe(conversationId);
        expect(data.readAt).toBeDefined();
        done();
      });

      // Mark messages as read
      clientSocket.emit("mark_messages_read", conversationId);
    });
  });
});
