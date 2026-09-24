import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

/**
 * Photo download endpoint
 *
 * Strategy: Redirect langsung ke Google Drive download URL.
 * Foto tidak diproxy melalui Vercel — menghemat bandwidth Vercel secara signifikan.
 *
 * Google Drive direct download URL bekerja selama folder sudah di-share (Anyone with link).
 * Credentials service account tidak diekspos ke browser karena kita hanya redirect ke URL publik Drive.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Validate photo in DB
  const photo = await prisma.mediaFile.findFirst({
    where: { id, status: "ACTIVE" },
    select: {
      id: true,
      driveFileId: true,
      filename: true,
      mimeType: true,
    },
  });

  if (!photo) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  // Redirect langsung ke Google Drive — tidak proxy melalui Vercel
  // URL ini bekerja untuk file dalam folder yang di-share "Anyone with link"
  const driveDownloadUrl = `https://drive.google.com/uc?export=download&id=${photo.driveFileId}&confirm=t`;

  return NextResponse.redirect(driveDownloadUrl, {
    status: 302,
    headers: {
      // Cache redirect 1 jam agar tidak bolak-balik ke server
      "Cache-Control": "public, max-age=3600",
    },
  });
}
