import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/client";

// GET /api/admin/logs/export — export audit logs sebagai CSV
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    const { searchParams } = new URL(req.url);
    const actionFilter = searchParams.get("action") || undefined;
    const userFilter   = searchParams.get("user")   || undefined;
    const from         = searchParams.get("from")   || undefined;
    const to           = searchParams.get("to")     || undefined;

    const where = {
      ...(actionFilter ? { action: actionFilter } : {}),
      ...(userFilter   ? { userId: userFilter }   : {}),
      ...(from || to   ? {
        createdAt: {
          ...(from ? { gte: new Date(from) } : {}),
          ...(to   ? { lte: new Date(to + "T23:59:59.999Z") } : {}),
        },
      } : {}),
    };

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 10000,   // batas aman
      include: { user: { select: { name: true, email: true } } },
    });

    // Susun CSV
    const header = ["Tanggal", "Aksi", "Entity", "EntityId", "User", "Email", "IP Hash", "Metadata"];
    const rows = logs.map((log) => [
      new Date(log.createdAt).toLocaleString("id-ID"),
      log.action,
      log.entity ?? "",
      log.entityId ?? "",
      log.user?.name ?? "(sistem)",
      log.user?.email ?? "",
      log.ipHash ?? "",
      log.metadata ? JSON.stringify(log.metadata) : "",
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const filename = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  });
}
