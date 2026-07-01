"use client";
import { useMemo } from "react";
import BottomNav from "../components/BottomNav";
import styles from "./analytics.module.css";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from "recharts";

/* Mock Analytics Data */
const weekdayData = [
  { day: "Mon", pnl: 4200, trades: 18 },
  { day: "Tue", pnl: -1800, trades: 15 },
  { day: "Wed", pnl: 6500, trades: 22 },
  { day: "Thu", pnl: 3100, trades: 20 },
  { day: "Fri", pnl: -900, trades: 12 },
];

const symbolData = [
  { name: "NIFTY", value: 42, color: "#448aff" },
  { name: "BANKNIFTY", value: 28, color: "#7c4dff" },
  { name: "RELIANCE", value: 15, color: "#00e676" },
  { name: "TCS", value: 10, color: "#ffab40" },
  { name: "Others", value: 5, color: "#5a5b70" },
];

const sessionData = [
  { session: "9:15 - 10:00", pnl: 8200, winRate: 72 },
  { session: "10:00 - 11:30", pnl: 3400, winRate: 58 },
  { session: "11:30 - 13:00", pnl: -2100, winRate: 38 },
  { session: "13:00 - 14:30", pnl: 1200, winRate: 55 },
  { session: "14:30 - 15:30", pnl: -800, winRate: 42 },
];

const streakData = {
  currentStreak: 3,
  streakType: "win",
  longestWin: 8,
  longestLoss: 4,
  avgWinStreak: 3.2,
  avgLossStreak: 1.8,
};

const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  const val = payload[0].value;
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      <p className={styles.tooltipValue} style={{ color: val >= 0 ? "var(--profit-green)" : "var(--loss-red)" }}>
        {val >= 0 ? "+" : ""}₹{Math.abs(val).toLocaleString("en-IN")}
      </p>
    </div>
  );
};

export default function AnalyticsPage() {
  return (
    <div className="page-wrapper">
      <header className={styles.header}>
        <h1 className={styles.title}>Analytics</h1>
        <span className={styles.badge}>This Month</span>
      </header>

      <main className={styles.main}>
        {/* Weekday Performance */}
        <div className={`${styles.card} glass-card`}>
          <h3 className={styles.cardTitle}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Weekday Performance
          </h3>
          <div className={styles.chartBody}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weekdayData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "#5a5b70", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#5a5b70", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar dataKey="pnl" radius={[6, 6, 0, 0]} barSize={32}>
                  {weekdayData.map((entry, i) => (
                    <Cell key={i} fill={entry.pnl >= 0 ? "rgba(0, 230, 118, 0.5)" : "rgba(255, 82, 82, 0.5)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Symbol Distribution */}
        <div className={`${styles.card} glass-card`}>
          <h3 className={styles.cardTitle}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-purple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
              <path d="M22 12A10 10 0 0 0 12 2v10z" />
            </svg>
            Symbol Distribution
          </h3>
          <div className={styles.pieRow}>
            <div className={styles.pieChart}>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={symbolData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {symbolData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className={styles.pieLegend}>
              {symbolData.map((s) => (
                <div key={s.name} className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: s.color }} />
                  <span className={styles.legendName}>{s.name}</span>
                  <span className={styles.legendValue}>{s.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Session Analysis */}
        <div className={`${styles.card} glass-card`}>
          <h3 className={styles.cardTitle}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            Session Analysis
          </h3>
          <div className={styles.sessionList}>
            {sessionData.map((s, i) => (
              <div key={i} className={styles.sessionItem}>
                <div className={styles.sessionTime}>{s.session}</div>
                <div className={styles.sessionStats}>
                  <span
                    className={`${styles.sessionPnl} mono`}
                    style={{ color: s.pnl >= 0 ? "var(--profit-green)" : "var(--loss-red)" }}
                  >
                    {s.pnl >= 0 ? "+" : ""}₹{Math.abs(s.pnl).toLocaleString("en-IN")}
                  </span>
                  <span className={styles.sessionWr} style={{ color: s.winRate >= 50 ? "var(--profit-green)" : "var(--loss-red)" }}>
                    {s.winRate}% WR
                  </span>
                </div>
                <div className={styles.sessionBar}>
                  <div
                    className={styles.sessionBarFill}
                    style={{
                      width: `${s.winRate}%`,
                      background: s.winRate >= 50 ? "var(--profit-green)" : "var(--loss-red)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Streak Card */}
        <div className={`${styles.card} glass-card`}>
          <h3 className={styles.cardTitle}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            Streak Stats
          </h3>
          <div className={styles.streakGrid}>
            <div className={styles.streakItem}>
              <span className={styles.streakLabel}>Current</span>
              <span className={`${styles.streakValue} mono ${streakData.streakType === "win" ? "text-profit" : "text-loss"}`}>
                {streakData.currentStreak} {streakData.streakType === "win" ? "🔥" : "❄️"}
              </span>
            </div>
            <div className={styles.streakItem}>
              <span className={styles.streakLabel}>Best Win</span>
              <span className={`${styles.streakValue} mono text-profit`}>{streakData.longestWin}🔥</span>
            </div>
            <div className={styles.streakItem}>
              <span className={styles.streakLabel}>Worst Loss</span>
              <span className={`${styles.streakValue} mono text-loss`}>{streakData.longestLoss}❄️</span>
            </div>
            <div className={styles.streakItem}>
              <span className={styles.streakLabel}>Avg Win</span>
              <span className={`${styles.streakValue} mono`}>{streakData.avgWinStreak}</span>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
