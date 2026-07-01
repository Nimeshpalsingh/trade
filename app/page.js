"use client";
import { useState, useMemo } from "react";
import BottomNav from "./components/BottomNav";
import PnlChart from "./components/PnlChart";
import styles from "./dashboard.module.css";

/* ===== FIXED DUMMY DATA — Realistic Indian Stock Market Trades ===== */
const allTrades = [
  // ===== JULY 2026 (This Month) =====
  { id:"t1", date:"2026-07-03", timestamp:1782950000000, symbol:"NIFTY", type:"LONG", pnl:-4250, rr:-2.1, isWin:false, mistakes:["Wrong Trade", "No SL"] },
  { id:"t2", date:"2026-07-03", timestamp:1782940000000, symbol:"BANKNIFTY", type:"SHORT", pnl:-1800, rr:-0.9, isWin:false, mistakes:["FOMO"] },
  { id:"t3", date:"2026-07-02", timestamp:1782860000000, symbol:"NIFTY", type:"LONG", pnl:-9100, rr:-4.5, isWin:false, mistakes:["Overtrading", "Revenge Trade"] },
  { id:"t4", date:"2026-07-01", timestamp:1782777000000, symbol:"RELIANCE", type:"LONG", pnl:2200, rr:1.5, isWin:true, mistakes:["Early Exit"] },
  { id:"t5", date:"2026-07-01", timestamp:1782777000000, symbol:"BANKNIFTY", type:"SHORT", pnl:-3200, rr:-1.6, isWin:false, mistakes:["Overtrading","FOMO"] },
  { id:"t6", date:"2026-06-27", timestamp:1782432000000, symbol:"NIFTY", type:"LONG", pnl:5800, rr:2.9, isWin:true, mistakes:[] },
  { id:"t7", date:"2026-06-27", timestamp:1782432000000, symbol:"BANKNIFTY", type:"LONG", pnl:7200, rr:3.2, isWin:true, mistakes:[] },
  { id:"t8", date:"2026-06-26", timestamp:1782345600000, symbol:"NIFTY", type:"SHORT", pnl:-2400, rr:-1.2, isWin:false, mistakes:["Wrong Trade"] },
  { id:"t9", date:"2026-06-26", timestamp:1782345600000, symbol:"TCS", type:"LONG", pnl:1500, rr:1.1, isWin:true, mistakes:[] },
  { id:"t10", date:"2026-06-25", timestamp:1782259200000, symbol:"BANKNIFTY", type:"LONG", pnl:-4500, rr:-2.2, isWin:false, mistakes:["No SL","Revenge Trade"] },
  { id:"t11", date:"2026-06-25", timestamp:1782259200000, symbol:"NIFTY", type:"SHORT", pnl:3800, rr:1.9, isWin:true, mistakes:[] },
  { id:"t12", date:"2026-06-24", timestamp:1782172800000, symbol:"NIFTY", type:"LONG", pnl:6100, rr:3.0, isWin:true, mistakes:[] },
  { id:"t13", date:"2026-06-24", timestamp:1782172800000, symbol:"INFY", type:"LONG", pnl:1800, rr:1.3, isWin:true, mistakes:["Early Exit"] },
  { id:"t14", date:"2026-06-23", timestamp:1782086400000, symbol:"BANKNIFTY", type:"SHORT", pnl:-2800, rr:-1.4, isWin:false, mistakes:["Overtrading"] },
  { id:"t15", date:"2026-06-23", timestamp:1782086400000, symbol:"NIFTY", type:"LONG", pnl:4400, rr:2.2, isWin:true, mistakes:[] },
  { id:"t16", date:"2026-06-20", timestamp:1781827200000, symbol:"NIFTY", type:"LONG", pnl:2900, rr:1.5, isWin:true, mistakes:[] },
  { id:"t17", date:"2026-06-20", timestamp:1781827200000, symbol:"BANKNIFTY", type:"SHORT", pnl:5200, rr:2.6, isWin:true, mistakes:[] },
  { id:"t18", date:"2026-06-19", timestamp:1781740800000, symbol:"RELIANCE", type:"LONG", pnl:-1200, rr:-0.6, isWin:false, mistakes:["FOMO","Early Exit"] },
  { id:"t19", date:"2026-06-19", timestamp:1781740800000, symbol:"NIFTY", type:"LONG", pnl:3600, rr:1.8, isWin:true, mistakes:[] },
  { id:"t20", date:"2026-06-18", timestamp:1781654400000, symbol:"BANKNIFTY", type:"LONG", pnl:-5100, rr:-2.5, isWin:false, mistakes:["Overtrading","No SL"] },
  { id:"t21", date:"2026-06-18", timestamp:1781654400000, symbol:"NIFTY", type:"SHORT", pnl:2100, rr:1.1, isWin:true, mistakes:[] },
  { id:"t22", date:"2026-06-17", timestamp:1781568000000, symbol:"NIFTY", type:"LONG", pnl:4800, rr:2.4, isWin:true, mistakes:[] },
  { id:"t23", date:"2026-06-17", timestamp:1781568000000, symbol:"HDFCBANK", type:"LONG", pnl:1100, rr:0.8, isWin:true, mistakes:[] },
  { id:"t24", date:"2026-06-16", timestamp:1781481600000, symbol:"BANKNIFTY", type:"SHORT", pnl:6800, rr:3.4, isWin:true, mistakes:[] },
  { id:"t25", date:"2026-06-16", timestamp:1781481600000, symbol:"NIFTY", type:"LONG", pnl:-1600, rr:-0.8, isWin:false, mistakes:["Wrong Trade"] },
  // ===== MAY 2026 =====
  { id:"t26", date:"2026-05-29", timestamp:1779926400000, symbol:"NIFTY", type:"LONG", pnl:3400, rr:1.7, isWin:true, mistakes:[] },
  { id:"t27", date:"2026-05-28", timestamp:1779840000000, symbol:"BANKNIFTY", type:"SHORT", pnl:-3800, rr:-1.9, isWin:false, mistakes:["Revenge Trade"] },
  { id:"t28", date:"2026-05-27", timestamp:1779753600000, symbol:"NIFTY", type:"LONG", pnl:5500, rr:2.8, isWin:true, mistakes:[] },
  { id:"t29", date:"2026-05-26", timestamp:1779667200000, symbol:"RELIANCE", type:"SHORT", pnl:2800, rr:1.4, isWin:true, mistakes:[] },
  { id:"t30", date:"2026-05-23", timestamp:1779408000000, symbol:"NIFTY", type:"LONG", pnl:-2200, rr:-1.1, isWin:false, mistakes:["Overtrading","FOMO"] },
  { id:"t31", date:"2026-05-22", timestamp:1779321600000, symbol:"BANKNIFTY", type:"LONG", pnl:8200, rr:4.1, isWin:true, mistakes:[] },
  { id:"t32", date:"2026-05-21", timestamp:1779235200000, symbol:"NIFTY", type:"SHORT", pnl:4100, rr:2.1, isWin:true, mistakes:[] },
  { id:"t33", date:"2026-05-20", timestamp:1779148800000, symbol:"TCS", type:"LONG", pnl:-900, rr:-0.5, isWin:false, mistakes:["Early Exit"] },
  { id:"t34", date:"2026-05-19", timestamp:1779062400000, symbol:"NIFTY", type:"LONG", pnl:3200, rr:1.6, isWin:true, mistakes:[] },
  { id:"t35", date:"2026-05-16", timestamp:1778803200000, symbol:"BANKNIFTY", type:"SHORT", pnl:-4200, rr:-2.1, isWin:false, mistakes:["No SL"] },
  { id:"t36", date:"2026-05-15", timestamp:1778716800000, symbol:"NIFTY", type:"LONG", pnl:2600, rr:1.3, isWin:true, mistakes:[] },
  { id:"t37", date:"2026-05-14", timestamp:1778630400000, symbol:"INFY", type:"LONG", pnl:1900, rr:1.0, isWin:true, mistakes:[] },
  { id:"t38", date:"2026-05-13", timestamp:1778544000000, symbol:"BANKNIFTY", type:"LONG", pnl:7500, rr:3.8, isWin:true, mistakes:[] },
  { id:"t39", date:"2026-05-12", timestamp:1778457600000, symbol:"NIFTY", type:"SHORT", pnl:-1500, rr:-0.8, isWin:false, mistakes:["Wrong Trade","FOMO"] },
  // ===== APRIL 2026 =====
  { id:"t40", date:"2026-04-30", timestamp:1777420800000, symbol:"NIFTY", type:"LONG", pnl:4600, rr:2.3, isWin:true, mistakes:[] },
  { id:"t41", date:"2026-04-29", timestamp:1777334400000, symbol:"BANKNIFTY", type:"SHORT", pnl:-2900, rr:-1.5, isWin:false, mistakes:["Overtrading"] },
  { id:"t42", date:"2026-04-28", timestamp:1777248000000, symbol:"RELIANCE", type:"LONG", pnl:3100, rr:1.6, isWin:true, mistakes:[] },
  { id:"t43", date:"2026-04-25", timestamp:1776988800000, symbol:"NIFTY", type:"LONG", pnl:5900, rr:3.0, isWin:true, mistakes:[] },
  { id:"t44", date:"2026-04-24", timestamp:1776902400000, symbol:"BANKNIFTY", type:"LONG", pnl:-6200, rr:-3.1, isWin:false, mistakes:["No SL","Revenge Trade"] },
  { id:"t45", date:"2026-04-23", timestamp:1776816000000, symbol:"NIFTY", type:"SHORT", pnl:2400, rr:1.2, isWin:true, mistakes:[] },
  { id:"t46", date:"2026-04-22", timestamp:1776729600000, symbol:"TCS", type:"LONG", pnl:1700, rr:0.9, isWin:true, mistakes:["Early Exit"] },
  // ===== MARCH 2026 =====
  { id:"t47", date:"2026-03-31", timestamp:1775145600000, symbol:"NIFTY", type:"LONG", pnl:3800, rr:1.9, isWin:true, mistakes:[] },
  { id:"t48", date:"2026-03-27", timestamp:1774800000000, symbol:"BANKNIFTY", type:"SHORT", pnl:6400, rr:3.2, isWin:true, mistakes:[] },
  { id:"t49", date:"2026-03-26", timestamp:1774713600000, symbol:"NIFTY", type:"LONG", pnl:-3500, rr:-1.8, isWin:false, mistakes:["FOMO","Overtrading"] },
  { id:"t50", date:"2026-03-25", timestamp:1774627200000, symbol:"RELIANCE", type:"LONG", pnl:2100, rr:1.1, isWin:true, mistakes:[] },
  { id:"t51", date:"2026-03-24", timestamp:1774540800000, symbol:"NIFTY", type:"SHORT", pnl:4900, rr:2.5, isWin:true, mistakes:[] },
  { id:"t52", date:"2026-03-21", timestamp:1774281600000, symbol:"BANKNIFTY", type:"LONG", pnl:-1800, rr:-0.9, isWin:false, mistakes:["Wrong Trade"] },
  // ===== FEB 2026 =====
  { id:"t53", date:"2026-02-27", timestamp:1772150400000, symbol:"NIFTY", type:"LONG", pnl:5200, rr:2.6, isWin:true, mistakes:[] },
  { id:"t54", date:"2026-02-26", timestamp:1772064000000, symbol:"BANKNIFTY", type:"SHORT", pnl:-4100, rr:-2.1, isWin:false, mistakes:["No SL"] },
  { id:"t55", date:"2026-02-25", timestamp:1771977600000, symbol:"NIFTY", type:"LONG", pnl:3600, rr:1.8, isWin:true, mistakes:[] },
  { id:"t56", date:"2026-02-24", timestamp:1771891200000, symbol:"INFY", type:"LONG", pnl:1400, rr:0.7, isWin:true, mistakes:["Early Exit"] },
  // ===== JAN 2026 =====
  { id:"t57", date:"2026-01-30", timestamp:1769731200000, symbol:"NIFTY", type:"SHORT", pnl:7100, rr:3.6, isWin:true, mistakes:[] },
  { id:"t58", date:"2026-01-29", timestamp:1769644800000, symbol:"BANKNIFTY", type:"LONG", pnl:-2600, rr:-1.3, isWin:false, mistakes:["Revenge Trade"] },
  { id:"t59", date:"2026-01-28", timestamp:1769558400000, symbol:"NIFTY", type:"LONG", pnl:4300, rr:2.2, isWin:true, mistakes:[] },
  { id:"t60", date:"2026-01-27", timestamp:1769472000000, symbol:"RELIANCE", type:"LONG", pnl:2800, rr:1.4, isWin:true, mistakes:[] },
  // ===== DEC 2025 =====
  { id:"t61", date:"2025-12-30", timestamp:1767052800000, symbol:"NIFTY", type:"LONG", pnl:3900, rr:2.0, isWin:true, mistakes:[] },
  { id:"t62", date:"2025-12-29", timestamp:1766966400000, symbol:"BANKNIFTY", type:"SHORT", pnl:-5500, rr:-2.8, isWin:false, mistakes:["Overtrading","FOMO"] },
  { id:"t63", date:"2025-12-26", timestamp:1766707200000, symbol:"NIFTY", type:"LONG", pnl:6700, rr:3.4, isWin:true, mistakes:[] },
  { id:"t64", date:"2025-12-24", timestamp:1766534400000, symbol:"TCS", type:"LONG", pnl:1200, rr:0.6, isWin:true, mistakes:[] },
  // ===== NOV 2025 =====
  { id:"t65", date:"2025-11-28", timestamp:1764288000000, symbol:"NIFTY", type:"SHORT", pnl:5100, rr:2.6, isWin:true, mistakes:[] },
  { id:"t66", date:"2025-11-27", timestamp:1764201600000, symbol:"BANKNIFTY", type:"LONG", pnl:-3200, rr:-1.6, isWin:false, mistakes:["Wrong Trade"] },
  { id:"t67", date:"2025-11-26", timestamp:1764115200000, symbol:"NIFTY", type:"LONG", pnl:4400, rr:2.2, isWin:true, mistakes:[] },
  // ===== OCT 2025 =====
  { id:"t68", date:"2025-10-31", timestamp:1761868800000, symbol:"NIFTY", type:"LONG", pnl:3300, rr:1.7, isWin:true, mistakes:[] },
  { id:"t69", date:"2025-10-30", timestamp:1761782400000, symbol:"BANKNIFTY", type:"SHORT", pnl:7800, rr:3.9, isWin:true, mistakes:[] },
  { id:"t70", date:"2025-10-29", timestamp:1761696000000, symbol:"RELIANCE", type:"LONG", pnl:-1900, rr:-1.0, isWin:false, mistakes:["FOMO"] },
  // ===== SEP 2025 =====
  { id:"t71", date:"2025-09-30", timestamp:1759190400000, symbol:"NIFTY", type:"LONG", pnl:5600, rr:2.8, isWin:true, mistakes:[] },
  { id:"t72", date:"2025-09-29", timestamp:1759104000000, symbol:"BANKNIFTY", type:"SHORT", pnl:-4800, rr:-2.4, isWin:false, mistakes:["No SL","Overtrading"] },
  { id:"t73", date:"2025-09-26", timestamp:1758844800000, symbol:"NIFTY", type:"LONG", pnl:2900, rr:1.5, isWin:true, mistakes:[] },
  // ===== AUG 2025 =====
  { id:"t74", date:"2025-08-29", timestamp:1756425600000, symbol:"NIFTY", type:"SHORT", pnl:4200, rr:2.1, isWin:true, mistakes:[] },
  { id:"t75", date:"2025-08-28", timestamp:1756339200000, symbol:"BANKNIFTY", type:"LONG", pnl:-2700, rr:-1.4, isWin:false, mistakes:["Revenge Trade"] },
  { id:"t76", date:"2025-08-27", timestamp:1756252800000, symbol:"NIFTY", type:"LONG", pnl:6300, rr:3.2, isWin:true, mistakes:[] },
].sort((a, b) => b.timestamp - a.timestamp);

const PERIOD_OPTIONS = [
  { label: "This Month", value: "1m" },
  { label: "3 Months", value: "3m" },
  { label: "6 Months", value: "6m" },
  { label: "1 Year", value: "1y" },
];

function getFilteredTrades(trades, period) {
  const now = new Date();
  let startDate = new Date();
  switch (period) {
    case "1m":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "3m":
      startDate.setMonth(now.getMonth() - 3);
      break;
    case "6m":
      startDate.setMonth(now.getMonth() - 6);
      break;
    case "1y":
      startDate.setFullYear(now.getFullYear() - 1);
      break;
  }
  return trades.filter((t) => new Date(t.date) >= startDate);
}

/* ===== SL LIMITS CONFIG ===== */
const SL_LIMITS = {
  dailySL: 3000,    // ₹3,000 per day max loss
  monthlySL: 15000, // ₹15,000 per month max loss
};

function calculateStats(trades) {
  if (trades.length === 0) {
    return {
      totalPnl: 0, winRate: 0, totalTrades: 0, avgRR: 0,
      bestDay: 0, worstDay: 0, bestDayDate: "-", worstDayDate: "-",
      wins: 0, losses: 0, chartData: [], mistakes: {},
    };
  }

  const wins = trades.filter((t) => t.isWin).length;
  const losses = trades.length - wins;
  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const avgRR = trades.reduce((s, t) => s + Math.abs(t.rr), 0) / trades.length;

  // Group by date
  const byDate = {};
  trades.forEach((t) => {
    if (!byDate[t.date]) byDate[t.date] = 0;
    byDate[t.date] += t.pnl;
  });

  const dayEntries = Object.entries(byDate).sort((a, b) => new Date(a[0]) - new Date(b[0]));
  let bestDay = -Infinity, worstDay = Infinity, bestDayDate = "", worstDayDate = "";
  dayEntries.forEach(([date, pnl]) => {
    if (pnl > bestDay) { bestDay = pnl; bestDayDate = date; }
    if (pnl < worstDay) { worstDay = pnl; worstDayDate = date; }
  });

  // Build cumulative chart data
  let cumulative = 0;
  const chartData = dayEntries.map(([date, pnl]) => {
    cumulative += pnl;
    return {
      date: new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      pnl: +cumulative.toFixed(2),
      dailyPnl: +pnl.toFixed(2),
    };
  });

  // Mistakes count
  const mistakes = {};
  trades.forEach((t) => {
    t.mistakes.forEach((m) => {
      mistakes[m] = (mistakes[m] || 0) + 1;
    });
  });

  return {
    totalPnl: +totalPnl.toFixed(2),
    winRate: +((wins / trades.length) * 100).toFixed(1),
    totalTrades: trades.length,
    avgRR: +avgRR.toFixed(2),
    bestDay: +bestDay.toFixed(2),
    worstDay: +worstDay.toFixed(2),
    bestDayDate,
    worstDayDate,
    wins,
    losses,
    chartData,
    mistakes,
  };
}

/* ===== Winning Streak Calculator ===== */
function calculateStreak(trades) {
  // Group by date, get daily PnL, sort latest first
  const byDate = {};
  trades.forEach((t) => {
    if (!byDate[t.date]) byDate[t.date] = 0;
    byDate[t.date] += t.pnl;
  });
  const days = Object.entries(byDate)
    .sort((a, b) => new Date(b[0]) - new Date(a[0]))
    .map(([date, pnl]) => ({ date, pnl }));

  if (days.length === 0) return { current: 0, type: "win", longest: 0 };

  // Current streak from most recent day
  const firstType = days[0].pnl >= 0 ? "win" : "loss";
  let current = 0;
  for (let i = 0; i < days.length; i++) {
    const isWin = days[i].pnl >= 0;
    if ((firstType === "win" && isWin) || (firstType === "loss" && !isWin)) {
      current++;
    } else break;
  }

  // Longest win streak
  let longest = 0, temp = 0;
  for (const d of [...days].reverse()) {
    if (d.pnl >= 0) { temp++; longest = Math.max(longest, temp); }
    else temp = 0;
  }

  return { current, type: firstType, longest };
}

/* ===== SL Breach Calculator ===== */
function calculateSLStats(trades) {
  // Group by date
  const byDate = {};
  trades.forEach((t) => {
    if (!byDate[t.date]) byDate[t.date] = 0;
    byDate[t.date] += t.pnl;
  });

  const dailyPnls = Object.entries(byDate).map(([date, pnl]) => ({ date, pnl }));
  const lossDays = dailyPnls.filter((d) => d.pnl < 0);

  // Worst daily loss
  const worstDailyLoss = lossDays.length > 0
    ? Math.min(...lossDays.map((d) => d.pnl))
    : 0;

  // Daily SL breaches
  const dailyBreaches = lossDays.filter((d) => Math.abs(d.pnl) > SL_LIMITS.dailySL).length;

  // Monthly total loss (sum of all losing days only)
  const monthlyTotalLoss = lossDays.reduce((s, d) => s + Math.abs(d.pnl), 0);
  const monthlyBreached = monthlyTotalLoss > SL_LIMITS.monthlySL;

  return {
    dailySLLimit: SL_LIMITS.dailySL,
    monthlySLLimit: SL_LIMITS.monthlySL,
    worstDailyLoss: Math.abs(worstDailyLoss),
    dailyBreaches,
    totalLossDays: lossDays.length,
    monthlyTotalLoss,
    monthlyBreached,
  };
}

const mistakeIcons = {
  Overtrading: "🔄",
  FOMO: "😰",
  "Early Exit": "🏃",
  "Wrong Trade": "❌",
  "No SL": "🚫",
  "Revenge Trade": "😡",
};

const mistakeColors = {
  Overtrading: "#ff5252",
  FOMO: "#ffab40",
  "Early Exit": "#448aff",
  "Wrong Trade": "#7c4dff",
  "No SL": "#ff5252",
  "Revenge Trade": "#ff5252",
};

export default function Dashboard() {
  const period = "1m"; // Fixed to This Month

  const filtered = useMemo(() => getFilteredTrades(allTrades, period), [period]);
  const stats = useMemo(() => calculateStats(filtered), [filtered]);
  const streak = useMemo(() => calculateStreak(filtered), [filtered]);
  const slStats = useMemo(() => calculateSLStats(filtered), [filtered]);

  const currentLabel = PERIOD_OPTIONS.find((o) => o.value === period)?.label;

  const formatCurrency = (val) => {
    const abs = Math.abs(val);
    if (abs >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
    if (abs >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
    return `₹${val.toFixed(0)}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === "-") return "-";
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const sortedMistakes = Object.entries(stats.mistakes).sort((a, b) => b[1] - a[1]);
  const dailySLPercent = Math.min((slStats.worstDailyLoss / slStats.dailySLLimit) * 100, 100);
  const monthlySLPercent = Math.min((slStats.monthlyTotalLoss / slStats.monthlySLLimit) * 100, 100);

  return (
    <div className="page-wrapper">
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logo}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="url(#grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#448aff" />
                  <stop offset="100%" stopColor="#7c4dff" />
                </linearGradient>
              </defs>
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div>
            <h1 className={styles.headerTitle}>TradeJournal</h1>
            <p className={styles.headerSubtitle}>Pro Dashboard</p>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.liveIndicator}>
            <span className={styles.liveDot} />
            LIVE
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {/* Total PnL Hero */}
        <div className={`${styles.pnlHero} glass-card`} style={{ animationDelay: "0.05s", marginTop: "16px" }}>
          <div className={styles.pnlHeroTop}>
            <span className={styles.pnlLabel}>Total PnL</span>
            <span className={`${styles.pnlBadge} ${stats.totalPnl >= 0 ? styles.pnlBadgeGreen : styles.pnlBadgeRed}`}>
              {stats.totalPnl >= 0 ? "PROFIT" : "LOSS"}
            </span>
          </div>
          <div className={`${styles.pnlValue} mono ${stats.totalPnl >= 0 ? "text-profit" : "text-loss"}`}>
            {stats.totalPnl >= 0 ? "+" : ""}{formatCurrency(stats.totalPnl)}
          </div>
          <div className={styles.pnlMeta}>
            <span>{stats.wins}W / {stats.losses}L</span>
            <span>•</span>
            <span>{stats.totalTrades} trades</span>
          </div>
        </div>

        {/* PnL Line Chart */}
        <div className={`${styles.chartCard} glass-card`} style={{ animationDelay: "0.1s" }}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Equity Curve</h3>
            <span className={`${styles.chartBadge} ${stats.totalPnl >= 0 ? styles.chartBadgeGreen : styles.chartBadgeRed}`}>
              {stats.totalPnl >= 0 ? "▲" : "▼"} {formatCurrency(stats.totalPnl)}
            </span>
          </div>
          <div className={styles.chartBody}>
            <PnlChart data={stats.chartData} isProfit={stats.totalPnl >= 0} />
          </div>
        </div>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          {/* Win Rate */}
          <div className={`${styles.statCard} glass-card`} style={{ animationDelay: "0.15s" }}>
            <div className={styles.statIcon} style={{ background: "var(--profit-green-bg)", color: "var(--profit-green)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Win Rate</span>
              <span className={`${styles.statValue} mono text-profit`}>{stats.winRate}%</span>
            </div>
          </div>

          {/* Total Trades */}
          <div className={`${styles.statCard} glass-card`} style={{ animationDelay: "0.2s" }}>
            <div className={styles.statIcon} style={{ background: "var(--accent-blue-bg)", color: "var(--accent-blue)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Total Trades</span>
              <span className={`${styles.statValue} mono`}>{stats.totalTrades}</span>
            </div>
          </div>

          {/* Avg RR */}
          <div className={`${styles.statCard} glass-card`} style={{ animationDelay: "0.25s" }}>
            <div className={styles.statIcon} style={{ background: "var(--accent-purple-bg)", color: "var(--accent-purple)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Avg R:R</span>
              <span className={`${styles.statValue} mono`}>{stats.avgRR}R</span>
            </div>
          </div>

          {/* Best Day */}
          <div className={`${styles.statCard} glass-card`} style={{ animationDelay: "0.3s" }}>
            <div className={styles.statIcon} style={{ background: "var(--profit-green-bg)", color: "var(--profit-green)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Best Day</span>
              <span className={`${styles.statValue} mono text-profit`}>+{formatCurrency(stats.bestDay)}</span>
              <span className={styles.statSub}>{formatDate(stats.bestDayDate)}</span>
            </div>
          </div>

          {/* Worst Day */}
          <div className={`${styles.statCard} glass-card`} style={{ animationDelay: "0.35s" }}>
            <div className={styles.statIcon} style={{ background: "var(--loss-red-bg)", color: "var(--loss-red)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                <polyline points="17 18 23 18 23 12" />
              </svg>
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Worst Day</span>
              <span className={`${styles.statValue} mono text-loss`}>{formatCurrency(stats.worstDay)}</span>
              <span className={styles.statSub}>{formatDate(stats.worstDayDate)}</span>
            </div>
          </div>

          {/* Win/Loss Ratio */}
          <div className={`${styles.statCard} glass-card`} style={{ animationDelay: "0.4s" }}>
            <div className={styles.statIcon} style={{ background: "var(--accent-cyan-bg)", color: "var(--accent-cyan)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
                <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
              </svg>
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>W/L Ratio</span>
              <span className={`${styles.statValue} mono`}>{stats.losses > 0 ? (stats.wins / stats.losses).toFixed(2) : stats.wins}</span>
            </div>
          </div>
        </div>

        {/* Winning Streak Section */}
        <div className={`${styles.streakSection} glass-card`} style={{ animationDelay: "0.42s" }}>
          <div className={styles.streakHeader}>
            <h3 className={styles.streakTitle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              Winning Streak
            </h3>
          </div>
          <div className={styles.streakContent}>
            <div className={styles.streakBig}>
              <span className={`${styles.streakNumber} mono ${streak.type === "win" ? "text-profit" : "text-loss"}`}>
                {streak.current}
              </span>
              <span className={styles.streakEmoji}>
                {streak.type === "win" ? "🔥" : "❄️"}
              </span>
              <span className={styles.streakTypeLabel}>
                {streak.type === "win" ? "Winning Days" : "Losing Days"}
              </span>
            </div>
            <div className={styles.streakMeta}>
              <div className={styles.streakMetaItem}>
                <span className={styles.streakMetaLabel}>Current</span>
                <span className={`${styles.streakMetaValue} mono ${streak.type === "win" ? "text-profit" : "text-loss"}`}>
                  {streak.current} {streak.type === "win" ? "W" : "L"}
                </span>
              </div>
              <div className={styles.streakDivider} />
              <div className={styles.streakMetaItem}>
                <span className={styles.streakMetaLabel}>Best Win Streak</span>
                <span className={`${styles.streakMetaValue} mono text-profit`}>{streak.longest} 🔥</span>
              </div>
              <div className={styles.streakDivider} />
              <div className={styles.streakMetaItem}>
                <span className={styles.streakMetaLabel}>Status</span>
                <span className={`${styles.streakMetaValue}`} style={{ color: streak.type === "win" ? "var(--profit-green)" : "var(--loss-red)" }}>
                  {streak.type === "win" ? "On Fire 🔥" : "Recovery Mode"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Management — SL Section */}
        <div className={`${styles.slSection} glass-card`} style={{ animationDelay: "0.44s" }}>
          <div className={styles.slHeader}>
            <h3 className={styles.slTitle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--loss-red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Risk Management
            </h3>
            <span className={styles.slBadge}>{currentLabel}</span>
          </div>

          {/* Daily SL */}
          <div className={styles.slCard}>
            <div className={styles.slCardHeader}>
              <span className={styles.slCardTitle}>Per Day SL Limit</span>
              <span className={`${styles.slCardStatus} ${slStats.worstDailyLoss > slStats.dailySLLimit ? styles.slBreached : styles.slSafe}`}>
                {slStats.worstDailyLoss > slStats.dailySLLimit ? "⚠️ BREACHED" : "✅ SAFE"}
              </span>
            </div>
            <div className={styles.slRow}>
              <div className={styles.slStat}>
                <span className={styles.slStatLabel}>Set Limit</span>
                <span className={`${styles.slStatValue} mono`}>₹{slStats.dailySLLimit.toLocaleString("en-IN")}</span>
              </div>
              <div className={styles.slStatArrow}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </div>
              <div className={styles.slStat}>
                <span className={styles.slStatLabel}>Worst Day Loss</span>
                <span className={`${styles.slStatValue} mono`} style={{ color: slStats.worstDailyLoss > slStats.dailySLLimit ? "var(--loss-red)" : "var(--profit-green)" }}>
                  ₹{slStats.worstDailyLoss.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
            <div className={styles.slBar}>
              <div
                className={styles.slBarFill}
                style={{
                  width: `${dailySLPercent}%`,
                  background: dailySLPercent >= 100 ? "var(--loss-red)" : dailySLPercent >= 70 ? "var(--accent-orange)" : "var(--profit-green)",
                }}
              />
            </div>
            <div className={styles.slBreachInfo}>
              <span>Breached <strong className="mono" style={{ color: slStats.dailyBreaches > 0 ? "var(--loss-red)" : "var(--profit-green)" }}>{slStats.dailyBreaches}</strong> out of {slStats.totalLossDays} loss days</span>
            </div>
          </div>

          {/* Monthly SL */}
          <div className={styles.slCard}>
            <div className={styles.slCardHeader}>
              <span className={styles.slCardTitle}>Monthly SL Limit</span>
              <span className={`${styles.slCardStatus} ${slStats.monthlyBreached ? styles.slBreached : styles.slSafe}`}>
                {slStats.monthlyBreached ? "🚨 EXCEEDED" : "✅ WITHIN LIMIT"}
              </span>
            </div>
            <div className={styles.slRow}>
              <div className={styles.slStat}>
                <span className={styles.slStatLabel}>Set Limit</span>
                <span className={`${styles.slStatValue} mono`}>₹{slStats.monthlySLLimit.toLocaleString("en-IN")}</span>
              </div>
              <div className={styles.slStatArrow}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </div>
              <div className={styles.slStat}>
                <span className={styles.slStatLabel}>Total Monthly Loss</span>
                <span className={`${styles.slStatValue} mono`} style={{ color: slStats.monthlyBreached ? "var(--loss-red)" : "var(--profit-green)" }}>
                  ₹{slStats.monthlyTotalLoss.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
            <div className={styles.slBar}>
              <div
                className={styles.slBarFill}
                style={{
                  width: `${monthlySLPercent}%`,
                  background: monthlySLPercent >= 100 ? "var(--loss-red)" : monthlySLPercent >= 70 ? "var(--accent-orange)" : "var(--profit-green)",
                }}
              />
            </div>
            <div className={styles.slBreachInfo}>
              <span>{monthlySLPercent.toFixed(0)}% of monthly limit used</span>
            </div>
          </div>
        </div>

        {/* Mistakes Section */}
        <div className={`${styles.mistakesSection} glass-card`} style={{ animationDelay: "0.45s" }}>
          <div className={styles.mistakesHeader}>
            <h3 className={styles.mistakesTitle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              Trading Mistakes
            </h3>
            <span className={styles.mistakesCount}>{currentLabel}</span>
          </div>
          {sortedMistakes.length === 0 ? (
            <div className={styles.noMistakes}>
              <span>🎯</span>
              <p>No mistakes recorded!</p>
            </div>
          ) : (
            <div className={styles.mistakesList}>
              {sortedMistakes.map(([name, count]) => {
                const maxCount = sortedMistakes[0][1];
                const percentage = (count / maxCount) * 100;
                return (
                  <div key={name} className={styles.mistakeItem}>
                    <div className={styles.mistakeInfo}>
                      <span className={styles.mistakeIcon}>{mistakeIcons[name] || "⚠️"}</span>
                      <span className={styles.mistakeName}>{name}</span>
                      <span className={styles.mistakeCount} style={{ color: mistakeColors[name] || "var(--accent-orange)" }}>
                        {count}x
                      </span>
                    </div>
                    <div className={styles.mistakeBar}>
                      <div
                        className={styles.mistakeBarFill}
                        style={{
                          width: `${percentage}%`,
                          background: mistakeColors[name] || "var(--accent-orange)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
