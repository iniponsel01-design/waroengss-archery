import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

/**
 * Photo download endpoint
 *
 * Redirect ke Google Drive usercontent — browser langsung download dari Google,
 * tidak proxy melalui Vercel. Terasa seperti download dari web biasa.
 *
 * URL format: https://drive.usercontent.google.com/download?id=DRIVE_FILE_ID&export=download&authuser=0
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const photo = await prisma.mediaFile.findFirst({
    where: { id, status: "ACTIVE" },
    select: { driveFileId: true, filename: true },
  });

  if (!photo) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  // Redirect ke Google Drive usercontent — download langsung dari Google
  const downloadUrl =
    `https://drive.usercontent.google.com/download?id=${photo.driveFileId}&export=download&authuser=0`;

  return NextResponse.redirect(downloadUrl, {
    status: 302,
    headers: {
      // Cache 1 jam — sama file tidak perlu hit server lagi
      "Cache-Control": "public, max-age=3600",
    },
  });
}
