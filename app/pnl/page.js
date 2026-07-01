"use client";
import { useState, useMemo } from "react";
import BottomNav from "../components/BottomNav";
import styles from "./pnl.module.css";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from "recharts";

/* ===== FIXED DUMMY DATA — Zerodha Style Daily P&L ===== */
const rawData = [
  // ===== JULY 2026 =====
  { date:"2026-07-01", pnl:4250, netPnl:4098, charges:152, numTrades:3 },
  // ===== JUNE 2026 =====
  { date:"2026-06-30", pnl:2100, netPnl:1932, charges:168, numTrades:4 },
  { date:"2026-06-27", pnl:13000, netPnl:12780, charges:220, numTrades:2 },
  { date:"2026-06-26", pnl:-900, netPnl:-1068, charges:168, numTrades:3 },
  { date:"2026-06-25", pnl:-700, netPnl:-885, charges:185, numTrades:4 },
  { date:"2026-06-24", pnl:7900, netPnl:7702, charges:198, numTrades:2 },
  { date:"2026-06-23", pnl:1600, netPnl:1425, charges:175, numTrades:3 },
  { date:"2026-06-20", pnl:8100, netPnl:7890, charges:210, numTrades:2 },
  { date:"2026-06-19", pnl:2400, netPnl:2215, charges:185, numTrades:3 },
  { date:"2026-06-18", pnl:-3000, netPnl:-3195, charges:195, numTrades:5 },
  { date:"2026-06-17", pnl:5900, netPnl:5720, charges:180, numTrades:2 },
  { date:"2026-06-16", pnl:5200, netPnl:5008, charges:192, numTrades:3 },
  { date:"2026-06-13", pnl:-1500, netPnl:-1672, charges:172, numTrades:4 },
  { date:"2026-06-12", pnl:3400, netPnl:3235, charges:165, numTrades:2 },
  { date:"2026-06-11", pnl:6200, netPnl:5990, charges:210, numTrades:3 },
  { date:"2026-06-10", pnl:-2800, netPnl:-2985, charges:185, numTrades:5 },
  { date:"2026-06-09", pnl:4100, netPnl:3928, charges:172, numTrades:2 },
  { date:"2026-06-06", pnl:1800, netPnl:1638, charges:162, numTrades:3 },
  { date:"2026-06-05", pnl:-4200, netPnl:-4398, charges:198, numTrades:6 },
  { date:"2026-06-04", pnl:7500, netPnl:7285, charges:215, numTrades:2 },
  { date:"2026-06-03", pnl:2200, netPnl:2038, charges:162, numTrades:3 },
  { date:"2026-06-02", pnl:-1100, netPnl:-1275, charges:175, numTrades:4 },
  // ===== MAY 2026 =====
  { date:"2026-05-29", pnl:3400, netPnl:3228, charges:172, numTrades:2 },
  { date:"2026-05-28", pnl:-3800, netPnl:-3992, charges:192, numTrades:4 },
  { date:"2026-05-27", pnl:5500, netPnl:5298, charges:202, numTrades:2 },
  { date:"2026-05-26", pnl:2800, netPnl:2635, charges:165, numTrades:3 },
  { date:"2026-05-23", pnl:-2200, netPnl:-2388, charges:188, numTrades:5 },
  { date:"2026-05-22", pnl:8200, netPnl:7978, charges:222, numTrades:1 },
  { date:"2026-05-21", pnl:4100, netPnl:3918, charges:182, numTrades:2 },
  { date:"2026-05-20", pnl:-900, netPnl:-1065, charges:165, numTrades:3 },
  { date:"2026-05-19", pnl:3200, netPnl:3028, charges:172, numTrades:2 },
  { date:"2026-05-16", pnl:-4200, netPnl:-4398, charges:198, numTrades:4 },
  { date:"2026-05-15", pnl:2600, netPnl:2432, charges:168, numTrades:2 },
  { date:"2026-05-14", pnl:1900, netPnl:1742, charges:158, numTrades:2 },
  { date:"2026-05-13", pnl:7500, netPnl:7282, charges:218, numTrades:1 },
  { date:"2026-05-12", pnl:-1500, netPnl:-1672, charges:172, numTrades:3 },
  // ===== APRIL 2026 =====
  { date:"2026-04-30", pnl:4600, netPnl:4408, charges:192, numTrades:2 },
  { date:"2026-04-29", pnl:-2900, netPnl:-3085, charges:185, numTrades:4 },
  { date:"2026-04-28", pnl:3100, netPnl:2928, charges:172, numTrades:2 },
  { date:"2026-04-25", pnl:5900, netPnl:5698, charges:202, numTrades:1 },
  { date:"2026-04-24", pnl:-6200, netPnl:-6412, charges:212, numTrades:5 },
  { date:"2026-04-23", pnl:2400, netPnl:2235, charges:165, numTrades:2 },
  { date:"2026-04-22", pnl:1700, netPnl:1542, charges:158, numTrades:2 },
  // ===== MARCH 2026 =====
  { date:"2026-03-31", pnl:3800, netPnl:3622, charges:178, numTrades:2 },
  { date:"2026-03-27", pnl:6400, netPnl:6185, charges:215, numTrades:1 },
  { date:"2026-03-26", pnl:-3500, netPnl:-3688, charges:188, numTrades:4 },
  { date:"2026-03-25", pnl:2100, netPnl:1938, charges:162, numTrades:2 },
  { date:"2026-03-24", pnl:4900, netPnl:4705, charges:195, numTrades:1 },
  { date:"2026-03-21", pnl:-1800, netPnl:-1972, charges:172, numTrades:3 },
  // ===== FEB 2026 =====
  { date:"2026-02-27", pnl:5200, netPnl:4998, charges:202, numTrades:1 },
  { date:"2026-02-26", pnl:-4100, netPnl:-4292, charges:192, numTrades:4 },
  { date:"2026-02-25", pnl:3600, netPnl:3428, charges:172, numTrades:2 },
  { date:"2026-02-24", pnl:1400, netPnl:1242, charges:158, numTrades:2 },
  // ===== JAN 2026 =====
  { date:"2026-01-30", pnl:7100, netPnl:6888, charges:212, numTrades:1 },
  { date:"2026-01-29", pnl:-2600, netPnl:-2788, charges:188, numTrades:3 },
  { date:"2026-01-28", pnl:4300, netPnl:4118, charges:182, numTrades:2 },
  { date:"2026-01-27", pnl:2800, netPnl:2635, charges:165, numTrades:2 },
].sort((a, b) => new Date(a.date) - new Date(b.date));

const PERIOD_TABS = [
  { label: "This Month", value: "1m" },
  { label: "3M", value: "3m" },
  { label: "6M", value: "6m" },
  { label: "1Y", value: "1y" },
  { label: "Custom", value: "custom" },
];

function filterByPeriod(data, period) {
  const now = new Date();
  let start = new Date();
  switch (period) {
    case "1m": start = new Date(now.getFullYear(), now.getMonth(), 1); break;
    case "3m": start.setMonth(now.getMonth() - 3); break;
    case "6m": start.setMonth(now.getMonth() - 6); break;
    case "1y": start.setFullYear(now.getFullYear() - 1); break;
  }
  return data.filter((d) => new Date(d.date) >= start);
}

/* Zerodha-style bar tooltip */
const ZerodhaTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className={styles.zTooltip}>
      <div className={styles.zTooltipDate}>
        {new Date(d.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
      </div>
      <div className={styles.zTooltipGrid}>
        <span className={styles.zTooltipLabel}>P&L</span>
        <span className={`${styles.zTooltipVal} mono`} style={{ color: d.netPnl >= 0 ? "#00e676" : "#ff5252" }}>
          {d.netPnl >= 0 ? "+" : ""}₹{Math.abs(d.netPnl).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
        </span>
        <span className={styles.zTooltipLabel}>Charges</span>
        <span className={`${styles.zTooltipVal} mono`} style={{ color: "#ff5252" }}>
          -₹{d.charges.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
        </span>
        <span className={styles.zTooltipLabel}>Trades</span>
        <span className={`${styles.zTooltipVal} mono`}>{d.numTrades}</span>
      </div>
    </div>
  );
};

const formatAmt = (v) => {
  const abs = Math.abs(v);
  if (abs >= 100000) return `₹${(v / 100000).toFixed(2)}L`;
  if (abs >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v.toFixed(0)}`;
};

const MonthCalendar = ({ year, month, data }) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon
  
  const blanks = Array.from({ length: firstDay });
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const monthName = new Date(year, month, 1).toLocaleString('default', { month: 'long', year: 'numeric' });

  const dataByDay = {};
  data.forEach(d => {
    const day = new Date(d.date).getDate();
    dataByDay[day] = d;
  });

  return (
    <div className={styles.calendarMonth}>
      <h3 className={styles.calendarMonthTitle}>{monthName}</h3>
      <div className={styles.calendarGrid}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i} className={styles.calHeader}>{d}</div>)}
        
        {blanks.map((_, i) => <div key={`blank-${i}`} className={styles.calCellEmpty}></div>)}
        
        {days.map(day => {
          const tradeData = dataByDay[day];
          let cellClass = styles.calCell;
          let pnlClass = "";
          
          if (tradeData) {
            cellClass = tradeData.netPnl >= 0 ? `${styles.calCell} ${styles.calCellProfit}` : `${styles.calCell} ${styles.calCellLoss}`;
            pnlClass = tradeData.netPnl >= 0 ? "text-profit" : "text-loss";
          }
          
          return (
            <div key={day} className={cellClass}>
              <span className={styles.calDayNum}>{day}</span>
              {tradeData && (
                <span className={`${styles.calDayPnl} mono ${pnlClass}`}>
                  {tradeData.netPnl > 0 ? '+' : ''}{formatAmt(tradeData.netPnl)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function PnlPage() {
  const [period, setPeriod] = useState("1m");
  const [customDates, setCustomDates] = useState({ start: "", end: "" });
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [tempDates, setTempDates] = useState({ start: "", end: "" });

  const filtered = useMemo(() => {
    if (period === "custom") {
      let res = rawData;
      if (customDates.start) res = res.filter(d => new Date(d.date) >= new Date(customDates.start));
      if (customDates.end) res = res.filter(d => new Date(d.date) <= new Date(customDates.end));
      return res;
    }
    return filterByPeriod(rawData, period);
  }, [period, customDates]);

  const handleApplyAdvFilters = () => {
    setCustomDates(tempDates);
    setPeriod("custom");
    setIsFilterModalOpen(false);
  };

  const handleResetAdvFilters = () => {
    setTempDates({ start: "", end: "" });
    setCustomDates({ start: "", end: "" });
    setPeriod("1m");
    setIsFilterModalOpen(false);
  };

  const chartData = useMemo(() =>
    filtered.map((d) => ({
      ...d,
      label: new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    })),
    [filtered]
  );

  // Stats
  const totalPnl = filtered.reduce((s, d) => s + d.netPnl, 0);
  const totalCharges = filtered.reduce((s, d) => s + d.charges, 0);
  const profitDays = filtered.filter((d) => d.netPnl > 0).length;
  const lossDays = filtered.filter((d) => d.netPnl < 0).length;
  const totalTrades = filtered.reduce((s, d) => s + d.numTrades, 0);
  const maxProfit = filtered.length > 0 ? Math.max(...filtered.map((d) => d.netPnl)) : 0;
  const maxLoss = filtered.length > 0 ? Math.min(...filtered.map((d) => d.netPnl)) : 0;

  // Advanced Stats (Win Rate & Risk Reward)
  const winRate = profitDays + lossDays > 0 ? ((profitDays / (profitDays + lossDays)) * 100).toFixed(1) : 0;
  const avgWin = profitDays > 0 ? filtered.filter(d => d.netPnl > 0).reduce((s,d) => s + d.netPnl, 0) / profitDays : 0;
  const avgLoss = lossDays > 0 ? filtered.filter(d => d.netPnl < 0).reduce((s,d) => s + d.netPnl, 0) / lossDays : 0;
  const avgRR = avgLoss !== 0 ? Math.abs(avgWin / avgLoss).toFixed(2) : (avgWin > 0 ? "Infinite" : 0);

  // Group by month for Calendar
  const monthsData = useMemo(() => {
    const grouped = {};
    filtered.forEach(d => {
      const dateObj = new Date(d.date);
      const mKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      if (!grouped[mKey]) grouped[mKey] = [];
      grouped[mKey].push(d);
    });
    return Object.keys(grouped).sort().reverse().map(key => ({
      monthKey: key,
      year: parseInt(key.split('-')[0]),
      month: parseInt(key.split('-')[1]) - 1,
      trades: grouped[key]
    }));
  }, [filtered]);

  return (
    <div className="page-wrapper">
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 className={styles.title}>P&L Statement</h1>
            <div className={styles.headerBadge}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              Zerodha Style
            </div>
          </div>
          <button 
            className={styles.iconBtn} 
            onClick={() => {
              setTempDates(customDates);
              setIsFilterModalOpen(true);
            }}
            style={{ 
              background: period === 'custom' ? 'rgba(124, 77, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              padding: '8px',
              borderRadius: '8px',
              color: period === 'custom' ? 'var(--accent-purple)' : '#e2e2e9',
              cursor: 'pointer'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
          </button>
        </div>
        {/* Period Tabs */}
        <div className={styles.periodTabs}>
          {PERIOD_TABS.map((tab) => (
            <button
              key={tab.value}
              className={`${styles.periodTab} ${period === tab.value ? styles.periodTabActive : ""}`}
              onClick={() => {
                if(tab.value === "custom") {
                  setTempDates(customDates);
                  setIsFilterModalOpen(true);
                } else {
                  setPeriod(tab.value);
                }
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <main className={styles.main}>
        {/* Zerodha-Style 1-Line Summary Strip */}
        <div className={styles.zerodhaSummaryStrip}>
          <div className={styles.zSummaryItem}>
            <span className={styles.zSummaryLabel}>Realized P&L</span>
            <span className={`${styles.zSummaryValue} mono ${totalPnl + totalCharges >= 0 ? "text-profit" : "text-loss"}`}>
              {totalPnl + totalCharges >= 0 ? "+" : ""}₹{Math.abs(totalPnl + totalCharges).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </span>
          </div>
          
          <div className={styles.zSummaryOp}>-</div>
          
          <div className={styles.zSummaryItem}>
            <span className={styles.zSummaryLabel}>Charges & Taxes</span>
            <span className={`${styles.zSummaryValue} mono`} style={{ color: "#ff5252" }}>
              ₹{totalCharges.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </span>
          </div>
          
          <div className={styles.zSummaryOp}>=</div>

          <div className={styles.zSummaryItem}>
            <span className={styles.zSummaryLabel}>Net Realized P&L</span>
            <span className={`${styles.zSummaryValue} mono ${totalPnl >= 0 ? "text-profit" : "text-loss"}`} style={{ fontSize: '18px', fontWeight: '700' }}>
              {totalPnl >= 0 ? "+" : ""}₹{Math.abs(totalPnl).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        {/* Advanced Quick Stats Row */}
        <div className={styles.quickStats}>
          <div className={styles.qStat}>
            <span className={styles.qLabel}>Win Rate</span>
            <span className={`${styles.qValue} mono ${winRate >= 50 ? 'text-profit' : 'text-loss'}`}>{winRate}%</span>
          </div>
          <div className={styles.qDivider} />
          <div className={styles.qStat}>
            <span className={styles.qLabel}>Avg R:R</span>
            <span className={`${styles.qValue} mono`}>{avgRR}</span>
          </div>
          <div className={styles.qDivider} />
          <div className={styles.qStat}>
            <span className={styles.qLabel}>Profit Days</span>
            <span className={`${styles.qValue} mono text-profit`}>{profitDays}</span>
          </div>
          <div className={styles.qDivider} />
          <div className={styles.qStat}>
            <span className={styles.qLabel}>Loss Days</span>
            <span className={`${styles.qValue} mono text-loss`}>{lossDays}</span>
          </div>
        </div>

        {/* Zerodha Style Calendar Heatmap */}
        <div className={styles.heatmapSection}>
          <div className={styles.chartLabel}>P&L Heatmap</div>
          <div className={styles.heatmapContainer}>
            {monthsData.length > 0 ? (
              monthsData.map((m) => (
                <MonthCalendar key={m.monthKey} year={m.year} month={m.month} data={m.trades} />
              ))
            ) : (
              <div className={styles.emptyHeatmap}>No trades in this period</div>
            )}
          </div>
        </div>

        {/* Bar Chart — Zerodha Style */}
        <div className={styles.chartSection}>
          <div className={styles.chartLabel}>Daily P&L</div>
          <div className={styles.chartWrap}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} margin={{ top: 10, right: 5, left: -15, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.04)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#5a5b70", fontSize: 9, fontFamily: "Inter" }}
                  axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={30}
                />
                <YAxis
                  tick={{ fill: "#5a5b70", fontSize: 10, fontFamily: "JetBrains Mono" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => {
                    if (Math.abs(v) >= 100000) return `${(v / 100000).toFixed(1)}L`;
                    if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(0)}K`;
                    return v;
                  }}
                />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
                <Tooltip content={<ZerodhaTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="netPnl" radius={[3, 3, 0, 0]} maxBarSize={16}>
                  {chartData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.netPnl >= 0 ? "#00e676" : "#ff5252"}
                      fillOpacity={0.75}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Max Profit / Loss Strip */}
        <div className={styles.maxStrip}>
          <div className={styles.maxItem}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00e676" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
            <span className={styles.maxLabel}>Max Profit</span>
            <span className={`${styles.maxValue} mono text-profit`}>+{formatAmt(maxProfit)}</span>
          </div>
          <div className={styles.maxDivider} />
          <div className={styles.maxItem}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff5252" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
              <polyline points="17 18 23 18 23 12" />
            </svg>
            <span className={styles.maxLabel}>Max Loss</span>
            <span className={`${styles.maxValue} mono text-loss`}>{formatAmt(maxLoss)}</span>
          </div>
        </div>

        {/* Day-by-day List — Zerodha Style Table */}
        <div className={styles.tableSection}>
          <div className={styles.tableHeader}>
            <span className={styles.tableHeaderCell}>Date</span>
            <span className={`${styles.tableHeaderCell} ${styles.right}`}>P&L</span>
            <span className={`${styles.tableHeaderCell} ${styles.right}`}>Charges</span>
            <span className={`${styles.tableHeaderCell} ${styles.right}`}>Trades</span>
          </div>
          <div className={styles.tableBody}>
            {[...filtered].reverse().map((d, i) => (
              <div key={i} className={styles.tableRow}>
                <span className={styles.tableCell}>
                  <span className={styles.datePrimary}>
                    {new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                  <span className={styles.dateSub}>
                    {new Date(d.date).toLocaleDateString("en-IN", { weekday: "short" })}
                  </span>
                </span>
                <span className={`${styles.tableCell} ${styles.right} mono`} style={{ color: d.netPnl >= 0 ? "var(--profit-green)" : "var(--loss-red)" }}>
                  {d.netPnl >= 0 ? "+" : ""}₹{Math.abs(d.netPnl).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </span>
                <span className={`${styles.tableCell} ${styles.right} mono`} style={{ color: "var(--text-muted)" }}>
                  ₹{d.charges.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </span>
                <span className={`${styles.tableCell} ${styles.right} mono`}>
                  {d.numTrades}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Advanced Filter Modal */}
      {isFilterModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsFilterModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Advanced Filters</h2>
              <button className={styles.modalClose} onClick={() => setIsFilterModalOpen(false)}>✕</button>
            </div>
            
            <div className={styles.modalBody}>
              {/* Date Range */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Custom Date Range</label>
                <div className={styles.dateInputs}>
                  <input 
                    type="date" 
                    className={styles.filterSelect} 
                    value={tempDates.start}
                    onChange={(e) => setTempDates({...tempDates, start: e.target.value})}
                  />
                  <span className={styles.dateTo}>to</span>
                  <input 
                    type="date" 
                    className={styles.filterSelect} 
                    value={tempDates.end}
                    onChange={(e) => setTempDates({...tempDates, end: e.target.value})}
                  />
                </div>
              </div>

              {/* Symbol Mock (UI Only for now as rawData lacks symbol) */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Symbol (Share)</label>
                <select className={styles.filterSelect}>
                  <option value="">All Symbols</option>
                  <option value="NIFTY 50">NIFTY 50</option>
                  <option value="BANKNIFTY">BANKNIFTY</option>
                </select>
              </div>

              {/* Setups Mock */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Setups / Strategies</label>
                <select className={styles.filterSelect}>
                  <option value="">All Setups</option>
                  <option value="Breakout">Breakout</option>
                  <option value="Reversal">Reversal</option>
                </select>
              </div>
            </div>
            
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={handleResetAdvFilters}>Reset</button>
              <button className={styles.btnPrimary} onClick={handleApplyAdvFilters}>Apply Filters</button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
