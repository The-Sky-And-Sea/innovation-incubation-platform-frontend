const DEFAULT_API_BASE_URL = "http://localhost:8080/api/v1";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;

export function isMockEnabled(): boolean {
  return import.meta.env.VITE_USE_MOCK !== "false";
}
