/**
 * Google Drive API Client
 * Uses Service Account for server-side authenticated access
 * Credentials are NEVER sent to the browser
 */

import { google, drive_v3 } from "googleapis";
import { config } from "@/config";
import * as fs from "fs";
import * as path from "path";

let cachedAuth: ReturnType<typeof google.auth.GoogleAuth> | null = null;

/**
 * Get authenticated Google Auth instance
 * Credentials loaded from env var (production) or key file (development)
 */
export function getGoogleAuth(): ReturnType<typeof google.auth.GoogleAuth> {
  if (cachedAuth) return cachedAuth;

  const scopes = config.google.driveScopes;

  // Production: credentials from environment variable
  if (config.google.serviceAccountJson) {
    try {
      const credentials = JSON.parse(config.google.serviceAccountJson);
      cachedAuth = new google.auth.GoogleAuth({ credentials, scopes });
      return cachedAuth;
    } catch {
      throw new Error(
        "Invalid GOOGLE_SERVICE_ACCOUNT_JSON environment variable"
      );
    }
  }

  // Development: credentials from key file
  const keyFilePath = path.resolve(config.google.serviceAccountKeyFile);
  if (fs.existsSync(keyFilePath)) {
    cachedAuth = new google.auth.GoogleAuth({ keyFile: keyFilePath, scopes });
    return cachedAuth;
  }

  throw new Error(
    "Google Service Account credentials not found. " +
      "Set GOOGLE_SERVICE_ACCOUNT_JSON env var or provide service-account.json file."
  );
}

/**
 * Get authenticated Google Drive API instance
 */
export async function getDriveClient(): Promise<drive_v3.Drive> {
  const auth = getGoogleAuth();
  return google.drive({ version: "v3", auth });
}
