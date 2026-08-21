// No longer using /api/proxy because Vercel proxying causes the backend to block Vercel's IP (429 Too Many Requests)
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const getBaseUrl = () => {
    if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL.replace('/api', '');
    return "http://localhost:8000";
};

export const BASE_URL = getBaseUrl();

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
