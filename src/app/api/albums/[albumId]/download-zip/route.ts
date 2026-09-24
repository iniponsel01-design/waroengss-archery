import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

/**
 * GET /api/albums/:albumId/download-zip
 *
 * Karena keterbatasan bandwidth Vercel free tier,
 * endpoint ini mengembalikan daftar link download individual
 * alih-alih stream ZIP melalui server.
 *
 * Client akan menerima JSON berisi array driveDownloadUrl
 * dan bisa download satu per satu atau menggunakan download manager.
 *
 * Untuk ZIP sebenarnya, upgrade ke Vercel Pro atau gunakan
 * layanan storage sendiri (R2/S3).
 */
export async function GET(
  request: NextRequest,
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

  // Kembalikan daftar link download langsung ke Drive
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


/**
 * GET /api/albums/:albumId/download-zip
 * Stream semua foto dalam album sebagai ZIP.
 * Menggunakan fflate (pure-JS zip) atau streaming per-file.
 *
 * Karena tidak ada library zip bawaan di edge/serverless,
 * kita gunakan pendekatan sederhana: redirect ke halaman konfirmasi
 * yang download satu per satu, ATAU stream ZIP menggunakan fflate.
 *
 * Catatan: untuk album besar (500+ foto), disarankan generate ZIP
 * secara async dan kirim link download. Implementasi saat ini
 * langsung stream — cocok untuk album <100 foto.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ albumId: string }> }
) {
  const { albumId } = await params;

  const album = await prisma.album.findFirst({
    where: { id: albumId, status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      eventDay: { select: { event: { select: { slug: true } } } },
    },
  });

  if (!album) {
    return NextResponse.json({ error: "Album not found" }, { status: 404 });
  }

  const photos = await prisma.mediaFile.findMany({
    where: { albumId, status: "ACTIVE" },
    select: { id: true, driveFileId: true, filename: true, displayName: true },
    orderBy: [{ sortOrder: "asc" }, { filename: "asc" }],
    take: 200,   // batas keamanan — album besar perlu async job
  });

  if (photos.length === 0) {
    return NextResponse.json({ error: "No photos in album" }, { status: 404 });
  }

  // Jika album >200 foto, kembalikan pesan informatif
  const totalCount = await prisma.mediaFile.count({ where: { albumId, status: "ACTIVE" } });
  if (totalCount > 200) {
    return NextResponse.json(
      { error: `Album ini punya ${totalCount} foto. Download ZIP hanya tersedia untuk album ≤200 foto saat ini.` },
      { status: 413 }
    );
  }

  try {
    const drive = await getDriveClient();

    // Stream ZIP menggunakan fflate jika tersedia, fallback ke multipart
    // Implementasi sederhana: kumpulkan semua file lalu zip
    const { Zip, ZipDeflate } = await import("fflate");

    const zipBuffers: Uint8Array[] = [];
    const zip = new Zip((err, dat, final) => {
      if (!err) zipBuffers.push(dat);
    });

    for (const photo of photos) {
      // Download dari Drive via service account
      const response = await drive.files.get(
        { fileId: photo.driveFileId, alt: "media" },
        { responseType: "arraybuffer" }
      );

      const buffer = new Uint8Array(response.data as ArrayBuffer);
      const filename = photo.displayName
        ? `${photo.displayName}.jpg`
        : photo.filename;

      const deflate = new ZipDeflate(filename, { level: 0 }); // level 0 = store, cepat
      zip.add(deflate);
      deflate.push(buffer, true);
    }

    zip.end();

    const zipData = new Uint8Array(
      zipBuffers.reduce((total, buf) => total + buf.length, 0)
    );
    let offset = 0;
    for (const buf of zipBuffers) {
      zipData.set(buf, offset);
      offset += buf.length;
    }

    const safeAlbumName = album.name.replace(/[^a-zA-Z0-9\u00C0-\u024F\s-]/g, "").trim();
    const filename = `${safeAlbumName}.zip`;

    return new NextResponse(zipData, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(zipData.length),
      },
    });
  } catch (error) {
    console.error("ZIP download error:", error);
    return NextResponse.json(
      { error: "Gagal membuat ZIP. Coba download foto satu per satu." },
      { status: 500 }
    );
  }
}
