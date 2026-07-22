"use client";

import { useState } from "react";
import { toast } from "sonner";
import { DollarSign, Loader2, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGuardarTasas } from "@/hooks/use-tasas";

const CAMPOS = [
  { key: "BCV", label: "Bolívares (BCV)", suffix: "Bs/USD" },
  { key: "COP", label: "Pesos (COP)", suffix: "COP/USD" },
  { key: "BINANCE", label: "Binance", suffix: "Bs/USD" },
];

function toInput(v) {
  return v === null || v === undefined ? "" : String(v);
}

export default function TasasPanel({ initial }) {
  const guardar = useGuardarTasas();
  const [values, setValues] = useState({
    BCV: toInput(initial?.BCV),
    COP: toInput(initial?.COP),
    BINANCE: toInput(initial?.BINANCE),
  });

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      await guardar.mutateAsync(values);
      toast.success("Tasas del día guardadas.");
    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 rounded-2xl bg-acro-surface p-4"
    >
      <div className="mb-3 flex items-center gap-2">
        <DollarSign className="size-5 text-acro-accent" />
        <h2 className="text-lg font-semibold text-acro-text">
          Tasa de cambio del día
        </h2>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        {CAMPOS.map((c) => (
          <div key={c.key} className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor={`tasa-${c.key}`} className="text-sm text-acro-muted">
              {c.label}
            </Label>
            <Input
              id={`tasa-${c.key}`}
              type="number"
              inputMode="decimal"
              step="0.0001"
              min="0"
              value={values[c.key]}
              onChange={(e) =>
                setValues((v) => ({ ...v, [c.key]: e.target.value }))
              }
              placeholder={c.suffix}
              className="h-11 bg-acro-dark"
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={guardar.isPending}
          className="flex h-11 items-center justify-center gap-2 rounded-xl bg-acro-accent px-5 font-semibold text-acro-dark transition-transform hover:scale-[1.02] disabled:opacity-60"
        >
          {guardar.isPending ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <Save className="size-5" />
          )}
          Guardar
        </button>
      </div>
    </form>
  );
}
