"use client";

import { useEffect, useState } from "react";

export function useClientId(storageKey: string) {
  const [clientId, setClientId] = useState("");

  useEffect(() => {
    const existing = window.localStorage.getItem(storageKey);
    if (existing) {
      setClientId(existing);
      return;
    }

    const generated = crypto.randomUUID();
    window.localStorage.setItem(storageKey, generated);
    setClientId(generated);
  }, [storageKey]);

  return [clientId, setClientId] as const;
}
