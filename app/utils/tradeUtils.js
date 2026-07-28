import { API_URL, normalizeMediaUrl } from "./apiConfig";
import { getSession } from "next-auth/react";

export const fetchSettings = async () => {
    try {
        const session = await getSession();
        if (!session?.apiToken) throw new Error("No session token available");
        const token = `Bearer ${session.apiToken}`;
        const res = await fetch(`${API_URL}/settings`, { 
            headers: { "Authorization": token, "Accept": "application/json" },
            cache: 'no-store'
        });
        if (!res.ok) throw new Error("Failed to fetch settings");
        return await res.json();
    } catch (e) {
        console.error("Error fetching settings:", e);
        return { symbols: [], setups: [], sessions: [], market_trends: [], timeframes: [], market_types: [], mistakes: [], rules: [] };
    }
};

export const fetchAndProcessTrades = async (existingSettings = null) => {
    try {
        const session = await getSession();
        if (!session?.apiToken) throw new Error("No session token available");
        const token = `Bearer ${session.apiToken}`;
        
        let settingsData = existingSettings;

        if (!settingsData) {
            const settingsRes = await fetch(`${API_URL}/settings`, { 
                headers: { "Authorization": token, "Accept": "application/json" },
                cache: 'no-store'
            });
            if (!settingsRes.ok) {
                console.error("Settings fetch status:", settingsRes.status, settingsRes.statusText);
                throw new Error(`Failed to fetch settings: ${settingsRes.status}`);
            }
            settingsData = await settingsRes.json();
        }
        
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
                images: trade.images ? trade.images.map(img => normalizeMediaUrl(img.image_path || img)) : [],
                grossPnl,
                charges,
                pnl: netPnl,
                netPnl,
                isWin: netPnl >= 0,
                rr: trade.type === "SHORT" && netPnl < 0 ? -rr : (netPnl < 0 ? -rr : rr)
            };
        });

        return processedTrades;
    } catch (e) {
        console.error("Error fetching trades:", e);
        return [];
    }
};
