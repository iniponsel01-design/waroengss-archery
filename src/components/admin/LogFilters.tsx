"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface LogFiltersProps {
  actions: string[];
  users: { id: string; name: string }[];
  currentAction?: string;
  currentUser?: string;
}

export function LogFilters({ actions, users, currentAction, currentUser }: LogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-wrap gap-3 items-center">
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-gray-500">Aksi:</label>
        <select
          value={currentAction ?? ""}
          onChange={(e) => updateFilter("action", e.target.value)}
          className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Semua Aksi</option>
          {actions.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-gray-500">Admin:</label>
        <select
          value={currentUser ?? ""}
          onChange={(e) => updateFilter("user", e.target.value)}
          className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Semua Admin</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      </div>

      {(currentAction || currentUser) && (
        <Link
          href="/admin/dashboard/system/logs"
          className="text-xs text-red-500 hover:text-red-700 ml-1"
        >
          ✕ Reset filter
        </Link>
      )}
    </div>
  );
}
