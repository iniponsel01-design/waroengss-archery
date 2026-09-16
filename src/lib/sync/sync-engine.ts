/**
 * Sync Engine
 * Incremental sync from Google Drive to PostgreSQL
 * Flow: Drive → Discover → Compare DB → INSERT/UPDATE/SKIP/MARK_DELETED
 */

import { prisma } from "@/lib/db/client";
import { googleDriveProvider } from "@/lib/storage/google-drive/provider";
import type { DriveFile, SyncResult } from "@/types";
import type { Album, SyncJob } from "@prisma/client";

const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export interface SyncAlbumOptions {
  eventId: string;
  eventDayId: string;
  albumId: string;
  driveFolderId: string;
  jobId: string;
}

/**
 * Sync a single album folder from Google Drive
 */
export async function syncAlbumFromDrive(options: SyncAlbumOptions): Promise<SyncResult> {
  const { eventId, eventDayId, albumId, driveFolderId, jobId } = options;

  const result: SyncResult = {
    totalFiles: 0,
    addedFiles: 0,
    updatedFiles: 0,
    deletedFiles: 0,
    failedFiles: 0,
    skippedFiles: 0,
    errors: [],
  };

  // Update job to RUNNING
  await prisma.syncJob.update({
    where: { id: jobId },
    data: { status: "RUNNING", startedAt: new Date() },
  });

  try {
    // 1. Discover files from Google Drive
    const driveFiles = await googleDriveProvider.listFiles(driveFolderId);

    const imageFiles = driveFiles.filter((f) => IMAGE_MIME_TYPES.has(f.mimeType));
    result.totalFiles = imageFiles.length;

    // 2. Get existing media files for this album from DB
    const existingMedia = await prisma.mediaFile.findMany({
      where: { albumId, status: { not: "DELETED" } },
      select: { id: true, driveFileId: true, driveModifiedAt: true },
    });

    const existingByDriveId = new Map(
      existingMedia.map((m) => [m.driveFileId, m])
    );
    const seenDriveIds = new Set<string>();

    // 3. Process each file
    for (const file of imageFiles) {
      seenDriveIds.add(file.id);

      try {
        const existing = existingByDriveId.get(file.id);
        const driveModifiedAt = file.modifiedTime
          ? new Date(file.modifiedTime)
          : null;

        const thumbnailUrl = googleDriveProvider.getThumbnailUrl(file.id);
        const previewUrl = googleDriveProvider.getPreviewUrl(file.id);

        if (!existing) {
          // NEW file — INSERT
          await prisma.mediaFile.create({
            data: {
              eventId,
              eventDayId,
              albumId,
              driveFileId: file.id,
              filename: file.name,
              mimeType: file.mimeType,
              fileSize: file.size ? BigInt(file.size) : null,
              width: file.imageMediaMetadata?.width ?? null,
              height: file.imageMediaMetadata?.height ?? null,
              thumbnailUrl,
              previewUrl,
              driveModifiedAt,
              status: "ACTIVE",
            },
          });
          result.addedFiles++;
        } else {
          // EXISTING — check if modified
          const existingModified = existing.driveModifiedAt;
          const wasModified =
            driveModifiedAt &&
            (!existingModified ||
              driveModifiedAt.getTime() > existingModified.getTime());

          if (wasModified) {
            await prisma.mediaFile.update({
              where: { id: existing.id },
              data: {
                filename: file.name,
                mimeType: file.mimeType,
                fileSize: file.size ? BigInt(file.size) : null,
                width: file.imageMediaMetadata?.width ?? null,
                height: file.imageMediaMetadata?.height ?? null,
                thumbnailUrl,
                previewUrl,
                driveModifiedAt,
                status: "ACTIVE",
              },
            });
            result.updatedFiles++;
          } else {
            result.skippedFiles++;
          }
        }
      } catch (error) {
        result.failedFiles++;
        result.errors.push(
          `Failed to sync ${file.name}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    // 4. Mark deleted files (in DB but not in Drive anymore)
    for (const [driveFileId, existingFile] of existingByDriveId) {
      if (!seenDriveIds.has(driveFileId)) {
        await prisma.mediaFile.update({
          where: { id: existingFile.id },
          data: { status: "DELETED" },
        });
        result.deletedFiles++;
      }
    }

    // 5. Update job to COMPLETED
    const finalStatus =
      result.failedFiles > 0
        ? result.addedFiles > 0 || result.updatedFiles > 0
          ? "PARTIAL"
          : "FAILED"
        : "COMPLETED";

    await prisma.syncJob.update({
      where: { id: jobId },
      data: {
        status: finalStatus,
        completedAt: new Date(),
        totalFiles: result.totalFiles,
        addedFiles: result.addedFiles,
        updatedFiles: result.updatedFiles,
        deletedFiles: result.deletedFiles,
        failedFiles: result.failedFiles,
        skippedFiles: result.skippedFiles,
        errorMessage: result.errors.length > 0 ? result.errors.join("\n") : null,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    result.errors.push(errorMessage);

    await prisma.syncJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        errorMessage,
      },
    });
  }

  return result;
}

/**
 * Create a sync job and start syncing an album
 */
export async function startAlbumSync(album: Album & { eventDayId: string }): Promise<SyncJob> {
  if (!album.driveFolderId) {
    throw new Error("Album has no Google Drive folder linked");
  }

  // Get event day to find event ID
  const eventDay = await prisma.eventDay.findUnique({
    where: { id: album.eventDayId },
    select: { eventId: true },
  });

  if (!eventDay) {
    throw new Error("Event day not found");
  }

  // Create sync job
  const job = await prisma.syncJob.create({
    data: {
      eventId: eventDay.eventId,
      albumId: album.id,
      provider: "GOOGLE_DRIVE",
      status: "QUEUED",
    },
  });

  // Run sync (in production this would be a background job)
  await syncAlbumFromDrive({
    eventId: eventDay.eventId,
    eventDayId: album.eventDayId,
    albumId: album.id,
    driveFolderId: album.driveFolderId,
    jobId: job.id,
  });

  // Return updated job
  return prisma.syncJob.findUnique({ where: { id: job.id } }) as Promise<SyncJob>;
}
