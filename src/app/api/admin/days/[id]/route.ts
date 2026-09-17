import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/client";
import { z } from "zod";

const updateDaySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  date: z.string().datetime().optional().nullable(),
  sortOrder: z.number().int().optional(),
  status: z.enum(["ACTIVE", "HIDDEN"]).optional(),
});

// PATCH /api/admin/days/:id
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (req) => {
    const { id } = await params;
    try {
      const body = await req.json();
      const data = updateDaySchema.parse(body);

      const day = await prisma.eventDay.update({
        where: { id },
        data: {
          ...data,
          date: data.date ? new Date(data.date) : data.date,
        },
      });

      return NextResponse.json({ success: true, data: day });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ success: false, error: "Validation failed" }, { status: 400 });
      }
      return NextResponse.json({ success: false, error: "Update failed" }, { status: 500 });
    }
  });
}

// DELETE /api/admin/days/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async () => {
    const { id } = await params;
    try {
      await prisma.eventDay.delete({ where: { id } });
      return NextResponse.json({ success: true });
    } catch {
      return NextResponse.json({ success: false, error: "Delete failed" }, { status: 500 });
    }
  });
}
