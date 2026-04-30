"use client";

import { useEffect, useMemo, useState } from "react";

type TocSection = {
  id: string;
  title: string;
};

type DetailTocProps = {
  sections: TocSection[];
};

export function DetailToc({ sections }: DetailTocProps) {
  const ids = useMemo(() => sections.map((section) => section.id), [sections]);
  const [activeId, setActiveId] = useState<string>(ids[0] ?? "");

  useEffect(() => {
    if (!ids.length) return;

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.add(entry.target.id);
          } else {
            visible.delete(entry.target.id);
          }
        }

        for (const id of ids) {
          if (visible.has(id)) {
            setActiveId(id);
            return;
          }
        }
      },
      {
        root: null,
        rootMargin: "-22% 0px -58% 0px",
        threshold: [0, 0.25, 0.6, 1],
      },
    );

    for (const id of ids) {
      const node = document.getElementById(id);
      if (node) observer.observe(node);
    }

    return () => observer.disconnect();
  }, [ids]);

  return (
    <div className="space-y-2">
      {sections.map((section) => {
        const active = section.id === activeId;
        return (
          <a
            key={section.id}
            href={`#${section.id}`}
            className={`detail-nav-link ${active ? "detail-nav-link-active" : ""}`}
            aria-current={active ? "location" : undefined}
          >
            <span
              className={`detail-nav-dot ${active ? "detail-nav-dot-active" : ""}`}
            />
            <span className="min-w-0 flex-1 truncate">{section.title}</span>
          </a>
        );
      })}
    </div>
  );
}
