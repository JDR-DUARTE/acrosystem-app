"use client";

import { useState } from "react";
import { Search, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useMiembros } from "@/hooks/use-miembros";

export default function MemberCombobox({ value, onChange }) {
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const { data: miembros, isFetching } = useMiembros(
    term.trim() ? { search: term.trim() } : {},
  );

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-md border border-border bg-acro-surface px-3 py-2.5">
        <span className="text-acro-text">{value.nombre}</span>
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Quitar miembro"
          className="text-acro-muted hover:text-acro-text"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  const results = miembros ?? [];

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-acro-muted" />
      <Input
        value={term}
        onChange={(e) => {
          setTerm(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Buscar miembro por nombre o cédula"
        className="h-12 bg-acro-surface pl-11"
      />
      {open && term.trim() && (
        <ul className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border bg-acro-dark py-1 shadow-lg">
          {isFetching && results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-acro-muted">Buscando…</li>
          ) : results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-acro-muted">
              Sin resultados.
            </li>
          ) : (
            results.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange({ id: m.id, nombre: m.nombre });
                    setOpen(false);
                    setTerm("");
                  }}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-acro-text hover:bg-white/5"
                >
                  <span>
                    {m.nombre}
                    {m.cedula ? (
                      <span className="ml-2 text-xs text-acro-muted">
                        {m.cedula}
                      </span>
                    ) : null}
                  </span>
                  <Check className="size-4 opacity-0" />
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
