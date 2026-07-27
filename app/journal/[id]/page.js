"use client";
import { API_URL } from "../../utils/apiConfig";
import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "./tradeDetails.module.css";

import { fetchAndProcessTrades } from "../../utils/tradeUtils";
import { useEffect } from "react";
import { getSession } from "next-auth/react";

export default function TradeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [allTrades, setAllTrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [zoomedImage, setZoomedImage] = useState(null);

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

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this trade?")) {
      try {
        const session = await getSession();
        const token = session?.apiToken ? `Bearer ${session.apiToken}` : "Bearer 1|6Jz5W4mBp114wk1fmxxjjg3bPNKHBrEsiHjnSEW2c20da63f";
        const res = await fetch(`${API_URL}/trades/${trade.id}`, {
          method: "DELETE",
          headers: {
            "Authorization": token
          }
        });
        if (res.ok) {
          alert("Trade deleted successfully.");
          router.push("/journal");
        } else {
          alert("Failed to delete trade.");
        }
      } catch (err) {
        alert("An error occurred while deleting.");
      }
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
            <span className={`${styles.typeTag} ${trade.type === "LONG" || trade.type === "Buy" ? styles.typeTagBuy : styles.typeTagSell}`}>
              {trade.type === "LONG" || trade.type === "Buy" ? "BUY" : "SELL"}
            </span> 
            <span>{new Date(trade.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.iconBtn} onClick={handleEdit} title="Edit Trade">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button className={styles.iconBtn} onClick={handleDelete} title="Delete Trade" style={{color: '#ef4444'}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

      {/* Media Gallery First */}
      {(trade.images && trade.images.length > 0) || (trade.video_link && getYoutubeEmbedUrl(trade.video_link)) ? (
        <section className={styles.imageGallery}>
          {trade.images && trade.images.map((img, i) => (
            <div key={i} className={styles.galleryItem} onClick={() => setZoomedImage(img)}>
              <img src={img} alt={`Screenshot ${i+1}`} className={styles.screenshot} />
            </div>
          ))}
          {trade.video_link && getYoutubeEmbedUrl(trade.video_link) && (
            <div className={styles.galleryItem} style={{ cursor: 'default' }}>
              <iframe 
                src={getYoutubeEmbedUrl(trade.video_link)}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className={styles.screenshot} 
              ></iframe>
            </div>
          )}
        </section>
      ) : (
        <div className={styles.emptyBox}>
          No screenshots or videos attached to this trade.
        </div>
      )}

      {/* Premium Stats Row */}
      <section className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Net PnL</span>
          <span className={`${styles.statValue} ${trade.pnl >= 0 ? styles.profitText : styles.lossText}`}>
            {trade.pnl >= 0 ? "+" : "-"}₹{Math.abs(trade.pnl).toLocaleString("en-IN", {minimumFractionDigits: 2})}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Risk/Reward</span>
          <span className={styles.statValue}>
            {trade.rr > 0 ? `1 : ${trade.rr}` : "-"}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Risk Amount</span>
          <span className={styles.statValue} style={{color: '#ef4444'}}>
            ₹{(Math.abs(parseFloat(trade.entry_price || 0) - parseFloat(trade.sl || 0)) * parseFloat(trade.qty || 0)).toLocaleString("en-IN", {minimumFractionDigits: 2})}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Capital Used</span>
          <span className={styles.statValue}>
            ₹{(parseFloat(trade.entry_price || 0) * parseFloat(trade.qty || 0)).toLocaleString("en-IN", {minimumFractionDigits: 2})}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Avg Entry</span>
          <span className={styles.statValue}>
            ₹{parseFloat(trade.entry_price || 0).toLocaleString("en-IN", {minimumFractionDigits: 2})}
          </span>
        </div>
      </section>

      {/* Main Content Grid */}
      <main className={styles.mainGrid}>
        
        {/* Left Column */}
        <div className={styles.leftCol}>
          <div className={styles.sectionBlock}>
            <h3 className={styles.sectionTitle}>Trade Context</h3>
            <div className={styles.tagsGrid}>
              {trade.setup && <span className={styles.contextTag}>Setup: {trade.setup}</span>}
              {trade.trend && <span className={styles.contextTag}>Trend: {trade.trend}</span>}
              {trade.session && <span className={styles.contextTag}>Session: {trade.session}</span>}
            </div>
          </div>

          <div className={styles.sectionBlock}>
            <h3 className={styles.sectionTitle}>Strategy Rules</h3>
            <div className={styles.tagsGrid}>
              {trade.rules && trade.rules.map(r => (
                <span key={r} className={styles.ruleChip}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  {r}
                </span>
              ))}
              {(!trade.rules || trade.rules.length === 0) && (
                <span style={{color: "#71717a", fontSize: "14px"}}>No rules marked.</span>
              )}
            </div>
          </div>

          <div className={styles.sectionBlock}>
            <h3 className={styles.sectionTitle}>Mistakes Made</h3>
            <div className={styles.tagsGrid}>
              {trade.mistakes && trade.mistakes.map(m => (
                <span key={m} className={styles.mistakeChip}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                  {m}
                </span>
              ))}
              {(!trade.mistakes || trade.mistakes.length === 0) && (
                <span style={{color: "#34d399", fontSize: "14px"}}>No mistakes recorded! Great job.</span>
              )}
            </div>
          </div>

          <div className={styles.sectionBlock}>
            <h3 className={styles.sectionTitle}>Trade Notes</h3>
            <div className={styles.notesBox}>
              {trade.notes || "No notes added for this trade."}
            </div>
          </div>

          {trade.exits && trade.exits.length > 0 && (
            <div className={styles.sectionBlock}>
              <h3 className={styles.sectionTitle}>Partial Exits</h3>
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

        {/* Right Column */}
        <div className={styles.rightCol}>
          <div className={styles.sectionBlock}>
            <h3 className={styles.sectionTitle}>Execution Details</h3>
            <div className={styles.kvList}>
              <div className={styles.kvRow}>
                <span className={styles.kvLabel}>Quantity</span>
                <span className={styles.kvValue}>{parseFloat(trade.qty || 0)}</span>
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
                <span className={styles.kvLabel}>Max Target Price</span>
                <span className={styles.kvValue}>{
                  trade.exits && trade.exits.length > 0 
                  ? (trade.type === 'LONG' || trade.type === 'Buy' 
                      ? Math.max(...trade.exits.map(e => parseFloat(e.price))) 
                      : Math.min(...trade.exits.map(e => parseFloat(e.price)))
                    ).toLocaleString("en-IN", {minimumFractionDigits: 2})
                  : "N/A"
                }</span>
              </div>
              <div className={styles.kvRow}>
                <span className={styles.kvLabel}>Charges / Brokerage</span>
                <span className={styles.kvValue}>₹ {trade.charges.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          <div className={styles.sectionBlock}>
            <h3 className={styles.sectionTitle}>Multi-Timeframe Bias</h3>
            {trade.biases && trade.biases.length > 0 ? (
              <div className={styles.biasGridDisplay}>
                {trade.biases.map((b, i) => (
                  <div key={i} className={styles.biasDisplayRow}>
                    <span className={styles.biasDisplayTf}>{b.time_frame || "Timeframe"}</span>
                    <span className={styles.biasDisplayVal} style={{color: b.bias === 'Up' || b.bias === 'Bullish' ? '#10b981' : (b.bias === 'Down' || b.bias === 'Bearish' ? '#ef4444' : '#fff')}}>
                      {b.bias || "Trend"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <span style={{color: "#71717a", fontSize: "14px"}}>No Multi-Timeframe Bias added.</span>
            )}
          </div>
        </div>

      </main>

      {/* Image Zoom Modal Overlay */}
      {zoomedImage && (
        <div className={styles.imageModalOverlay} onClick={() => setZoomedImage(null)}>
          <button className={styles.closeModalBtn} onClick={(e) => { e.stopPropagation(); setZoomedImage(null); }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          <img src={zoomedImage} alt="Zoomed Screenshot" className={styles.zoomedImage} onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
