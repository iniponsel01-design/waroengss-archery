/**
 * Google Drive Storage Provider
 * Implements StorageProviderInterface for Google Drive
 */

import { getDriveClient } from "./client";
import type { StorageProviderInterface } from "../storage-provider";
import type { DriveFile, DriveFolder, SyncResult } from "@/types";
import { config } from "@/config";

const GOOGLE_DRIVE_THUMBNAIL_BASE =
  "https://drive.google.com/thumbnail?id=";
const GOOGLE_DRIVE_PREVIEW_BASE =
  "https://lh3.googleusercontent.com/d/";

const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

export class GoogleDriveProvider implements StorageProviderInterface {
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const drive = await getDriveClient();
      await drive.about.get({ fields: "user" });
      return { success: true, message: "Connected to Google Drive" };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Connection failed",
      };
    }
  }

  async listFolders(parentFolderId?: string): Promise<DriveFolder[]> {
    const drive = await getDriveClient();

    const query = parentFolderId
      ? `mimeType = 'application/vnd.google-apps.folder' and '${parentFolderId}' in parents and trashed = false`
      : `mimeType = 'application/vnd.google-apps.folder' and trashed = false`;

    const response = await drive.files.list({
      q: query,
      fields: "files(id, name, mimeType, createdTime, modifiedTime, parents)",
      orderBy: "name",
      pageSize: 100,
    });

    return (response.data.files || []).map((f) => ({
      id: f.id!,
      name: f.name!,
      mimeType: f.mimeType!,
      createdTime: f.createdTime || undefined,
      modifiedTime: f.modifiedTime || undefined,
      parents: f.parents || undefined,
    }));
  }

  async listFiles(folderId: string): Promise<DriveFile[]> {
    const drive = await getDriveClient();
    const files: DriveFile[] = [];
    let pageToken: string | undefined;

    do {
      const response = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false and mimeType != 'application/vnd.google-apps.folder'`,
        fields:
          "nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, thumbnailLink, webContentLink, webViewLink, imageMediaMetadata)",
        orderBy: "name",
        pageSize: 1000,
        pageToken: pageToken || undefined,
      });

      const driveFiles = response.data.files || [];

      for (const f of driveFiles) {
        if (IMAGE_MIME_TYPES.has(f.mimeType || "")) {
          files.push({
            id: f.id!,
            name: f.name!,
            mimeType: f.mimeType!,
            size: f.size || undefined,
            createdTime: f.createdTime || undefined,
            modifiedTime: f.modifiedTime || undefined,
            thumbnailLink: f.thumbnailLink || undefined,
            webContentLink: f.webContentLink || undefined,
            webViewLink: f.webViewLink || undefined,
            imageMediaMetadata: f.imageMediaMetadata
              ? {
                  width: f.imageMediaMetadata.width || undefined,
                  height: f.imageMediaMetadata.height || undefined,
                }
              : undefined,
          });
        }
      }

      pageToken = response.data.nextPageToken || undefined;
    } while (pageToken);

    return files;
  }

  async getFile(fileId: string): Promise<DriveFile | null> {
    try {
      const drive = await getDriveClient();
      const response = await drive.files.get({
        fileId,
        fields:
          "id, name, mimeType, size, createdTime, modifiedTime, thumbnailLink, webContentLink, webViewLink, imageMediaMetadata",
      });

      const f = response.data;
      return {
        id: f.id!,
        name: f.name!,
        mimeType: f.mimeType!,
        size: f.size || undefined,
        createdTime: f.createdTime || undefined,
        modifiedTime: f.modifiedTime || undefined,
        thumbnailLink: f.thumbnailLink || undefined,
        webContentLink: f.webContentLink || undefined,
        webViewLink: f.webViewLink || undefined,
        imageMediaMetadata: f.imageMediaMetadata
          ? {
              width: f.imageMediaMetadata.width || undefined,
              height: f.imageMediaMetadata.height || undefined,
            }
          : undefined,
      };
    } catch {
      return null;
    }
  }

  /**
   * Thumbnail URL — used for gallery grid
   * sz=800: sweet spot — tajam di retina/2x DPR, file ~2-3x lebih kecil dari sz=2400.
   * Sebelumnya sz=400 menyebabkan blur di layar retina dan grid lebar.
   */
  getThumbnailUrl(fileId: string): string {
    return `${GOOGLE_DRIVE_THUMBNAIL_BASE}${fileId}&sz=800`;
  }

  /**
   * Preview URL — used in photo viewer
   * Larger size for better quality
   */
  getPreviewUrl(fileId: string): string {
    return `${GOOGLE_DRIVE_THUMBNAIL_BASE}${fileId}&sz=2400`;
  }

  /**
   * Get a server-authenticated download URL
   * Called from /api/photos/[id]/download — credentials never exposed to browser
   */
  async getDownloadUrl(fileId: string): Promise<string> {
    // Use Google Drive export/download endpoint
    // The actual download happens server-side via our API proxy
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }

  async syncFolder(folderId: string): Promise<{ files: DriveFile[]; result: SyncResult }> {
    const files = await this.listFiles(folderId);

    return {
      files,
      result: {
        totalFiles: files.length,
        addedFiles: 0,
        updatedFiles: 0,
        deletedFiles: 0,
        failedFiles: 0,
        skippedFiles: 0,
        errors: [],
      },
    };
  }
}

// Singleton instance
export const googleDriveProvider = new GoogleDriveProvider();
