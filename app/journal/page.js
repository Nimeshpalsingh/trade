"use client";
import { useState, useMemo } from "react";
import BottomNav from "../components/BottomNav";
import styles from "./journal.module.css";
import { useRouter } from "next/navigation";

// Get current date context to generate relevant mock data
const today = new Date();
const currentYear = today.getFullYear();
const currentMonth = String(today.getMonth() + 1).padStart(2, '0');

// Extended Mock Data for Advanced View (Updated to current month so they show by default)
const allTrades = [
  { 
    id:"t1", date:`${currentYear}-${currentMonth}-02`, time: "09:15 AM", symbol:"NIFTY 50", type:"Buy", 
    qty: 50, entry: 22550.25, exit: 22750.50, sl: 22450.00, target: 22850.00, 
    lotSize: 1, pnl:12525.00, rr: 2.99, roi: 2.50, mode: "Live", trend: "Up", session: "Morning (9:15 - 11:30)",
    setups:["Breakout"], timeframe: "15m", 
    mistakes:["FOMO", "Overtrading", "RR Not Maintained"], 
    notes: "Good breakout trade. Followed all rules. Booked 50% at 1R and rest at target. Volume was good. Market in trending condition.",
    status: "Completed", isBookmarked: true
  },
  { 
    id:"t2", date:`${currentYear}-${currentMonth}-05`, time: "10:45 AM", symbol:"BANKNIFTY", type:"Sell", 
    qty: 15, entry: 52400.00, exit: 52520.00, sl: 52300.00, target: 52000.00,
    lotSize: 1, pnl:-2150.00, rr: -1.0, roi: -0.5, mode: "Live", trend: "Sideways", session: "Morning (9:15 - 11:30)",
    setups:["Liquidity Grab"], timeframe: "5m", 
    mistakes:["FOMO", "Revenge Trading"], 
    notes: "Got chopped out. Market was sideways.",
    status: "Completed", isBookmarked: true
  },
  { 
    id:"t3", date:`${currentYear}-${currentMonth}-12`, time: "11:30 AM", symbol:"RELIANCE", type:"Buy", 
    qty: 100, entry: 3120.00, exit: 3188.00, sl: 3100.00, target: 3200.00,
    lotSize: 1, pnl:6800.00, rr: 3.2, roi: 2.1, mode: "Paper", trend: "Up", session: "Afternoon (11:30 - 13:30)",
    setups:["Reversal"], timeframe: "15m", 
    mistakes:[], 
    notes: "Perfect bounce from daily support.",
    status: "Completed", isBookmarked: true
  },
  { 
    id:"t4", date:`${currentYear}-${currentMonth}-18`, time: "02:15 PM", symbol:"NIFTY 50", type:"Buy", 
    qty: 50, entry: 22600.00, exit: 22669.20, sl: 22550.00, target: 22750.00,
    lotSize: 1, pnl:3460.00, rr: 1.5, roi: 0.8, mode: "Live", trend: "Up", session: "Late (13:30 - 15:30)",
    setups:["Breakout"], timeframe: "15m", 
    mistakes:["Early Exit"], 
    notes: "Got scared and exited early.",
    status: "Completed", isBookmarked: false
  },
  { 
    id:"t5", date:`${currentYear}-${currentMonth}-21`, time: "03:05 PM", symbol:"BANKNIFTY", type:"Sell", 
    qty: 15, entry: 52600.00, exit: 52683.33, sl: 52700.00, target: 52400.00,
    lotSize: 1, pnl:-1250.00, rr: -0.8, roi: -0.3, mode: "Live", trend: "Down", session: "Late (13:30 - 15:30)",
    setups:["FOMO Trade"], timeframe: "5m", 
    mistakes:["FOMO", "Overtrading"], 
    notes: "Should not have traded in the last hour.",
    status: "Completed", isBookmarked: false
  }
];

const AVAILABLE_SETUPS = ["Breakout", "Reversal", "Pullback", "Liquidity Grab", "FOMO Trade", "Moving Average Bounce"];
const AVAILABLE_SESSIONS = ["Morning (9:15 - 11:30)", "Afternoon (11:30 - 13:30)", "Late (13:30 - 15:30)"];

export default function JournalPage() {
  const router = useRouter();
  
  // Basic states
  const [filter, setFilter] = useState("Completed");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Helper to format Date as YYYY-MM-DD
  const formatDate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Helper to format Date for Display as '1 July 2026'
  const formatDateDisplay = (dateString) => {
    if (!dateString) return "";
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-GB', options);
  };

  // Calculate This Month's Start and End Dates
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const initialAdvFilters = {
    startDate: formatDate(firstDayOfMonth),
    endDate: formatDate(lastDayOfMonth),
    symbol: "",
    type: "", 
    result: "", 
    session: "",
    setups: []
  };

  // Advanced Filter Modal States
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [advFilters, setAdvFilters] = useState(initialAdvFilters);

  const filteredTrades = useMemo(() => {
    let result = allTrades;
    
    // 1. Basic Quick Tabs Filter
    if (filter === "Active") result = result.filter(t => t.status === "Active");
    if (filter === "Bookmarked") result = result.filter(t => t.isBookmarked);
    if (filter === "Completed") result = result.filter(t => t.status === "Completed");

    // 2. Search Query Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.symbol.toLowerCase().includes(q) || 
        t.setups.some(s => s.toLowerCase().includes(q))
      );
    }
    
    // 3. Advanced Filters
    if (advFilters.startDate) {
      result = result.filter(t => new Date(t.date) >= new Date(advFilters.startDate));
    }
    if (advFilters.endDate) {
      result = result.filter(t => new Date(t.date) <= new Date(advFilters.endDate));
    }
    if (advFilters.symbol) {
      result = result.filter(t => t.symbol === advFilters.symbol);
    }
    if (advFilters.type) {
      result = result.filter(t => t.type === advFilters.type);
    }
    if (advFilters.result) {
      if (advFilters.result === "Win") result = result.filter(t => t.pnl > 0);
      if (advFilters.result === "Loss") result = result.filter(t => t.pnl <= 0);
    }
    if (advFilters.session) {
      result = result.filter(t => t.session === advFilters.session);
    }
    if (advFilters.setups.length > 0) {
      result = result.filter(t => t.setups.some(s => advFilters.setups.includes(s)));
    }
    
    return result;
  }, [filter, searchQuery, advFilters]);

  // Calculate dynamic stats
  const stats = useMemo(() => {
    if (filteredTrades.length === 0) return { winRate: 0, avgRR: 0, wins: 0, total: 0 };
    const wins = filteredTrades.filter(t => t.pnl > 0).length;
    const totalRR = filteredTrades.reduce((sum, t) => sum + t.rr, 0);
    return {
      winRate: ((wins / filteredTrades.length) * 100).toFixed(1),
      avgRR: (totalRR / filteredTrades.length).toFixed(2),
      wins,
      total: filteredTrades.length
    };
  }, [filteredTrades]);

  // Calculate aggregated mistakes
  const mistakesCount = useMemo(() => {
    const counts = {};
    filteredTrades.forEach(t => {
      if (t.mistakes) {
        t.mistakes.forEach(m => {
          counts[m] = (counts[m] || 0) + 1;
        });
      }
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [filteredTrades]);

  const toggleSetup = (setup) => {
    setAdvFilters(prev => {
      const newSetups = prev.setups.includes(setup)
        ? prev.setups.filter(s => s !== setup)
        : [...prev.setups, setup];
      return { ...prev, setups: newSetups };
    });
  };

  const handleTradeClick = (id) => {
    router.push(`/journal/${id}`);
  };

  const handleApplyAdvFilters = () => {
    setIsFilterModalOpen(false);
  };

  const handleResetAdvFilters = () => {
    setAdvFilters(initialAdvFilters);
  };

  return (
    <div className="page-wrapper" style={{ backgroundColor: "#000" }}>
      <header className={styles.header}>
        <button className={styles.iconBtn}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <h1 className={styles.title}>Trades</h1>
        <button className={styles.iconBtn}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z" />
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
      </header>

      <main className={styles.main}>
        {/* Top Filters */}
        <div className={styles.filterTabs}>
          {["All", "Completed", "Active", "Bookmarked"].map(f => (
            <button 
              key={f}
              className={`${styles.filterTab} ${filter === f ? styles.filterTabActive : ""}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className={styles.searchContainer}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" className={styles.searchIcon}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input 
            type="text" 
            placeholder="Search by name or setup" 
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button 
            className={styles.filterIconBtn} 
            onClick={() => setIsFilterModalOpen(true)}
            style={{ 
              background: Object.values(advFilters).some(v => v !== "" && v.length !== 0) ? 'rgba(124, 77, 255, 0.2)' : 'transparent',
              borderRadius: '8px'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={Object.values(advFilters).some(v => v !== "" && v.length !== 0) ? "var(--accent-purple)" : "currentColor"} strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
          </button>
        </div>

        {/* Active Filter Chips */}
        <div className={styles.activeFiltersContainer}>
          {advFilters.startDate && advFilters.endDate && (
            <div className={styles.activeFilterChip}>
              {formatDateDisplay(advFilters.startDate)} to {formatDateDisplay(advFilters.endDate)}
              <button onClick={() => setAdvFilters(prev => ({...prev, startDate: "", endDate: ""}))}>✕</button>
            </div>
          )}
          {advFilters.symbol && (
            <div className={styles.activeFilterChip}>
              {advFilters.symbol}
              <button onClick={() => setAdvFilters(prev => ({...prev, symbol: ""}))}>✕</button>
            </div>
          )}
          {advFilters.type && (
            <div className={styles.activeFilterChip}>
              {advFilters.type}
              <button onClick={() => setAdvFilters(prev => ({...prev, type: ""}))}>✕</button>
            </div>
          )}
          {advFilters.result && (
            <div className={styles.activeFilterChip}>
              {advFilters.result}
              <button onClick={() => setAdvFilters(prev => ({...prev, result: ""}))}>✕</button>
            </div>
          )}
          {advFilters.session && (
            <div className={styles.activeFilterChip}>
              {advFilters.session}
              <button onClick={() => setAdvFilters(prev => ({...prev, session: ""}))}>✕</button>
            </div>
          )}
          {advFilters.setups.map(setup => (
            <div key={setup} className={styles.activeFilterChip}>
              {setup}
              <button onClick={() => setAdvFilters(prev => ({...prev, setups: prev.setups.filter(s => s !== setup)}))}>✕</button>
            </div>
          ))}
          {/* Show clear all if any filters are active */}
          {(advFilters.startDate || advFilters.symbol || advFilters.type || advFilters.result || advFilters.session || advFilters.setups.length > 0) && (
             <button className={styles.clearAllBtn} onClick={handleResetAdvFilters}>Clear All</button>
          )}
        </div>

        {/* Dynamic Graphical Stats Summary */}
        <div className={styles.statsSummaryCard}>
          <div className={styles.statsSummaryItem}>
            <div className={styles.statGraphCircle} style={{ background: `conic-gradient(var(--profit-green) ${stats.winRate}%, rgba(255,255,255,0.05) 0)` }}>
              <div className={styles.statGraphInner}>
                <span className={styles.statGraphValue}>{stats.winRate}%</span>
              </div>
            </div>
            <div className={styles.statGraphLabels}>
              <span className={styles.statGraphTitle}>Win Rate</span>
              <span className={styles.statGraphSub}>{stats.wins} of {stats.total} Trades</span>
            </div>
          </div>
          
          <div className={styles.statsSummaryDivider} />

          <div className={styles.statsSummaryItem}>
            <div className={styles.statGraphCircle} style={{ background: `conic-gradient(var(--accent-cyan) ${Math.min((stats.avgRR / 3) * 100, 100)}%, rgba(255,255,255,0.05) 0)` }}>
              <div className={styles.statGraphInner}>
                <span className={styles.statGraphValue}>{stats.avgRR}</span>
              </div>
            </div>
            <div className={styles.statGraphLabels}>
              <span className={styles.statGraphTitle}>Avg R:R</span>
              <span className={styles.statGraphSub}>Risk to Reward</span>
            </div>
          </div>

          <div className={styles.statsSummaryDivider} />

          <div className={`${styles.statsSummaryItem} ${styles.mistakesSection}`}>
            <div className={styles.statGraphLabels} style={{ width: '100%' }}>
              <span className={styles.statGraphTitle} style={{ marginBottom: '8px' }}>Top Mistakes</span>
              <div className={styles.mistakesSummaryGrid}>
                {mistakesCount.length > 0 ? (
                  mistakesCount.map(([mistake, count]) => (
                    <span key={mistake} className={styles.mistakeSummaryBadge}>
                      {mistake} <span className={styles.mistakeCount}>{count}</span>
                    </span>
                  ))
                ) : (
                  <span className={styles.statGraphSub} style={{ color: 'var(--profit-green)' }}>No mistakes! 🎯</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Trades List */}
        <div className={styles.tradesList}>
          {filteredTrades.map((trade, index) => (
            <div 
              key={trade.id} 
              className={styles.tradeCard} 
              style={{ animationDelay: `${index * 0.05}s` }}
              onClick={() => handleTradeClick(trade.id)}
            >
              <div className={styles.cardRow}>
                <span className={styles.symbol}>{trade.symbol}</span>
                <span className={`${styles.pnl} ${trade.pnl >= 0 ? styles.textGreen : styles.textRed}`}>
                  {trade.pnl >= 0 ? "+" : "-"}₹ {Math.abs(trade.pnl).toLocaleString("en-IN", {minimumFractionDigits: 2})}
                </span>
              </div>
              
              <div className={styles.cardRow}>
                <span className={`${styles.type} ${trade.type === "Buy" ? styles.textGreen : styles.textRed}`}>
                  {trade.type}
                </span>
                <span className={`${styles.rr} ${trade.rr >= 0 ? styles.textGreen : styles.textRed}`}>
                  {trade.rr}R
                </span>
              </div>

              <div className={styles.cardRow}>
                <span className={styles.metaText}>{trade.date} • {trade.time}</span>
                <span className={styles.bookmarkIcon}>
                  {trade.isBookmarked ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--accent-orange)" stroke="var(--accent-orange)" strokeWidth="2">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                  )}
                </span>
              </div>

              <div className={styles.cardRow}>
                <span className={styles.metaText}>{trade.setups.join(", ")} • {trade.timeframe}</span>
              </div>
            </div>
          ))}
          
          {filteredTrades.length === 0 && (
            <div className={styles.emptyState}>
              No trades found matching your filters.
            </div>
          )}
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
                <label className={styles.filterLabel}>Date Range</label>
                <div className={styles.dateInputs}>
                  <input 
                    type="date" 
                    className={styles.filterSelect} 
                    value={advFilters.startDate}
                    onChange={(e) => setAdvFilters({...advFilters, startDate: e.target.value})}
                  />
                  <span className={styles.dateTo}>to</span>
                  <input 
                    type="date" 
                    className={styles.filterSelect} 
                    value={advFilters.endDate}
                    onChange={(e) => setAdvFilters({...advFilters, endDate: e.target.value})}
                  />
                </div>
              </div>

              {/* Symbol */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Symbol (Share)</label>
                <select 
                  className={styles.filterSelect}
                  value={advFilters.symbol}
                  onChange={(e) => setAdvFilters({...advFilters, symbol: e.target.value})}
                >
                  <option value="">All Symbols</option>
                  <option value="NIFTY 50">NIFTY 50</option>
                  <option value="BANKNIFTY">BANKNIFTY</option>
                  <option value="RELIANCE">RELIANCE</option>
                  <option value="TCS">TCS</option>
                </select>
              </div>

              {/* Session */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Trading Session</label>
                <select 
                  className={styles.filterSelect}
                  value={advFilters.session}
                  onChange={(e) => setAdvFilters({...advFilters, session: e.target.value})}
                >
                  <option value="">All Sessions</option>
                  {AVAILABLE_SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Setups (Multi-Select) */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Setups / Strategies</label>
                <div className={styles.setupGrid}>
                  {AVAILABLE_SETUPS.map(s => {
                    const isActive = advFilters.setups.includes(s);
                    return (
                      <button 
                        key={s} 
                        className={`${styles.setupChip} ${isActive ? styles.setupChipActive : ""}`}
                        onClick={() => toggleSetup(s)}
                      >
                        {isActive && <span>✓ </span>}{s}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Trade Type & Result (2 columns) */}
              <div className={styles.filterRowGrid}>
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Trade Type</label>
                  <select 
                    className={styles.filterSelect}
                    value={advFilters.type}
                    onChange={(e) => setAdvFilters({...advFilters, type: e.target.value})}
                  >
                    <option value="">All Types</option>
                    <option value="Buy">Buy (Long)</option>
                    <option value="Sell">Sell (Short)</option>
                  </select>
                </div>
                
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Result</label>
                  <select 
                    className={styles.filterSelect}
                    value={advFilters.result}
                    onChange={(e) => setAdvFilters({...advFilters, result: e.target.value})}
                  >
                    <option value="">All Results</option>
                    <option value="Win">Win Only</option>
                    <option value="Loss">Loss Only</option>
                  </select>
                </div>
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
