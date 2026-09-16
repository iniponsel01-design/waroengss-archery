/**
 * JWT Authentication utilities
 * Uses jose for edge-compatible JWT operations
 */

import { SignJWT, jwtVerify } from "jose";
import { config } from "@/config";
import type { AdminSession } from "@/types";

const secret = new TextEncoder().encode(config.auth.jwtSecret);

export async function signToken(payload: Omit<AdminSession, "iat" | "exp">): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(config.auth.jwtExpiresIn)
    .sign(secret);
}

export async function verifyToken(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as AdminSession;
  } catch {
    return null;
  }
}
