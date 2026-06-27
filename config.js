/* =========================================================
   NSS Talent Hunt 2083 — Supabase configuration
   This is the ONLY place credentials are stored.
   ========================================================= */

const SUPABASE_URL  = "";   // e.g. "https://xxxxxxxx.supabase.co"
const SUPABASE_ANON_KEY = ""; // e.g. "eyJhbGciOiJIUzI1NiIsInR5cCI6..."

// Expose globally
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;