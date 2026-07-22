"use client";

import { useQuery, useMutation } from "@tanstack/react-query";

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Error de red.");
  return data;
}

export function useProductos(filters = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.categoria) params.set("categoria", String(filters.categoria));
  const qs = params.toString();

  return useQuery({
    queryKey: ["productos", filters],
    queryFn: () =>
      fetchJson(`/api/productos${qs ? `?${qs}` : ""}`).then((d) => d.productos),
  });
}

export function useCrearVenta() {
  return useMutation({
    mutationFn: (input) =>
      fetchJson("/api/ventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
  });
}
