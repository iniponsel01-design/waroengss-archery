import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { googleDriveProvider } from "@/lib/storage/google-drive/provider";
import { getDriveClient } from "@/lib/storage/google-drive/client";

/**
 * Secure photo download endpoint
 * - Validates photo exists and is ACTIVE
 * - Downloads from Google Drive server-side using service account
 * - Streams the file to the client
 * - NEVER exposes credentials to the browser
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // 1. Look up photo in DB
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
    return NextResponse.json(
      { error: "Photo not found" },
      { status: 404 }
    );
  }

  try {
    // 2. Download from Google Drive using server-side service account
    const drive = await getDriveClient();

    const response = await drive.files.get(
      { fileId: photo.driveFileId, alt: "media" },
      { responseType: "arraybuffer" }
    );

    const buffer = Buffer.from(response.data as ArrayBuffer);

    // 3. Return as download response
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": photo.mimeType || "image/jpeg",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(photo.filename)}"`,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Failed to download photo" },
      { status: 500 }
    );
  }
}
