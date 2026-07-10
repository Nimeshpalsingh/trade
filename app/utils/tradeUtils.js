export const fetchSettings = async () => {
    try {
        const token = "Bearer 1|6Jz5W4mBp114wk1fmxxjjg3bPNKHBrEsiHjnSEW2c20da63f";
        const res = await fetch("http://localhost:8000/api/settings", { headers: { "Authorization": token, "Accept": "application/json" } });
        if (!res.ok) throw new Error("Failed to fetch settings");
        return await res.json();
    } catch (e) {
        console.error("Error fetching settings:", e);
        return { symbols: [], setups: [], sessions: [], market_trends: [], timeframes: [], market_types: [], mistakes: [], rules: [] };
    }
};

export const fetchAndProcessTrades = async () => {
    try {
        const token = "Bearer 1|6Jz5W4mBp114wk1fmxxjjg3bPNKHBrEsiHjnSEW2c20da63f"; // Keeping hardcoded for now as it's the current auth method
        
        const [settingsRes, tradesRes] = await Promise.all([
            fetch("http://localhost:8000/api/settings", { headers: { "Authorization": token, "Accept": "application/json" } }),
            fetch("http://localhost:8000/api/trades", { headers: { "Authorization": token, "Accept": "application/json" } })
        ]);

        if (!settingsRes.ok || !tradesRes.ok) throw new Error("Failed to fetch data");

        const data = await settingsRes.json();
        const breakevenRules = data.symbols.filter(s => s.breakeven_value).map(s => ({ symbol: s.name, value: s.breakeven_value }));
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
                timeframe: trade.timeFrame ? trade.timeFrame.name : "",
                trend: trade.marketTrend ? trade.marketTrend.name : "",
                marketType: trade.marketType ? trade.marketType.name : "",
                session: trade.session ? trade.session.name : "",
                mistakes: trade.mistakes ? trade.mistakes.map(m => m.name) : [],
                rules: trade.rules ? trade.rules.map(r => r.name) : [],
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
