import { NextResponse } from "next/server";
import { config } from "@/config";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(config.auth.cookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
