import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/client";
import { EventForm } from "@/components/admin/EventForm";
import { DayManager } from "@/components/admin/DayManager";
import { ExternalLink } from "lucide-react";
import { DeleteEventButton } from "@/components/admin/DeleteEventButton";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id }, select: { title: true } });
  return { title: event ? `Edit: ${event.title}` : "Edit Event" };
}

export default async function EditEventPage({ params }: Props) {
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      eventDays: {
        orderBy: { sortOrder: "asc" },
        include: {
          albumGroups: {
            orderBy: { sortOrder: "asc" },
            include: {
              albums: {
                orderBy: { sortOrder: "asc" },
                include: {
                  _count: { select: { mediaFiles: { where: { status: "ACTIVE" } } } },
                },
              },
            },
          },
          albums: {
            orderBy: { sortOrder: "asc" },
            include: {
              _count: { select: { mediaFiles: { where: { status: "ACTIVE" } } } },
            },
          },
          _count: { select: { mediaFiles: { where: { status: "ACTIVE" } } } },
        },
      },
    },
  });

  if (!event) notFound();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900 truncate">{event.title}</h1>
        <div className="flex items-center gap-2">
          {event.status === "PUBLISHED" && (
            <Link
              href={`/e/${event.slug}`}
              target="_blank"
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              <ExternalLink size={14} />
              Lihat Publik
            </Link>
          )}
          <DeleteEventButton eventId={event.id} eventTitle={event.title} />
        </div>
      </div>

      {/* Event Details Form */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-base font-bold text-gray-900 mb-5">Detail Event</h2>
        <EventForm event={event} />
      </div>

      {/* Days & Albums Manager */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-base font-bold text-gray-900 mb-5">Hari & Album</h2>
        <DayManager event={event} days={event.eventDays} />
      </div>
    </div>
  );
}
