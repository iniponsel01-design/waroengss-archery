"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  FolderOpen,
  Images,
  HardDrive,
  RefreshCw,
  Palette,
  QrCode,
  Users,
  Settings,
  ScrollText,
  ChevronRight,
} from "lucide-react";import { cn } from "@/lib/utils/cn";

const navItems = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    group: "Events",
    items: [
      { label: "Semua Event", href: "/admin/dashboard/events", icon: Calendar },
      { label: "Buat Event", href: "/admin/dashboard/events/new", icon: Calendar },
    ],
  },
  {
    group: "Google Drive",
    items: [
      { label: "Koneksi", href: "/admin/dashboard/drive/connections", icon: HardDrive },
      { label: "Sync", href: "/admin/dashboard/drive/sync", icon: RefreshCw },
    ],
  },
  {
    group: "Tools",
    items: [
      { label: "QR Code", href: "/admin/dashboard/tools/qrcode", icon: QrCode },
    ],
  },
  {
    group: "Appearance",
    items: [
      { label: "Banner & Promosi", href: "/admin/dashboard/appearance/banners", icon: Palette },
      { label: "Iklan (AdSense)", href: "/admin/dashboard/appearance/ads", icon: Palette },
      { label: "Branding", href: "/admin/dashboard/appearance/branding", icon: Palette },
    ],
  },
  {
    group: "System",
    items: [
      { label: "Admin Users", href: "/admin/dashboard/system/users", icon: Users },
      { label: "Settings", href: "/admin/dashboard/system/settings", icon: Settings },
      { label: "Logs", href: "/admin/dashboard/system/logs", icon: ScrollText },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <aside className="w-60 bg-gray-900 text-white flex flex-col shrink-0 overflow-y-auto">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-gray-800">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
          Admin Panel
        </p>
        <p className="text-sm font-bold text-white mt-0.5">
          Waroeng SS Archery
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item, i) => {
          if ("href" in item) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                  isActive(item.href, item.exact)
                    ? "bg-brand-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                )}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            );
          }

          return (
            <div key={i}>
              <p className="px-3 pt-4 pb-1 text-xs font-semibold text-gray-600 uppercase tracking-widest">
                {item.group}
              </p>
              {item.items.map((subItem) => (
                <Link
                  key={subItem.href}
                  href={subItem.href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                    isActive(subItem.href)
                      ? "bg-brand-600 text-white"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  )}
                >
                  <subItem.icon size={16} />
                  {subItem.label}
                </Link>
              ))}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
