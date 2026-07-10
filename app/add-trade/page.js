"use client";
import { useState, useEffect, useRef } from "react";
import BottomNav from "../components/BottomNav";
import styles from "./addtrade.module.css";

const STRATEGY_RULES = []; // Will be loaded dynamically

import { useRouter } from "next/navigation";

export default function AddTradePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  
  const [settings, setSettings] = useState({
    setups: [], sessions: [], timeFrames: [], symbols: [], 
    marketTrends: [], marketTypes: [], breakeven: [], mistakes: [], rules: []
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/settings", {
          headers: {
            "Accept": "application/json",
            "Authorization": "Bearer 1|6Jz5W4mBp114wk1fmxxjjg3bPNKHBrEsiHjnSEW2c20da63f"
          }
        });
        if (res.ok) {
          const data = await res.json();
          setSettings({
            setups: [...new Set(data.setups.map(s => s.name.trim()))],
            sessions: data.sessions.map(s => ({ id: s.id.toString(), name: s.name.trim(), startTime: s.start_time, endTime: s.end_time })),
            timeFrames: [...new Set(data.timeFrames.map(s => s.name.trim()))],
            symbols: [...new Set(data.symbols.map(s => s.name.trim()))],
            marketTrends: [...new Set(data.marketTrends.map(s => s.name.trim()))],
            marketTypes: data.marketTypes ? [...new Set(data.marketTypes.map(s => s.name.trim()))] : [],
            mistakes: [...new Set(data.mistakes.map(s => s.name.trim()))],
            rules: [...new Set(data.rules.map(s => s.name.trim()))],
            breakeven: data.symbols.filter(s => s.breakeven_value).map(s => ({ id: s.id.toString(), symbol: s.name, value: s.breakeven_value }))
          });
        }
      } catch (e) {
        console.error("Failed to fetch settings", e);
      }
    };
    fetchSettings();
  }, []);
  
  const goToManage = (cat) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("openManageCat", cat);
      localStorage.setItem("returnTo", "/add-trade");
      router.push("/manage");
    }
  };
  
  // Step 1: Basic
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [marketType, setMarketType] = useState("Options");
  const [type, setType] = useState("LONG");
  const [symbol, setSymbol] = useState("NIFTY");
  const [qty, setQty] = useState("");
  const [entry, setEntry] = useState("");
  const [exits, setExits] = useState([{ qty: "", price: "" }]);
  const [sl, setSl] = useState("");
  const [slPoints, setSlPoints] = useState("");
  const [tpPoints, setTpPoints] = useState("");
  const [riskAmount, setRiskAmount] = useState("");
  const [rewardRatio, setRewardRatio] = useState("");
  
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
      const bRule = settings.breakeven.find(b => b.symbol === symbol);
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

  // --- Smart Auto-Fill Handlers ---
  const calculateSmart = (field, val, currentExits) => {
    let currentEn = field === "entry" ? parseFloat(val) : parseFloat(entry);
    let currentSlPts = field === "slPoints" ? parseFloat(val) : parseFloat(slPoints);
    let currentSl = field === "sl" ? parseFloat(val) : parseFloat(sl);
    let currentRisk = field === "riskAmount" ? parseFloat(val) : parseFloat(riskAmount);
    let currentRR = field === "rewardRatio" ? parseFloat(val) : parseFloat(rewardRatio);
    let currentTpPts = field === "tpPoints" ? parseFloat(val) : parseFloat(tpPoints);
    let currentType = field === "type" ? val : type;
    let newQty = qty;

    // 1. Sync SL Points and SL Price
    if (field === "slPoints" && !isNaN(currentSlPts) && !isNaN(currentEn)) {
      const calcSl = currentType === "LONG" ? (currentEn - currentSlPts) : (currentEn + currentSlPts);
      setSl(calcSl.toFixed(2));
      currentSl = calcSl;
    } else if (field === "sl" && !isNaN(currentSl) && !isNaN(currentEn)) {
      const calcPts = Math.abs(currentEn - currentSl);
      setSlPoints(calcPts.toFixed(2));
      currentSlPts = calcPts;
    } else if ((field === "entry" || field === "type") && !isNaN(currentSlPts) && !isNaN(currentEn)) {
      const calcSl = currentType === "LONG" ? (currentEn - currentSlPts) : (currentEn + currentSlPts);
      setSl(calcSl.toFixed(2));
      currentSl = calcSl;
    }

    // 2. Auto Qty from Risk and SL Points
    if (!isNaN(currentRisk) && !isNaN(currentSlPts) && currentSlPts > 0) {
      const calcQty = Math.round(currentRisk / currentSlPts).toString();
      if (field !== "qty") {
        setQty(calcQty);
        newQty = calcQty;
      }
    }

    // 3. Auto TP Points & Price based on RR
    const rrStr = field === "rewardRatio" ? val : rewardRatio;
    const rrValues = rrStr.toString().split(",").map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
    
    if (rrValues.length > 0) {
       if (!isNaN(currentSlPts)) {
         // Set TP points display to first RR
         const firstTpPts = (currentSlPts * rrValues[0]).toFixed(2);
         if (field !== "tpPoints") {
            setTpPoints(firstTpPts);
            currentTpPts = parseFloat(firstTpPts);
         }
       }

       // Calculate Split Exits
       if (!isNaN(currentSlPts) && currentSlPts > 0 && !isNaN(currentEn)) {
          const baseQty = parseFloat(newQty) || 0;
          let splitQty = Math.floor(baseQty / rrValues.length);
          let remainder = baseQty % rrValues.length;
          
          // Only do this if they actually entered an RR string or Entry/SL/Qty changed. 
          // To avoid resetting manual edits when not needed, we just rebuild exits based on RR.
          const updatedExits = [];
          rrValues.forEach((rr, index) => {
            const calcTpPts = currentSlPts * rr;
            const calcTpPrice = currentType === "LONG" ? (currentEn + calcTpPts) : (currentEn - calcTpPts);
            let targetQty = splitQty;
            if (index === 0) targetQty += remainder;
            
            updatedExits.push({
              qty: targetQty > 0 ? targetQty.toString() : "",
              price: calcTpPrice.toFixed(2)
            });
          });
          setExits(updatedExits);
       }
    } else if (field === "tpPoints" && !isNaN(currentTpPts) && !isNaN(currentSlPts) && currentSlPts > 0) {
      // Manual TP points
      setRewardRatio((currentTpPts / currentSlPts).toFixed(2));
      currentRR = currentTpPts / currentSlPts;
      if (!isNaN(currentEn) && currentExits && currentExits.length >= 1) {
        const calcTpPrice = currentType === "LONG" ? (currentEn + currentTpPts) : (currentEn - currentTpPts);
        const updatedExits = [...currentExits];
        updatedExits[0].price = calcTpPrice.toFixed(2);
        if (!updatedExits[0].qty && newQty) updatedExits[0].qty = newQty;
        setExits(updatedExits);
      }
    }
  };

  const handleEntryChange = (val) => { setEntry(val); setErrors(prev => ({...prev, entry: null})); calculateSmart("entry", val, exits); };
  const handleSlChange = (val) => { setSl(val); setErrors(prev => ({...prev, sl: null})); calculateSmart("sl", val, exits); };
  const handleSlPointsChange = (val) => { setSlPoints(val); calculateSmart("slPoints", val, exits); };
  const handleTpPointsChange = (val) => { setTpPoints(val); calculateSmart("tpPoints", val, exits); };
  const handleTypeChange = (val) => { setType(val); calculateSmart("type", val, exits); };
  const handleRiskChange = (val) => { setRiskAmount(val); calculateSmart("riskAmount", val, exits); };
  const handleRrChange = (val) => { setRewardRatio(val); calculateSmart("rewardRatio", val, exits); };

  const addExit = () => setExits([...exits, { qty: "", price: "" }]);
  const removeExit = (index) => setExits(exits.filter((_, i) => i !== index));
  const updateExit = (index, field, value) => {
    if (field === "qty" && value !== "") {
        const valNum = parseFloat(value) || 0;
        const otherExitsQty = exits.reduce((sum, ex, i) => i !== index ? sum + (parseFloat(ex.qty) || 0) : sum, 0);
        const totalTradeQty = parseFloat(qty) || 0;
        const maxAllowed = totalTradeQty - otherExitsQty;
        
        if (valNum > maxAllowed) {
            setErrors(prev => ({...prev, exits: `Max allowed exit qty is ${maxAllowed}`}));
            return; // Prevent updating state
        }
    }

    const newExits = [...exits];
    newExits[index][field] = value;
    setExits(newExits);
    if (field === "qty" || field === "price") {
      setErrors(prev => ({...prev, exits: null}));
    }
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

  const handleNext = () => {
    if (step === 1) {
      let newErrors = {};
      if (!marketType) newErrors.marketType = "Required";
      if (!symbol) newErrors.symbol = "Required";
      if (!qty || parseFloat(qty) <= 0) newErrors.qty = "Invalid Qty";
      if (!entry || parseFloat(entry) <= 0) newErrors.entry = "Invalid Price";
      if (!sl || parseFloat(sl) <= 0) {
        newErrors.sl = "Invalid Stop Loss";
      } else if (entry && parseFloat(entry) > 0) {
        const slVal = parseFloat(sl);
        const entryVal = parseFloat(entry);
        if (type === "LONG" && slVal >= entryVal) {
          newErrors.sl = "SL must be < Entry for LONG";
        } else if (type === "SHORT" && slVal <= entryVal) {
          newErrors.sl = "SL must be > Entry for SHORT";
        }
      }
      
      const hasValidExit = exits.some(ex => (parseFloat(ex.qty) || 0) > 0 && (parseFloat(ex.price) || 0) > 0);
      if (!hasValidExit) newErrors.exits = "Add at least 1 exit point";
      
      let totalExitQty = exits.reduce((sum, ex) => sum + (parseFloat(ex.qty) || 0), 0);
      if (totalExitQty > (parseFloat(qty) || 0)) newErrors.exits = "Exit Qty exceeds Total";
      
      setErrors(newErrors);
      if (Object.keys(newErrors).length > 0) return;
    }
    setErrors({});
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        date,
        symbol,
        type,
        qty: parseFloat(qty) || 0,
        entry_price: parseFloat(entry) || 0,
        sl: parseFloat(sl) || null,
        setup: strategy,
        time_frame: timeFrame,
        market_trend: marketTrend,
        market_type: marketType,
        session,
        notes,
        video_link: videoLink,
        exits: exits.filter(e => e.qty && e.price).map(e => ({ qty: parseFloat(e.qty), price: parseFloat(e.price) })),
        biases: Object.entries(biases).map(([tf, b]) => ({ time_frame: tf, bias: b })).filter(b => b.bias),
        rules: selectedRules,
        mistakes: selectedMistakes,
        images: images,
      };

      const res = await fetch("http://localhost:8000/api/trades", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          // Hardcoded test user token for demo purposes
          "Authorization": "Bearer 1|6Jz5W4mBp114wk1fmxxjjg3bPNKHBrEsiHjnSEW2c20da63f"
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error("Failed to save trade");
      }

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setStep(1);
      }, 3000);
    } catch (e) {
      console.error(e);
      alert("Error saving trade to backend");
    }
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
                
                <div className={styles.field}>
                  <div className={styles.labelRow}>
                    <label className={styles.label}>Market Type</label>
                    <button type="button" className={styles.addShortcutBtn} onClick={() => goToManage('marketTypes')}>+ Add</button>
                  </div>
                  <select className={`${styles.input} ${errors.marketType ? styles.inputError : ""}`} value={marketType} onChange={(e) => { setMarketType(e.target.value); setErrors(prev => ({...prev, marketType: null})); }}>
                    {settings.marketTypes && settings.marketTypes.map((s, idx) => <option key={`${s}-${idx}`} value={s}>{s}</option>)}
                  </select>
                  {errors.marketType && <span className={styles.errorText}>{errors.marketType}</span>}
                </div>

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
                    <select className={`${styles.input} ${errors.symbol ? styles.inputError : ""}`} value={symbol} onChange={(e) => { setSymbol(e.target.value); setErrors(prev => ({...prev, symbol: null})); }}>
                      {settings.symbols.map((s, idx) => <option key={`${s}-${idx}`} value={s}>{s}</option>)}
                    </select>
                    {errors.symbol && <span className={styles.errorText}>{errors.symbol}</span>}
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Trade Type</label>
                  <div className={styles.typeGroup}>
                    <button type="button" className={`${styles.typeBtn} ${type === "LONG" ? styles.typeLong : ""}`} onClick={() => handleTypeChange("LONG")}>LONG</button>
                    <button type="button" className={`${styles.typeBtn} ${type === "SHORT" ? styles.typeShort : ""}`} onClick={() => handleTypeChange("SHORT")}>SHORT</button>
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Risk Amount (₹)</label>
                    <input type="number" className={styles.input} placeholder="e.g. 1000" value={riskAmount} onChange={(e) => handleRiskChange(e.target.value)} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Reward Ratio (1:X)</label>
                    <input type="text" className={styles.input} placeholder="e.g. 2 or 2,3" value={rewardRatio} onChange={(e) => handleRrChange(e.target.value)} />
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Total Quantity</label>
                    <input type="number" className={`${styles.input} ${errors.qty ? styles.inputError : ""}`} placeholder="e.g. 50" value={qty} onChange={(e) => { 
                      const newQty = e.target.value;
                      setQty(newQty); 
                      setErrors(prev => ({...prev, qty: null})); 
                      
                      let totalExitQty = exits.reduce((sum, ex) => sum + (parseFloat(ex.qty) || 0), 0);
                      if (totalExitQty > (parseFloat(newQty) || 0)) {
                          setErrors(prev => ({...prev, exits: `Total exit qty exceeds trade qty`}));
                      } else {
                          setErrors(prev => ({...prev, exits: null}));
                      }
                      calculateSmart("qty", newQty, exits);
                    }} />
                    {errors.qty && <span className={styles.errorText}>{errors.qty}</span>}
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Entry Price</label>
                    <input type="number" className={`${styles.input} ${errors.entry ? styles.inputError : ""}`} placeholder="0.00" value={entry} onChange={(e) => handleEntryChange(e.target.value)} />
                    {errors.entry && <span className={styles.errorText}>{errors.entry}</span>}
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>SL (Points) - Auto Fill</label>
                    <input type="number" className={styles.input} placeholder="e.g. 20" value={slPoints} onChange={(e) => handleSlPointsChange(e.target.value)} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Stop Loss Price</label>
                    <input type="number" className={`${styles.input} ${errors.sl ? styles.inputError : ""}`} placeholder="0.00" value={sl} onChange={(e) => handleSlChange(e.target.value)} />
                    {errors.sl && <span className={styles.errorText}>{errors.sl}</span>}
                  </div>
                </div>

                <div className={styles.exitsSection}>
                  <div className={styles.exitsHeader}>
                    <label className={styles.label}>Take Profit / Exits (Partial/Trailing)</label>
                  </div>
                  <div className={styles.field} style={{marginBottom: "16px"}}>
                    <label className={styles.label}>Target (Points) - Auto Fill</label>
                    <input type="number" className={styles.input} placeholder="e.g. 40" value={tpPoints} onChange={(e) => handleTpPointsChange(e.target.value)} />
                  </div>
                  <div className={styles.exitsList}>
                    {exits.map((ex, idx) => (
                      <div key={idx} className={styles.exitRow}>
                        <div className={styles.field}>
                          <input type="number" className={`${styles.input} ${errors.exits ? styles.inputError : ""}`} placeholder="Exit Qty" value={ex.qty} onChange={(e) => updateExit(idx, "qty", e.target.value)} />
                        </div>
                        <div className={styles.field}>
                          <input type="number" className={`${styles.input} ${errors.exits ? styles.inputError : ""}`} placeholder="Exit Price" value={ex.price} onChange={(e) => updateExit(idx, "price", e.target.value)} />
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
                  {errors.exits && <span className={styles.errorText} style={{marginTop: "8px"}}>{errors.exits}</span>}
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
                    {settings.setups.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className={styles.field}>
                  <div className={styles.labelRow}>
                    <label className={styles.label}>Time Frame</label>
                    <button type="button" className={styles.addShortcutBtn} onClick={() => goToManage('timeFrames')}>+ Add</button>
                  </div>
                  <select className={styles.input} value={timeFrame} onChange={(e) => setTimeFrame(e.target.value)}>
                    {settings.timeFrames.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                
                <div className={styles.field}>
                  <div className={styles.labelRow}>
                    <label className={styles.label}>Market Condition</label>
                    <button type="button" className={styles.addShortcutBtn} onClick={() => goToManage('marketTrends')}>+ Add</button>
                  </div>
                  <select className={styles.input} value={marketTrend} onChange={(e) => setMarketTrend(e.target.value)}>
                    {settings.marketTrends.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className={styles.field}>
                  <div className={styles.labelRow}>
                    <label className={styles.label}>Session</label>
                    <button type="button" className={styles.addShortcutBtn} onClick={() => goToManage('sessions')}>+ Add</button>
                  </div>
                  <select className={styles.input} value={session} onChange={(e) => setSession(e.target.value)}>
                    {settings.sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                
                <div className={styles.formGroupHeader}>
                  <label className={styles.formLabel}>Strategy Rules</label>
                  <button type="button" className={styles.addShortcutBtn} onClick={() => goToManage('rules')}>+ Add</button>
                </div>
                <div className={styles.rulesList}>
                  {settings.rules.map(rule => (
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
                  <div className={styles.labelRow} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className={styles.label}>Multi-Timeframe Bias (Optional)</label>
                    <button type="button" className={styles.addShortcutBtn} onClick={() => goToManage('timeFrames')}>+ Add</button>
                  </div>
                  <div className={styles.biasGrid}>
                    {settings.timeFrames.map(tf => (
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
                    {settings.mistakes.map(m => (
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
                <button type="button" className={styles.navBtnPrimary} onClick={handleNext}>
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
