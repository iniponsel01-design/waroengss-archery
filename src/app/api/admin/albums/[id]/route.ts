import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/client";
import { z } from "zod";

const updateAlbumSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().max(1000).optional().nullable(),
  driveFolderId: z.string().optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  status: z.enum(["ACTIVE", "HIDDEN"]).optional(),
});

// PATCH /api/admin/albums/:id
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (req) => {
    const { id } = await params;
    try {
      const body = await req.json();
      const data = updateAlbumSchema.parse(body);

      const album = await prisma.album.update({
        where: { id },
        data,
      });

      return NextResponse.json({ success: true, data: album });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ success: false, error: "Validation failed" }, { status: 400 });
      }
      return NextResponse.json({ success: false, error: "Update failed" }, { status: 500 });
    }
  });
}

// DELETE /api/admin/albums/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async () => {
    const { id } = await params;
    try {
      await prisma.album.delete({ where: { id } });
      return NextResponse.json({ success: true });
    } catch {
      return NextResponse.json({ success: false, error: "Delete failed" }, { status: 500 });
    }
  });
}
