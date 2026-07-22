import "server-only";
import { createClient } from "@/lib/supabase/server";

// Ventana (en días) para considerar una suscripción como "próxima a vencer".
export const VENTANA_PROXIMOS_DIAS = 7;

const SELECT = `
  id_suscripcion,
  fecha_expiracion,
  estado,
  pases_restantes,
  miembros!inner (
    id_persona,
    telefono,
    personas!inner ( nombre_completo, cedula )
  ),
  planes ( nombre )
`;

function addDays(isoDate, days) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function mapRow(row) {
  return {
    id: row.id_suscripcion,
    miembroId: row.miembros?.id_persona,
    telefono: row.miembros?.telefono ?? "",
    nombre: row.miembros?.personas?.nombre_completo ?? "",
    cedula: row.miembros?.personas?.cedula ?? "",
    fechaExpiracion: row.fecha_expiracion,
    plan: row.planes?.nombre ?? "—",
    pasesRestantes: row.pases_restantes,
  };
}

export async function listVencimientos({ tipo = "proximos", search } = {}) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("suscripciones").select(SELECT);
  if (error) throw new Error(error.message);

  const hoy = new Date().toISOString().slice(0, 10);
  const limite = addDays(hoy, VENTANA_PROXIMOS_DIAS);

  let rows = (data ?? []).map(mapRow);

  if (tipo === "expirados") {
    rows = rows.filter((r) => r.fechaExpiracion < hoy);
    rows.sort((a, b) => b.fechaExpiracion.localeCompare(a.fechaExpiracion));
  } else {
    rows = rows.filter(
      (r) => r.fechaExpiracion >= hoy && r.fechaExpiracion <= limite,
    );
    rows.sort((a, b) => a.fechaExpiracion.localeCompare(b.fechaExpiracion));
  }

  if (search) {
    const q = search.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.nombre.toLowerCase().includes(q) ||
        (r.cedula ?? "").toLowerCase().includes(q),
    );
  }

  return rows;
}
