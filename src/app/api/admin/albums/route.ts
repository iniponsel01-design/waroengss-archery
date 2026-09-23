import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/client";
import { createAlbumSchema } from "@/lib/validation/schemas";
import { z } from "zod";

export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req, session) => {
    try {
      const body = await req.json();
      const data = createAlbumSchema.parse(body);

      const album = await prisma.album.create({
        data: {
          eventDayId:   data.eventDayId,
          albumGroupId: data.albumGroupId ?? null,
          name:         data.name,
          slug:         data.slug,
          description:  data.description,
          driveFolderId: data.driveFolderId,
          sortOrder:    data.sortOrder,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: session!.userId,
          action: "CREATE_ALBUM",
          entity: "Album",
          entityId: album.id,
        },
      });

      return NextResponse.json({ success: true, data: album }, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { success: false, error: "Validation failed", details: error.errors },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}
