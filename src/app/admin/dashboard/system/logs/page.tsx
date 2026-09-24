import { prisma } from "@/lib/db/client";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { LogFilters } from "@/components/admin/LogFilters";
import { prisma } from "@/lib/db/client";

export const dynamic = "force-dynamic";

const LOGS_PER_PAGE = 25;

const ACTION_COLORS: Record<string, string> = {
  LOGIN:             "bg-blue-100 text-blue-700",
  LOGOUT:            "bg-gray-100 text-gray-600",
  CREATE_EVENT:      "bg-green-100 text-green-700",
  UPDATE_EVENT:      "bg-yellow-100 text-yellow-700",
  DELETE_EVENT:      "bg-red-100 text-red-700",
  PUBLISH_EVENT:     "bg-emerald-100 text-emerald-700",
  UNPUBLISH_EVENT:   "bg-orange-100 text-orange-700",
  CREATE_EVENT_DAY:  "bg-green-100 text-green-700",
  CREATE_ALBUM:      "bg-green-100 text-green-700",
  START_SYNC:        "bg-purple-100 text-purple-700",
  SYNC_COMPLETED:    "bg-purple-100 text-purple-700",
  UPDATE_SETTINGS:   "bg-indigo-100 text-indigo-700",
};

interface Props {
  searchParams: Promise<{
    page?: string;
    action?: string;
    user?: string;
    from?: string;
    to?: string;
  }>;
}

export default async function AdminLogsPage({ searchParams }: Props) {
  const { page, action: actionFilter, user: userFilter, from, to } = await searchParams;
  const currentPage = Math.max(1, parseInt(page ?? "1"));

  // Build where clause dengan date range
  const where = {
    ...(actionFilter ? { action: actionFilter } : {}),
    ...(userFilter ? { userId: userFilter } : {}),
    ...(from || to ? {
      createdAt: {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to + "T23:59:59.999Z") } : {}),
      },
    } : {}),
  };

  const [logs, totalLogs, actions, users] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      take: LOGS_PER_PAGE,
      skip: (currentPage - 1) * LOGS_PER_PAGE,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.auditLog.count({ where }),
    // Distinct actions for filter
    prisma.auditLog.findMany({
      select: { action: true },
      distinct: ["action"],
      orderBy: { action: "asc" },
    }),
    // Distinct users for filter
    prisma.adminUser.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(totalLogs / LOGS_PER_PAGE);

  const buildUrl = (params: { page?: number; action?: string; user?: string }) => {
    const p = new URLSearchParams();
    if (params.page && params.page > 1) p.set("page", String(params.page));
    if (params.action ?? actionFilter) p.set("action", params.action ?? actionFilter!);
    if (params.user ?? userFilter) p.set("user", params.user ?? userFilter!);
    const str = p.toString();
    return str ? `?${str}` : "?";
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-500 text-sm mt-1">
            Riwayat aktivitas admin — {totalLogs.toLocaleString("id-ID")} log total
          </p>
        </div>
        {/* Export CSV */}
        <a
          href={`/api/admin/logs/export?action=${actionFilter ?? ""}&user=${userFilter ?? ""}&from=${from ?? ""}&to=${to ?? ""}`}
          className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-3 py-2 rounded-xl transition-colors"
        >
          <Download size={14} />
          Export CSV
        </a>
      </div>

      {/* Filters — client component for interactivity */}
      <Suspense fallback={<div className="h-12 bg-white rounded-2xl border border-gray-100 animate-pulse" />}>
        <LogFilters
          actions={actions.map((a) => a.action)}
          users={users}
          currentAction={actionFilter}
          currentUser={userFilter}
        />
      </Suspense>

      {/* Log table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {logs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            {actionFilter || userFilter
              ? "Tidak ada log dengan filter ini."
              : "Belum ada log aktivitas."}
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-100">
              {logs.map((log) => (
                <div key={log.id} className="px-5 py-3 flex items-start justify-between gap-4 hover:bg-gray-50">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-semibold font-mono shrink-0 mt-0.5",
                      ACTION_COLORS[log.action] ?? "bg-gray-100 text-gray-600"
                    )}>
                      {log.action}
                    </span>
                    <div className="min-w-0">
                      {(log.entity || log.entityId) && (
                        <p className="text-sm text-gray-700">
                          {log.entity && <span className="font-medium">{log.entity}</span>}
                          {log.entityId && (
                            <code className="text-xs text-gray-400 ml-1.5 bg-gray-100 px-1 rounded">
                              {log.entityId.slice(0, 12)}
                            </code>
                          )}
                        </p>
                      )}
                      {log.metadata && typeof log.metadata === "object" && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">
                          {Object.entries(log.metadata as Record<string, unknown>)
                            .slice(0, 3)
                            .map(([k, v]) => `${k}: ${String(v)}`)
                            .join(" · ")}
                        </p>
                      )}
                      {log.user && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          👤 {log.user.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <time className="text-xs text-gray-400 shrink-0 tabular-nums">
                    {new Date(log.createdAt).toLocaleString("id-ID", {
                      day: "2-digit", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </time>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                <div className="text-xs text-gray-400">
                  {((currentPage - 1) * LOGS_PER_PAGE) + 1}–{Math.min(currentPage * LOGS_PER_PAGE, totalLogs)} dari {totalLogs.toLocaleString("id-ID")}
                </div>

                <div className="flex items-center gap-1">
                  <Link
                    href={buildUrl({ page: currentPage - 1, action: actionFilter, user: userFilter })}
                    className={cn(
                      "flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg transition-colors",
                      currentPage <= 1
                        ? "text-gray-300 pointer-events-none"
                        : "text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    <ChevronLeft size={14} />
                  </Link>

                  {/* Page numbers — show 5 around current */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                    .reduce<(number | "...")[]>((acc, p, i, arr) => {
                      if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      p === "..." ? (
                        <span key={`dots-${i}`} className="text-gray-300 px-1 text-sm">…</span>
                      ) : (
                        <Link
                          key={p}
                          href={buildUrl({ page: p as number, action: actionFilter, user: userFilter })}
                          className={cn(
                            "w-8 h-8 flex items-center justify-center text-xs rounded-lg transition-colors",
                            p === currentPage
                              ? "bg-brand-600 text-white font-semibold"
                              : "text-gray-600 hover:bg-gray-200"
                          )}
                        >
                          {p}
                        </Link>
                      )
                    )}

                  <Link
                    href={buildUrl({ page: currentPage + 1, action: actionFilter, user: userFilter })}
                    className={cn(
                      "flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg transition-colors",
                      currentPage >= totalPages
                        ? "text-gray-300 pointer-events-none"
                        : "text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    <ChevronRight size={14} />
                  </Link>
                </div>

                <div className="text-xs text-gray-400">
                  Hal {currentPage} / {totalPages}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
