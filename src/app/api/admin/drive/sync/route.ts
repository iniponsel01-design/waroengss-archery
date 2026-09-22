import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/client";
import { syncAlbumFromDrive } from "@/lib/sync/sync-engine";

// POST /api/admin/drive/sync — trigger sync for an album (async, non-blocking)
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req, session) => {
    try {
      const body = await req.json();
      const { albumId } = body as { albumId: string };

      if (!albumId) {
        return NextResponse.json(
          { success: false, error: "albumId is required" },
          { status: 400 }
        );
      }

      const album = await prisma.album.findUnique({
        where: { id: albumId },
        include: { eventDay: true },
      });

      if (!album) {
        return NextResponse.json(
          { success: false, error: "Album not found" },
          { status: 404 }
        );
      }

      if (!album.driveFolderId) {
        return NextResponse.json(
          { success: false, error: "Album has no Google Drive folder linked" },
          { status: 400 }
        );
      }

      await prisma.auditLog.create({
        data: {
          userId: session!.userId,
          action: "START_SYNC",
          entity: "Album",
          entityId: albumId,
        },
      });

      // Buat sync job di DB dengan status QUEUED terlebih dahulu
      const eventDay = await prisma.eventDay.findUnique({
        where: { id: album.eventDayId },
        select: { eventId: true },
      });

      if (!eventDay) {
        return NextResponse.json(
          { success: false, error: "Event day not found" },
          { status: 404 }
        );
      }

      const job = await prisma.syncJob.create({
        data: {
          eventId: eventDay.eventId,
          albumId: album.id,
          provider: "GOOGLE_DRIVE",
          status: "QUEUED",
        },
      });

      // Fire-and-forget — sync jalan di background, tidak memblokir response.
      // Client polling GET /api/admin/drive/sync?eventId=... untuk status.
      void syncAlbumFromDrive({
        eventId: eventDay.eventId,
        eventDayId: album.eventDayId,
        albumId: album.id,
        driveFolderId: album.driveFolderId,
        jobId: job.id,
      });

      // Langsung 202 — job sudah terdaftar, sync berjalan async
      return NextResponse.json(
        { success: true, data: { jobId: job.id, status: "QUEUED" } },
        { status: 202 }
      );
    } catch (error) {
      console.error("Sync error:", error);
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Sync failed",
        },
        { status: 500 }
      );
    }
  });
}

// GET /api/admin/drive/sync — list recent sync jobs
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId") ?? undefined;
    const jobId = searchParams.get("jobId") ?? undefined;
    const limit = parseInt(searchParams.get("limit") ?? "20");

    // Single job status — dipakai oleh client polling setelah 202
    if (jobId) {
      const job = await prisma.syncJob.findUnique({
        where: { id: jobId },
        include: {
          album: { select: { id: true, name: true } },
          event: { select: { id: true, title: true, slug: true } },
        },
      });
      if (!job) {
        return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: job });
    }

    const jobs = await prisma.syncJob.findMany({
      where: eventId ? { eventId } : {},
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 100),
      include: {
        album: { select: { id: true, name: true } },
        event: { select: { id: true, title: true, slug: true } },
      },
    });

    return NextResponse.json({ success: true, data: jobs });
  });
}
