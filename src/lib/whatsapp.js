// Código de país por defecto (Venezuela).
const DEFAULT_COUNTRY_CODE = "58";

// Normaliza un teléfono a formato internacional para wa.me (solo dígitos).
// Ej: "0424 731 6893" -> "584247316893".
export function normalizePhone(raw) {
  if (!raw) return null;
  let digits = String(raw).replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) {
    digits = DEFAULT_COUNTRY_CODE + digits.slice(1);
  } else if (!digits.startsWith(DEFAULT_COUNTRY_CODE) && digits.length <= 10) {
    digits = DEFAULT_COUNTRY_CODE + digits;
  }
  return digits;
}

export function buildWhatsappUrl(phone, message) {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
