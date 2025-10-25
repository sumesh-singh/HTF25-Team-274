import nodemailer from "nodemailer";
import config from "@/config";
import logger from "@/utils/logger";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configure transporter based on environment
    if (config.nodeEnv === "production" && config.email.sendgridApiKey) {
      // Use SendGrid in production
      this.transporter = nodemailer.createTransporter({
        service: "SendGrid",
        auth: {
          user: "apikey",
          pass: config.email.sendgridApiKey,
        },
      });
    } else {
      // Use Ethereal Email for development/testing
      this.transporter = nodemailer.createTransporter({
        host: "smtp.ethereal.email",
        port: 587,
        auth: {
          user: "ethereal.user@ethereal.email",
          pass: "ethereal.pass",
        },
      });
    }
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const mailOptions = {
        from: config.email.fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const info = await this.transporter.sendMail(mailOptions);

      if (config.nodeEnv === "development") {
        logger.info(`Email sent: ${nodemailer.getTestMessageUrl(info)}`);
      } else {
        logger.info(`Email sent to ${options.to}: ${info.messageId}`);
      }
    } catch (error) {
      logger.error("Email sending failed:", error);
      throw new Error("Failed to send email");
    }
  }

  async sendPasswordResetEmail(
    email: string,
    resetToken: string
  ): Promise<void> {
    const resetUrl = `${config.corsOrigin}/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Password Reset - SkillSync</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { 
              display: inline-block; 
              background: #4F46E5; 
              color: white; 
              padding: 12px 24px; 
              text-decoration: none; 
              border-radius: 5px; 
              margin: 20px 0; 
            }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>SkillSync Password Reset</h1>
            </div>
            <div class="content">
              <h2>Reset Your Password</h2>
              <p>You requested a password reset for your SkillSync account. Click the button below to reset your password:</p>
              <a href="${resetUrl}" class="button">Reset Password</a>
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p><a href="${resetUrl}">${resetUrl}</a></p>
              <p><strong>This link will expire in 10 minutes.</strong></p>
              <p>If you didn't request this password reset, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>© 2024 SkillSync. All rights reserved.</p>
              <p>This is an automated email, please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      SkillSync Password Reset
      
      You requested a password reset for your SkillSync account.
      
      Reset your password by visiting: ${resetUrl}
      
      This link will expire in 10 minutes.
      
      If you didn't request this password reset, please ignore this email.
    `;

    await this.sendEmail({
      to: email,
      subject: "Reset Your SkillSync Password",
      html,
      text,
    });
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to SkillSync!</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { 
              display: inline-block; 
              background: #4F46E5; 
              color: white; 
              padding: 12px 24px; 
              text-decoration: none; 
              border-radius: 5px; 
              margin: 20px 0; 
            }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to SkillSync!</h1>
            </div>
            <div class="content">
              <h2>Hi ${firstName}!</h2>
              <p>Welcome to SkillSync, the peer-to-peer learning platform where you can teach and learn skills from others in our community.</p>
              <p>You've been awarded <strong>50 starter credits</strong> to get you started on your learning journey!</p>
              <h3>What you can do now:</h3>
              <ul>
                <li>Complete your profile and add your skills</li>
                <li>Browse and connect with other learners and teachers</li>
                <li>Book your first learning session</li>
                <li>Start teaching and earning credits</li>
              </ul>
              <a href="${config.corsOrigin}/profile" class="button">Complete Your Profile</a>
              <p>If you have any questions, feel free to reach out to our support team.</p>
            </div>
            <div class="footer">
              <p>© 2024 SkillSync. All rights reserved.</p>
              <p>Happy learning!</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      Welcome to SkillSync!
      
      Hi ${firstName}!
      
      Welcome to SkillSync, the peer-to-peer learning platform where you can teach and learn skills from others in our community.
      
      You've been awarded 50 starter credits to get you started on your learning journey!
      
      What you can do now:
      - Complete your profile and add your skills
      - Browse and connect with other learners and teachers
      - Book your first learning session
      - Start teaching and earning credits
      
      Visit your profile: ${config.corsOrigin}/profile
      
      If you have any questions, feel free to reach out to our support team.
      
      Happy learning!
    `;

    await this.sendEmail({
      to: email,
      subject: "Welcome to SkillSync - Your Learning Journey Starts Now!",
      html,
      text,
    });
  }

  async sendEmailVerificationEmail(
    email: string,
    verificationToken: string
  ): Promise<void> {
    const verificationUrl = `${config.corsOrigin}/verify-email?token=${verificationToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Verify Your Email - SkillSync</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { 
              display: inline-block; 
              background: #4F46E5; 
              color: white; 
              padding: 12px 24px; 
              text-decoration: none; 
              border-radius: 5px; 
              margin: 20px 0; 
            }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Verify Your Email</h1>
            </div>
            <div class="content">
              <h2>Almost there!</h2>
              <p>Please verify your email address to complete your SkillSync registration:</p>
              <a href="${verificationUrl}" class="button">Verify Email</a>
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p><a href="${verificationUrl}">${verificationUrl}</a></p>
              <p>This verification link will expire in 24 hours.</p>
            </div>
            <div class="footer">
              <p>© 2024 SkillSync. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      Verify Your Email - SkillSync
      
      Almost there!
      
      Please verify your email address to complete your SkillSync registration:
      ${verificationUrl}
      
      This verification link will expire in 24 hours.
    `;

    await this.sendEmail({
      to: email,
      subject: "Verify Your SkillSync Email Address",
      html,
      text,
    });
  }
}

export const emailService = new EmailService();
