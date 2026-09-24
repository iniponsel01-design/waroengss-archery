import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { eventRepository } from "@/repositories/event.repository";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/shared/SiteHeader";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { FavoritesGallery } from "@/components/gallery/FavoritesGallery";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ eventSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { eventSlug } = await params;
  const event = await eventRepository.findPublishedBySlug(eventSlug);
  if (!event) return {};
  return {
    title: `Foto Favorit — ${event.title}`,
    robots: { index: false, follow: false },
  };
}

export default async function FavoritesPage({ params }: Props) {
  const { eventSlug } = await params;
  const event = await eventRepository.findPublishedBySlug(eventSlug);
  if (!event) notFound();

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-gray-950">
        <section className="bg-gray-900 text-white border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <nav className="text-sm text-gray-400 mb-3">
              <Link href={`/e/${eventSlug}`} className="hover:text-white transition-colors">
                {event.title}
              </Link>
              <span className="mx-2">/</span>
              <span className="text-gray-200">Foto Favorit</span>
            </nav>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Heart size={22} className="text-red-400" fill="currentColor" />
              Foto Favorit Saya
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Foto yang Anda tandai bintang — tersimpan di browser ini
            </p>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 py-6">
          <FavoritesGallery eventSlug={eventSlug} />
        </section>
      </main>
      <SiteFooter dark />
    </>
  );
}
