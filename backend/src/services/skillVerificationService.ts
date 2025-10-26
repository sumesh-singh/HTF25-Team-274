import {
  SkillVerification,
  SkillVerificationStatus,
  UserSkill,
} from "@prisma/client";
import prisma from "@/lib/prisma";

export interface SkillVerificationWithDetails extends SkillVerification {
  requester: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  verifier: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  skill: {
    id: string;
    name: string;
    category: string;
  };
}

export interface VerificationRequest {
  userSkillId: string;
  verifierId: string;
  message?: string;
}

export interface VerificationResponse {
  verificationId: string;
  status: SkillVerificationStatus;
  feedback?: string;
}

export class SkillVerificationService {
  /**
   * Request skill verification from another user
   */
  async requestVerification(data: {
    userSkillId: string;
    requesterId: string;
    verifierId: string;
    message?: string;
  }): Promise<SkillVerificationWithDetails> {
    // Get the user skill to verify it belongs to the requester
    const userSkill = await prisma.userSkill.findFirst({
      where: {
        id: data.userSkillId,
        userId: data.requesterId,
      },
      include: {
        skill: true,
      },
    });

    if (!userSkill) {
      throw new Error("User skill not found or does not belong to requester");
    }

    // Check if requester and verifier are the same
    if (data.requesterId === data.verifierId) {
      throw new Error("Cannot request verification from yourself");
    }

    // Check if verification request already exists
    const existingVerification = await prisma.skillVerification.findUnique({
      where: {
        requesterId_verifierId_skillId: {
          requesterId: data.requesterId,
          verifierId: data.verifierId,
          skillId: userSkill.skillId,
        },
      },
    });

    if (existingVerification) {
      throw new Error(
        "Verification request already exists for this skill and verifier"
      );
    }

    // Create verification request
    const verification = await prisma.skillVerification.create({
      data: {
        requesterId: data.requesterId,
        verifierId: data.verifierId,
        skillId: userSkill.skillId,
        status: SkillVerificationStatus.PENDING,
        feedback: data.message,
      },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        verifier: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        skill: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
    });

    return verification;
  }

  /**
   * Respond to a skill verification request
   */
  async respondToVerification(data: {
    verificationId: string;
    verifierId: string;
    status: SkillVerificationStatus;
    feedback?: string;
  }): Promise<SkillVerificationWithDetails> {
    // Get the verification request
    const verification = await prisma.skillVerification.findFirst({
      where: {
        id: data.verificationId,
        verifierId: data.verifierId,
        status: SkillVerificationStatus.PENDING,
      },
    });

    if (!verification) {
      throw new Error("Verification request not found or already processed");
    }

    // Update verification status
    const updatedVerification = await prisma.skillVerification.update({
      where: { id: data.verificationId },
      data: {
        status: data.status,
        feedback: data.feedback,
        updatedAt: new Date(),
      },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        verifier: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        skill: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
    });

    // If approved, update the user skill verification count
    if (data.status === SkillVerificationStatus.APPROVED) {
      await this.updateUserSkillVerification(
        verification.requesterId,
        verification.skillId
      );
    }

    return updatedVerification;
  }

  /**
   * Get verification requests for a user (as verifier)
   */
  async getVerificationRequests(
    verifierId: string,
    status?: SkillVerificationStatus
  ): Promise<SkillVerificationWithDetails[]> {
    const where: any = {
      verifierId,
    };

    if (status) {
      where.status = status;
    }

    return await prisma.skillVerification.findMany({
      where,
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        verifier: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        skill: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Get verification history for a user (as requester)
   */
  async getVerificationHistory(
    requesterId: string,
    status?: SkillVerificationStatus
  ): Promise<SkillVerificationWithDetails[]> {
    const where: any = {
      requesterId,
    };

    if (status) {
      where.status = status;
    }

    return await prisma.skillVerification.findMany({
      where,
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        verifier: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        skill: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Get skill verification status for a specific skill
   */
  async getSkillVerificationStatus(userId: string, skillId: string) {
    const userSkill = await prisma.userSkill.findUnique({
      where: {
        userId_skillId: {
          userId,
          skillId,
        },
      },
    });

    if (!userSkill) {
      throw new Error("User skill not found");
    }

    const verifications = await prisma.skillVerification.findMany({
      where: {
        requesterId: userId,
        skillId,
        status: SkillVerificationStatus.APPROVED,
      },
      include: {
        verifier: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            rating: true,
          },
        },
      },
    });

    return {
      userSkill,
      verificationCount: verifications.length,
      isVerified: userSkill.isVerified,
      verifications,
      needsMoreVerifications: verifications.length < 3,
    };
  }

  /**
   * Update user skill verification status based on approved verifications
   */
  private async updateUserSkillVerification(
    userId: string,
    skillId: string
  ): Promise<void> {
    // Count approved verifications
    const approvedCount = await prisma.skillVerification.count({
      where: {
        requesterId: userId,
        skillId,
        status: SkillVerificationStatus.APPROVED,
      },
    });

    // Update user skill if we have 3+ verifications
    const isVerified = approvedCount >= 3;

    await prisma.userSkill.updateMany({
      where: {
        userId,
        skillId,
      },
      data: {
        verificationCount: approvedCount,
        isVerified,
      },
    });
  }

  /**
   * Get users who can verify a specific skill (have the skill and can teach it)
   */
  async getPotentialVerifiers(skillId: string, requesterId: string) {
    const potentialVerifiers = await prisma.user.findMany({
      where: {
        id: { not: requesterId }, // Exclude the requester
        skills: {
          some: {
            skillId,
            canTeach: true,
            proficiencyLevel: { gte: 60 }, // At least intermediate level
          },
        },
      },
      include: {
        skills: {
          where: {
            skillId,
            canTeach: true,
          },
          include: {
            skill: true,
          },
        },
      },
      orderBy: [{ rating: "desc" }, { totalSessions: "desc" }],
      take: 20, // Limit to top 20 potential verifiers
    });

    return potentialVerifiers;
  }

  /**
   * Get verification statistics for a user
   */
  async getVerificationStats(userId: string) {
    const [
      requestedCount,
      receivedCount,
      approvedGiven,
      approvedReceived,
      pendingRequests,
      pendingToReview,
    ] = await Promise.all([
      // Verifications requested by user
      prisma.skillVerification.count({
        where: { requesterId: userId },
      }),
      // Verifications received by user (as verifier)
      prisma.skillVerification.count({
        where: { verifierId: userId },
      }),
      // Approved verifications given by user
      prisma.skillVerification.count({
        where: {
          verifierId: userId,
          status: SkillVerificationStatus.APPROVED,
        },
      }),
      // Approved verifications received by user
      prisma.skillVerification.count({
        where: {
          requesterId: userId,
          status: SkillVerificationStatus.APPROVED,
        },
      }),
      // Pending verification requests from user
      prisma.skillVerification.count({
        where: {
          requesterId: userId,
          status: SkillVerificationStatus.PENDING,
        },
      }),
      // Pending verifications to review
      prisma.skillVerification.count({
        where: {
          verifierId: userId,
          status: SkillVerificationStatus.PENDING,
        },
      }),
    ]);

    return {
      requested: requestedCount,
      received: receivedCount,
      approvedGiven,
      approvedReceived,
      pendingRequests,
      pendingToReview,
    };
  }
}

export const skillVerificationService = new SkillVerificationService();
