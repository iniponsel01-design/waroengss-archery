import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/client";
import { createAlbumGroupSchema } from "@/lib/validation/schemas";
import { z } from "zod";

// POST /api/admin/album-groups — buat AlbumGroup baru
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req, session) => {
    try {
      const body = await req.json();
      const data = createAlbumGroupSchema.parse(body);

      // Pastikan eventDay ada
      const eventDay = await prisma.eventDay.findUnique({
        where: { id: data.eventDayId },
      });
      if (!eventDay) {
        return NextResponse.json(
          { success: false, error: "Event day not found" },
          { status: 404 }
        );
      }

      const group = await prisma.albumGroup.create({
        data: {
          eventDayId:  data.eventDayId,
          name:        data.name,
          slug:        data.slug,
          description: data.description ?? null,
          sortOrder:   data.sortOrder ?? 0,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId:   session!.userId,
          action:   "CREATE_ALBUM_GROUP",
          entity:   "AlbumGroup",
          entityId: group.id,
        },
      });

      return NextResponse.json({ success: true, data: group }, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { success: false, error: "Validation failed", details: error.errors },
          { status: 400 }
        );
      }
      console.error("Create album group error:", error);
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}
