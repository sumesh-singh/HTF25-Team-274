import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  corsOrigin: string;
  database: {
    url: string;
  };
  redis: {
    url: string;
  };
  jwt: {
    secret: string;
    refreshSecret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  email: {
    sendgridApiKey: string;
    fromEmail: string;
  };
  upload: {
    maxFileSize: number;
    uploadPath: string;
  };
  stripe: {
    secretKey: string;
    webhookSecret: string;
  };
  oauth: {
    google: {
      clientId: string;
      clientSecret: string;
    };
    linkedin: {
      clientId: string;
      clientSecret: string;
    };
  };
  zoom: {
    apiKey: string;
    apiSecret: string;
  };
  daily: {
    apiKey: string;
    domainName: string;
  };
}

const config: Config = {
  port: parseInt(process.env.PORT || "3001", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",

  database: {
    url:
      process.env.DATABASE_URL ||
      "postgresql://skillsync:skillsync_password@localhost:5432/skillsync_dev",
  },

  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
  },

  jwt: {
    secret: process.env.JWT_SECRET || "your-super-secret-jwt-key",
    refreshSecret:
      process.env.JWT_REFRESH_SECRET || "your-super-secret-refresh-key",
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },

  email: {
    sendgridApiKey: process.env.SENDGRID_API_KEY || "",
    fromEmail: process.env.FROM_EMAIL || "noreply@skillsync.com",
  },

  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || "10485760", 10), // 10MB
    uploadPath:
      process.env.UPLOAD_PATH || path.join(__dirname, "../../uploads"),
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  },

  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
    linkedin: {
      clientId: process.env.LINKEDIN_CLIENT_ID || "",
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || "",
    },
  },

  zoom: {
    apiKey: process.env.ZOOM_API_KEY || "",
    apiSecret: process.env.ZOOM_API_SECRET || "",
  },

  daily: {
    apiKey: process.env.DAILY_API_KEY || "",
    domainName: process.env.DAILY_DOMAIN_NAME || "",
  },
};

// Validate required environment variables in production
if (config.nodeEnv === "production") {
  const requiredVars = ["DATABASE_URL", "JWT_SECRET", "JWT_REFRESH_SECRET"];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      throw new Error(`Required environment variable ${varName} is not set`);
    }
  }
}

export default config;
