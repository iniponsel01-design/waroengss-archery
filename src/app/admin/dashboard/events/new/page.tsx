import type { Metadata } from "next";
import { EventForm } from "@/components/admin/EventForm";

export const metadata: Metadata = { title: "Buat Event Baru" };

export default function NewEventPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Buat Event Baru</h1>
      <EventForm />
    </div>
  );
}
