import { NextRequest, NextResponse } from "next/server";
import { mediaRepository } from "@/repositories/media.repository";
import { eventRepository } from "@/repositories/event.repository";
import { searchSchema } from "@/lib/validation/schemas";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = searchSchema.parse(Object.fromEntries(searchParams));

    if (!params.eventSlug) {
      return NextResponse.json(
        { success: false, error: "eventSlug is required" },
        { status: 400 }
      );
    }

    const event = await eventRepository.findPublishedBySlug(params.eventSlug);
    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      );
    }

    const result = await mediaRepository.search({
      ...params,
      eventId: event.id,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid search parameters" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Search failed" },
      { status: 500 }
    );
  }
}
