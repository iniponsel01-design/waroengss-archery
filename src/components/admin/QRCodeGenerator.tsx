"use client";

import { useState } from "react";
import { Download, QrCode } from "lucide-react";
import { config } from "@/config";

interface Event {
  id: string;
  title: string;
  slug: string;
}

interface QRCodeGeneratorProps {
  events: Event[];
}

export function QRCodeGenerator({ events }: QRCodeGeneratorProps) {
  const [selectedSlug, setSelectedSlug] = useState(events[0]?.slug ?? "");

  const eventUrl = selectedSlug ? `${config.app.url}/e/${selectedSlug}` : "";

  const downloadSVG = () => {
    window.open(`/api/qrcode?slug=${selectedSlug}&format=svg`, "_blank");
  };

  const downloadPNG = () => {
    const a = document.createElement("a");
    a.href = `/api/qrcode?slug=${selectedSlug}&format=png`;
    a.download = `qr-${selectedSlug}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
      {events.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <p>Belum ada event yang dipublikasikan.</p>
          <p className="text-sm mt-1">Publish event terlebih dahulu untuk membuat QR Code.</p>
        </div>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pilih Event
            </label>
            <select
              value={selectedSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {events.map((event) => (
                <option key={event.id} value={event.slug}>
                  {event.title}
                </option>
              ))}
            </select>
            {eventUrl && (
              <p className="text-xs text-gray-400 mt-1.5 break-all">{eventUrl}</p>
            )}
          </div>

          {selectedSlug && (
            <div className="flex flex-col items-center gap-4">
              {/* QR Code Preview — rendered server-side via API */}
              <div className="bg-white border-4 border-white shadow-lg rounded-2xl p-2 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/qrcode?slug=${selectedSlug}&format=svg`}
                  alt={`QR Code for ${selectedSlug}`}
                  width={240}
                  height={240}
                  className="block"
                />
              </div>

              <div className="text-center">
                <p className="text-sm font-medium text-gray-800">
                  {events.find((e) => e.slug === selectedSlug)?.title}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{selectedSlug}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={downloadSVG}
                  className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                >
                  <Download size={14} />
                  SVG
                </button>
                <button
                  onClick={downloadPNG}
                  className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                >
                  <Download size={14} />
                  PNG
                </button>
              </div>

              <p className="text-xs text-gray-400 text-center max-w-xs">
                QR Code ini mengarah langsung ke halaman event. Cetak dan bagikan ke peserta.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
