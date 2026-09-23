import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { withAdminAuth } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/client";
import { syncDayFoldersFromDrive } from "@/lib/sync/sync-engine";

/**
 * POST /api/admin/drive/sync-day
 * Scan sub-folder Drive untuk satu EventDay:
 *   - Sub-folder level 1 tanpa sub-folder → Album langsung (Mode B)
 *   - Sub-folder level 1 dengan sub-folder → AlbumGroup + Album (Mode A)
 * Auto-create AlbumGroup dan Album yang belum ada, lalu sync foto tiap album.
 *
 * Body: { eventDayId: string, dayFolderId: string }
 */
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req, session) => {
    try {
      const body = await req.json();
      const { eventDayId, dayFolderId } = body as {
        eventDayId: string;
        dayFolderId: string;
      };

      if (!eventDayId || !dayFolderId) {
        return NextResponse.json(
          { success: false, error: "eventDayId dan dayFolderId wajib diisi" },
          { status: 400 }
        );
      }

      const eventDay = await prisma.eventDay.findUnique({
        where: { id: eventDayId },
        select: { id: true, eventId: true, event: { select: { slug: true } } },
      });

      if (!eventDay) {
        return NextResponse.json(
          { success: false, error: "Event day not found" },
          { status: 404 }
        );
      }

      await prisma.auditLog.create({
        data: {
          userId:   session!.userId,
          action:   "SYNC_DAY_FOLDERS",
          entity:   "EventDay",
          entityId: eventDayId,
          metadata: { dayFolderId },
        },
      });

      // Jalankan sync (blocking — bisa lama untuk banyak album)
      // Untuk Day dengan banyak album, pertimbangkan background job
      const result = await syncDayFoldersFromDrive({
        eventId:    eventDay.eventId,
        eventDayId: eventDay.id,
        dayFolderId,
      });

      // Invalidate public cache
      if (eventDay.event.slug) {
        revalidatePath(`/e/${eventDay.event.slug}`);
        revalidatePath(`/e/${eventDay.event.slug}/day`, "page");
      }

      return NextResponse.json({ success: true, data: result });
    } catch (error) {
      console.error("Sync day folders error:", error);
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
