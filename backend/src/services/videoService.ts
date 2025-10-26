import axios from "axios";
import jwt from "jsonwebtoken";
import config from "@/config";
import logger from "@/utils/logger";

export interface VideoMeeting {
  id: string;
  url: string;
  password?: string;
  startTime: Date;
  duration: number; // minutes
  provider: "zoom" | "daily";
}

export interface CreateMeetingOptions {
  title: string;
  startTime: Date;
  duration: number; // minutes
  hostEmail?: string;
  participantEmails?: string[];
  recordingEnabled?: boolean;
}

class VideoService {
  private zoomApiKey: string;
  private zoomApiSecret: string;
  private dailyApiKey: string;
  private dailyDomainName: string;

  constructor() {
    this.zoomApiKey = config.zoom.apiKey || "";
    this.zoomApiSecret = config.zoom.apiSecret || "";
    this.dailyApiKey = config.daily.apiKey || "";
    this.dailyDomainName = config.daily.domainName || "";
  }

  /**
   * Create a video meeting using the preferred provider
   */
  async createMeeting(
    options: CreateMeetingOptions,
    provider: "zoom" | "daily" = "daily"
  ): Promise<VideoMeeting> {
    try {
      if (provider === "zoom" && this.zoomApiKey && this.zoomApiSecret) {
        return await this.createZoomMeeting(options);
      } else if (provider === "daily" && this.dailyApiKey) {
        return await this.createDailyMeeting(options);
      } else {
        // Fallback to the available provider
        if (this.dailyApiKey) {
          return await this.createDailyMeeting(options);
        } else if (this.zoomApiKey && this.zoomApiSecret) {
          return await this.createZoomMeeting(options);
        } else {
          throw new Error("No video provider configured");
        }
      }
    } catch (error) {
      logger.error("Failed to create video meeting:", error);
      throw new Error("Failed to create video meeting");
    }
  }

  /**
   * Create a Zoom meeting
   */
  private async createZoomMeeting(
    options: CreateMeetingOptions
  ): Promise<VideoMeeting> {
    const token = this.generateZoomJWT();

    const meetingData = {
      topic: options.title,
      type: 2, // Scheduled meeting
      start_time: options.startTime.toISOString(),
      duration: options.duration,
      timezone: "UTC",
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        mute_upon_entry: true,
        watermark: false,
        use_pmi: false,
        approval_type: 0, // Automatically approve
        audio: "both",
        auto_recording: options.recordingEnabled ? "cloud" : "none",
        waiting_room: false,
      },
    };

    const response = await axios.post(
      "https://api.zoom.us/v2/users/me/meetings",
      meetingData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const meeting = response.data;

    return {
      id: meeting.id.toString(),
      url: meeting.join_url,
      password: meeting.password,
      startTime: new Date(meeting.start_time),
      duration: meeting.duration,
      provider: "zoom",
    };
  }

  /**
   * Create a Daily.co meeting room
   */
  private async createDailyMeeting(
    options: CreateMeetingOptions
  ): Promise<VideoMeeting> {
    const roomData = {
      name: `session-${Date.now()}`,
      properties: {
        start_time: Math.floor(options.startTime.getTime() / 1000),
        exp: Math.floor(
          (options.startTime.getTime() + options.duration * 60 * 1000) / 1000
        ),
        enable_screenshare: true,
        enable_chat: true,
        enable_knocking: true,
        enable_prejoin_ui: true,
        enable_network_ui: true,
        enable_video_processing_ui: true,
        max_participants: 2, // For 1-on-1 sessions
        enable_recording: options.recordingEnabled ? "cloud" : "off",
      },
    };

    const response = await axios.post(
      "https://api.daily.co/v1/rooms",
      roomData,
      {
        headers: {
          Authorization: `Bearer ${this.dailyApiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const room = response.data;

    return {
      id: room.name,
      url: room.url,
      startTime: options.startTime,
      duration: options.duration,
      provider: "daily",
    };
  }

  /**
   * Delete a video meeting
   */
  async deleteMeeting(
    meetingId: string,
    provider: "zoom" | "daily"
  ): Promise<void> {
    try {
      if (provider === "zoom") {
        await this.deleteZoomMeeting(meetingId);
      } else if (provider === "daily") {
        await this.deleteDailyRoom(meetingId);
      }
    } catch (error) {
      logger.error(`Failed to delete ${provider} meeting:`, error);
      // Don't throw error for cleanup operations
    }
  }

  /**
   * Delete a Zoom meeting
   */
  private async deleteZoomMeeting(meetingId: string): Promise<void> {
    const token = this.generateZoomJWT();

    await axios.delete(`https://api.zoom.us/v2/meetings/${meetingId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  /**
   * Delete a Daily.co room
   */
  private async deleteDailyRoom(roomName: string): Promise<void> {
    await axios.delete(`https://api.daily.co/v1/rooms/${roomName}`, {
      headers: {
        Authorization: `Bearer ${this.dailyApiKey}`,
      },
    });
  }

  /**
   * Generate JWT token for Zoom API
   */
  private generateZoomJWT(): string {
    const payload = {
      iss: this.zoomApiKey,
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiration
    };

    return jwt.sign(payload, this.zoomApiSecret);
  }

  /**
   * Check if a meeting can be joined (15 minutes before start time)
   */
  canJoinMeeting(scheduledAt: Date): boolean {
    const now = new Date();
    const joinTime = new Date(scheduledAt.getTime() - 15 * 60 * 1000); // 15 minutes before
    return now >= joinTime;
  }

  /**
   * Get meeting join URL with validation
   */
  getMeetingJoinUrl(videoLink: string, scheduledAt: Date): string | null {
    if (!this.canJoinMeeting(scheduledAt)) {
      return null;
    }
    return videoLink;
  }
}

export const videoService = new VideoService();
