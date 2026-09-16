import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/middleware";
import { eventRepository } from "@/repositories/event.repository";
import { createEventSchema } from "@/lib/validation/schemas";
import { z } from "zod";
import { prisma } from "@/lib/db/client";

// GET /api/admin/events — list all events
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const search = searchParams.get("q") ?? undefined;

    const result = await eventRepository.listAll({ page, search });
    return NextResponse.json({ success: true, ...result });
  });
}

// POST /api/admin/events — create event
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req, session) => {
    try {
      const body = await req.json();
      const data = createEventSchema.parse(body);

      // Check slug uniqueness
      const slugExists = await eventRepository.slugExists(data.slug);
      if (slugExists) {
        return NextResponse.json(
          { success: false, error: "Slug already exists" },
          { status: 409 }
        );
      }

      const event = await eventRepository.create(data);

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: session!.userId,
          action: "CREATE_EVENT",
          entity: "Event",
          entityId: event.id,
          metadata: { title: event.title, slug: event.slug },
        },
      });

      return NextResponse.json({ success: true, data: event }, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { success: false, error: "Validation failed", details: error.errors },
          { status: 400 }
        );
      }
      console.error("Create event error:", error);
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}
