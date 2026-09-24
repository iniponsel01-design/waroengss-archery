import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/client";

/**
 * GET /api/admin/albums/export?eventId=xxx
 * Export daftar semua foto dalam event sebagai CSV.
 * Berguna untuk keperluan administrasi dan referensi pembelian foto.
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId") ?? undefined;

    if (!eventId) {
      return NextResponse.json({ error: "eventId wajib diisi" }, { status: 400 });
    }

    const photos = await prisma.mediaFile.findMany({
      where: { eventId, status: "ACTIVE" },
      select: {
        id: true,
        displayName: true,
        filename: true,
        driveFileId: true,
        width: true,
        height: true,
        createdAt: true,
        album: {
          select: {
            name: true,
            slug: true,
            albumGroup: { select: { name: true } },
            eventDay: { select: { title: true, dayNumber: true } },
          },
        },
      },
      orderBy: [{ album: { eventDay: { sortOrder: "asc" } } }, { sortOrder: "asc" }, { filename: "asc" }],
    });

    const header = [
      "ID", "Display Name", "Filename", "Drive File ID",
      "Hari", "Grup/Sesi", "Album", "Lebar", "Tinggi", "Tanggal Sync",
    ];

    const rows = photos.map((p) => [
      p.id,
      p.displayName ?? "",
      p.filename,
      p.driveFileId,
      `Day ${p.album.eventDay.dayNumber} - ${p.album.eventDay.title}`,
      p.album.albumGroup?.name ?? "",
      p.album.name,
      p.width ?? "",
      p.height ?? "",
      new Date(p.createdAt).toLocaleString("id-ID"),
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const filename = `album-export-${eventId.slice(-8)}-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  });
}
