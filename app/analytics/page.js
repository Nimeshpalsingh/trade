"use client";
import { useState, useMemo } from "react";
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

const today = new Date();
const currentYear = today.getFullYear();
const currentMonth = String(today.getMonth() + 1).padStart(2, '0');

// Extended Mock Data for Analytics
const allTrades = [
  { id:"t1", date:`${currentYear}-${currentMonth}-02`, symbol:"NIFTY", pnl: 4500, rr: 2.2, session: "Morning (9:15 - 11:30)", setups:["Breakout"], mistakes:[] },
  { id:"t2", date:`${currentYear}-${currentMonth}-03`, symbol:"BANKNIFTY", pnl: -2100, rr: -1.0, session: "Morning (9:15 - 11:30)", setups:["Liquidity Grab"], mistakes:["FOMO"] },
  { id:"t3", date:`${currentYear}-${currentMonth}-04`, symbol:"RELIANCE", pnl: 6800, rr: 3.2, session: "Afternoon (11:30 - 13:30)", setups:["Reversal"], mistakes:[] },
  { id:"t4", date:`${currentYear}-${currentMonth}-05`, symbol:"NIFTY", pnl: 3460, rr: 1.5, session: "Late (13:30 - 15:30)", setups:["Breakout"], mistakes:["Early Exit"] },
  { id:"t5", date:`${currentYear}-${currentMonth}-06`, symbol:"BANKNIFTY", pnl: -1250, rr: -0.8, session: "Late (13:30 - 15:30)", setups:["FOMO Trade"], mistakes:["FOMO", "Overtrading"] },
  { id:"t6", date:`${currentYear}-${currentMonth}-09`, symbol:"NIFTY", pnl: 8100, rr: 4.1, session: "Morning (9:15 - 11:30)", setups:["Pullback"], mistakes:[] },
  { id:"t7", date:`${currentYear}-${currentMonth}-10`, symbol:"TCS", pnl: 1200, rr: 1.1, session: "Afternoon (11:30 - 13:30)", setups:["Breakout"], mistakes:[] },
  { id:"t8", date:`${currentYear}-${currentMonth}-11`, symbol:"BANKNIFTY", pnl: -4500, rr: -2.0, session: "Morning (9:15 - 11:30)", setups:["Reversal"], mistakes:["Revenge Trading"] },
  { id:"t9", date:`${currentYear}-${currentMonth}-12`, symbol:"NIFTY", pnl: 5400, rr: 2.6, session: "Late (13:30 - 15:30)", setups:["Pullback"], mistakes:[] },
  { id:"t10", date:`${currentYear}-${currentMonth}-16`, symbol:"RELIANCE", pnl: -3200, rr: -1.4, session: "Morning (9:15 - 11:30)", setups:["Breakout"], mistakes:["No SL"] },
  { id:"t11", date:`${currentYear}-${currentMonth}-17`, symbol:"NIFTY", pnl: 7200, rr: 3.5, session: "Afternoon (11:30 - 13:30)", setups:["Liquidity Grab"], mistakes:[] },
  { id:"t12", date:`${currentYear}-${currentMonth}-18`, symbol:"BANKNIFTY", pnl: 3800, rr: 1.8, session: "Late (13:30 - 15:30)", setups:["Breakout"], mistakes:[] },
  { id:"t13", date:`${currentYear}-${currentMonth}-19`, symbol:"NIFTY", pnl: -1800, rr: -0.9, session: "Morning (9:15 - 11:30)", setups:["FOMO Trade"], mistakes:["FOMO"] },
  { id:"t14", date:`${currentYear}-${currentMonth}-23`, symbol:"BANKNIFTY", pnl: 9500, rr: 4.8, session: "Morning (9:15 - 11:30)", setups:["Reversal"], mistakes:[] },
  { id:"t15", date:`${currentYear}-${currentMonth}-24`, symbol:"TCS", pnl: -2400, rr: -1.2, session: "Afternoon (11:30 - 13:30)", setups:["Pullback"], mistakes:["Overtrading"] },
  { id:"t16", date:`${currentYear}-${currentMonth}-25`, symbol:"NIFTY", pnl: 2900, rr: 1.4, session: "Late (13:30 - 15:30)", setups:["Breakout"], mistakes:[] },
];

const COLORS = ["#448aff", "#7c4dff", "#00e676", "#ffab40", "#ff5252", "#e040fb"];

const CustomBarTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload || !payload.length) return null;
  const val = payload[0].value;
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      <p className={styles.tooltipValue}>
        {unit === "₹" ? `${val < 0 ? "-" : ""}₹${Math.abs(val).toLocaleString("en-IN")}` : `${val}${unit}`}
      </p>
    </div>
  );
};

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("thisMonth");
  
  // Custom Date States
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const [customStart, setCustomStart] = useState(firstDay.toISOString().split("T")[0]);
  const [customEnd, setCustomEnd] = useState(lastDay.toISOString().split("T")[0]);

  // Adv Filters
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [advFilters, setAdvFilters] = useState({
    symbol: "",
    session: "",
    setup: ""
  });
  const hasAdvFilters = advFilters.symbol || advFilters.session || advFilters.setup;

  // Filter Trades
  const filteredTrades = useMemo(() => {
    let start = new Date(0);
    let end = new Date("2100-01-01");

    if (dateRange === "thisMonth") {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (dateRange === "lastMonth") {
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end = new Date(today.getFullYear(), today.getMonth(), 0);
    } else if (dateRange === "custom") {
      start = new Date(customStart);
      end = new Date(customEnd);
      end.setHours(23, 59, 59, 999);
    }

    let result = allTrades.filter(t => {
      const td = new Date(t.date);
      return td >= start && td <= end;
    });

    if (advFilters.symbol) result = result.filter(t => t.symbol === advFilters.symbol);
    if (advFilters.session) result = result.filter(t => t.session === advFilters.session);
    if (advFilters.setup) result = result.filter(t => t.setups.includes(advFilters.setup));

    return result;
  }, [dateRange, customStart, customEnd, advFilters]);

  // 1. Setup Analytics
  const setupData = useMemo(() => {
    const map = {};
    filteredTrades.forEach(t => {
      t.setups.forEach(s => {
        if (!map[s]) map[s] = { name: s, total: 0, wins: 0, pnl: 0, totalRR: 0 };
        map[s].total++;
        if (t.pnl > 0) map[s].wins++;
        map[s].pnl += t.pnl;
        map[s].totalRR += t.rr;
      });
    });
    return Object.values(map).map(item => ({
      ...item,
      winRate: Math.round((item.wins / item.total) * 100),
      avgRR: Number((item.totalRR / item.total).toFixed(2)),
    })).sort((a, b) => b.winRate - a.winRate);
  }, [filteredTrades]);

  // 2. Session Analytics
  const sessionData = useMemo(() => {
    const map = {};
    filteredTrades.forEach(t => {
      if (!map[t.session]) map[t.session] = { name: t.session, total: 0, wins: 0, pnl: 0 };
      map[t.session].total++;
      if (t.pnl > 0) map[t.session].wins++;
      map[t.session].pnl += t.pnl;
    });
    return Object.values(map).map(item => ({
      ...item,
      winRate: Math.round((item.wins / item.total) * 100),
    })).sort((a, b) => b.winRate - a.winRate);
  }, [filteredTrades]);

  // 3. Symbol Analytics
  const symbolData = useMemo(() => {
    const map = {};
    filteredTrades.forEach(t => {
      if (!map[t.symbol]) map[t.symbol] = { name: t.symbol, total: 0, wins: 0, pnl: 0 };
      map[t.symbol].total++;
      if (t.pnl > 0) map[t.symbol].wins++;
      map[t.symbol].pnl += t.pnl;
    });
    return Object.values(map).map(item => ({
      ...item,
      winRate: Math.round((item.wins / item.total) * 100),
    })).sort((a, b) => b.winRate - a.winRate);
  }, [filteredTrades]);

  // 4. Mistakes Cost
  const mistakeData = useMemo(() => {
    const map = {};
    filteredTrades.forEach(t => {
      if (t.pnl < 0 && t.mistakes.length > 0) {
        t.mistakes.forEach(m => {
          if (!map[m]) map[m] = { name: m, totalLoss: 0, count: 0 };
          map[m].totalLoss += Math.abs(t.pnl); // Add absolute loss amount
          map[m].count++;
        });
      }
    });
    return Object.values(map).sort((a, b) => b.totalLoss - a.totalLoss);
  }, [filteredTrades]);

  const totalWins = filteredTrades.filter(t => t.pnl > 0).length;
  const overallWinRate = filteredTrades.length > 0 ? Math.round((totalWins / filteredTrades.length) * 100) : 0;

  return (
    <div className="page-wrapper">
      <header className={styles.header}>
        <h1 className={styles.title}>Advanced Analytics</h1>
      </header>

      <main className={styles.main}>
        
        {/* Date Filter */}
        <div className={`${styles.card} glass-card`}>
          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <label>Period</label>
              <select className={styles.select} value={dateRange} onChange={e => setDateRange(e.target.value)}>
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="custom">Custom Date</option>
              </select>
            </div>
            
            {dateRange === "custom" && (
              <>
                <div className={styles.filterGroup}>
                  <label>Start Date</label>
                  <input type="date" className={styles.dateInput} value={customStart} onChange={e => setCustomStart(e.target.value)} />
                </div>
                <div className={styles.filterGroup}>
                  <label>End Date</label>
                  <input type="date" className={styles.dateInput} value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
                </div>
              </>
            )}

            <button 
              className={`${styles.filterIconBtn} ${hasAdvFilters ? styles.active : ""}`}
              onClick={() => setIsFilterModalOpen(true)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              Advanced
            </button>
          </div>

          {/* Active Filter Chips */}
          {hasAdvFilters && (
            <div className={styles.activeFilters}>
              {advFilters.symbol && (
                <span className={styles.filterChip}>
                  {advFilters.symbol}
                  <button onClick={() => setAdvFilters(p => ({ ...p, symbol: "" }))}>&times;</button>
                </span>
              )}
              {advFilters.session && (
                <span className={styles.filterChip}>
                  {advFilters.session.split(" (")[0]} {/* Show short name */}
                  <button onClick={() => setAdvFilters(p => ({ ...p, session: "" }))}>&times;</button>
                </span>
              )}
              {advFilters.setup && (
                <span className={styles.filterChip}>
                  {advFilters.setup}
                  <button onClick={() => setAdvFilters(p => ({ ...p, setup: "" }))}>&times;</button>
                </span>
              )}
            </div>
          )}

          <div className={styles.overallStats}>
            <div className={styles.statBox}>
              <span>Trades</span>
              <strong>{filteredTrades.length}</strong>
            </div>
            <div className={styles.statBox}>
              <span>Overall Win Rate</span>
              <strong className="text-profit">{overallWinRate}%</strong>
            </div>
          </div>
        </div>

        {/* Setup Win Rate */}
        <div className={`${styles.card} glass-card`}>
          <h3 className={styles.cardTitle}>Win Rate by Setup</h3>
          {setupData.length > 0 ? (
            <div className={styles.chartBody}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={setupData} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={false} />
                  <XAxis type="number" hide domain={[0, 100]} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#a0a0b0", fontSize: 12 }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip content={<CustomBarTooltip unit="%" />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                  <Bar dataKey="winRate" radius={[0, 4, 4, 0]} barSize={20}>
                    {setupData.map((entry, i) => (
                      <Cell key={i} fill={entry.winRate >= 50 ? "#00e676" : "#ff5252"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className={styles.emptyText}>No setup data in this period.</p>
          )}
        </div>

        {/* Session Win Rate */}
        <div className={`${styles.card} glass-card`}>
          <h3 className={styles.cardTitle}>Win Rate by Time Session</h3>
          {sessionData.length > 0 ? (
            <div className={styles.chartBody}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={sessionData} margin={{ top: 15, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "#a0a0b0", fontSize: 10 }} axisLine={false} tickLine={false} angle={-15} textAnchor="end" />
                  <YAxis type="number" domain={[0, 100]} tick={{ fill: "#5a5b70", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomBarTooltip unit="%" />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                  <Bar dataKey="winRate" radius={[4, 4, 0, 0]} barSize={25}>
                    {sessionData.map((entry, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className={styles.emptyText}>No session data in this period.</p>
          )}
        </div>

        {/* Risk Reward by Setup */}
        <div className={`${styles.card} glass-card`}>
          <h3 className={styles.cardTitle}>Avg Risk:Reward by Setup</h3>
          {setupData.length > 0 ? (
            <div className={styles.chartBody}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={setupData} margin={{ top: 15, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "#a0a0b0", fontSize: 10 }} axisLine={false} tickLine={false} angle={-15} textAnchor="end" />
                  <YAxis type="number" tick={{ fill: "#5a5b70", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomBarTooltip unit="R" />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                  <Bar dataKey="avgRR" radius={[4, 4, 0, 0]} barSize={25}>
                    {setupData.map((entry, i) => (
                      <Cell key={i} fill={entry.avgRR >= 2 ? "#448aff" : entry.avgRR >= 1 ? "#00e676" : "#ffab40"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className={styles.emptyText}>No RR data.</p>
          )}
        </div>

        {/* Cost of Mistakes */}
        <div className={`${styles.card} glass-card`}>
          <h3 className={styles.cardTitle}>Total Cost of Mistakes (Losses)</h3>
          {mistakeData.length > 0 ? (
            <div className={styles.chartBody}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={mistakeData} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#a0a0b0", fontSize: 12 }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip content={<CustomBarTooltip unit="₹" />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                  <Bar dataKey="totalLoss" radius={[0, 4, 4, 0]} barSize={20} fill="#ff5252" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className={styles.emptyText} style={{color: 'var(--profit-green)'}}>No mistakes recorded! Great job.</p>
          )}
        </div>

        {/* Symbol Distribution */}
        <div className={`${styles.card} glass-card`}>
          <h3 className={styles.cardTitle}>Symbol Win Rate</h3>
          <div className={styles.pieRow}>
            {symbolData.map((s) => (
              <div key={s.name} className={styles.legendItem}>
                <div className={styles.legendHeader}>
                  <span className={styles.legendName}>{s.name}</span>
                  <span className={styles.legendValue} style={{color: s.winRate >= 50 ? 'var(--profit-green)' : 'var(--loss-red)'}}>{s.winRate}%</span>
                </div>
                <div className={styles.barTrack}>
                  <div className={styles.barFill} style={{width: `${s.winRate}%`, background: s.winRate >= 50 ? 'var(--profit-green)' : 'var(--loss-red)'}}></div>
                </div>
              </div>
            ))}
            {symbolData.length === 0 && <p className={styles.emptyText}>No symbol data.</p>}
          </div>
        </div>

      </main>

      {/* Advanced Filter Modal */}
      {isFilterModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Advanced Filters</h3>
              <button className={styles.closeBtn} onClick={() => setIsFilterModalOpen(false)}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              <div>
                <label className={styles.advFilterLabel}>Symbol</label>
                <select className={styles.advFilterSelect} value={advFilters.symbol} onChange={(e) => setAdvFilters(prev => ({...prev, symbol: e.target.value}))}>
                  <option value="">All Symbols</option>
                  <option value="NIFTY">NIFTY</option>
                  <option value="BANKNIFTY">BANKNIFTY</option>
                  <option value="RELIANCE">RELIANCE</option>
                  <option value="TCS">TCS</option>
                </select>
              </div>
              <div>
                <label className={styles.advFilterLabel}>Session</label>
                <select className={styles.advFilterSelect} value={advFilters.session} onChange={(e) => setAdvFilters(prev => ({...prev, session: e.target.value}))}>
                  <option value="">All Sessions</option>
                  <option value="Morning (9:15 - 11:30)">Morning</option>
                  <option value="Afternoon (11:30 - 13:30)">Afternoon</option>
                  <option value="Late (13:30 - 15:30)">Late</option>
                </select>
              </div>
              <div>
                <label className={styles.advFilterLabel}>Setup</label>
                <select className={styles.advFilterSelect} value={advFilters.setup} onChange={(e) => setAdvFilters(prev => ({...prev, setup: e.target.value}))}>
                  <option value="">All Setups</option>
                  <option value="Breakout">Breakout</option>
                  <option value="Reversal">Reversal</option>
                  <option value="Pullback">Pullback</option>
                  <option value="Liquidity Grab">Liquidity Grab</option>
                  <option value="FOMO Trade">FOMO Trade</option>
                </select>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.modalBtn} onClick={() => setAdvFilters({ symbol: "", session: "", setup: "" })}>Clear</button>
              <button className={`${styles.modalBtn} ${styles.modalBtnPrimary}`} onClick={() => setIsFilterModalOpen(false)}>Apply</button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
