export const API_URL = typeof window !== 'undefined' ? "/api/proxy" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api");
export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000";

export const normalizeMediaUrl = (url) => {
    if (!url) return url;
    if (typeof url !== 'string') return url;
    
    // If it's already a full HTTP URL, check if we need to proxy the storage part
    if (url.startsWith('http')) {
        if (url.includes('/storage/')) {
            return '/storage/' + url.split('/storage/')[1];
        }
        return url;
    }
    
    // If it doesn't start with /storage/ or http, but it's an image path
    if (url.startsWith('trade_images/') || url.startsWith('storage/')) {
        return url.startsWith('storage/') ? '/' + url : '/storage/' + url;
    }
    
    // Ensure it has a leading slash
    return url.startsWith('/') ? url : '/' + url;
};
