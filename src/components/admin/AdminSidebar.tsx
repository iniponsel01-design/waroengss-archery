"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Calendar,
  HardDrive,
  RefreshCw,
  Palette,
  QrCode,
  Users,
  Settings,
  ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

// ── Types ─────────────────────────────────────────────────────
interface NavLink {
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
}

interface NavGroup {
  group: string;
  items: NavLink[];
}

type NavItem = NavLink | NavGroup;

function isNavLink(item: NavItem): item is NavLink {
  return "href" in item;
}

// ── Nav structure ─────────────────────────────────────────────
const navItems: NavItem[] = [
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
      { label: "Buat Event",  href: "/admin/dashboard/events/new", icon: Calendar },
    ],
  },
  {
    group: "Google Drive",
    items: [
      { label: "Koneksi", href: "/admin/dashboard/drive/connections", icon: HardDrive },
      { label: "Sync",    href: "/admin/dashboard/drive/sync",        icon: RefreshCw },
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
      { label: "Banner & Promosi", href: "/admin/dashboard/appearance/banners",  icon: Palette },
      { label: "Iklan (AdSense)",  href: "/admin/dashboard/appearance/ads",      icon: Palette },
      { label: "Branding",         href: "/admin/dashboard/appearance/branding", icon: Palette },
    ],
  },
  {
    group: "System",
    items: [
      { label: "Admin Users", href: "/admin/dashboard/system/users",    icon: Users },
      { label: "Settings",    href: "/admin/dashboard/system/settings", icon: Settings },
      { label: "Logs",        href: "/admin/dashboard/system/logs",     icon: ScrollText },
    ],
  },
];

// ── Component ─────────────────────────────────────────────────
export function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const linkClass = (href: string, exact?: boolean) =>
    cn(
      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
      isActive(href, exact)
        ? "bg-brand-600 text-white"
        : "text-gray-400 hover:text-white hover:bg-gray-800"
    );

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
          if (isNavLink(item)) {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={linkClass(item.href, item.exact)}>
                <Icon size={16} />
                {item.label}
              </Link>
            );
          }

          return (
            <div key={i}>
              <p className="px-3 pt-4 pb-1 text-xs font-semibold text-gray-600 uppercase tracking-widest">
                {item.group}
              </p>
              {item.items.map((sub) => {
                const Icon = sub.icon;
                return (
                  <Link key={sub.href} href={sub.href} className={linkClass(sub.href)}>
                    <Icon size={16} />
                    {sub.label}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
