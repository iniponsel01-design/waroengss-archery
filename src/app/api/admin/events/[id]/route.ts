import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/middleware";
import { eventRepository } from "@/repositories/event.repository";
import { updateEventSchema } from "@/lib/validation/schemas";
import { z } from "zod";
import { prisma } from "@/lib/db/client";

// GET /api/admin/events/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async () => {
    const { id } = await params;
    const event = await eventRepository.findById(id);
    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: event });
  });
}

// PATCH /api/admin/events/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (req, session) => {
    const { id } = await params;

    try {
      const body = await req.json();
      const data = updateEventSchema.parse(body);

      // Check slug uniqueness if changing
      if (data.slug) {
        const slugExists = await eventRepository.slugExists(data.slug, id);
        if (slugExists) {
          return NextResponse.json(
            { success: false, error: "Slug already exists" },
            { status: 409 }
          );
        }
      }

      const event = await eventRepository.update(id, data);

      await prisma.auditLog.create({
        data: {
          userId: session!.userId,
          action: "UPDATE_EVENT",
          entity: "Event",
          entityId: id,
          metadata: { changes: Object.keys(data) },
        },
      });

      return NextResponse.json({ success: true, data: event });
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

// DELETE /api/admin/events/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (_req, session) => {
    const { id } = await params;

    const event = await eventRepository.findById(id);
    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      );
    }

    await eventRepository.delete(id);

    await prisma.auditLog.create({
      data: {
        userId: session!.userId,
        action: "DELETE_EVENT",
        entity: "Event",
        entityId: id,
        metadata: { title: event.title },
      },
    });

    return NextResponse.json({ success: true });
  });
}
