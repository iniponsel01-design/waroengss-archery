import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/client";
import { createEventDaySchema } from "@/lib/validation/schemas";
import { z } from "zod";

export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req, session) => {
    try {
      const body = await req.json();
      const data = createEventDaySchema.parse(body);

      // Check event exists
      const event = await prisma.event.findUnique({ where: { id: data.eventId } });
      if (!event) {
        return NextResponse.json(
          { success: false, error: "Event not found" },
          { status: 404 }
        );
      }

      const day = await prisma.eventDay.create({
        data: {
          eventId: data.eventId,
          dayNumber: data.dayNumber,
          title: data.title,
          description: data.description,
          date: data.date ? new Date(data.date) : null,
          sortOrder: data.sortOrder,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: session!.userId,
          action: "CREATE_EVENT_DAY",
          entity: "EventDay",
          entityId: day.id,
        },
      });

      return NextResponse.json({ success: true, data: day }, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { success: false, error: "Validation failed", details: error.errors },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}
