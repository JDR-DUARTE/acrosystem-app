import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getDashboardStats() {
  const supabase = await createClient();
  const hoy = new Date();
  const hoyStr = hoy.toISOString().slice(0, 10);
  const inicioHoy = `${hoyStr}T00:00:00.000Z`;
  const hace7dias = new Date(hoy);
  hace7dias.setDate(hace7dias.getDate() - 7);

  const [totalRes, activosRes, ventasRes, checkinsRes] = await Promise.all([
    supabase.from("miembros").select("*", { count: "exact", head: true }),
    supabase
      .from("suscripciones")
      .select("id_miembro")
      .eq("estado", "Activo")
      .gte("fecha_expiracion", hoyStr),
    supabase.from("ventas").select("total_usd").gte("fecha_hora", inicioHoy),
    supabase
      .from("check_in")
      .select("*", { count: "exact", head: true })
      .gte("fecha_hora", hace7dias.toISOString()),
  ]);

  const miembrosActivos = new Set(
    (activosRes.data ?? []).map((s) => s.id_miembro),
  ).size;

  const ingresosHoy = (ventasRes.data ?? []).reduce(
    (acc, v) => acc + Number(v.total_usd ?? 0),
    0,
  );

  return {
    ingresosHoy,
    miembrosActivos,
    totalRegistrados: totalRes.count ?? 0,
    accesosSemana: checkinsRes.count ?? 0,
  };
}
