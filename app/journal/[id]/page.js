"use client";
import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "./tradeDetails.module.css";

import { fetchAndProcessTrades } from "../../utils/tradeUtils";
import { useEffect } from "react";

export default function TradeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Basic");
  const [allTrades, setAllTrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAndProcessTrades().then(data => {
      setAllTrades(data);
      setIsLoading(false);
    });
  }, []);

  const currentIndex = allTrades.findIndex(t => String(t.id) === String(params.id));
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

  if (isLoading) {
    return <div style={{color: "white", padding: "20px", textAlign: "center"}}>Loading trade details...</div>;
  }

  if (!trade) {
    return <div style={{color: "white", padding: "20px", textAlign: "center"}}>Trade not found</div>;
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
            <span className={trade.type === "LONG" ? styles.textGreen : styles.textRed}>{trade.type === "LONG" ? "Buy" : "Sell"}</span> 
            {" • "}{trade.date}
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
                <span className={styles.kvValue}>{parseFloat(trade.entry_price || 0).toLocaleString("en-IN", {minimumFractionDigits: 2})}</span>
              </div>
              <div className={styles.kvRow}>
                <span className={styles.kvLabel}>Avg. Exit Price</span>
                <span className={styles.kvValue}>{
                  trade.exits && trade.exits.length > 0 
                  ? (trade.exits.reduce((acc, ex) => acc + (parseFloat(ex.price) * parseFloat(ex.qty)), 0) / trade.exits.reduce((acc, ex) => acc + parseFloat(ex.qty), 0)).toLocaleString("en-IN", {minimumFractionDigits: 2})
                  : "N/A"
                }</span>
              </div>
              <div className={styles.kvRow}>
                <span className={styles.kvLabel}>Stop Loss</span>
                <span className={styles.kvValue}>{parseFloat(trade.sl || 0).toLocaleString("en-IN", {minimumFractionDigits: 2})}</span>
              </div>
              <div className={styles.kvRow}>
                <span className={styles.kvLabel}>Target Price</span>
                <span className={styles.kvValue}>N/A</span>
              </div>
              <div className={styles.kvRow}>
                <span className={styles.kvLabel}>Quantity</span>
                <span className={styles.kvValue}>{parseFloat(trade.qty || 0)}</span>
              </div>
              <div className={styles.kvRow}>
                <span className={styles.kvLabel}>Capital Used</span>
                <span className={styles.kvValue}>₹ {(parseFloat(trade.entry_price || 0) * parseFloat(trade.qty || 0)).toLocaleString("en-IN", {minimumFractionDigits: 2})}</span>
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
            {trade.exits && trade.exits.length > 0 && (
              <div className={styles.sectionBlock}>
                <h3 className={styles.sectionTitle}>Exits Breakdown</h3>
                <div className={styles.exitsList}>
                  {trade.exits.map((ex, idx) => (
                    <div key={idx} className={styles.exitRow}>
                      <span className={styles.exitQty}>{ex.qty} Qty</span>
                      <span className={styles.exitPrice}>@ ₹{parseFloat(ex.price).toLocaleString("en-IN", {minimumFractionDigits: 2})}</span>
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
              {trade.setup && <span className={styles.contextTag}>Setup: {trade.setup}</span>}
              <span className={styles.contextTag}>Trend: {trade.trend}</span>
              <span className={styles.contextTag}>Session: {trade.session}</span>
            </div>

            {/* Strategy Rules Section */}
            <div className={styles.sectionBlock}>
              <h3 className={styles.sectionTitle}>Strategy Rules Followed</h3>
              <div className={styles.mistakesGrid}>
                {trade.rules && trade.rules.map(r => (
                  <div key={r} className={`${styles.ruleChip}`}>
                    ✅ {r}
                  </div>
                ))}
                {(!trade.rules || trade.rules.length === 0) && (
                  <span style={{color: "var(--text-muted)", fontSize: "13px"}}>No specific rules marked.</span>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "Bias" && (
          <div className={styles.overviewSection}>
            {/* Bias Section */}
            {trade.biases && trade.biases.length > 0 ? (
              <div className={styles.sectionBlock}>
                <h3 className={styles.sectionTitle}>Multi-Timeframe Bias</h3>
                <div className={styles.biasGridDisplay}>
                  {trade.biases.map((b, i) => (
                    <div key={i} className={styles.biasDisplayRow}>
                      <span className={styles.biasDisplayTf}>{b.timeFrame?.name || "Timeframe"}</span>
                      <span className={`${styles.biasDisplayVal} ${b.trend?.name === 'Up' || b.trend?.name === 'Bullish' ? styles.textGreen : (b.trend?.name === 'Down' || b.trend?.name === 'Bearish' ? styles.textRed : "")}`}>
                        {b.trend?.name || "Trend"}
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
                {trade.mistakes && trade.mistakes.map(m => (
                  <div key={m} className={`${styles.mistakeChip} ${styles.mistakeActive}`}>
                    ⚠️ {m}
                  </div>
                ))}
                {(!trade.mistakes || trade.mistakes.length === 0) && (
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
