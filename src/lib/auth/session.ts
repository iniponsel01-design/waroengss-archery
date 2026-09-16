/**
 * Session management for admin authentication
 */

import { cookies } from "next/headers";
import { verifyToken } from "./jwt";
import { config } from "@/config";
import type { AdminSession } from "@/types";

export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(config.auth.cookieName)?.value;
    if (!token) return null;
    return await verifyToken(token);
  } catch {
    return null;
  }
}

export async function requireAdminSession(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export function createSessionCookieOptions() {
  return {
    name: config.auth.cookieName,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  };
}
