import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/client";
import { z } from "zod";

const adSlotSchema = z.object({
  name: z.string().min(1).max(100),
  position: z.enum([
    "HOME_BOTTOM",
    "EVENT_BOTTOM",
    "DAY_BOTTOM",
    "GALLERY_BOTTOM",
    "PHOTO_SIDEBAR",
  ]),
  adClient: z.string().min(1),
  adSlot: z.string().min(1),
  adFormat: z.string().default("auto"),
  isActive: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    const slots = await prisma.adSlot.findMany({ orderBy: { position: "asc" } });
    return NextResponse.json({ success: true, data: slots });
  });
}

export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const body = await req.json();
      const data = adSlotSchema.parse(body);
      const slot = await prisma.adSlot.create({ data });
      return NextResponse.json({ success: true, data: slot }, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ success: false, error: "Validation failed" }, { status: 400 });
      }
      return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
    }
  });
}
