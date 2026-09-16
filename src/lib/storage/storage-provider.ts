/**
 * Storage Provider Abstraction
 * Allows swapping Google Drive for S3, R2, etc. in the future
 */

import type { DriveFile, DriveFolder, SyncResult } from "@/types";

export interface StorageProviderInterface {
  /**
   * Test the connection to the storage provider
   */
  testConnection(): Promise<{ success: boolean; message: string }>;

  /**
   * List folders within a given folder (or root)
   */
  listFolders(parentFolderId?: string): Promise<DriveFolder[]>;

  /**
   * List image files within a folder
   */
  listFiles(folderId: string): Promise<DriveFile[]>;

  /**
   * Get a single file's metadata
   */
  getFile(fileId: string): Promise<DriveFile | null>;

  /**
   * Get thumbnail URL for a file (small preview, for gallery grid)
   */
  getThumbnailUrl(fileId: string): string;

  /**
   * Get preview URL for a file (medium size, for photo viewer)
   */
  getPreviewUrl(fileId: string): string;

  /**
   * Get a secure, server-side download URL for a file
   * This should NOT expose credentials to the browser
   */
  getDownloadUrl(fileId: string): Promise<string>;

  /**
   * Sync a folder — discover files and return sync result
   */
  syncFolder(folderId: string): Promise<{ files: DriveFile[]; result: SyncResult }>;
}
