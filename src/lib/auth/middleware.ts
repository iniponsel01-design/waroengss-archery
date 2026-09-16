/**
 * Auth middleware helpers for API routes
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./jwt";
import { config } from "@/config";

export async function withAdminAuth(
  request: NextRequest,
  handler: (req: NextRequest, session: Awaited<ReturnType<typeof verifyToken>>) => Promise<NextResponse>
): Promise<NextResponse> {
  const token = request.cookies.get(config.auth.cookieName)?.value;

  if (!token) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const session = await verifyToken(token);

  if (!session) {
    return NextResponse.json({ success: false, error: "Invalid or expired session" }, { status: 401 });
  }

  return handler(request, session);
}
