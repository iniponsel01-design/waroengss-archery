import Link from "next/link";
import { config } from "@/config";
import { cn } from "@/lib/utils/cn";

interface SiteHeaderProps {
  transparent?: boolean;
}

export function SiteHeader({ transparent = false }: SiteHeaderProps) {
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
          className="text-white font-bold text-sm tracking-wide hover:text-brand-400 transition-colors"
        >
          {config.app.brandName}
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
