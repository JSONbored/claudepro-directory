"use client";

import { Search, X } from "lucide-react";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  name?: string;
};

export function SearchBar({
  value,
  onChange,
  placeholder,
  className = "",
  name
}: SearchBarProps) {
  return (
    <div
      className={`search-shell flex items-center gap-3 rounded-[1.2rem] border border-[var(--line)] px-4 py-3 ${className}`}
    >
      <Search className="h-4.5 w-4.5 text-[var(--muted)]" />
      <input
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-[var(--panel)] hover:text-[var(--ink)]"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
