export const API_URL = typeof window !== 'undefined' ? "/api/proxy" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api");
export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000";

export const normalizeMediaUrl = (url) => {
    if (!url) return url;
    if (typeof url !== 'string') return url;
    if (url.includes('/storage/')) {
        return '/storage/' + url.split('/storage/')[1];
    }
    return url;
};
