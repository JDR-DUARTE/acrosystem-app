"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Plus, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMiembros } from "@/hooks/use-miembros";

const ALL = "todos";

export default function MiembrosList({ planes = [] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState(ALL);
  const [estado, setEstado] = useState(ALL);

  const { data: miembros, isLoading, isError, error } = useMiembros({
    search: search.trim() || undefined,
    plan: plan === ALL ? undefined : plan,
    estado: estado === ALL ? undefined : estado,
  });

  return (
    <section className="pb-24">
      <h1 className="mb-6 text-3xl font-bold text-acro-text lg:text-4xl">
        Miembros
      </h1>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-acro-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o cédula"
            className="h-12 bg-acro-surface pl-11"
          />
        </div>

        <Select value={plan} onValueChange={setPlan}>
          <SelectTrigger className="h-12 w-full bg-acro-surface md:w-48">
            <SelectValue placeholder="Tipo de plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los planes</SelectItem>
            {planes.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={estado} onValueChange={setEstado}>
          <SelectTrigger className="h-12 w-full bg-acro-surface md:w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los estados</SelectItem>
            <SelectItem value="Activo">Activo</SelectItem>
            <SelectItem value="Inactivo">Inactivo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl bg-acro-surface">
        <div className="grid grid-cols-[1.5fr_1fr_1fr_auto] gap-4 border-b border-border px-5 py-4 text-sm font-medium text-acro-muted">
          <span>Nombre</span>
          <span>Cédula</span>
          <span>Plan</span>
          <span>Estado</span>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-3 p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex items-center gap-2 p-6 text-sm text-acro-danger">
            <AlertCircle className="size-5" />
            {error?.message ?? "No se pudieron cargar los miembros."}
          </div>
        ) : !miembros || miembros.length === 0 ? (
          <p className="p-8 text-center text-sm text-acro-muted">
            No hay miembros que coincidan con la búsqueda.
          </p>
        ) : (
          <ul>
            {miembros.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => router.push(`/miembros/${m.id}`)}
                  className="grid w-full grid-cols-[1.5fr_1fr_1fr_auto] items-center gap-4 border-b border-border px-5 py-4 text-left transition-colors last:border-0 hover:bg-white/5"
                >
                  <span className="truncate font-medium text-acro-text">
                    {m.nombre}
                  </span>
                  <span className="truncate text-acro-muted">
                    {m.cedula || "—"}
                  </span>
                  <span className="truncate text-acro-muted">
                    {m.planActual?.nombre ?? "—"}
                  </span>
                  <Badge
                    className={
                      m.estado === "Activo"
                        ? "bg-acro-accent text-acro-dark"
                        : "bg-muted text-acro-muted"
                    }
                  >
                    {m.estado}
                  </Badge>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link
        href="/miembros/nuevo"
        aria-label="Registrar miembro"
        className="fixed bottom-6 right-6 z-20 flex size-16 items-center justify-center rounded-2xl bg-acro-accent text-acro-dark shadow-lg transition-transform hover:scale-105"
      >
        <Plus className="size-8" />
      </Link>
    </section>
  );
}
