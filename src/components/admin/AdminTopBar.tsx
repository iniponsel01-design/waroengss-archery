"use client";

import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import type { AdminSession } from "@/types";

interface AdminTopBarProps {
  session: AdminSession;
}

export function AdminTopBar({ session }: AdminTopBarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <header className="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0">
      <div />
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center">
            <User size={14} className="text-brand-600" />
          </div>
          <span className="text-gray-700 font-medium hidden sm:inline">
            {session.name}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </div>
    </header>
  );
}
