// Environment configuration
// These are public/publishable keys safe for frontend use

const getEnvVar = (key: string, fallback?: string): string => {
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return process.env[key] || fallback || ""
  }
  if (typeof import.meta !== "undefined" && import.meta.env) {
    return import.meta.env[key] || fallback || ""
  }
  return fallback || ""
}

export const ENV = {
  SUPABASE_URL: getEnvVar("NEXT_PUBLIC_SUPABASE_URL") || getEnvVar("VITE_SUPABASE_URL"),
  SUPABASE_ANON_KEY: getEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY") || getEnvVar("VITE_SUPABASE_ANON_KEY"),
  GEMINI_API_KEY: getEnvVar("NEXT_PUBLIC_GEMINI_API_KEY") || getEnvVar("VITE_GEMINI_API_KEY"),
} as const
