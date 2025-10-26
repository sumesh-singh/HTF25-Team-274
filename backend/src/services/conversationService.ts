import prisma from "@/lib/prisma";
import logger from "@/utils/logger";

interface CreateConversationData {
  participantIds: string[];
  title?: string;
  isGroup?: boolean;
}

interface ConversationWithDetails {
  id: string;
  title: string | null;
  isGroup: boolean;
  createdAt: Date;
  updatedAt: Date;
  participants: Array<{
    id: string;
    userId: string;
    joinedAt: Date;
    lastReadAt: Date | null;
    isActive: boolean;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      avatar: string | null;
      lastActive: Date;
    };
  }>;
  lastMessage?: {
    id: string;
    content: string;
    type: string;
    sentAt: Date;
    sender: {
      id: string;
      firstName: string;
      lastName: string;
    };
  } | null;
  unreadCount?: number;
}

class ConversationService {
  async createConversation(
    data: CreateConversationData,
    creatorId: string
  ): Promise<ConversationWithDetails> {
    try {
      // Ensure creator is included in participants
      const participantIds = [...new Set([...data.participantIds, creatorId])];

      // For direct conversations (2 participants), check if one already exists
      if (participantIds.length === 2 && !data.isGroup) {
        const existingConversation = await this.findDirectConversation(
          participantIds[0],
          participantIds[1]
        );
        if (existingConversation) {
          return existingConversation;
        }
      }

      const conversation = await prisma.conversation.create({
        data: {
          title: data.title,
          isGroup: data.isGroup || participantIds.length > 2,
          participants: {
            create: participantIds.map((userId) => ({
              userId,
              joinedAt: new Date(),
            })),
          },
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                  lastActive: true,
                },
              },
            },
          },
        },
      });

      logger.debug(`Conversation created: ${conversation.id}`);
      return conversation as ConversationWithDetails;
    } catch (error) {
      logger.error("Error creating conversation:", error);
      throw new Error("Failed to create conversation");
    }
  }

  async findDirectConversation(
    userId1: string,
    userId2: string
  ): Promise<ConversationWithDetails | null> {
    try {
      const conversation = await prisma.conversation.findFirst({
        where: {
          isGroup: false,
          participants: {
            every: {
              userId: { in: [userId1, userId2] },
              isActive: true,
            },
          },
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                  lastActive: true,
                },
              },
            },
          },
          messages: {
            take: 1,
            orderBy: { sentAt: "desc" },
            include: {
              sender: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      if (!conversation) return null;

      return {
        ...conversation,
        lastMessage: conversation.messages[0] || null,
      } as ConversationWithDetails;
    } catch (error) {
      logger.error("Error finding direct conversation:", error);
      return null;
    }
  }

  async getUserConversations(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    conversations: ConversationWithDetails[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const skip = (page - 1) * limit;

      const [conversations, total] = await Promise.all([
        prisma.conversation.findMany({
          where: {
            participants: {
              some: {
                userId: userId,
                isActive: true,
              },
            },
          },
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                    lastActive: true,
                  },
                },
              },
            },
            messages: {
              take: 1,
              orderBy: { sentAt: "desc" },
              include: {
                sender: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
          orderBy: { updatedAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.conversation.count({
          where: {
            participants: {
              some: {
                userId: userId,
                isActive: true,
              },
            },
          },
        }),
      ]);

      // Calculate unread count for each conversation
      const conversationsWithUnread = await Promise.all(
        conversations.map(async (conversation) => {
          const userParticipant = conversation.participants.find(
            (p) => p.userId === userId
          );
          const lastReadAt = userParticipant?.lastReadAt;

          const unreadCount = await prisma.message.count({
            where: {
              conversationId: conversation.id,
              senderId: { not: userId },
              sentAt: lastReadAt ? { gt: lastReadAt } : undefined,
            },
          });

          return {
            ...conversation,
            lastMessage: conversation.messages[0] || null,
            unreadCount,
          };
        })
      );

      const hasMore = skip + conversations.length < total;

      return {
        conversations: conversationsWithUnread as ConversationWithDetails[],
        total,
        hasMore,
      };
    } catch (error) {
      logger.error("Error getting user conversations:", error);
      throw new Error("Failed to get conversations");
    }
  }

  async getConversation(
    conversationId: string,
    userId: string
  ): Promise<ConversationWithDetails | null> {
    try {
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          participants: {
            some: {
              userId: userId,
              isActive: true,
            },
          },
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                  lastActive: true,
                },
              },
            },
          },
          messages: {
            take: 1,
            orderBy: { sentAt: "desc" },
            include: {
              sender: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      if (!conversation) return null;

      // Calculate unread count
      const userParticipant = conversation.participants.find(
        (p) => p.userId === userId
      );
      const lastReadAt = userParticipant?.lastReadAt;

      const unreadCount = await prisma.message.count({
        where: {
          conversationId: conversation.id,
          senderId: { not: userId },
          sentAt: lastReadAt ? { gt: lastReadAt } : undefined,
        },
      });

      return {
        ...conversation,
        lastMessage: conversation.messages[0] || null,
        unreadCount,
      } as ConversationWithDetails;
    } catch (error) {
      logger.error("Error getting conversation:", error);
      return null;
    }
  }

  async hasUserAccess(
    conversationId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const participant = await prisma.conversationUser.findFirst({
        where: {
          conversationId,
          userId,
          isActive: true,
        },
      });

      return !!participant;
    } catch (error) {
      logger.error("Error checking user access:", error);
      return false;
    }
  }

  async addParticipant(
    conversationId: string,
    userId: string,
    addedBy: string
  ): Promise<void> {
    try {
      // Verify the person adding has access to the conversation
      const hasAccess = await this.hasUserAccess(conversationId, addedBy);
      if (!hasAccess) {
        throw new Error("Access denied");
      }

      // Check if user is already a participant
      const existingParticipant = await prisma.conversationUser.findFirst({
        where: {
          conversationId,
          userId,
        },
      });

      if (existingParticipant) {
        // Reactivate if inactive
        if (!existingParticipant.isActive) {
          await prisma.conversationUser.update({
            where: { id: existingParticipant.id },
            data: { isActive: true, joinedAt: new Date() },
          });
        }
        return;
      }

      // Add new participant
      await prisma.conversationUser.create({
        data: {
          conversationId,
          userId,
          joinedAt: new Date(),
        },
      });

      // Update conversation to group if more than 2 participants
      const participantCount = await prisma.conversationUser.count({
        where: {
          conversationId,
          isActive: true,
        },
      });

      if (participantCount > 2) {
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { isGroup: true },
        });
      }

      logger.debug(
        `Participant ${userId} added to conversation ${conversationId}`
      );
    } catch (error) {
      logger.error("Error adding participant:", error);
      throw new Error("Failed to add participant");
    }
  }

  async removeParticipant(
    conversationId: string,
    userId: string,
    removedBy: string
  ): Promise<void> {
    try {
      // Verify the person removing has access (either removing themselves or is admin)
      const hasAccess = await this.hasUserAccess(conversationId, removedBy);
      if (!hasAccess || userId !== removedBy) {
        // For now, only allow users to remove themselves
        // In future, add admin/creator permissions
        if (userId !== removedBy) {
          throw new Error("Can only remove yourself from conversations");
        }
      }

      await prisma.conversationUser.updateMany({
        where: {
          conversationId,
          userId,
        },
        data: { isActive: false },
      });

      logger.debug(
        `Participant ${userId} removed from conversation ${conversationId}`
      );
    } catch (error) {
      logger.error("Error removing participant:", error);
      throw new Error("Failed to remove participant");
    }
  }

  async updateConversation(
    conversationId: string,
    userId: string,
    updates: { title?: string }
  ): Promise<ConversationWithDetails> {
    try {
      // Verify user has access
      const hasAccess = await this.hasUserAccess(conversationId, userId);
      if (!hasAccess) {
        throw new Error("Access denied");
      }

      const conversation = await prisma.conversation.update({
        where: { id: conversationId },
        data: updates,
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                  lastActive: true,
                },
              },
            },
          },
        },
      });

      logger.debug(`Conversation updated: ${conversationId}`);
      return conversation as ConversationWithDetails;
    } catch (error) {
      logger.error("Error updating conversation:", error);
      throw new Error("Failed to update conversation");
    }
  }

  async archiveConversation(
    conversationId: string,
    userId: string
  ): Promise<void> {
    try {
      await prisma.conversationUser.updateMany({
        where: {
          conversationId,
          userId,
        },
        data: { isActive: false },
      });

      logger.debug(
        `Conversation ${conversationId} archived for user ${userId}`
      );
    } catch (error) {
      logger.error("Error archiving conversation:", error);
      throw new Error("Failed to archive conversation");
    }
  }
}

export const conversationService = new ConversationService();
