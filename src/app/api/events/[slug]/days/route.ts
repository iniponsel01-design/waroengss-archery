import { NextRequest, NextResponse } from "next/server";
import { eventRepository } from "@/repositories/event.repository";
import { prisma } from "@/lib/db/client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const event = await eventRepository.findPublishedBySlug(slug);
  if (!event) {
    return NextResponse.json(
      { success: false, error: "Event not found" },
      { status: 404 }
    );
  }

  const days = await prisma.eventDay.findMany({
    where: { eventId: event.id, status: "ACTIVE" },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: {
        select: {
          albums: { where: { status: "ACTIVE" } },
          mediaFiles: { where: { status: "ACTIVE" } },
        },
      },
    },
  });

  return NextResponse.json({ success: true, data: days });
}
