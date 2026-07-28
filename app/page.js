"use client";
import { useState, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import BottomNav from "./components/BottomNav";
import PnlChart from "./components/PnlChart";
import styles from "./dashboard.module.css";
import { fetchAndProcessTrades } from "./utils/tradeUtils";

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
  let bestDay = 0, worstDay = 0, bestDayDate = "-", worstDayDate = "-";
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
  if (trades.length === 0) return { current: 0, type: "win", longest: 0 };

  const sortedTrades = [...trades].sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date));

  // Current streak from most recent trade
  const firstType = sortedTrades[0].pnl >= 0 ? "win" : "loss";
  let current = 0;
  for (let i = 0; i < sortedTrades.length; i++) {
    const isWin = sortedTrades[i].pnl >= 0;
    if ((firstType === "win" && isWin) || (firstType === "loss" && !isWin)) {
      current++;
    } else break;
  }

  // Longest win streak
  let longest = 0, temp = 0;
  for (let i = sortedTrades.length - 1; i >= 0; i--) {
    if (sortedTrades[i].pnl >= 0) { temp++; longest = Math.max(longest, temp); }
    else temp = 0;
  }

  return { current, type: firstType, longest };
}

/* ===== Real SL Adherence Calculator ===== */
function calculateSLStats(trades) {
  if (trades.length === 0) return { avgRisk: 0, maxRisk: 0, slBreaches: 0, totalLosingTrades: 0, adherencePercent: 100, worstLoss: 0, bySymbol: [] };

  let slBreaches = 0;
  let totalLosingTrades = 0;
  let totalRisk = 0;
  let maxRisk = 0;
  let worstLoss = 0;
  const symData = {};

  trades.forEach(t => {
    // Planned Risk: (Entry - SL) * Qty
    const plannedRisk = Math.abs(parseFloat(t.entry_price || 0) - parseFloat(t.sl || 0)) * parseFloat(t.qty || 0);
    totalRisk += plannedRisk;
    if (plannedRisk > maxRisk) maxRisk = plannedRisk;

    const sym = t.symbol || "Unknown";
    if (!symData[sym]) symData[sym] = { name: sym, totalRisk: 0, tradeCount: 0, slBreaches: 0 };
    symData[sym].totalRisk += plannedRisk;
    symData[sym].tradeCount++;

    if (t.pnl < 0) {
      totalLosingTrades++;
      const actualLoss = Math.abs(t.pnl);
      if (actualLoss > worstLoss) worstLoss = actualLoss;

      // Buffer of 5% for slippage/charges. If actual loss > planned risk * 1.05, it's a breach.
      if (actualLoss > plannedRisk * 1.05) {
        slBreaches++;
        symData[sym].slBreaches++;
      }
    }
  });

  const avgRisk = totalRisk / trades.length;
  const adherencePercent = totalLosingTrades > 0 ? ((totalLosingTrades - slBreaches) / totalLosingTrades) * 100 : 100;

  const bySymbol = Object.values(symData).map(s => {
    s.avgRisk = s.tradeCount > 0 ? s.totalRisk / s.tradeCount : 0;
    return s;
  });

  return {
    avgRisk: +avgRisk.toFixed(2),
    maxRisk: +maxRisk.toFixed(2),
    slBreaches,
    totalLosingTrades,
    adherencePercent: +adherencePercent.toFixed(1),
    worstLoss: +worstLoss.toFixed(2),
    bySymbol
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
  const router = useRouter();
  const { data: session } = useSession();
  const userName = session?.user?.name ? session.user.name.split(' ')[0] : "Trader";
  const period = "1m"; // Fixed to This Month

  const [allTrades, setAllTrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchAndProcessTrades();
      setAllTrades(data);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const filtered = useMemo(() => getFilteredTrades(allTrades, period), [allTrades, period]);
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

  const currentMonthName = new Date().toLocaleString("en-US", { month: "long" });
  const pnlTitle = period === "1m" ? `${currentMonthName.toUpperCase()} PNL` : `${currentLabel?.toUpperCase()} PNL`;

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
            <h1 className={styles.headerTitle}>Hey {userName} 👋</h1>
            <p className={styles.headerSubtitle}>Welcome back</p>
          </div>
        </div>
        <div className={styles.headerRight}>
          <button 
            className={styles.headerActionBtn} 
            onClick={() => window.location.href = '/calculator'}
            title="Calculator"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
              <rect x="9" y="9" width="6" height="6" />
              <line x1="9" y1="1" x2="9" y2="4" />
              <line x1="15" y1="1" x2="15" y2="4" />
              <line x1="9" y1="20" x2="9" y2="23" />
              <line x1="15" y1="20" x2="15" y2="23" />
              <line x1="20" y1="9" x2="23" y2="9" />
              <line x1="20" y1="14" x2="23" y2="14" />
              <line x1="1" y1="9" x2="4" y2="9" />
              <line x1="1" y1="14" x2="4" y2="14" />
            </svg>
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>Loading trades...</div>
        ) : (
          <>
            {/* Total PnL Hero */}
        <div className={`${styles.pnlHero} glass-card`} style={{ animationDelay: "0.05s", marginTop: "16px" }}>
          <div className={styles.pnlHeroTop}>
            <span className={styles.pnlLabel}>{pnlTitle}</span>
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
          <button 
            className={styles.analyticsBtn}
            onClick={() => router.push('/analytics')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" />
              <path d="M18 9l-5 5-4-4-5 5" />
            </svg>
            View Advanced Analytics
          </button>
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
                {streak.type === "win" ? "Winning Trades" : "Losing Trades"}
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
              Stop Loss Adherence
            </h3>
            <span className={styles.slBadge}>{currentLabel}</span>
          </div>

          <div className={styles.slCard}>
            <div className={styles.slCardHeader}>
              <span className={styles.slCardTitle}>Risk Discipline (Slippage Adjusted)</span>
              <span className={`${styles.slCardStatus} ${slStats.slBreaches > 0 ? styles.slBreached : styles.slSafe}`}>
                {slStats.slBreaches > 0 ? "⚠️ NEEDS WORK" : "✅ DISCIPLINED"}
              </span>
            </div>
            <div className={styles.slRow}>
              <div className={styles.slStat}>
                <span className={styles.slStatLabel}>Average Risk / Trade</span>
                <span className={`${styles.slStatValue} mono`}>₹{slStats.avgRisk.toLocaleString("en-IN")}</span>
              </div>
              <div className={styles.slStatArrow}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </div>
              <div className={styles.slStat}>
                <span className={styles.slStatLabel}>Worst Trade Loss</span>
                <span className={`${styles.slStatValue} mono`} style={{ color: slStats.worstLoss > 0 ? "var(--loss-red)" : "var(--text-muted)" }}>
                  ₹{slStats.worstLoss.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
            <div className={styles.slBar}>
              <div
                className={styles.slBarFill}
                style={{
                  width: `${slStats.adherencePercent}%`,
                  background: slStats.adherencePercent >= 80 ? "var(--profit-green)" : slStats.adherencePercent >= 50 ? "var(--accent-orange)" : "var(--loss-red)",
                }}
              />
            </div>
            <div className={styles.slBreachInfo}>
              <span>
                Maintained Stop Loss on <strong className="mono" style={{ color: slStats.adherencePercent >= 80 ? "var(--profit-green)" : "var(--loss-red)" }}>{slStats.adherencePercent}%</strong> of losing trades 
                (Breached {slStats.slBreaches} out of {slStats.totalLosingTrades})
              </span>
            </div>
          </div>

          <div className={styles.slCard}>
            <div className={styles.slCardHeader}>
              <span className={styles.slCardTitle}>Symbol Risk Breakdown</span>
              <span className={styles.slCardStatus} style={{background: 'rgba(124, 77, 255, 0.1)', color: 'var(--accent-purple)', border: '1px solid rgba(124, 77, 255, 0.2)'}}>
                {slStats.bySymbol?.length || 0} SYMBOLS
              </span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {slStats.bySymbol?.map((sym, i) => (
                <div key={i} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>{sym.name}</span>
                    <span style={{ fontSize: '10px', color: sym.slBreaches > 0 ? 'var(--loss-red)' : 'var(--profit-green)', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', background: sym.slBreaches > 0 ? 'var(--loss-red-bg)' : 'var(--profit-green-bg)' }}>
                      {sym.slBreaches > 0 ? `⚠️ ${sym.slBreaches} SL HITS` : "✅ 0 SL HITS"}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>Avg Risk / Trade</div>
                      <div style={{ fontSize: '14px', fontWeight: '600' }} className="mono">₹{sym.avgRisk.toLocaleString("en-IN", {maximumFractionDigits: 0})}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>Period Risk Taken</div>
                      <div style={{ fontSize: '14px', fontWeight: '600' }} className="mono">₹{sym.totalRisk.toLocaleString("en-IN", {maximumFractionDigits: 0})}</div>
                    </div>
                  </div>
                </div>
              ))}
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
        </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
