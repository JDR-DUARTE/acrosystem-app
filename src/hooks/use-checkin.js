"use client";

import { useMutation } from "@tanstack/react-query";

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Error de red.");
  return data;
}

export function useCheckin() {
  return useMutation({
    mutationFn: (query) =>
      fetchJson("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      }),
  });
}
