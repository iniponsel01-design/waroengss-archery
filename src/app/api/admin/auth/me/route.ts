import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/middleware";

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (_req, session) => {
    return NextResponse.json({ success: true, data: session });
  });
}
