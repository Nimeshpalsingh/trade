"use client";
import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "./tradeDetails.module.css";

// Extended Mock Data capturing all fields from "Add Trade" wizard
const allTrades = [
  { 
    id:"t1", date:"2025-05-28", time: "09:15", symbol:"NIFTY 50", type:"Buy", 
    qty: 50, entry: 22550.25, exit: 22700.25, sl: 22450.00, target: 22850.00, 
    partialExits: [{ qty: 25, price: 22650.00 }, { qty: 25, price: 22750.50 }],
    lotSize: 1, pnl:12525.00, rr: 2.99, roi: 2.50, charges: 125,
    mode: "Live", trend: "Up", session: "Morning (9:15 - 11:30)",
    setups:["Breakout"], timeframe: "15m", 
    biases: { "1 Month": "Up", "1 Week": "Up", "1 Day": "Up", "1 Hour": "Not Sure" },
    strategyRules: ["Liquidity Taken", "BOS", "CHOCH"],
    mistakes:["FOMO", "Overtrading", "RR Not Maintained"], 
    notes: "Good breakout trade. Followed all rules. Booked 50% at 1R and rest at target. Volume was good. Market in trending condition.",
    status: "Completed", isBookmarked: true,
    images: [], // mock image URLs would go here
    videoLink: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  },
  { 
    id:"t2", date:"2025-05-28", time: "10:45", symbol:"BANKNIFTY", type:"Sell", 
    qty: 15, entry: 52400.00, exit: 52520.00, sl: 52300.00, target: 52000.00,
    partialExits: [{ qty: 15, price: 52520.00 }],
    lotSize: 1, pnl:-2150.00, rr: -1.0, roi: -0.5, charges: 80,
    mode: "Live", trend: "Sideways", session: "Morning (9:15 - 11:30)",
    setups:["Liquidity Grab"], timeframe: "5m", 
    biases: { "1 Day": "Down", "15 Min": "Down" },
    strategyRules: ["Inducement", "Fair Value Gap"],
    mistakes:["FOMO", "Revenge Trading"], 
    notes: "Got chopped out. Market was sideways.",
    status: "Completed", isBookmarked: true,
    images: []
  },
  { 
    id:"t3", date:"2025-05-28", time: "11:30", symbol:"RELIANCE", type:"Buy", 
    qty: 100, entry: 3120.00, exit: 3188.00, sl: 3100.00, target: 3200.00,
    partialExits: [{ qty: 100, price: 3188.00 }],
    lotSize: 1, pnl:6800.00, rr: 3.2, roi: 2.1, charges: 45,
    mode: "Live", trend: "Up", session: "Afternoon (11:30 - 13:30)",
    setups:["Reversal"], timeframe: "15m", 
    biases: { "1 Week": "Up", "1 Day": "Up" },
    strategyRules: ["BOS"],
    mistakes:[], 
    notes: "Perfect bounce from daily support.",
    status: "Completed", isBookmarked: true,
    images: []
  }
];

export default function TradeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Basic");
  
  const currentIndex = allTrades.findIndex(t => t.id === params.id);
  const trade = allTrades[currentIndex];

  const prevTrade = currentIndex > 0 ? allTrades[currentIndex - 1] : null;
  const nextTrade = currentIndex < allTrades.length - 1 ? allTrades[currentIndex + 1] : null;

  const getYoutubeEmbedUrl = (url) => {
    if (!url) return null;
    let videoId = "";
    if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1]?.split("?")[0];
    } else if (url.includes("youtube.com/watch")) {
      videoId = new URLSearchParams(url.split("?")[1]).get("v");
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  if (!trade) {
    return <div style={{color: "white", padding: "20px"}}>Trade not found</div>;
  }

  const allMistakesList = ["FOMO", "Overtrading", "Revenge Trading", "RR Not Maintained", "Early Exit"];
  const allRulesList = ["Liquidity Taken", "Inducement", "BOS", "CHOCH", "Order Block", "Fair Value Gap"];

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this trade?")) {
      alert("Trade deleted successfully.");
      router.push("/journal");
    }
  };

  const handleEdit = () => {
    router.push(`/add-trade?edit=${trade.id}`);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.push("/journal")}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <div className={styles.headerTitles}>
          <h1 className={styles.title}>{trade.symbol}</h1>
          <p className={styles.subtitle}>
            <span className={trade.type === "Buy" ? styles.textGreen : styles.textRed}>{trade.type}</span> 
            {" • "}{trade.date} • {trade.time}
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.iconBtn} onClick={handleEdit} title="Edit Trade">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button className={styles.iconBtn} onClick={handleDelete} title="Delete Trade" style={{color: 'var(--loss-red)'}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </header>

      {/* Navigation (Prev/Next) */}
      <div className={styles.navRow}>
        <button 
          className={styles.navBtn} 
          disabled={!prevTrade}
          onClick={() => prevTrade && router.push(`/journal/${prevTrade.id}`)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Previous
        </button>
        <span className={styles.navCount}>{currentIndex + 1} of {allTrades.length}</span>
        <button 
          className={styles.navBtn} 
          disabled={!nextTrade}
          onClick={() => nextTrade && router.push(`/journal/${nextTrade.id}`)}
        >
          Next
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        {["Basic", "Setup", "Bias", "Notes", "Media"].map(tab => (
          <button 
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <main className={styles.main}>
        {activeTab === "Basic" && (
          <div className={styles.overviewSection}>
            {/* Key Value Pairs */}
            <div className={styles.kvList}>
              <div className={styles.kvRow}>
                <span className={styles.kvLabel}>Entry Price</span>
                <span className={styles.kvValue}>{trade.entry.toLocaleString("en-IN", {minimumFractionDigits: 2})}</span>
              </div>
              <div className={styles.kvRow}>
                <span className={styles.kvLabel}>Avg. Exit Price</span>
                <span className={styles.kvValue}>{trade.exit.toLocaleString("en-IN", {minimumFractionDigits: 2})}</span>
              </div>
              <div className={styles.kvRow}>
                <span className={styles.kvLabel}>Stop Loss</span>
                <span className={styles.kvValue}>{trade.sl.toLocaleString("en-IN", {minimumFractionDigits: 2})}</span>
              </div>
              <div className={styles.kvRow}>
                <span className={styles.kvLabel}>Target Price</span>
                <span className={styles.kvValue}>{trade.target.toLocaleString("en-IN", {minimumFractionDigits: 2})}</span>
              </div>
              <div className={styles.kvRow}>
                <span className={styles.kvLabel}>Quantity</span>
                <span className={styles.kvValue}>{trade.qty}</span>
              </div>
              <div className={styles.kvRow}>
                <span className={styles.kvLabel}>Capital Used</span>
                <span className={styles.kvValue}>₹ {(trade.entry * trade.qty * (trade.lotSize || 1)).toLocaleString("en-IN", {minimumFractionDigits: 2})}</span>
              </div>
              <div className={styles.kvRow}>
                <span className={styles.kvLabel}>Charges / Brokerage</span>
                <span className={styles.kvValue}>₹ {trade.charges.toLocaleString("en-IN")}</span>
              </div>
              <div className={styles.kvRow}>
                <span className={styles.kvLabel}>Risk / Reward</span>
                <span className={styles.kvValue}>1 : {trade.rr >= 0 ? trade.rr : Math.abs(trade.rr)}</span>
              </div>
              <div className={styles.kvRow}>
                <span className={styles.kvLabel}>Net PnL</span>
                <span className={`${styles.kvValue} ${trade.pnl >= 0 ? styles.textGreen : styles.textRed}`}>
                  {trade.pnl >= 0 ? "+" : "-"}₹ {Math.abs(trade.pnl).toLocaleString("en-IN", {minimumFractionDigits: 2})}
                </span>
              </div>
            </div>

            {/* Partial Exits Section */}
            {trade.partialExits && trade.partialExits.length > 0 && (
              <div className={styles.sectionBlock}>
                <h3 className={styles.sectionTitle}>Exits Breakdown</h3>
                <div className={styles.exitsList}>
                  {trade.partialExits.map((ex, idx) => (
                    <div key={idx} className={styles.exitRow}>
                      <span className={styles.exitQty}>{ex.qty} Qty</span>
                      <span className={styles.exitPrice}>@ ₹{ex.price.toLocaleString("en-IN", {minimumFractionDigits: 2})}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "Setup" && (
          <div className={styles.overviewSection}>
            {/* Quick Context Tags */}
            <div className={styles.contextTags}>
              {trade.setups && trade.setups.map(s => <span key={s} className={styles.contextTag}>Setup: {s}</span>)}
              <span className={styles.contextTag}>Trend: {trade.trend}</span>
              <span className={styles.contextTag}>Session: {trade.session}</span>
            </div>

            {/* Strategy Rules Section */}
            <div className={styles.sectionBlock}>
              <h3 className={styles.sectionTitle}>Strategy Rules Followed</h3>
              <div className={styles.mistakesGrid}>
                {allRulesList.map(r => {
                  const isActive = trade.strategyRules.includes(r);
                  if(!isActive) return null; // Only show rules that were actually followed
                  return (
                    <div key={r} className={`${styles.ruleChip}`}>
                      ✅ {r}
                    </div>
                  );
                })}
                {trade.strategyRules.length === 0 && (
                  <span style={{color: "var(--text-muted)", fontSize: "13px"}}>No specific rules marked.</span>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "Bias" && (
          <div className={styles.overviewSection}>
            {/* Bias Section */}
            {trade.biases && Object.keys(trade.biases).length > 0 ? (
              <div className={styles.sectionBlock}>
                <h3 className={styles.sectionTitle}>Multi-Timeframe Bias</h3>
                <div className={styles.biasGridDisplay}>
                  {Object.entries(trade.biases).map(([tf, bias]) => (
                    <div key={tf} className={styles.biasDisplayRow}>
                      <span className={styles.biasDisplayTf}>{tf}</span>
                      <span className={`${styles.biasDisplayVal} ${bias === 'Up' ? styles.textGreen : bias === 'Down' ? styles.textRed : ""}`}>
                        {bias}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className={styles.emptyTab}>
                No Multi-Timeframe Bias added for this trade.
              </div>
            )}
          </div>
        )}

        {activeTab === "Notes" && (
          <div className={styles.overviewSection}>
            {/* Mistakes Section */}
            <div className={styles.sectionBlock}>
              <h3 className={styles.sectionTitle}>Mistakes</h3>
              <div className={styles.mistakesGrid}>
                {allMistakesList.map(m => {
                  const isActive = trade.mistakes.includes(m);
                  if(!isActive) return null; // Only show active mistakes
                  return (
                    <div key={m} className={`${styles.mistakeChip} ${styles.mistakeActive}`}>
                      ⚠️ {m}
                    </div>
                  );
                })}
                {trade.mistakes.length === 0 && (
                  <span style={{color: "var(--text-muted)", fontSize: "13px"}}>No mistakes recorded! Great job.</span>
                )}
              </div>
            </div>

             <div className={styles.sectionBlock}>
              <h3 className={styles.sectionTitle}>Trade Notes</h3>
              <div className={styles.notesBox}>
                {trade.notes || "No notes added for this trade."}
              </div>
            </div>
          </div>
        )}

        {activeTab === "Media" && (
          <div className={styles.overviewSection}>
            {trade.videoLink && getYoutubeEmbedUrl(trade.videoLink) && (
              <div className={styles.sectionBlock}>
                <h3 className={styles.sectionTitle}>Screen Recording / Video</h3>
                <div className={styles.videoWrapper}>
                  <iframe 
                    src={getYoutubeEmbedUrl(trade.videoLink)}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className={styles.videoIframe}
                  ></iframe>
                </div>
              </div>
            )}

            <div className={styles.sectionBlock}>
              <h3 className={styles.sectionTitle}>Chart Screenshots</h3>
              {trade.images && trade.images.length > 0 ? (
                <div className={styles.imagesGrid}>
                  {trade.images.map((img, i) => (
                    <img key={i} src={img} alt={`Trade screenshot ${i+1}`} className={styles.screenshot} />
                  ))}
                </div>
              ) : (
                <div className={styles.emptyBox}>
                  No images attached to this trade.
                </div>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
