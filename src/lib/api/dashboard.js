import "server-only";
import { createClient } from "@/lib/supabase/server";
import { hoyVE, inicioDiaVE_UTC, haceNdiasVE_UTC } from "@/lib/timezone";

export async function getDashboardStats() {
  const supabase = await createClient();
  const hoyStr = hoyVE();
  const inicioHoy = inicioDiaVE_UTC(hoyStr);
  const hace7dias = haceNdiasVE_UTC(7);

  const [totalRes, activosRes, ingresosRes, checkinsRes] = await Promise.all([
    supabase.from("miembros").select("*", { count: "exact", head: true }),
    supabase
      .from("suscripciones")
      .select("id_miembro")
      .eq("estado", "Activo")
      .gte("fecha_expiracion", hoyStr),
    supabase
      .from("check_in")
      .select("*", { count: "exact", head: true })
      .gte("fecha_hora", inicioHoy),
    supabase
      .from("check_in")
      .select("*", { count: "exact", head: true })
      .gte("fecha_hora", hace7dias),
  ]);

  const miembrosActivos = new Set(
    (activosRes.data ?? []).map((s) => s.id_miembro),
  ).size;

  return {
    ingresosHoy: ingresosRes.count ?? 0,
    miembrosActivos,
    totalRegistrados: totalRes.count ?? 0,
    accesosSemana: checkinsRes.count ?? 0,
  };
}
