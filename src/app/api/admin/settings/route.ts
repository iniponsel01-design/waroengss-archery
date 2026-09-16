import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/client";
import { updateSettingSchema } from "@/lib/validation/schemas";
import { z } from "zod";

export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const body = await req.json();
      const { key, value } = updateSettingSchema.parse(body);

      await prisma.siteSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ success: false, error: "Invalid data" }, { status: 400 });
      }
      return NextResponse.json({ success: false, error: "Failed to save setting" }, { status: 500 });
    }
  });
}
