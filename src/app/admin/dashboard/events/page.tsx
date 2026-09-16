import Link from "next/link";
import { prisma } from "@/lib/db/client";
import { Plus, Edit, Eye, ExternalLink } from "lucide-react";
import { formatDateRange } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const events = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { eventDays: true, mediaFiles: true },
      },
    },
  });

  const statusColor: Record<string, string> = {
    PUBLISHED: "bg-green-100 text-green-700",
    DRAFT: "bg-gray-100 text-gray-600",
    ARCHIVED: "bg-yellow-100 text-yellow-700",
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Events</h1>
        <Link
          href="/admin/dashboard/events/new"
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          <Plus size={16} />
          Buat Event
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {events.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="font-medium">Belum ada event</p>
            <Link
              href="/admin/dashboard/events/new"
              className="text-brand-600 hover:underline text-sm mt-2 inline-block"
            >
              Buat event pertama →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {events.map((event) => (
              <div key={event.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-gray-900 truncate">{event.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[event.status]}`}>
                      {event.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    /{event.slug} ·{" "}
                    {formatDateRange(event.startDate, event.endDate) || "No date"} ·{" "}
                    {event._count.eventDays} hari · {event._count.mediaFiles.toLocaleString()} foto
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {event.status === "PUBLISHED" && (
                    <Link
                      href={`/e/${event.slug}`}
                      target="_blank"
                      className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label="View public page"
                    >
                      <ExternalLink size={16} />
                    </Link>
                  )}
                  <Link
                    href={`/admin/dashboard/events/${event.id}`}
                    className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Edit size={14} />
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
