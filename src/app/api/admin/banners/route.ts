import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/client";
import { z } from "zod";

const bannerSchema = z.object({
  title: z.string().min(1).max(200),
  subtitle: z.string().max(300).optional().nullable(),
  imageUrl: z.string().url().optional().nullable().or(z.literal("")),
  linkUrl: z.string().optional().nullable(),
  linkLabel: z.string().max(50).optional().nullable(),
  bgColor: z.string().default("#1e293b"),
  textColor: z.string().default("#ffffff"),
  type: z.enum(["PROMO", "ANNOUNCEMENT", "SPONSOR"]).default("PROMO"),
  position: z.enum(["HOME_TOP", "HOME_BOTTOM", "GALLERY_TOP", "GALLERY_BOTTOM"]).default("HOME_TOP"),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
});

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    const banners = await prisma.banner.findMany({ orderBy: [{ position: "asc" }, { sortOrder: "asc" }] });
    return NextResponse.json({ success: true, data: banners });
  });
}

export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const body = await req.json();
      const data = bannerSchema.parse(body);
      const banner = await prisma.banner.create({
        data: {
          ...data,
          imageUrl: data.imageUrl || null,
          linkUrl: data.linkUrl || null,
          startsAt: data.startsAt ? new Date(data.startsAt) : null,
          endsAt: data.endsAt ? new Date(data.endsAt) : null,
        },
      });
      return NextResponse.json({ success: true, data: banner }, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ success: false, error: "Validation failed", details: error.errors }, { status: 400 });
      }
      return NextResponse.json({ success: false, error: "Failed to create banner" }, { status: 500 });
    }
  });
}
