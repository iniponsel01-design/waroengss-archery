import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const position = searchParams.get("position") ?? undefined;

  const now = new Date();

  const banners = await prisma.banner.findMany({
    where: {
      isActive: true,
      ...(position ? { position: position as "HOME_TOP" | "HOME_BOTTOM" | "GALLERY_TOP" | "GALLERY_BOTTOM" } : {}),
      OR: [
        { startsAt: null },
        { startsAt: { lte: now } },
      ],
      AND: [
        {
          OR: [
            { endsAt: null },
            { endsAt: { gte: now } },
          ],
        },
      ],
    },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({ data: banners });
}
