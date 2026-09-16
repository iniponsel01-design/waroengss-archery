import { NextRequest, NextResponse } from "next/server";
import { eventRepository } from "@/repositories/event.repository";

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

  return NextResponse.json({ success: true, data: event });
}
