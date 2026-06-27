/* =========================================================
   NSS Talent Hunt 2083 — Supabase configuration
   This is the ONLY place credentials are stored.
   ========================================================= */

const SUPABASE_URL  = "https://ogkfhbkxlvydmkvispkr.supabase.co";   // e.g. "https://xxxxxxxx.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9na2ZoYmt4bHZ5ZG1rdmlzcGtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NDIxMTMsImV4cCI6MjA5ODExODExM30.wfyEDxT3JT8wKadKCO3QXI_WLaBuZbOenrkE89MLE2A"; // e.g. "eyJhbGciOiJIUzI1NiIsInR5cCI6..."

// Expose globally
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;