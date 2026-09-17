import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/client";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  subtitle: z.string().max(300).optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  linkUrl: z.string().optional().nullable(),
  linkLabel: z.string().max(50).optional().nullable(),
  bgColor: z.string().optional(),
  textColor: z.string().optional(),
  type: z.enum(["PROMO", "ANNOUNCEMENT", "SPONSOR"]).optional(),
  position: z.enum(["HOME_TOP", "HOME_BOTTOM", "GALLERY_TOP", "GALLERY_BOTTOM"]).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
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
      const banner = await prisma.banner.update({
        where: { id },
        data: {
          ...data,
          startsAt: data.startsAt ? new Date(data.startsAt) : data.startsAt,
          endsAt: data.endsAt ? new Date(data.endsAt) : data.endsAt,
        },
      });
      return NextResponse.json({ success: true, data: banner });
    } catch {
      return NextResponse.json({ success: false, error: "Update failed" }, { status: 500 });
    }
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async () => {
    const { id } = await params;
    await prisma.banner.delete({ where: { id } });
    return NextResponse.json({ success: true });
  });
}
