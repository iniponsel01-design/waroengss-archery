/**
 * Server-side auth helper untuk Server Components (pages)
 * Berbeda dari middleware.ts yang hanya untuk API routes.
 */

import { cookies } from "next/headers";
import { verifyToken } from "./jwt";
import { config } from "@/config";

/**
 * Verifikasi session admin dari Server Component.
 * Return session jika valid, null jika tidak.
 */
export async function withAdminAuthServer() {
  const cookieStore = await cookies();
  const token = cookieStore.get(config.auth.cookieName)?.value;
  if (!token) return null;
  return verifyToken(token);
}
