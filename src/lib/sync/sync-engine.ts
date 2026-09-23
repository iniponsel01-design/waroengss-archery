/**
 * Sync Engine
 * Incremental sync from Google Drive to PostgreSQL
 * Flow: Drive → Discover → Compare DB → INSERT/UPDATE/SKIP/MARK_DELETED
 *
 * Dua mode sync:
 * 1. syncAlbumFromDrive()       — sync foto dalam SATU album (folder Drive → Album di DB)
 * 2. syncDayFoldersFromDrive()  — scan sub-folder di Day folder Drive:
 *      - sub-folder level 1 → AlbumGroup (contoh: "Sesi 1")
 *      - sub-folder level 2 → Album (contoh: "Matches")
 *      - jika tidak ada sub-folder → langsung jadi Album (backward compatible)
 */

import { prisma } from "@/lib/db/client";
import { googleDriveProvider } from "@/lib/storage/google-drive/provider";
import type { DriveFile, SyncResult } from "@/types";
import type { Album, SyncJob } from "@prisma/client";
import { generateDisplayName } from "@/lib/utils/display-name";
import { generateSlug } from "@/lib/utils/slug";

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

    // Load album + event metadata untuk display name generation
    const albumMeta = await prisma.album.findUnique({
      where: { id: albumId },
      select: {
        slug: true,
        eventDay: {
          select: {
            dayNumber: true,
            event: { select: { slug: true } },
          },
        },
      },
    });
    const eventSlug  = albumMeta?.eventDay.event.slug  ?? "event";
    const dayNumber  = albumMeta?.eventDay.dayNumber    ?? 1;
    const albumSlug  = albumMeta?.slug                  ?? "album";

    // 2. Get ALL existing media files for this album from DB (termasuk DELETED)
    // — include DELETED agar upsert tidak conflict jika file yang sama pernah di-delete
    const existingMedia = await prisma.mediaFile.findMany({
      where: { albumId },
      select: { id: true, driveFileId: true, driveModifiedAt: true, displayName: true, status: true },
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

        // Position 1-based — pakai index di imageFiles (sudah diurutkan by name dari Drive)
        const position = imageFiles.indexOf(file) + 1;
        const displayName = generateDisplayName({ eventSlug, dayNumber, albumSlug, position });

        if (!existing) {
          // NEW file — upsert by driveFileId untuk hindari race condition
          // (jika job lain sudah INSERT duluan, update saja)
          await prisma.mediaFile.upsert({
            where: { driveFileId: file.id },
            create: {
              eventId,
              eventDayId,
              albumId,
              driveFileId: file.id,
              filename: file.name,
              displayName,
              mimeType: file.mimeType,
              fileSize: file.size ? BigInt(file.size) : null,
              width: file.imageMediaMetadata?.width ?? null,
              height: file.imageMediaMetadata?.height ?? null,
              thumbnailUrl,
              previewUrl,
              driveModifiedAt,
              status: "ACTIVE",
            },
            update: {
              filename: file.name,
              displayName,
              mimeType: file.mimeType,
              fileSize: file.size ? BigInt(file.size) : null,
              width: file.imageMediaMetadata?.width ?? null,
              height: file.imageMediaMetadata?.height ?? null,
              thumbnailUrl,
              previewUrl,
              driveModifiedAt,
              status: "ACTIVE",   // reaktivasi jika sebelumnya DELETED
            },
          });
          result.addedFiles++;
        } else if (existing.status === "DELETED") {
          // File pernah dihapus dari Drive lalu muncul lagi — reaktivasi
          await prisma.mediaFile.update({
            where: { id: existing.id },
            data: {
              filename: file.name,
              displayName: existing.displayName ?? displayName,
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
          // EXISTING ACTIVE/HIDDEN — check if modified
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
                ...(existing.displayName ? {} : { displayName }),
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
            if (!existing.displayName) {
              await prisma.mediaFile.update({
                where: { id: existing.id },
                data: { displayName },
              });
            }
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
 * @deprecated Gunakan pola di sync/route.ts:
 *   1. Buat SyncJob (status QUEUED)
 *   2. void syncAlbumFromDrive(...)   ← fire-and-forget
 *   3. Return 202 langsung ke client
 *
 * Fungsi ini masih blocking dan hanya cocok untuk script CLI/seeder.
 */
export async function startAlbumSync(album: Album & { eventDayId: string }): Promise<SyncJob> {
  if (!album.driveFolderId) {
    throw new Error("Album has no Google Drive folder linked");
  }

  const eventDay = await prisma.eventDay.findUnique({
    where: { id: album.eventDayId },
    select: { eventId: true },
  });

  if (!eventDay) {
    throw new Error("Event day not found");
  }

  const job = await prisma.syncJob.create({
    data: {
      eventId: eventDay.eventId,
      albumId: album.id,
      provider: "GOOGLE_DRIVE",
      status: "QUEUED",
    },
  });

  // Blocking — jangan panggil dari HTTP request handler
  await syncAlbumFromDrive({
    eventId: eventDay.eventId,
    eventDayId: album.eventDayId,
    albumId: album.id,
    driveFolderId: album.driveFolderId,
    jobId: job.id,
  });

  return prisma.syncJob.findUnique({ where: { id: job.id } }) as Promise<SyncJob>;
}

// ─────────────────────────────────────────────────────────────
// SUB-FOLDER SYNC
// ─────────────────────────────────────────────────────────────

export interface SyncDayFoldersOptions {
  eventId: string;
  eventDayId: string;
  /** Drive folder ID milik Day (berisi sub-folder grup/album) */
  dayFolderId: string;
}

export interface SyncDayFoldersResult {
  groupsCreated: number;
  groupsUpdated: number;
  albumsCreated: number;
  albumsUpdated: number;
  /** Tiap entry = hasil syncAlbumFromDrive untuk album yang di-sync */
  albumSyncResults: Array<{ albumId: string; albumName: string; result: SyncResult }>;
  errors: string[];
}

/**
 * syncDayFoldersFromDrive
 *
 * Scan sub-folder di dayFolderId (Drive folder milik EventDay):
 *
 * Mode A — sub-folder memiliki sub-folder lagi (2 level):
 *   dayFolder/
 *     Sesi 1/            → AlbumGroup "Sesi 1"
 *       Matches/         → Album "Matches" (isi foto)
 *       UPP/             → Album "UPP" (isi foto)
 *     Sesi 2/            → AlbumGroup "Sesi 2"
 *       Matches/         → Album "Matches"
 *
 * Mode B — sub-folder langsung berisi foto (1 level, backward compatible):
 *   dayFolder/
 *     Matches/           → Album "Matches" (langsung, tanpa grup)
 *     UPP/               → Album "UPP"
 *
 * Mode deteksi: cek apakah sub-folder level 1 punya sub-sub-folder.
 * Jika ya → Mode A. Jika tidak → Mode B.
 * Mixed (sebagian punya sub-folder) → yang punya sub-folder jadi grup, yang tidak jadi album langsung.
 */
export async function syncDayFoldersFromDrive(
  options: SyncDayFoldersOptions
): Promise<SyncDayFoldersResult> {
  const { eventId, eventDayId, dayFolderId } = options;

  const result: SyncDayFoldersResult = {
    groupsCreated: 0,
    groupsUpdated: 0,
    albumsCreated: 0,
    albumsUpdated: 0,
    albumSyncResults: [],
    errors: [],
  };

  // 1. List semua sub-folder langsung di dayFolder
  const level1Folders = await googleDriveProvider.listFolders(dayFolderId);

  for (const l1 of level1Folders) {
    try {
      // 2. Cek apakah level-1 folder punya sub-folder (Mode A) atau tidak (Mode B)
      const level2Folders = await googleDriveProvider.listFolders(l1.id);

      if (level2Folders.length > 0) {
        // ── Mode A: l1 = AlbumGroup, l2 = Album ──────────────
        const groupSlug = generateSlug(l1.name);

        // Upsert AlbumGroup
        const existingGroup = await prisma.albumGroup.findFirst({
          where: { eventDayId, slug: groupSlug },
        });

        let group;
        if (existingGroup) {
          group = await prisma.albumGroup.update({
            where: { id: existingGroup.id },
            data: { name: l1.name, status: "ACTIVE" },
          });
          result.groupsUpdated++;
        } else {
          // Hitung sortOrder dari jumlah grup yang sudah ada
          const groupCount = await prisma.albumGroup.count({ where: { eventDayId } });
          group = await prisma.albumGroup.create({
            data: {
              eventDayId,
              name:      l1.name,
              slug:      groupSlug,
              sortOrder: groupCount,
              status:    "ACTIVE",
            },
          });
          result.groupsCreated++;
        }

        // Upsert Album untuk tiap sub-folder level-2
        for (const l2 of level2Folders) {
          const albumResult = await upsertAlbumAndSync({
            eventId,
            eventDayId,
            albumGroupId: group.id,
            folderName:   l2.name,
            driveFolderId: l2.id,
            result,
          });
          if (albumResult) {
            result.albumSyncResults.push({
              albumId:   albumResult.albumId,
              albumName: l2.name,
              result:    albumResult.syncResult,
            });
          }
        }
      } else {
        // ── Mode B: l1 langsung jadi Album (tanpa grup) ───────
        const albumResult = await upsertAlbumAndSync({
          eventId,
          eventDayId,
          albumGroupId: null,
          folderName:   l1.name,
          driveFolderId: l1.id,
          result,
        });
        if (albumResult) {
          result.albumSyncResults.push({
            albumId:   albumResult.albumId,
            albumName: l1.name,
            result:    albumResult.syncResult,
          });
        }
      }
    } catch (err) {
      result.errors.push(
        `Error processing folder "${l1.name}": ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return result;
}

/** Helper: upsert Album di DB lalu sync foto-fotonya */
async function upsertAlbumAndSync(opts: {
  eventId:      string;
  eventDayId:   string;
  albumGroupId: string | null;
  folderName:   string;
  driveFolderId: string;
  result:       SyncDayFoldersResult;
}): Promise<{ albumId: string; syncResult: SyncResult } | null> {
  const { eventId, eventDayId, albumGroupId, folderName, driveFolderId, result } = opts;
  const slug = generateSlug(folderName);

  try {
    // Cari album yang sudah ada berdasarkan driveFolderId (paling akurat) atau slug
    let album = await prisma.album.findFirst({
      where: { driveFolderId, eventDayId },
    });

    if (!album) {
      // Coba match by slug (album mungkin ada tapi belum linked ke Drive)
      album = await prisma.album.findFirst({
        where: { eventDayId, slug },
      });
    }

    if (album) {
      // Update album yang sudah ada
      album = await prisma.album.update({
        where: { id: album.id },
        data: {
          name:          folderName,
          driveFolderId: driveFolderId,
          albumGroupId:  albumGroupId,
          status:        "ACTIVE",
        },
      });
      result.albumsUpdated++;
    } else {
      // Buat album baru
      const albumCount = await prisma.album.count({
        where: albumGroupId ? { albumGroupId } : { eventDayId, albumGroupId: null },
      });
      album = await prisma.album.create({
        data: {
          eventDayId,
          albumGroupId,
          name:          folderName,
          slug,
          driveFolderId: driveFolderId,
          sortOrder:     albumCount,
          status:        "ACTIVE",
        },
      });
      result.albumsCreated++;
    }

    // Buat SyncJob dan sync foto (memakai guard duplikat yang sudah ada di route.ts)
    const existingActiveJob = await prisma.syncJob.findFirst({
      where: { albumId: album.id, status: { in: ["QUEUED", "RUNNING"] } },
    });

    if (existingActiveJob) {
      // Skip — sudah ada job aktif
      return null;
    }

    const job = await prisma.syncJob.create({
      data: {
        eventId,
        albumId:  album.id,
        provider: "GOOGLE_DRIVE",
        status:   "QUEUED",
      },
    });

    const syncResult = await syncAlbumFromDrive({
      eventId,
      eventDayId,
      albumId:       album.id,
      driveFolderId: driveFolderId,
      jobId:         job.id,
    });

    return { albumId: album.id, syncResult };
  } catch (err) {
    result.errors.push(
      `Error upserting/syncing album "${folderName}": ${err instanceof Error ? err.message : String(err)}`
    );
    return null;
  }
}
