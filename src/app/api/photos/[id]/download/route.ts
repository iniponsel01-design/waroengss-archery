import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getDriveClient } from "@/lib/storage/google-drive/client";

/**
 * Secure photo download endpoint
 *
 * Strategy:
 * 1. Validate photo exists and is ACTIVE in DB
 * 2. Download from Google Drive server-side (credentials never reach browser)
 * 3. Stream file to client as attachment
 *
 * Credentials are NEVER sent to the browser.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // 1. Validate photo in DB
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

  try {
    // 2. Download from Drive via service account (server-side only)
    const drive = await getDriveClient();

    const response = await drive.files.get(
      { fileId: photo.driveFileId, alt: "media" },
      { responseType: "arraybuffer" }
    );

    const buffer = Buffer.from(response.data as ArrayBuffer);

    // 3. Return as download
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": photo.mimeType || "image/jpeg",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(photo.filename)}`,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Download error for", photo.driveFileId, error);

    // Fallback: redirect to Drive direct download
    // Note: this may fail for private files — but keeps UX working
    const fallbackUrl = `https://drive.google.com/uc?export=download&id=${photo.driveFileId}`;
    return NextResponse.redirect(fallbackUrl, { status: 302 });
  }
}
