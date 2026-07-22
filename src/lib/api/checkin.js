import "server-only";
import { createClient } from "@/lib/supabase/server";

const MIEMBRO_SELECT = `
  id_persona,
  qr_codigo,
  personas!inner ( nombre_completo, cedula ),
  categorias ( nombre ),
  suscripciones (
    id_suscripcion, estado, fecha_inicio, fecha_expiracion, pases_restantes,
    planes ( id_plan, nombre, pases_totales )
  )
`;

function activeSubscription(subs) {
  const hoy = new Date().toISOString().slice(0, 10);
  return (subs ?? [])
    .filter((s) => s.estado === "Activo" && s.fecha_expiracion >= hoy)
    .sort((a, b) => b.fecha_expiracion.localeCompare(a.fecha_expiracion))[0];
}

async function findMiembro(supabase, query) {
  const term = String(query ?? "").trim();
  if (!term) return null;

  // 1) por código QR
  const byQr = await supabase
    .from("miembros")
    .select(MIEMBRO_SELECT)
    .eq("qr_codigo", term)
    .maybeSingle();
  if (byQr.data) return byQr.data;

  // 2) por cédula (en personas)
  const persona = await supabase
    .from("personas")
    .select("id_persona")
    .eq("cedula", term)
    .maybeSingle();
  if (!persona.data) return null;

  const byCedula = await supabase
    .from("miembros")
    .select(MIEMBRO_SELECT)
    .eq("id_persona", persona.data.id_persona)
    .maybeSingle();
  return byCedula.data ?? null;
}

// Valida y registra un check-in. Devuelve un objeto con el resultado.
export async function registrarCheckin({ query }) {
  const supabase = await createClient();
  const miembro = await findMiembro(supabase, query);

  if (!miembro) {
    return {
      resultado: "no_encontrado",
      mensaje: "No se encontró ningún miembro con ese QR o cédula.",
    };
  }

  const base = {
    miembro: {
      id: miembro.id_persona,
      nombre: miembro.personas?.nombre_completo ?? "",
      cedula: miembro.personas?.cedula ?? "",
      categoria: miembro.categorias?.nombre ?? null,
    },
  };

  const sub = activeSubscription(miembro.suscripciones);
  if (!sub) {
    return {
      ...base,
      resultado: "denegado",
      mensaje: "El miembro no tiene un plan activo o está vencido.",
    };
  }

  const usaPases = (sub.planes?.pases_totales ?? 0) > 0;
  if (usaPases && sub.pases_restantes <= 0) {
    return {
      ...base,
      resultado: "denegado",
      mensaje: "El plan no tiene pases disponibles.",
      plan: sub.planes?.nombre ?? "—",
    };
  }

  const { error: insertError } = await supabase.from("check_in").insert({
    id_miembro: miembro.id_persona,
    id_suscripcion: sub.id_suscripcion,
  });
  if (insertError) throw new Error(insertError.message);

  let pasesRestantes = sub.pases_restantes;
  if (usaPases) {
    pasesRestantes = sub.pases_restantes - 1;
    const { error: updError } = await supabase
      .from("suscripciones")
      .update({ pases_restantes: pasesRestantes })
      .eq("id_suscripcion", sub.id_suscripcion);
    if (updError) throw new Error(updError.message);
  }

  return {
    ...base,
    resultado: "permitido",
    mensaje: "Acceso permitido.",
    plan: sub.planes?.nombre ?? "—",
    fechaExpiracion: sub.fecha_expiracion,
    usaPases,
    pasesRestantes: usaPases ? pasesRestantes : null,
  };
}
