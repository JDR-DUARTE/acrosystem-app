// The Supabase project base URL must NOT include a path (e.g. `/rest/v1`).
// Some environments inject it with a trailing REST path, which breaks Auth
// calls, so we normalize it defensively.
function normalizeUrl(raw) {
  if (!raw) return raw;
  return raw.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
}

export const SUPABASE_URL = normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
