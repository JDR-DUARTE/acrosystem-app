// Utilidades de fecha para la zona horaria de Venezuela (GMT-4, sin horario de verano).
const VE_OFFSET_MS = 4 * 60 * 60 * 1000;

// Fecha actual en Venezuela como "YYYY-MM-DD".
export function hoyVE() {
  const ve = new Date(Date.now() - VE_OFFSET_MS);
  return ve.toISOString().slice(0, 10);
}

// Inicio (00:00 VE) de un día "YYYY-MM-DD", expresado en UTC ISO.
export function inicioDiaVE_UTC(fecha = hoyVE()) {
  return `${fecha}T04:00:00.000Z`;
}

// Inicio del día VE de hace N días, en UTC ISO.
export function haceNdiasVE_UTC(n) {
  const d = new Date(inicioDiaVE_UTC());
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString();
}
