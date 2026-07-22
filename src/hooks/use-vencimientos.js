"use client";

import { useQuery } from "@tanstack/react-query";

async function fetchJson(url) {
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Error de red.");
  return data;
}

export function useVencimientos({ tipo = "proximos", search } = {}) {
  const params = new URLSearchParams({ tipo });
  if (search) params.set("search", search);

  return useQuery({
    queryKey: ["vencimientos", tipo, search ?? ""],
    queryFn: () =>
      fetchJson(`/api/vencimientos?${params.toString()}`).then(
        (d) => d.vencimientos,
      ),
  });
}
