import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  dark?: boolean;
}

export function Breadcrumb({ items, className, dark = false }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center flex-wrap gap-1 text-sm", className)}
    >
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-1">
          {index > 0 && (
            <ChevronRight
              size={14}
              className={dark ? "text-gray-600" : "text-gray-400"}
            />
          )}
          {item.href && index < items.length - 1 ? (
            <Link
              href={item.href}
              className={cn(
                "hover:underline transition-colors",
                dark ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"
              )}
            >
              {item.label}
            </Link>
          ) : (
            <span className={dark ? "text-gray-300" : "text-gray-700"}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
