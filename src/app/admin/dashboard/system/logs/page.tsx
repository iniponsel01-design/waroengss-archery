import { prisma } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export default async function AdminLogsPage() {
  const logs = await prisma.auditLog.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true } } },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {logs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Belum ada log aktivitas.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((log) => (
              <div key={log.id} className="px-6 py-3 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded mr-2">
                      {log.action}
                    </span>
                    {log.entity && (
                      <span className="text-gray-500">
                        {log.entity} {log.entityId?.slice(0, 8)}
                      </span>
                    )}
                  </p>
                  {log.user && (
                    <p className="text-xs text-gray-400 mt-0.5">{log.user.name}</p>
                  )}
                </div>
                <time className="text-xs text-gray-400 shrink-0">
                  {new Date(log.createdAt).toLocaleString("id-ID")}
                </time>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
