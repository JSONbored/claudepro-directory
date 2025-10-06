"use client";

import { useReportWebVitals } from "next/web-vitals";

export function WebVitals() {
  // Next.js automatically optimizes Web Vitals
  // This component ensures the hook is called but doesn't collect data
  useReportWebVitals(() => {
    // No-op: We only care about the optimizations, not monitoring
  });

  return null;
}
