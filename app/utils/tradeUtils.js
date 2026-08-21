import { API_URL, normalizeMediaUrl } from "./apiConfig";
import { getSession } from "next-auth/react";

let settingsCache = null;
let settingsCacheTime = 0;
let settingsPromise = null;

export const fetchSettings = async () => {
    const now = Date.now();
    if (settingsCache && (now - settingsCacheTime < 10000)) { // 10-second cache
        return settingsCache;
    }
    if (settingsPromise) return settingsPromise;

    settingsPromise = (async () => {
        try {
            const session = await getSession();
            if (!session?.apiToken) throw new Error("No session token available");
            const token = `Bearer ${session.apiToken}`;
            const res = await fetch(`${API_URL}/settings`, { 
                headers: { "Authorization": token, "Accept": "application/json" },
                cache: 'no-store'
            });
            if (!res.ok) {
                const errorText = await res.text().catch(() => "");
                console.error("Settings fetch failed:", res.status, res.statusText, errorText);
                throw new Error(`Failed to fetch settings: ${res.status} ${res.statusText}`);
            }
            const data = await res.json();
            settingsCache = data;
            settingsCacheTime = Date.now();
            settingsPromise = null;
            return data;
        } catch (e) {
            settingsPromise = null;
            console.error("Error fetching settings:", e);
            return { symbols: [], setups: [], sessions: [], market_trends: [], timeframes: [], market_types: [], mistakes: [], rules: [], preMarketMoods: [] };
        }
    })();
    return settingsPromise;
};

let tradesCache = null;
let tradesCacheTime = 0;
let tradesPromise = null;

export const fetchAndProcessTrades = async (existingSettings = null) => {
    const now = Date.now();
    if (tradesCache && (now - tradesCacheTime < 5000)) { // 5-second cache for trades
        return tradesCache;
    }
    if (tradesPromise) return tradesPromise;

    tradesPromise = (async () => {
        try {
            const session = await getSession();
            if (!session?.apiToken) throw new Error("No session token available");
            const token = `Bearer ${session.apiToken}`;
            
            let settingsData = existingSettings;

            if (!settingsData) {
                settingsData = await fetchSettings();
            }
            
            // Add a small 200ms delay to prevent hitting WAF limits for simultaneous requests
            await new Promise(resolve => setTimeout(resolve, 200));

            const tradesRes = await fetch(`${API_URL}/trades`, { 
                headers: { "Authorization": token, "Accept": "application/json" },
                cache: 'no-store'
            });

        if (!tradesRes.ok) {
            console.error("Trades fetch status:", tradesRes.status, tradesRes.statusText);
            throw new Error(`Failed to fetch trades: ${tradesRes.status}`);
        }

        const breakevenRules = settingsData.symbols.filter(s => s.breakeven_value).map(s => ({ symbol: s.name, value: s.breakeven_value }));
        const rawTrades = await tradesRes.json();

        const processedTrades = rawTrades.map(trade => {
            let grossPnl = 0;
            let totalExitedQty = 0;
            let totalExitValue = 0;
            const entryPrice = parseFloat(trade.entry_price) || 0;

            if (trade.exits && trade.exits.length > 0) {
                trade.exits.forEach(ex => {
                    const exQ = parseFloat(ex.qty) || 0;
                    const exP = parseFloat(ex.price) || 0;
                    if (exQ > 0 && exP > 0) {
                        totalExitedQty += exQ;
                        totalExitValue += (exQ * exP);
                        if (trade.type === "LONG") grossPnl += (exP - entryPrice) * exQ;
                        if (trade.type === "SHORT") grossPnl += (entryPrice - exP) * exQ;
                    }
                });
            }

            let charges = 0;
            const symbolName = trade.symbol ? trade.symbol.name : "";
            const bRule = breakevenRules.find(b => b.symbol === symbolName);
            if (bRule) {
                if (bRule.value.includes("%")) {
                    const percent = parseFloat(bRule.value.replace("%", ""));
                    const turnover = (entryPrice * totalExitedQty) + totalExitValue;
                    charges = turnover * (percent / 100);
                } else {
                    charges = parseFloat(bRule.value.replace(/[^0-9.]/g, ""));
                }
            }

            const netPnl = grossPnl - charges;
            const slPrice = parseFloat(trade.sl) || 0;
            let rr = 0;
            
            if (slPrice > 0 && totalExitedQty > 0) {
                const avgExitPrice = totalExitValue / totalExitedQty;
                const risk = Math.abs(entryPrice - slPrice);
                const reward = Math.abs(avgExitPrice - entryPrice);
                if (risk > 0) {
                    rr = parseFloat((reward / risk).toFixed(2));
                }
            }

            return {
                ...trade,
                symbol: symbolName,
                setup: trade.setup ? trade.setup.name : "",
                timeframe: trade.time_frame ? trade.time_frame.name : "",
                trend: trade.market_trend ? trade.market_trend.name : "",
                marketType: trade.market_type ? trade.market_type.name : "",
                session: trade.session ? trade.session.name : "",
                mistakes: trade.mistakes ? trade.mistakes.map(m => m.name) : [],
                rules: trade.rules ? trade.rules.map(r => r.name) : [],
                preMarketMoods: trade.pre_market_moods ? trade.pre_market_moods.map(m => m.name) : (trade.preMarketMoods ? trade.preMarketMoods.map(m => m.name) : []),
                images: trade.images ? trade.images.map(img => normalizeMediaUrl(img.image_path || img)) : [],
                grossPnl,
                charges,
                pnl: netPnl,
                netPnl,
                isWin: netPnl >= 0,
                rr: trade.type === "SHORT" && netPnl < 0 ? -rr : (netPnl < 0 ? -rr : rr)
            };
        });

        tradesCache = processedTrades;
        tradesCacheTime = Date.now();
        tradesPromise = null;
        return processedTrades;
    } catch (e) {
        tradesPromise = null;
        console.error("Error fetching trades:", e);
        return [];
    }
    })();
    return tradesPromise;
};

// --- Backtest API Functions ---

export const fetchBacktests = async () => {
    try {
        const session = await getSession();
        if (!session?.apiToken) return [];
        const res = await fetch(`${API_URL}/backtests`, {
            headers: { "Authorization": `Bearer ${session.apiToken}`, "Accept": "application/json" }
        });
        if (!res.ok) throw new Error("Failed to fetch backtests");
        const data = await res.json();
        return data.data || [];
    } catch (e) {
        console.error("fetchBacktests error:", e);
        return [];
    }
};

export const saveBacktest = async (btData) => {
    try {
        const session = await getSession();
        if (!session?.apiToken) throw new Error("No session");
        const res = await fetch(`${API_URL}/backtests`, {
            method: 'POST',
            headers: { "Authorization": `Bearer ${session.apiToken}`, "Accept": "application/json", "Content-Type": "application/json" },
            body: JSON.stringify(btData)
        });
        if (!res.ok) throw new Error("Failed to save backtest");
        const data = await res.json();
        return data.data;
    } catch (e) {
        console.error("saveBacktest error:", e);
        throw e;
    }
};

export const updateBacktest = async (id, btData) => {
    try {
        const session = await getSession();
        if (!session?.apiToken) throw new Error("No session");
        const res = await fetch(`${API_URL}/backtests/${id}`, {
            method: 'PUT',
            headers: { "Authorization": `Bearer ${session.apiToken}`, "Accept": "application/json", "Content-Type": "application/json" },
            body: JSON.stringify(btData)
        });
        if (!res.ok) throw new Error("Failed to update backtest");
        const data = await res.json();
        return data.data;
    } catch (e) {
        console.error("updateBacktest error:", e);
        throw e;
    }
};

export const deleteBacktest = async (id) => {
    try {
        const session = await getSession();
        if (!session?.apiToken) throw new Error("No session");
        const res = await fetch(`${API_URL}/backtests/${id}`, {
            method: 'DELETE',
            headers: { "Authorization": `Bearer ${session.apiToken}`, "Accept": "application/json" }
        });
        if (!res.ok) throw new Error("Failed to delete backtest");
        return true;
    } catch (e) {
        console.error("deleteBacktest error:", e);
        throw e;
    }
};

export const getBacktest = async (id) => {
    try {
        const session = await getSession();
        if (!session?.apiToken) throw new Error("No session");
        const res = await fetch(`${API_URL}/backtests/${id}`, {
            headers: { "Authorization": `Bearer ${session.apiToken}`, "Accept": "application/json" }
        });
        if (!res.ok) throw new Error("Failed to fetch backtest");
        const data = await res.json();
        return data.data;
    } catch (e) {
        console.error("getBacktest error:", e);
        throw e;
    }
};

export const shareBacktest = async (id, email, role) => {
    try {
        const session = await getSession();
        if (!session?.apiToken) throw new Error("No session");
        const res = await fetch(`${API_URL}/backtests/${id}/share`, {
            method: 'POST',
            headers: { "Authorization": `Bearer ${session.apiToken}`, "Accept": "application/json", "Content-Type": "application/json" },
            body: JSON.stringify({ email, role })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to share backtest");
        return data;
    } catch (e) {
        console.error("shareBacktest error:", e);
        throw e;
    }
};

export const removeShareBacktest = async (id, userId) => {
    try {
        const session = await getSession();
        if (!session?.apiToken) throw new Error("No session");
        const res = await fetch(`${API_URL}/backtests/${id}/share/${userId}`, {
            method: 'DELETE',
            headers: { "Authorization": `Bearer ${session.apiToken}`, "Accept": "application/json" }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to remove share");
        return data;
    } catch (e) {
        console.error("removeShareBacktest error:", e);
        throw e;
    }
};
