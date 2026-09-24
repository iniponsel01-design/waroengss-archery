import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

/**
 * GET /api/albums/:albumId/download-zip
 *
 * Mengembalikan daftar link download individual langsung ke Google Drive.
 * Tidak proxy melalui Vercel — menghemat bandwidth free tier.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ albumId: string }> }
) {
  const { albumId } = await params;

  const album = await prisma.album.findFirst({
    where: { id: albumId, status: "ACTIVE" },
    select: { id: true, name: true },
  });

  if (!album) {
    return NextResponse.json({ error: "Album not found" }, { status: 404 });
  }

  const photos = await prisma.mediaFile.findMany({
    where: { albumId, status: "ACTIVE" },
    select: { id: true, driveFileId: true, filename: true, displayName: true },
    orderBy: [{ sortOrder: "asc" }, { filename: "asc" }],
  });

  if (photos.length === 0) {
    return NextResponse.json({ error: "No photos in album" }, { status: 404 });
  }

  const downloadLinks = photos.map((p) => ({
    id: p.id,
    name: p.displayName ?? p.filename,
    url: `https://drive.google.com/uc?export=download&id=${p.driveFileId}&confirm=t`,
  }));

  return NextResponse.json({
    albumName: album.name,
    total: photos.length,
    downloads: downloadLinks,
    note: "Download satu per satu atau gunakan download manager untuk semua sekaligus",
  });
}
