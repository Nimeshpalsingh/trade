"use client";
import { useState, useEffect, useRef } from "react";
import BottomNav from "../components/BottomNav";
import styles from "./addtrade.module.css";

// Shared Mock Data (Will come from Backend/Context later)
const MOCK_SETTINGS = {
  setups: ["Breakout", "Pullback", "Reversal", "Fakeout", "Moving Average Bounce", "VWAP Reject"],
  sessions: [
    { id: "1", name: "Morning", startTime: "09:15", endTime: "11:30" },
    { id: "2", name: "Afternoon", startTime: "13:00", endTime: "15:30" },
    { id: "3", name: "Algo", startTime: "09:15", endTime: "15:30" }
  ],
  timeFrames: ["1 Minute", "3 Minutes", "5 Minutes", "15 Minutes", "1 Hour", "1 Day"],
  symbols: ["NIFTY", "BANKNIFTY", "FINNIFTY", "RELIANCE", "HDFCBANK"],
  marketTrends: ["Trending", "Ranging", "Volatile", "Choppy"],
  breakeven: [
    { id: "1", symbol: "NIFTY", value: "₹60" },
    { id: "2", symbol: "BANKNIFTY", value: "₹65" },
    { id: "3", symbol: "RELIANCE", value: "0.03%" },
  ],
  mistakes: ["Overtrading", "FOMO", "Early Exit", "Wrong Trade", "No SL", "Revenge Trade", "Chasing", "Position Too Big"],
};

const STRATEGY_RULES = [
  "Liquidity Taken",
  "BOS",
  "CHOCH",
  "HTF Trend",
  "Volume Confirmed",
  "RSI Confirmed",
  "News Checked",
  "Session Confirmed"
];

import { useRouter } from "next/navigation";

export default function AddTradePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  
  const goToManage = (cat) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("openManageCat", cat);
      localStorage.setItem("returnTo", "/add-trade");
      router.push("/manage");
    }
  };
  
  // Step 1: Basic
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [type, setType] = useState("LONG");
  const [symbol, setSymbol] = useState("NIFTY");
  const [qty, setQty] = useState("");
  const [entry, setEntry] = useState("");
  const [exits, setExits] = useState([{ qty: "", price: "" }]);
  const [sl, setSl] = useState("");
  
  // Computed values
  const [netPnl, setNetPnl] = useState(0);
  const [rr, setRr] = useState(0);
  const [chargesAmount, setChargesAmount] = useState(0);

  // Step 2: Setup
  const [strategy, setStrategy] = useState("Breakout");
  const [timeFrame, setTimeFrame] = useState("15 Minutes");
  const [marketTrend, setMarketTrend] = useState("Trending");
  const [session, setSession] = useState("1"); // Using ID for Morning
  const [biases, setBiases] = useState({}); // { '1M': 'Up', '1D': 'Down' }
  const [selectedRules, setSelectedRules] = useState(["Liquidity Taken", "BOS", "CHOCH", "HTF Trend", "RSI Confirmed", "Session Confirmed"]);

  // Step 4: Notes
  const [notes, setNotes] = useState("");
  const [selectedMistakes, setSelectedMistakes] = useState([]);

  // Step 5: Media (Images & Video)
  const [images, setImages] = useState([]);
  const [videoLink, setVideoLink] = useState("");
  const fileInputRef = useRef(null);

  // --- Auto Calculations ---
  useEffect(() => {
    const q = parseFloat(qty) || 0;
    const en = parseFloat(entry) || 0;
    const stop = parseFloat(sl) || 0;

    const hasValidExit = exits.some(ex => (parseFloat(ex.qty) || 0) > 0 && (parseFloat(ex.price) || 0) > 0);

    if (q > 0 && en > 0 && hasValidExit) {
      // 1. Gross PnL
      let gross = 0;
      let turnover = 0;
      let totalExitedQty = 0;
      let totalExitValue = 0;
      
      exits.forEach(ex => {
        const exQ = parseFloat(ex.qty) || 0;
        const exP = parseFloat(ex.price) || 0;
        if (exQ > 0 && exP > 0) {
          totalExitedQty += exQ;
          totalExitValue += (exQ * exP);
          if (type === "LONG") gross += (exP - en) * exQ;
          if (type === "SHORT") gross += (en - exP) * exQ;
        }
      });

      // 2. Charges
      let charges = 0;
      const bRule = MOCK_SETTINGS.breakeven.find(b => b.symbol === symbol);
      if (bRule) {
        if (bRule.value.includes("%")) {
          const percent = parseFloat(bRule.value.replace("%", ""));
          turnover = (en * totalExitedQty) + totalExitValue;
          charges = turnover * (percent / 100);
        } else {
          charges = parseFloat(bRule.value.replace(/[^0-9.]/g, ""));
        }
      }
      
      setChargesAmount(charges);
      setNetPnl(gross - charges);

      // 3. Risk Reward
      if (stop > 0 && totalExitedQty > 0) {
        const avgExitPrice = totalExitValue / totalExitedQty;
        const risk = Math.abs(en - stop);
        const reward = Math.abs(avgExitPrice - en);
        if (risk > 0) {
          setRr((reward / risk).toFixed(2));
        } else {
          setRr(0);
        }
      } else {
        setRr(0);
      }
    } else {
      setNetPnl(0);
      setRr(0);
      setChargesAmount(0);
    }
  }, [qty, entry, exits, sl, type, symbol]);

  // --- Handlers ---
  const addExit = () => setExits([...exits, { qty: "", price: "" }]);
  const removeExit = (index) => setExits(exits.filter((_, i) => i !== index));
  const updateExit = (index, field, value) => {
    const newExits = [...exits];
    newExits[index][field] = value;
    setExits(newExits);
  };

  const toggleRule = (r) => {
    setSelectedRules(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  };

  const toggleMistake = (m) => {
    setSelectedMistakes(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  };

  const handlePaste = (e) => {
    if (step === 5) {
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          const reader = new FileReader();
          reader.onload = (e) => {
            setImages(prev => {
              if (prev.length < 3) return [...prev, e.target.result];
              return prev;
            });
          };
          reader.readAsDataURL(blob);
          break;
        }
      }
    }
  };

  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  });

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImages(prev => {
          if (prev.length < 3) return [...prev, ev.target.result];
          return prev;
        });
      };
      reader.readAsDataURL(file);
    });
    
    if (e.target) e.target.value = "";
  };
  
  const removeImage = (indexToRemove) => {
    setImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setStep(1);
    }, 3000);
  };

  const stepNames = ["Basic", "Setup", "Bias", "Notes", "Media"];

  return (
    <div className="page-wrapper">
      <header className={styles.header}>
        <div className={styles.tabsHeader}>
          {stepNames.map((name, index) => (
            <div 
              key={name} 
              className={`${styles.tabItem} ${step === index + 1 ? styles.tabActive : ""}`}
              onClick={() => setStep(index + 1)}
            >
              {name}
            </div>
          ))}
        </div>
      </header>

      <main className={styles.main}>
        {submitted ? (
          <div className={styles.successBanner}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--profit-green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            Trade Saved Successfully!
          </div>
        ) : (
          <div className={styles.form}>
            {/* ================= STEP 1: Basic ================= */}
            {step === 1 && (
              <div className={styles.stepBlock}>
                
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Date</label>
                    <input type="date" className={styles.input} value={date} onChange={(e) => setDate(e.target.value)} />
                  </div>
                  <div className={styles.field}>
                    <div className={styles.labelRow}>
                      <label className={styles.label}>Symbol</label>
                      <button type="button" className={styles.addShortcutBtn} onClick={() => goToManage('symbols')}>+ Add</button>
                    </div>
                    <select className={styles.input} value={symbol} onChange={(e) => setSymbol(e.target.value)}>
                      {MOCK_SETTINGS.symbols.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Trade Type</label>
                  <div className={styles.typeGroup}>
                    <button type="button" className={`${styles.typeBtn} ${type === "LONG" ? styles.typeLong : ""}`} onClick={() => setType("LONG")}>LONG</button>
                    <button type="button" className={`${styles.typeBtn} ${type === "SHORT" ? styles.typeShort : ""}`} onClick={() => setType("SHORT")}>SHORT</button>
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Total Quantity</label>
                    <input type="number" className={styles.input} placeholder="e.g. 50" value={qty} onChange={(e) => setQty(e.target.value)} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Entry Price</label>
                    <input type="number" className={styles.input} placeholder="0.00" value={entry} onChange={(e) => setEntry(e.target.value)} />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Stop Loss (SL)</label>
                  <input type="number" className={styles.input} placeholder="0.00" value={sl} onChange={(e) => setSl(e.target.value)} />
                </div>

                <div className={styles.exitsSection}>
                  <div className={styles.exitsHeader}>
                    <label className={styles.label}>Exit Points (Partial Booking/Trailing)</label>
                  </div>
                  <div className={styles.exitsList}>
                    {exits.map((ex, idx) => (
                      <div key={idx} className={styles.exitRow}>
                        <div className={styles.field}>
                          <input type="number" className={styles.input} placeholder="Exit Qty" value={ex.qty} onChange={(e) => updateExit(idx, "qty", e.target.value)} />
                        </div>
                        <div className={styles.field}>
                          <input type="number" className={styles.input} placeholder="Exit Price" value={ex.price} onChange={(e) => updateExit(idx, "price", e.target.value)} />
                        </div>
                        {exits.length > 1 && (
                          <button type="button" className={styles.removeExitBtn} onClick={() => removeExit(idx)}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button type="button" className={styles.addExitBtn} onClick={addExit}>
                    + Add Partial Exit
                  </button>
                </div>

                <div className={styles.autoCalcBox}>
                  <div className={styles.calcItem}>
                    <span className={styles.calcLabel}>Charges</span>
                    <span className={styles.calcValue}>₹{chargesAmount.toFixed(2)}</span>
                  </div>
                  <div className={styles.calcItem}>
                    <span className={styles.calcLabel}>Net PnL</span>
                    <span className={`${styles.calcValue} ${netPnl > 0 ? styles.profitText : netPnl < 0 ? styles.lossText : ""}`}>
                      ₹{netPnl.toFixed(2)}
                    </span>
                  </div>
                  <div className={styles.calcItem}>
                    <span className={styles.calcLabel}>R:R</span>
                    <span className={styles.calcValue}>{rr > 0 ? `1 : ${rr}` : "-"}</span>
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 2: Setup ================= */}
            {step === 2 && (
              <div className={styles.stepBlock}>
                
                <div className={styles.field}>
                  <div className={styles.labelRow}>
                    <label className={styles.label}>Strategy / Setup</label>
                    <button type="button" className={styles.addShortcutBtn} onClick={() => goToManage('setups')}>+ Add</button>
                  </div>
                  <select className={styles.input} value={strategy} onChange={(e) => setStrategy(e.target.value)}>
                    {MOCK_SETTINGS.setups.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className={styles.field}>
                  <div className={styles.labelRow}>
                    <label className={styles.label}>Time Frame</label>
                    <button type="button" className={styles.addShortcutBtn} onClick={() => goToManage('timeFrames')}>+ Add</button>
                  </div>
                  <select className={styles.input} value={timeFrame} onChange={(e) => setTimeFrame(e.target.value)}>
                    {MOCK_SETTINGS.timeFrames.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                
                <div className={styles.field}>
                  <div className={styles.labelRow}>
                    <label className={styles.label}>Market Condition</label>
                    <button type="button" className={styles.addShortcutBtn} onClick={() => goToManage('marketTrends')}>+ Add</button>
                  </div>
                  <select className={styles.input} value={marketTrend} onChange={(e) => setMarketTrend(e.target.value)}>
                    {MOCK_SETTINGS.marketTrends.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className={styles.field}>
                  <div className={styles.labelRow}>
                    <label className={styles.label}>Session</label>
                    <button type="button" className={styles.addShortcutBtn} onClick={() => goToManage('sessions')}>+ Add</button>
                  </div>
                  <select className={styles.input} value={session} onChange={(e) => setSession(e.target.value)}>
                    {MOCK_SETTINGS.sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                
                <div className={styles.rulesList}>
                  {STRATEGY_RULES.map(rule => (
                    <label key={rule} className={styles.ruleCheckboxLabel}>
                      <div className={`${styles.customCheckbox} ${selectedRules.includes(rule) ? styles.customCheckboxChecked : ""}`}>
                        {selectedRules.includes(rule) && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <input 
                        type="checkbox" 
                        style={{ display: "none" }}
                        checked={selectedRules.includes(rule)}
                        onChange={() => toggleRule(rule)}
                      />
                      <span>{rule}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* ================= STEP 3: Bias ================= */}
            {step === 3 && (
              <div className={styles.stepBlock}>
                <div className={styles.field}>
                  <div className={styles.labelRow}>
                    <label className={styles.label}>Multi-Timeframe Bias (Optional)</label>
                  </div>
                  <div className={styles.biasGrid}>
                    {["1 Month", "1 Week", "1 Day", "4 Hours", "1 Hour", "30 Min", "15 Min", "5 Min", "3 Min", "1 Min"].map(tf => (
                      <div key={tf} className={styles.biasRow}>
                        <span className={styles.biasTf}>{tf}</span>
                        <div className={styles.biasOptions}>
                          <button 
                            type="button" 
                            className={`${styles.biasBtn} ${biases[tf] === 'Up' ? styles.biasUp : ''}`}
                            onClick={() => setBiases(prev => ({...prev, [tf]: prev[tf] === 'Up' ? null : 'Up'}))}
                          >Up</button>
                          <button 
                            type="button" 
                            className={`${styles.biasBtn} ${biases[tf] === 'Down' ? styles.biasDown : ''}`}
                            onClick={() => setBiases(prev => ({...prev, [tf]: prev[tf] === 'Down' ? null : 'Down'}))}
                          >Down</button>
                          <button 
                            type="button" 
                            className={`${styles.biasBtn} ${biases[tf] === 'Not Sure' ? styles.biasNeutral : ''}`}
                            onClick={() => setBiases(prev => ({...prev, [tf]: prev[tf] === 'Not Sure' ? null : 'Not Sure'}))}
                          >Not Sure</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 4: Notes ================= */}
            {step === 4 && (
              <div className={styles.stepBlock}>
                
                <div className={styles.field}>
                  <div className={styles.labelRow}>
                    <label className={styles.label}>Mistakes Made (If Any)</label>
                    <button type="button" className={styles.addShortcutBtn} onClick={() => goToManage('mistakes')}>+ Add</button>
                  </div>
                  <div className={styles.mistakesWrap}>
                    {MOCK_SETTINGS.mistakes.map(m => (
                      <button 
                        key={m} type="button" 
                        className={`${styles.mistakeChip} ${selectedMistakes.includes(m) ? styles.mistakeChipActive : ""}`} 
                        onClick={() => toggleMistake(m)}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Journal Notes</label>
                  <textarea 
                    className={`${styles.input} ${styles.textarea}`} 
                    placeholder="Why did you take this trade? How did you feel?" 
                    rows={6} 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* ================= STEP 5: Media ================= */}
            {step === 5 && (
              <div className={styles.stepBlock}>
                
                <div className={styles.field}>
                  <label className={styles.label}>YouTube Video Link (Optional)</label>
                  <input 
                    type="url" 
                    className={styles.input} 
                    placeholder="https://youtu.be/..." 
                    value={videoLink} 
                    onChange={(e) => setVideoLink(e.target.value)} 
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Chart Screenshots ({images.length}/3)</label>
                  
                  {images.length > 0 && (
                    <div className={styles.imageGrid}>
                      {images.map((img, index) => (
                        <div key={index} className={styles.imagePreviewBox}>
                          <img src={img} alt={`Screenshot ${index + 1}`} className={styles.previewImg} />
                          <button type="button" className={styles.removeImgBtn} onClick={() => removeImage(index)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {images.length < 3 && (
                    <div className={styles.pasteArea} onClick={() => fileInputRef.current.click()}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                      <p>Click to Upload or Paste Image (Ctrl+V)</p>
                      <span style={{fontSize: "12px", color: "var(--text-muted)"}}>You can add {3 - images.length} more image{3 - images.length > 1 ? "s" : ""}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        multiple
                        ref={fileInputRef} 
                        style={{ display: "none" }} 
                        onChange={handleImageUpload} 
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className={styles.stepNav}>
              {step > 1 ? (
                <button type="button" className={styles.navBtnOutline} onClick={() => setStep(step - 1)}>
                  Back
                </button>
              ) : <div></div>}
              
              {step < 5 ? (
                <button type="button" className={styles.navBtnPrimary} onClick={() => setStep(step + 1)}>
                  Next
                </button>
              ) : (
                <button type="button" className={styles.submitBtn} onClick={handleSubmit}>
                  Save Trade
                </button>
              )}
            </div>
            
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
