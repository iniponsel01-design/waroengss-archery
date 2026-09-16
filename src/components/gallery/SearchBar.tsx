"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";

interface SearchBarProps {
  eventSlug: string;
  placeholder?: string;
}

export function SearchBar({ eventSlug, placeholder = "Cari foto..." }: SearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = (q: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (q) {
      params.set("q", q);
    } else {
      params.delete("q");
    }

    startTransition(() => {
      // Navigate to event search page
      router.push(`/e/${eventSlug}/search?${params.toString()}`);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) handleSearch(value.trim());
  };

  const handleClear = () => {
    setValue("");
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-md">
      <div className="relative flex items-center">
        <Search
          size={16}
          className="absolute left-3 text-gray-400 pointer-events-none"
        />
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          aria-label="Cari foto"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-8 text-gray-500 hover:text-gray-300 transition-colors"
            aria-label="Hapus pencarian"
          >
            <X size={14} />
          </button>
        )}
        {isPending ? (
          <Loader2 size={14} className="absolute right-3 text-gray-400 animate-spin" />
        ) : (
          <button
            type="submit"
            className="absolute right-3 text-gray-400 hover:text-white transition-colors"
            aria-label="Cari"
          >
            <Search size={14} />
          </button>
        )}
      </div>
    </form>
  );
}
