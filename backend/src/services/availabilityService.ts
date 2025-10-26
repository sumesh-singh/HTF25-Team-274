import { Availability } from "@prisma/client";
import prisma from "@/lib/prisma";

export interface AvailabilitySlot {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  timezone: string;
}

export interface AvailabilityWithUser extends Availability {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    timezone: string;
  };
}

export interface AvailabilityOverlap {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  duration: number; // minutes
}

export interface UserAvailabilityFilters {
  userId?: string;
  dayOfWeek?: number;
  isActive?: boolean;
}

export class AvailabilityService {
  /**
   * Get user availability
   */
  async getUserAvailability(
    userId: string,
    filters: UserAvailabilityFilters = {}
  ): Promise<Availability[]> {
    const where: any = {
      userId,
    };

    if (filters.dayOfWeek !== undefined) {
      where.dayOfWeek = filters.dayOfWeek;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    return await prisma.availability.findMany({
      where,
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
  }

  /**
   * Add availability slot
   */
  async addAvailabilitySlot(data: {
    userId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    timezone: string;
  }): Promise<Availability> {
    // Validate day of week
    if (data.dayOfWeek < 0 || data.dayOfWeek > 6) {
      throw new Error(
        "Day of week must be between 0 (Sunday) and 6 (Saturday)"
      );
    }

    // Validate time format
    if (
      !this.isValidTimeFormat(data.startTime) ||
      !this.isValidTimeFormat(data.endTime)
    ) {
      throw new Error("Time must be in HH:MM format");
    }

    // Validate time range
    if (
      this.timeToMinutes(data.startTime) >= this.timeToMinutes(data.endTime)
    ) {
      throw new Error("Start time must be before end time");
    }

    // Check for overlapping availability
    const overlapping = await this.checkForOverlappingAvailability(
      data.userId,
      data.dayOfWeek,
      data.startTime,
      data.endTime
    );

    if (overlapping) {
      throw new Error("This time slot overlaps with existing availability");
    }

    return await prisma.availability.create({
      data,
    });
  }

  /**
   * Update availability slot
   */
  async updateAvailabilitySlot(
    availabilityId: string,
    userId: string,
    data: {
      dayOfWeek?: number;
      startTime?: string;
      endTime?: string;
      timezone?: string;
      isActive?: boolean;
    }
  ): Promise<Availability> {
    // Verify the availability belongs to the user
    const existingAvailability = await prisma.availability.findFirst({
      where: {
        id: availabilityId,
        userId: userId,
      },
    });

    if (!existingAvailability) {
      throw new Error("Availability slot not found");
    }

    // Validate updates
    if (
      data.dayOfWeek !== undefined &&
      (data.dayOfWeek < 0 || data.dayOfWeek > 6)
    ) {
      throw new Error(
        "Day of week must be between 0 (Sunday) and 6 (Saturday)"
      );
    }

    if (data.startTime && !this.isValidTimeFormat(data.startTime)) {
      throw new Error("Start time must be in HH:MM format");
    }

    if (data.endTime && !this.isValidTimeFormat(data.endTime)) {
      throw new Error("End time must be in HH:MM format");
    }

    // Check time range if both times are provided
    const startTime = data.startTime || existingAvailability.startTime;
    const endTime = data.endTime || existingAvailability.endTime;

    if (this.timeToMinutes(startTime) >= this.timeToMinutes(endTime)) {
      throw new Error("Start time must be before end time");
    }

    // Check for overlapping availability (excluding current slot)
    const dayOfWeek =
      data.dayOfWeek !== undefined
        ? data.dayOfWeek
        : existingAvailability.dayOfWeek;
    const overlapping = await this.checkForOverlappingAvailability(
      userId,
      dayOfWeek,
      startTime,
      endTime,
      availabilityId
    );

    if (overlapping) {
      throw new Error("This time slot overlaps with existing availability");
    }

    return await prisma.availability.update({
      where: { id: availabilityId },
      data,
    });
  }

  /**
   * Remove availability slot
   */
  async removeAvailabilitySlot(
    availabilityId: string,
    userId: string
  ): Promise<void> {
    // Verify the availability belongs to the user
    const existingAvailability = await prisma.availability.findFirst({
      where: {
        id: availabilityId,
        userId: userId,
      },
    });

    if (!existingAvailability) {
      throw new Error("Availability slot not found");
    }

    await prisma.availability.delete({
      where: { id: availabilityId },
    });
  }

  /**
   * Get availability overlap between two users
   */
  async getAvailabilityOverlap(
    userId1: string,
    userId2: string
  ): Promise<AvailabilityOverlap[]> {
    const [user1Availability, user2Availability] = await Promise.all([
      this.getUserAvailability(userId1, { isActive: true }),
      this.getUserAvailability(userId2, { isActive: true }),
    ]);

    const overlaps: AvailabilityOverlap[] = [];

    for (const slot1 of user1Availability) {
      for (const slot2 of user2Availability) {
        if (slot1.dayOfWeek === slot2.dayOfWeek) {
          const overlap = this.calculateTimeOverlap(
            slot1.startTime,
            slot1.endTime,
            slot2.startTime,
            slot2.endTime
          );

          if (overlap) {
            overlaps.push({
              dayOfWeek: slot1.dayOfWeek,
              startTime: overlap.startTime,
              endTime: overlap.endTime,
              duration: overlap.duration,
            });
          }
        }
      }
    }

    return overlaps.sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) {
        return a.dayOfWeek - b.dayOfWeek;
      }
      return this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startTime);
    });
  }

  /**
   * Get users with overlapping availability
   */
  async getUsersWithOverlappingAvailability(
    userId: string,
    minOverlapMinutes: number = 60
  ): Promise<
    Array<{
      user: {
        id: string;
        firstName: string;
        lastName: string;
        timezone: string;
      };
      overlaps: AvailabilityOverlap[];
      totalOverlapMinutes: number;
    }>
  > {
    // Get all users with availability (excluding the current user)
    const usersWithAvailability = await prisma.user.findMany({
      where: {
        id: { not: userId },
        availability: {
          some: { isActive: true },
        },
      },
      include: {
        availability: {
          where: { isActive: true },
        },
      },
    });

    const results = [];

    for (const user of usersWithAvailability) {
      const overlaps = await this.getAvailabilityOverlap(userId, user.id);
      const totalOverlapMinutes = overlaps.reduce(
        (sum, overlap) => sum + overlap.duration,
        0
      );

      if (totalOverlapMinutes >= minOverlapMinutes) {
        results.push({
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            timezone: user.timezone,
          },
          overlaps,
          totalOverlapMinutes,
        });
      }
    }

    return results.sort(
      (a, b) => b.totalOverlapMinutes - a.totalOverlapMinutes
    );
  }

  /**
   * Get weekly availability summary
   */
  async getWeeklyAvailabilitySummary(userId: string) {
    const availability = await this.getUserAvailability(userId, {
      isActive: true,
    });

    const weeklyHours = Array(7).fill(0);
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    for (const slot of availability) {
      const duration =
        this.timeToMinutes(slot.endTime) - this.timeToMinutes(slot.startTime);
      weeklyHours[slot.dayOfWeek] += duration / 60;
    }

    const summary = weeklyHours.map((hours, dayIndex) => ({
      dayOfWeek: dayIndex,
      dayName: dayNames[dayIndex],
      hours: Math.round(hours * 100) / 100,
      slots: availability.filter((slot) => slot.dayOfWeek === dayIndex).length,
    }));

    const totalHours = weeklyHours.reduce((sum, hours) => sum + hours, 0);

    return {
      totalWeeklyHours: Math.round(totalHours * 100) / 100,
      dailySummary: summary,
      totalSlots: availability.length,
    };
  }

  /**
   * Check if a user is available at a specific time
   */
  async isUserAvailable(
    userId: string,
    dayOfWeek: number,
    time: string,
    timezone?: string
  ): Promise<boolean> {
    const availability = await this.getUserAvailability(userId, {
      dayOfWeek,
      isActive: true,
    });

    const timeMinutes = this.timeToMinutes(time);

    return availability.some((slot) => {
      const startMinutes = this.timeToMinutes(slot.startTime);
      const endMinutes = this.timeToMinutes(slot.endTime);
      return timeMinutes >= startMinutes && timeMinutes < endMinutes;
    });
  }

  /**
   * Get available time slots for a specific day
   */
  async getAvailableTimeSlots(
    userId: string,
    dayOfWeek: number,
    slotDuration: number = 60 // minutes
  ): Promise<Array<{ startTime: string; endTime: string }>> {
    const availability = await this.getUserAvailability(userId, {
      dayOfWeek,
      isActive: true,
    });

    const slots = [];

    for (const availabilitySlot of availability) {
      const startMinutes = this.timeToMinutes(availabilitySlot.startTime);
      const endMinutes = this.timeToMinutes(availabilitySlot.endTime);

      for (
        let time = startMinutes;
        time + slotDuration <= endMinutes;
        time += slotDuration
      ) {
        slots.push({
          startTime: this.minutesToTime(time),
          endTime: this.minutesToTime(time + slotDuration),
        });
      }
    }

    return slots;
  }

  /**
   * Private helper methods
   */
  private isValidTimeFormat(time: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}`;
  }

  private async checkForOverlappingAvailability(
    userId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    excludeId?: string
  ): Promise<boolean> {
    const where: any = {
      userId,
      dayOfWeek,
      isActive: true,
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const existingSlots = await prisma.availability.findMany({ where });

    const newStartMinutes = this.timeToMinutes(startTime);
    const newEndMinutes = this.timeToMinutes(endTime);

    return existingSlots.some((slot) => {
      const existingStartMinutes = this.timeToMinutes(slot.startTime);
      const existingEndMinutes = this.timeToMinutes(slot.endTime);

      // Check for overlap
      return (
        newStartMinutes < existingEndMinutes &&
        newEndMinutes > existingStartMinutes
      );
    });
  }

  private calculateTimeOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string
  ): { startTime: string; endTime: string; duration: number } | null {
    const start1Minutes = this.timeToMinutes(start1);
    const end1Minutes = this.timeToMinutes(end1);
    const start2Minutes = this.timeToMinutes(start2);
    const end2Minutes = this.timeToMinutes(end2);

    const overlapStart = Math.max(start1Minutes, start2Minutes);
    const overlapEnd = Math.min(end1Minutes, end2Minutes);

    if (overlapStart < overlapEnd) {
      return {
        startTime: this.minutesToTime(overlapStart),
        endTime: this.minutesToTime(overlapEnd),
        duration: overlapEnd - overlapStart,
      };
    }

    return null;
  }
}

export const availabilityService = new AvailabilityService();
