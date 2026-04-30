"use client";

import { Search, X } from "lucide-react";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  name?: string;
};

export function SearchBar({
  value,
  onChange,
  placeholder,
  name,
}: SearchBarProps) {
  return (
    <div className="directory-search-shell">
      <Search className="directory-search-icon" />
      <input
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="directory-input directory-search-input"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="rounded-full p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
