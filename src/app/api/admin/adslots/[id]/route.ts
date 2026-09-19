import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/client";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  position: z.enum([
    "HOME_BOTTOM",
    "EVENT_BOTTOM",
    "DAY_BOTTOM",
    "GALLERY_BOTTOM",
    "PHOTO_SIDEBAR",
  ]).optional(),
  adClient: z.string().min(1).optional(),
  adSlot: z.string().min(1).optional(),
  adFormat: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (req) => {
    const { id } = await params;
    try {
      const body = await req.json();
      const data = updateSchema.parse(body);
      const slot = await prisma.adSlot.update({ where: { id }, data });
      return NextResponse.json({ success: true, data: slot });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ success: false, error: "Validation failed" }, { status: 400 });
      }
      return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
    }
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async () => {
    const { id } = await params;
    await prisma.adSlot.delete({ where: { id } });
    return NextResponse.json({ success: true });
  });
}
