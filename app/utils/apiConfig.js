export const API_URL = typeof window !== 'undefined' ? "/api/proxy" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api");
export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000";
