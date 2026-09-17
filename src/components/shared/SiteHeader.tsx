import Link from "next/link";
import { getBranding } from "@/lib/utils/branding";
import { cn } from "@/lib/utils/cn";

interface SiteHeaderProps {
  transparent?: boolean;
}

export async function SiteHeader({ transparent = false }: SiteHeaderProps) {
  const branding = await getBranding();

  return (
    <header
      className={cn(
        "w-full z-40",
        transparent
          ? "absolute top-0 left-0 right-0 bg-transparent"
          : "relative bg-gray-900 border-b border-gray-800"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
        >
          {branding.brandLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={branding.brandLogoUrl}
              alt={branding.brandName}
              className="h-8 w-auto object-contain"
            />
          ) : (
            <span className="text-white font-bold text-sm tracking-wide">
              {branding.brandName}
            </span>
          )}
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            href="/"
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            Events
          </Link>
        </nav>
      </div>
    </header>
  );
}
