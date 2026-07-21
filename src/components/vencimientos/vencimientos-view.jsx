"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  MessageSquare,
  AlertCircle,
  CalendarX,
  CalendarClock,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useVencimientos } from "@/hooks/use-vencimientos";

const TABS = [
  { id: "proximos", label: "Próximos" },
  { id: "expirados", label: "Expirados" },
];

function formatDate(value) {
  if (!value) return "—";
  const [y, m, d] = value.split("-");
  return `${d}/${m}/${y}`;
}

export default function VencimientosView() {
  const router = useRouter();
  const [tab, setTab] = useState("proximos");
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, error } = useVencimientos({
    tipo: tab,
    search: search.trim() || undefined,
  });

  const esExpirados = tab === "expirados";
  const HeaderIcon = esExpirados ? CalendarX : CalendarClock;
  const headerLabel = esExpirados
    ? "Clientes con planes vencidos"
    : "Clientes próximos a vencer";
  const fechaLabel = esExpirados ? "Venció" : "Vence";

  function enviarAviso(e, nombre) {
    e.stopPropagation();
    toast.success(`Aviso registrado para ${nombre}.`);
  }

  return (
    <section className="pb-24">
      <h1 className="mb-6 text-3xl font-bold text-acro-text lg:text-4xl">
        Vista de Vencimientos
      </h1>

      <div className="relative mb-4 max-w-xl">
        <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-acro-muted" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o cédula"
          className="h-12 bg-acro-surface pl-11"
        />
      </div>

      <div className="mb-5 grid max-w-xl grid-cols-2 gap-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-xl py-2.5 text-base font-medium transition-colors",
              tab === t.id
                ? "bg-acro-accent text-acro-dark"
                : "bg-acro-surface text-acro-text hover:bg-white/5",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl bg-acro-surface p-4">
        <div className="mb-3 flex items-center gap-3">
          <HeaderIcon className="size-6 text-acro-accent" />
          <h2 className="text-lg font-semibold text-acro-text">
            {headerLabel}
          </h2>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex items-center gap-2 py-6 text-sm text-acro-danger">
            <AlertCircle className="size-5" />
            {error?.message ?? "No se pudieron cargar los vencimientos."}
          </div>
        ) : !data || data.length === 0 ? (
          <p className="py-8 text-center text-sm text-acro-muted">
            {esExpirados
              ? "No hay planes vencidos."
              : "No hay planes próximos a vencer."}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {data.map((v) => (
              <li key={v.id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/miembros/${v.miembroId}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") router.push(`/miembros/${v.miembroId}`);
                  }}
                  className="flex items-center justify-between gap-3 rounded-xl bg-acro-dark px-4 py-3 transition-colors hover:bg-white/5"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-acro-text">
                      {v.nombre}
                    </p>
                    <p className="text-sm text-acro-muted">
                      {fechaLabel}: {formatDate(v.fechaExpiracion)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => enviarAviso(e, v.nombre)}
                    className="flex shrink-0 items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-acro-text transition-colors hover:bg-white/5"
                  >
                    <MessageSquare className="size-4" />
                    Aviso
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
