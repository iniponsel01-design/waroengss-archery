/**
 * Application Configuration
 * All environment variables are validated and typed here.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, defaultValue = ""): string {
  return process.env[name] ?? defaultValue;
}

export const config = {
  app: {
    url: optionalEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
    name: optionalEnv("NEXT_PUBLIC_APP_NAME", "Waroeng SS Archery Gallery"),
    brandName: optionalEnv("NEXT_PUBLIC_BRAND_NAME", "Waroeng SS Archery"),
    nodeEnv: optionalEnv("NODE_ENV", "development"),
    isDev: process.env.NODE_ENV === "development",
    isProd: process.env.NODE_ENV === "production",
  },

  auth: {
    jwtSecret: optionalEnv("JWT_SECRET", "dev-jwt-secret-change-in-production"),
    jwtExpiresIn: "7d",
    cookieName: "wss_admin_token",
    adminSetupToken: optionalEnv("ADMIN_SETUP_TOKEN", ""),
  },

  google: {
    clientId: optionalEnv("GOOGLE_CLIENT_ID"),
    clientSecret: optionalEnv("GOOGLE_CLIENT_SECRET"),
    serviceAccountKeyFile: optionalEnv(
      "GOOGLE_SERVICE_ACCOUNT_KEY_FILE",
      "./service-account.json"
    ),
    serviceAccountJson: optionalEnv("GOOGLE_SERVICE_ACCOUNT_JSON"),
    // Google Drive scopes
    driveScopes: ["https://www.googleapis.com/auth/drive.readonly"],
  },

  rateLimit: {
    maxRequests: parseInt(optionalEnv("RATE_LIMIT_MAX_REQUESTS", "100")),
    windowMs: parseInt(optionalEnv("RATE_LIMIT_WINDOW_MS", "60000")),
  },

  pagination: {
    defaultPageSize: 48,
    maxPageSize: 100,
    albumPageSize: 20,
    eventPageSize: 10,
  },

  cache: {
    // Next.js revalidation times in seconds
    eventMetadata: 300,        // 5 minutes
    eventList: 60,             // 1 minute
    photoList: 120,            // 2 minutes
    staticContent: 86400,      // 24 hours
  },

  storage: {
    maxFileSizeMb: 50,
    allowedMimeTypes: [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ],
  },
} as const;

export type AppConfig = typeof config;
