import Link from "next/link";
import { config } from "@/config";
import { cn } from "@/lib/utils/cn";

interface SiteFooterProps {
  dark?: boolean;
}

export function SiteFooter({ dark = false }: SiteFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer
      className={cn(
        "border-t py-8",
        dark
          ? "bg-gray-950 border-gray-800 text-gray-500"
          : "bg-white border-gray-100 text-gray-500"
      )}
    >
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
        <p>
          &copy; {year}{" "}
          <Link
            href="/"
            className="hover:text-gray-300 transition-colors font-medium"
          >
            {config.app.brandName}
          </Link>
          . All rights reserved.
        </p>
        <p className="text-xs opacity-60">
          Powered by Nusantara Event Gallery
        </p>
      </div>
    </footer>
  );
}
