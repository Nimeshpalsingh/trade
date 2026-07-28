export const API_URL = typeof window !== 'undefined' ? "/api/proxy" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api");
export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000";

export const normalizeMediaUrl = (url) => {
    if (!url) return url;
    if (typeof url !== 'string') return url;
    
    // If it's already an absolute URL, return as is
    if (url.startsWith('http')) {
        return url;
    }
    
    // Format path correctly
    let path = url;
    if (path.startsWith('trade_images/')) {
        path = 'storage/' + path;
    }
    if (!path.startsWith('/')) {
        path = '/' + path;
    }
    
    // Combine with BASE_URL to fetch directly from backend server (bypassing Vercel proxy)
    return `${BASE_URL}${path}`;
};
