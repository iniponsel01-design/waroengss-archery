import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const position = searchParams.get("position") ?? undefined;

  const slots = await prisma.adSlot.findMany({
    where: {
      isActive: true,
      ...(position ? { position: position as "HOME_BOTTOM" | "GALLERY_BOTTOM" | "PHOTO_SIDEBAR" } : {}),
    },
    orderBy: { position: "asc" },
  });

  return NextResponse.json({ data: slots });
}
