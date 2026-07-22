import "server-only";
import { createClient } from "@/lib/supabase/server";

const SELECT = `
  id_persona,
  fecha_nacimiento,
  talla_zapato,
  telefono,
  contacto_emergencia,
  num_asuncion_riesgos,
  qr_codigo,
  personas!inner ( nombre_completo, cedula, deuda_acumulada, tipo_perfil ),
  categorias ( id_categoria, nombre ),
  suscripciones (
    id_suscripcion, estado, fecha_inicio, fecha_expiracion, pases_restantes,
    planes ( id_plan, nombre )
  )
`;

function hoyVEStr() {
  return new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function activeSubscription(suscripciones = []) {
  const today = hoyVEStr();
  return (
    suscripciones.find(
      (s) => s.estado === "Activo" && s.fecha_expiracion >= today,
    ) ?? null
  );
}

function mapMiembro(row) {
  const activa = activeSubscription(row.suscripciones);
  return {
    id: row.id_persona,
    nombre: row.personas?.nombre_completo ?? "",
    cedula: row.personas?.cedula ?? "",
    deuda: Number(row.personas?.deuda_acumulada ?? 0),
    fechaNacimiento: row.fecha_nacimiento,
    tallaZapato: row.talla_zapato,
    telefono: row.telefono,
    contactoEmergencia: row.contacto_emergencia,
    numAsuncionRiesgos: row.num_asuncion_riesgos,
    qrCodigo: row.qr_codigo,
    categoria: row.categorias
      ? { id: row.categorias.id_categoria, nombre: row.categorias.nombre }
      : null,
    estado: activa ? "Activo" : "Inactivo",
    planId: activa?.planes?.id_plan ?? null,
    planActual: activa
      ? {
          id: activa.planes?.id_plan ?? null,
          nombre: activa.planes?.nombre ?? "—",
          fechaInicio: activa.fecha_inicio,
          fechaExpiracion: activa.fecha_expiracion,
          pasesRestantes: activa.pases_restantes,
        }
      : null,
  };
}

export async function listMiembros({ search, plan, estado } = {}) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("miembros").select(SELECT);
  if (error) throw new Error(error.message);

  let miembros = (data ?? []).map(mapMiembro);

  if (search) {
    const q = search.toLowerCase();
    miembros = miembros.filter(
      (m) =>
        m.nombre.toLowerCase().includes(q) ||
        (m.cedula ?? "").toLowerCase().includes(q),
    );
  }
  if (plan) {
    miembros = miembros.filter((m) => String(m.planId) === String(plan));
  }
  if (estado) {
    miembros = miembros.filter((m) => m.estado === estado);
  }

  return miembros.sort((a, b) => a.nombre.localeCompare(b.nombre));
}

export async function getMiembro(id) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("miembros")
    .select(SELECT)
    .eq("id_persona", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapMiembro(data) : null;
}

export async function createMiembro(input) {
  const supabase = await createClient();

  const nombre = String(input.nombre ?? "").trim();
  const cedula = String(input.cedula ?? "").trim();
  if (!nombre) throw new Error("El nombre es obligatorio.");
  if (!cedula) throw new Error("La cédula / pasaporte es obligatoria.");
  if (!input.contactoEmergencia)
    throw new Error("El contacto de emergencia es obligatorio.");
  if (!input.numAsuncionRiesgos)
    throw new Error("El NDAR (documento de asunción de riesgos) es obligatorio.");

  const { data: persona, error: personaError } = await supabase
    .from("personas")
    .insert({
      nombre_completo: nombre,
      cedula,
      tipo_perfil: "Miembro",
    })
    .select("id_persona")
    .single();
  if (personaError) {
    if (personaError.code === "23505")
      throw new Error("Ya existe una persona con esa cédula.");
    throw new Error(personaError.message);
  }

  const { error: miembroError } = await supabase.from("miembros").insert({
    id_persona: persona.id_persona,
    id_categoria: input.categoriaId ? Number(input.categoriaId) : null,
    fecha_nacimiento: input.fechaNacimiento || null,
    talla_zapato: input.tallaZapato || null,
    telefono: input.telefono || null,
    contacto_emergencia: input.contactoEmergencia,
    num_asuncion_riesgos: input.numAsuncionRiesgos,
    qr_codigo: crypto.randomUUID(),
  });
  if (miembroError) {
    // Roll back the persona row so we don't leave orphans.
    await supabase.from("personas").delete().eq("id_persona", persona.id_persona);
    throw new Error(miembroError.message);
  }

  return { id: persona.id_persona };
}

export async function listCategorias() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categorias")
    .select("id_categoria, nombre")
    .order("id_categoria");
  if (error) throw new Error(error.message);
  return (data ?? []).map((c) => ({ id: c.id_categoria, nombre: c.nombre }));
}
