import logger from "../utils/logger";

export class ContentModerationService {
  // List of inappropriate words/phrases (this would be more comprehensive in production)
  private readonly inappropriateWords = [
    // Profanity
    "fuck",
    "shit",
    "damn",
    "bitch",
    "asshole",
    "bastard",
    // Hate speech indicators
    "hate",
    "kill",
    "die",
    "stupid",
    "idiot",
    "moron",
    // Spam indicators
    "buy now",
    "click here",
    "free money",
    "get rich quick",
    // Inappropriate content
    "nude",
    "sex",
    "porn",
    "adult content",
  ];

  // Spam patterns
  private readonly spamPatterns = [
    /(.)\1{4,}/g, // Repeated characters (aaaaa)
    /[A-Z]{5,}/g, // All caps words
    /\b\d{10,}\b/g, // Long numbers (phone numbers)
    /https?:\/\/[^\s]+/g, // URLs
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, // Email addresses
  ];

  /**
   * Check if content contains inappropriate language
   */
  checkInappropriateContent(content: string): {
    isInappropriate: boolean;
    flaggedWords: string[];
    severity: "low" | "medium" | "high";
  } {
    const lowerContent = content.toLowerCase();
    const flaggedWords: string[] = [];

    // Check for inappropriate words
    for (const word of this.inappropriateWords) {
      if (lowerContent.includes(word.toLowerCase())) {
        flaggedWords.push(word);
      }
    }

    let severity: "low" | "medium" | "high" = "low";
    if (flaggedWords.length > 3) {
      severity = "high";
    } else if (flaggedWords.length > 1) {
      severity = "medium";
    }

    return {
      isInappropriate: flaggedWords.length > 0,
      flaggedWords,
      severity,
    };
  }

  /**
   * Check if content appears to be spam
   */
  checkSpamContent(content: string): {
    isSpam: boolean;
    spamIndicators: string[];
    confidence: number;
  } {
    const spamIndicators: string[] = [];
    let spamScore = 0;

    // Check spam patterns
    for (const pattern of this.spamPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        spamIndicators.push(`Pattern: ${pattern.source}`);
        spamScore += matches.length * 10;
      }
    }

    // Check for excessive repetition
    const words = content.split(/\s+/);
    const wordCount = new Map<string, number>();

    for (const word of words) {
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, "");
      if (cleanWord.length > 2) {
        wordCount.set(cleanWord, (wordCount.get(cleanWord) || 0) + 1);
      }
    }

    // Check for words repeated more than 3 times
    for (const [word, count] of wordCount.entries()) {
      if (count > 3) {
        spamIndicators.push(`Repeated word: ${word} (${count} times)`);
        spamScore += count * 5;
      }
    }

    // Check content length vs unique words ratio
    const uniqueWords = wordCount.size;
    const totalWords = words.length;
    if (totalWords > 10 && uniqueWords / totalWords < 0.3) {
      spamIndicators.push("Low unique word ratio");
      spamScore += 20;
    }

    const confidence = Math.min(spamScore / 100, 1);

    return {
      isSpam: confidence > 0.5,
      spamIndicators,
      confidence,
    };
  }

  /**
   * Comprehensive content moderation check
   */
  moderateContent(
    content: string,
    userId?: string
  ): {
    shouldFlag: boolean;
    shouldBlock: boolean;
    reasons: string[];
    severity: "low" | "medium" | "high";
    confidence: number;
  } {
    const inappropriateCheck = this.checkInappropriateContent(content);
    const spamCheck = this.checkSpamContent(content);

    const reasons: string[] = [];
    let shouldFlag = false;
    let shouldBlock = false;
    let overallSeverity: "low" | "medium" | "high" = "low";
    let confidence = 0;

    // Handle inappropriate content
    if (inappropriateCheck.isInappropriate) {
      shouldFlag = true;
      reasons.push(
        `Inappropriate language detected: ${inappropriateCheck.flaggedWords.join(
          ", "
        )}`
      );

      if (inappropriateCheck.severity === "high") {
        shouldBlock = true;
        overallSeverity = "high";
        confidence = 0.9;
      } else if (inappropriateCheck.severity === "medium") {
        overallSeverity = "medium";
        confidence = 0.7;
      } else {
        confidence = 0.4;
      }
    }

    // Handle spam content
    if (spamCheck.isSpam) {
      shouldFlag = true;
      reasons.push(`Spam detected: ${spamCheck.spamIndicators.join(", ")}`);

      if (spamCheck.confidence > 0.8) {
        shouldBlock = true;
        overallSeverity = "high";
        confidence = Math.max(confidence, spamCheck.confidence);
      } else if (spamCheck.confidence > 0.6) {
        overallSeverity =
          overallSeverity === "low" ? "medium" : overallSeverity;
        confidence = Math.max(confidence, spamCheck.confidence);
      }
    }

    // Log moderation action
    if (shouldFlag) {
      logger.warn(`Content flagged for user ${userId || "unknown"}:`, {
        reasons,
        severity: overallSeverity,
        confidence,
        contentPreview: content.substring(0, 100),
      });
    }

    return {
      shouldFlag,
      shouldBlock,
      reasons,
      severity: overallSeverity,
      confidence,
    };
  }

  /**
   * Clean content by removing or replacing inappropriate parts
   */
  cleanContent(content: string): string {
    let cleanedContent = content;

    // Replace inappropriate words with asterisks
    for (const word of this.inappropriateWords) {
      const regex = new RegExp(`\\b${word}\\b`, "gi");
      cleanedContent = cleanedContent.replace(regex, "*".repeat(word.length));
    }

    // Remove URLs
    cleanedContent = cleanedContent.replace(
      /https?:\/\/[^\s]+/g,
      "[URL removed]"
    );

    // Remove email addresses
    cleanedContent = cleanedContent.replace(
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
      "[Email removed]"
    );

    return cleanedContent;
  }

  /**
   * Check user profile content (bio, skills, etc.)
   */
  moderateProfile(profileData: {
    bio?: string;
    firstName?: string;
    lastName?: string;
  }): {
    isValid: boolean;
    issues: string[];
    cleanedData: typeof profileData;
  } {
    const issues: string[] = [];
    const cleanedData = { ...profileData };

    // Check bio
    if (profileData.bio) {
      const bioCheck = this.moderateContent(profileData.bio);
      if (bioCheck.shouldBlock) {
        issues.push("Bio contains inappropriate content");
        cleanedData.bio = this.cleanContent(profileData.bio);
      } else if (bioCheck.shouldFlag) {
        issues.push("Bio flagged for review");
      }
    }

    // Check names for inappropriate content
    if (profileData.firstName) {
      const nameCheck = this.checkInappropriateContent(profileData.firstName);
      if (nameCheck.isInappropriate) {
        issues.push("First name contains inappropriate content");
      }
    }

    if (profileData.lastName) {
      const nameCheck = this.checkInappropriateContent(profileData.lastName);
      if (nameCheck.isInappropriate) {
        issues.push("Last name contains inappropriate content");
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      cleanedData,
    };
  }
}

export const contentModerationService = new ContentModerationService();
