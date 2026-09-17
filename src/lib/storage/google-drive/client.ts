/**
 * Google Drive API Client
 * Uses Service Account for server-side authenticated access
 * Credentials are NEVER sent to the browser
 */

import { google, drive_v3 } from "googleapis";
import { GoogleAuth } from "google-auth-library";
import { config } from "@/config";
import * as fs from "fs";
import * as path from "path";

let cachedAuth: GoogleAuth | null = null;

export function getGoogleAuth(): GoogleAuth {
  if (cachedAuth) return cachedAuth;

  const scopes = config.google.driveScopes;

  // Production: credentials from environment variable
  if (config.google.serviceAccountJson) {
    try {
      const credentials = JSON.parse(config.google.serviceAccountJson);
      cachedAuth = new GoogleAuth({ credentials, scopes });
      return cachedAuth;
    } catch {
      throw new Error("Invalid GOOGLE_SERVICE_ACCOUNT_JSON environment variable");
    }
  }

  // Development: credentials from key file
  const keyFilePath = path.resolve(config.google.serviceAccountKeyFile);
  if (fs.existsSync(keyFilePath)) {
    cachedAuth = new GoogleAuth({ keyFile: keyFilePath, scopes });
    return cachedAuth;
  }

  throw new Error(
    "Google Service Account credentials not found. " +
    "Set GOOGLE_SERVICE_ACCOUNT_JSON env var or provide service-account.json file."
  );
}

export async function getDriveClient(): Promise<drive_v3.Drive> {
  const auth = getGoogleAuth();
  return google.drive({ version: "v3", auth });
}
