import { createClient } from "@/lib/supabase/server";

const ADMIN_ROLE = "Administrativo";

/**
 * Returns the authenticated auth.users record (or null).
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Resolves the EMPLEADOS profile (with its ROLES.nombre) for the current
 * auth user. Returns `{ user, employee, isAdmin }`. The employee may be null
 * if the auth user is not yet linked to an EMPLEADOS row.
 */
export async function getCurrentEmployee() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, employee: null, isAdmin: false };
  }

  const { data: employee } = await supabase
    .from("empleados")
    .select("id_persona, id_rol, personas(nombre_completo), roles(nombre)")
    .eq("auth_uuid", user.id)
    .maybeSingle();

  const isAdmin = employee?.roles?.nombre === ADMIN_ROLE;

  return { user, employee: employee ?? null, isAdmin };
}
