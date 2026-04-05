"use client";

import { useState } from "react";

import { SearchBar } from "@/components/search-bar";

type HeroSearchFormProps = {
  initialQuery?: string;
};

export function HeroSearchForm({
  initialQuery = ""
}: HeroSearchFormProps) {
  const [query, setQuery] = useState(initialQuery);

  return (
    <form action="/browse" method="get" className="hero-search-form">
      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder="Search agents, MCP servers, skills, rules, hooks, guides..."
        name="q"
        className="hero-search-input"
      />
      <button type="submit" className="link-button link-button-primary hero-search-button">
        Search
      </button>
    </form>
  );
}
