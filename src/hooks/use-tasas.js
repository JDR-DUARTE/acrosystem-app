"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Error de red.");
  return data;
}

export function useTasasHoy(initial) {
  return useQuery({
    queryKey: ["tasas", "hoy"],
    queryFn: () => fetchJson("/api/tasas").then((d) => d.tasas),
    initialData: initial,
  });
}

export function useGuardarTasas() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input) =>
      fetchJson("/api/tasas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }).then((d) => d.tasas),
    onSuccess: (tasas) => {
      queryClient.setQueryData(["tasas", "hoy"], tasas);
    },
  });
}
