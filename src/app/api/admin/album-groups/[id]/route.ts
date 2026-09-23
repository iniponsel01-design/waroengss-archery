import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/client";
import { updateAlbumGroupSchema } from "@/lib/validation/schemas";
import { z } from "zod";

// PATCH /api/admin/album-groups/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (req) => {
    const { id } = await params;
    try {
      const body = await req.json();
      const data = updateAlbumGroupSchema.parse(body);

      const group = await prisma.albumGroup.update({
        where: { id },
        data,
      });

      return NextResponse.json({ success: true, data: group });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { success: false, error: "Validation failed", details: error.errors },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { success: false, error: "Update failed" },
        { status: 500 }
      );
    }
  });
}

// DELETE /api/admin/album-groups/[id]
// Album di dalam grup tidak dihapus — albumGroupId di-set NULL (ON DELETE SET NULL di FK)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (_req, session) => {
    const { id } = await params;
    try {
      const group = await prisma.albumGroup.findUnique({
        where: { id },
        select: { id: true, name: true, eventDayId: true },
      });
      if (!group) {
        return NextResponse.json(
          { success: false, error: "Album group not found" },
          { status: 404 }
        );
      }

      await prisma.albumGroup.delete({ where: { id } });

      await prisma.auditLog.create({
        data: {
          userId:   session!.userId,
          action:   "DELETE_ALBUM_GROUP",
          entity:   "AlbumGroup",
          entityId: id,
          metadata: { name: group.name },
        },
      });

      return NextResponse.json({ success: true });
    } catch {
      return NextResponse.json(
        { success: false, error: "Delete failed" },
        { status: 500 }
      );
    }
  });
}
