import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getCurrentEmployee } from "@/lib/auth";
import { hoyVE } from "@/lib/timezone";

// Monedas/tasas del día que administra el negocio.
const MONEDAS = ["BCV", "COP", "BINANCE"];

// Devuelve las tasas del día de hoy (VE) como { BCV, COP, BINANCE }.
export async function getTasasHoy() {
  const supabase = await createClient();
  const fecha = hoyVE();
  const { data, error } = await supabase
    .from("tasas_cambio")
    .select("moneda, valor_tasa")
    .eq("fecha_tasa", fecha)
    .in("moneda", MONEDAS);
  if (error) throw new Error(error.message);

  const tasas = { fecha, BCV: null, COP: null, BINANCE: null };
  for (const row of data ?? []) {
    tasas[row.moneda] = row.valor_tasa === null ? null : Number(row.valor_tasa);
  }
  return tasas;
}

// Guarda (upsert) las tasas del día de hoy (VE).
export async function guardarTasasHoy(input = {}) {
  const supabase = await createClient();
  const { employee } = await getCurrentEmployee();
  if (!employee) throw new Error("No autorizado.");

  const fecha = hoyVE();
  const rows = MONEDAS.map((moneda) => ({ moneda, valor: input[moneda] }))
    .filter((r) => r.valor !== undefined && r.valor !== null && r.valor !== "")
    .map((r) => {
      const valor = Number(r.valor);
      if (!Number.isFinite(valor) || valor < 0) {
        throw new Error(`Tasa inválida para ${r.moneda}.`);
      }
      return { moneda: r.moneda, valor_tasa: valor, fecha_tasa: fecha };
    });

  if (rows.length === 0) throw new Error("Ingresa al menos una tasa.");

  const { error } = await supabase
    .from("tasas_cambio")
    .upsert(rows, { onConflict: "moneda,fecha_tasa" });
  if (error) throw new Error(error.message);

  return getTasasHoy();
}
