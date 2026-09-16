import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/client";
import { startAlbumSync } from "@/lib/sync/sync-engine";

// POST /api/admin/drive/sync — trigger sync for an album
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

      // Start sync (runs in-request for V1; use background job in production)
      const job = await startAlbumSync({
        ...album,
        eventDayId: album.eventDayId,
      });

      return NextResponse.json({ success: true, data: job });
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
    const limit = parseInt(searchParams.get("limit") ?? "20");

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
