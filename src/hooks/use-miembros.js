"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Error de red.");
  }
  return data;
}

export function useMiembros(filters = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.plan) params.set("plan", filters.plan);
  if (filters.estado) params.set("estado", filters.estado);
  const qs = params.toString();

  return useQuery({
    queryKey: ["miembros", filters],
    queryFn: () =>
      fetchJson(`/api/miembros${qs ? `?${qs}` : ""}`).then((d) => d.miembros),
  });
}

export function useCreateMiembro() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input) =>
      fetchJson("/api/miembros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["miembros"] });
    },
  });
}
