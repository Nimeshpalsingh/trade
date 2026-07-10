"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import BottomNav from "../components/BottomNav";
import styles from "./manage.module.css";

// Initial mock data
const initialData = {
  setups: ["Breakout", "Pullback", "Reversal", "Fakeout"],
  sessions: [
    { id: "1", name: "Morning", startTime: "09:15", endTime: "11:30" },
    { id: "2", name: "Afternoon", startTime: "13:00", endTime: "15:30" },
    { id: "3", name: "Algo", startTime: "09:15", endTime: "15:30" }
  ],
  marketTypes: ["Options", "Futures", "Equity", "Forex"],
  timeFrames: ["1m", "3m", "5m", "15m", "1H", "1D"],
  symbols: ["NIFTY", "BANKNIFTY", "FINNIFTY", "RELIANCE", "HDFCBANK"],
  marketTrends: ["Up Trend", "Down Trend", "Sideways", "Not Sure"],
  breakeven: [
    { id: "1", symbol: "NIFTY", value: "₹60" },
    { id: "2", symbol: "RELIANCE", value: "0.03%" },
  ],
  mistakes: ["Overtrading", "FOMO", "Early Exit", "Wrong Trade", "No SL", "Revenge Trade", "Chasing", "Position Too Big"],
  riskLimits: [
    { id: "1", type: "Daily SL", value: "2000" },
    { id: "2", type: "Weekly SL", value: "10000" },
    { id: "3", type: "Monthly SL", value: "40000" },
  ],
  rules: ["Liquidity Taken", "BOS", "CHOCH", "HTF Trend", "Volume Confirmed", "RSI Confirmed", "News Checked", "Session Confirmed"],
};

const CATEGORIES = [
  { id: "setups", title: "Trading Setups", icon: "🎯", desc: "Manage your trading strategies" },
  { id: "sessions", title: "Trading Sessions", icon: "🕒", desc: "Morning, Afternoon, Algo etc." },
  { id: "marketTypes", title: "Market Types", icon: "📈", desc: "Options, Futures, Equity" },
  { id: "timeFrames", title: "Time Frames", icon: "⏱️", desc: "1m, 5m, 15m, 1D etc." },
  { id: "symbols", title: "Symbols / Shares", icon: "🏦", desc: "NIFTY, BANKNIFTY, RELIANCE" },
  { id: "marketTrends", title: "Market Trends", icon: "📊", desc: "Up, Down, Not Sure etc." },
  { id: "breakeven", title: "Breakeven & Charges", icon: "💰", desc: "Set brokerage and taxes per symbol" },
  { id: "rules", title: "Strategy Rules", icon: "✅", desc: "BOS, CHOCH, Liquidity etc." },
  { id: "mistakes", title: "Common Mistakes", icon: "⚠️", desc: "FOMO, Overtrading, No SL etc." },
  { id: "riskLimits", title: "Risk & SL Limits", icon: "🛡️", desc: "Set Daily, Weekly, Monthly SL limits" },
];

export default function ManagePage() {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [activeCategory, setActiveCategory] = useState(null);
  
  // formState: null | { mode: 'ADD' | 'EDIT', item: any, originalId?: string }
  const [formState, setFormState] = useState(null);
  
  const [toast, setToast] = useState({ show: false, message: "" });
  const showToast = (msg) => {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  };

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
          const apiData = await res.json();
          setData(prev => ({
            ...prev,
            setups: [...new Set(apiData.setups.map(s => s.name.trim()))],
            sessions: apiData.sessions.map(s => ({ id: s.id.toString(), name: s.name.trim(), startTime: s.start_time, endTime: s.end_time })),
            timeFrames: [...new Set(apiData.timeFrames.map(s => s.name.trim()))],
            symbols: [...new Set(apiData.symbols.map(s => s.name.trim()))],
            marketTrends: [...new Set(apiData.marketTrends.map(s => s.name.trim()))],
            marketTypes: apiData.marketTypes ? [...new Set(apiData.marketTypes.map(s => s.name.trim()))] : prev.marketTypes,
            mistakes: [...new Set(apiData.mistakes.map(s => s.name.trim()))],
            rules: [...new Set(apiData.rules.map(s => s.name.trim()))],
            breakeven: apiData.symbols.filter(s => s.breakeven_value).map(s => ({ id: s.id.toString(), symbol: s.name, value: s.breakeven_value })),
            riskLimits: apiData.riskLimits ? apiData.riskLimits.map(s => ({ id: s.id.toString(), type: s.type, value: s.value })) : prev.riskLimits
          }));
        }
      } catch (e) {
        console.error("Failed to fetch settings", e);
      }
    };
    fetchSettings();
  }, []);

  // Auto-open category if navigating from another page (e.g. Add Trade shortcuts)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const catToOpen = localStorage.getItem("openManageCat");
      if (catToOpen) {
        setActiveCategory(catToOpen);
        localStorage.removeItem("openManageCat");
      }
    }
  }, []);

  // Form input states (Simple string)
  const [inputValue, setInputValue] = useState("");
  
  // Form input states (Breakeven)
  const [bSymbol, setBSymbol] = useState("");
  const [bValue, setBValue] = useState("");

  // Form input states (Sessions)
  const [sName, setSName] = useState("");
  const [sStartTime, setSStartTime] = useState("");
  const [sEndTime, setSEndTime] = useState("");

  // Form input states (Risk Limits)
  const [rType, setRType] = useState("");
  const [rValue, setRValue] = useState("");

  const activeCatDetails = CATEGORIES.find(c => c.id === activeCategory);

  const closeCategory = () => {
    if (typeof window !== "undefined") {
      const returnTo = localStorage.getItem("returnTo");
      if (returnTo) {
        localStorage.removeItem("returnTo");
        router.push(returnTo);
        return;
      }
    }
    setActiveCategory(null);
    setFormState(null);
  };

  const openAddForm = () => {
    setInputValue("");
    setBSymbol(data.symbols.length > 0 ? data.symbols[0] : ""); // Default to first symbol
    setBValue("");
    setSName("");
    setSStartTime("09:15");
    setSEndTime("15:30");
    setRType("Daily SL");
    setRValue("");
    setFormState({ mode: "ADD" });
  };

  const openEditForm = (item) => {
    if (activeCategory === "breakeven") {
      setBSymbol(item.symbol);
      setBValue(item.value);
      setFormState({ mode: "EDIT", item, originalId: item.id });
    } else if (activeCategory === "sessions") {
      setSName(item.name);
      setSStartTime(item.startTime);
      setSEndTime(item.endTime);
      setFormState({ mode: "EDIT", item, originalId: item.id });
    } else if (activeCategory === "riskLimits") {
      setRType(item.type);
      setRValue(item.value);
      setFormState({ mode: "EDIT", item, originalId: item.id });
    } else {
      setInputValue(item);
      setFormState({ mode: "EDIT", item, originalId: item });
    }
  };

  const handleDelete = (category, itemToDelete) => {
    if (category === "breakeven" || category === "sessions" || category === "riskLimits") {
      setData((prev) => ({
        ...prev,
        [category]: prev[category].filter((item) => item.id !== itemToDelete),
      }));
    } else {
      setData((prev) => ({
        ...prev,
        [category]: prev[category].filter((item) => item !== itemToDelete),
      }));
    }
  };

  // State for Custom Confirmation Modal
  const [deletePrompt, setDeletePrompt] = useState({ 
    isOpen: false, 
    category: null, 
    itemToDelete: null, 
    step: 1 
  });

  const requestDelete = (category, itemToDelete) => {
    setDeletePrompt({ isOpen: true, category, itemToDelete, step: 1 });
  };

  const confirmDelete = async () => {
    const { category, itemToDelete, step } = deletePrompt;
    
    if (category === "symbols" && step === 1) {
      // Move to step 2 for double confirmation
      setDeletePrompt((prev) => ({ ...prev, step: 2 }));
      return;
    }

    const token = "1|6Jz5W4mBp114wk1fmxxjjg3bPNKHBrEsiHjnSEW2c20da63f";
    const headers = { "Content-Type": "application/json", "Authorization": `Bearer ${token}` };
    
    let endpoint = "";
    if (category === "setups") endpoint = "setups";
    else if (category === "timeFrames") endpoint = "time-frames";
    else if (category === "symbols") endpoint = "symbols";
    else if (category === "breakeven") endpoint = "breakeven";
    else if (category === "sessions") endpoint = "sessions";
    else if (category === "marketTrends") endpoint = "market-trends";
    else if (category === "marketTypes") endpoint = "market-types";
    else if (category === "mistakes") endpoint = "mistakes";
    else if (category === "rules") endpoint = "rules";
    else if (category === "riskLimits") endpoint = "risk-limits";

    if (endpoint) {
      const payload = (category === "breakeven" || category === "sessions" || category === "riskLimits") 
        ? { id: itemToDelete } 
        : { name: itemToDelete };
        
      await fetch(`http://localhost:8000/api/settings/${endpoint}`, { 
        method: "DELETE", headers, body: JSON.stringify(payload) 
      });
    }

    // Proceed with deletion
    handleDelete(category, itemToDelete);
    setDeletePrompt({ isOpen: false, category: null, itemToDelete: null, step: 1 });
    showToast("Item deleted successfully!");
  };

  const cancelDelete = () => {
    setDeletePrompt({ isOpen: false, category: null, itemToDelete: null, step: 1 });
  };

  const handleSave = async () => {
    const token = "1|6Jz5W4mBp114wk1fmxxjjg3bPNKHBrEsiHjnSEW2c20da63f";
    const headers = { "Content-Type": "application/json", "Authorization": `Bearer ${token}` };

    if (activeCategory === "breakeven") {
      if (!bSymbol || !bValue.trim()) return;
      
      const isDuplicate = data.breakeven.some(item => item.symbol === bSymbol && item.id !== formState.originalId);
      if (isDuplicate) {
        showToast(`Breakeven for ${bSymbol} already exists!`);
        return;
      }
      
      if (formState.mode === "ADD") {
        await fetch("http://localhost:8000/api/settings/symbols", { method: "POST", headers, body: JSON.stringify({ name: bSymbol, breakeven_value: bValue.trim() }) });
        setData((prev) => ({
          ...prev,
          breakeven: [...prev.breakeven, { id: Date.now().toString(), symbol: bSymbol, value: bValue.trim() }]
        }));
      } else {
        await fetch("http://localhost:8000/api/settings/breakeven", { method: "PUT", headers, body: JSON.stringify({ id: formState.originalId, symbol: bSymbol, value: bValue.trim() }) });
        setData((prev) => ({
          ...prev,
          breakeven: prev.breakeven.map(item => 
            item.id === formState.originalId ? { ...item, symbol: bSymbol, value: bValue.trim() } : item
          )
        }));
      }
    } else if (activeCategory === "sessions") {
      if (!sName.trim() || !sStartTime || !sEndTime) return;
      
      const isDuplicate = data.sessions.some(item => item.name.toLowerCase() === sName.trim().toLowerCase() && item.id !== formState.originalId);
      if (isDuplicate) {
        showToast(`Session ${sName.trim()} already exists!`);
        return;
      }
      
      if (formState.mode === "ADD") {
        const res = await fetch("http://localhost:8000/api/settings/sessions", { method: "POST", headers, body: JSON.stringify({ name: sName.trim(), start_time: sStartTime, end_time: sEndTime }) });
        const resData = await res.json();
        setData((prev) => ({
          ...prev,
          sessions: [...prev.sessions, { id: resData.id ? resData.id.toString() : Date.now().toString(), name: sName.trim(), startTime: sStartTime, endTime: sEndTime }]
        }));
      } else {
        await fetch("http://localhost:8000/api/settings/sessions", { method: "PUT", headers, body: JSON.stringify({ id: formState.originalId, name: sName.trim(), start_time: sStartTime, end_time: sEndTime }) });
        setData((prev) => ({
          ...prev,
          sessions: prev.sessions.map(item => 
            item.id === formState.originalId ? { ...item, name: sName.trim(), startTime: sStartTime, endTime: sEndTime } : item
          )
        }));
      }
    } else if (activeCategory === "riskLimits") {
      if (!rType.trim() || !rValue.trim()) return;
      
      const isDuplicate = data.riskLimits.some(item => item.type.toLowerCase() === rType.trim().toLowerCase() && item.id !== formState.originalId);
      if (isDuplicate) {
        showToast(`Risk limit ${rType.trim()} already exists!`);
        return;
      }
      
      if (formState.mode === "ADD") {
        const res = await fetch("http://localhost:8000/api/settings/risk-limits", { method: "POST", headers, body: JSON.stringify({ type: rType.trim(), value: rValue.toString().trim() }) });
        const resData = await res.json();
        setData((prev) => ({
          ...prev,
          riskLimits: [...prev.riskLimits, { id: resData.id ? resData.id.toString() : Date.now().toString(), type: rType.trim(), value: rValue.toString().trim() }]
        }));
      } else {
        await fetch("http://localhost:8000/api/settings/risk-limits", { method: "PUT", headers, body: JSON.stringify({ id: formState.originalId, type: rType.trim(), value: rValue.toString().trim() }) });
        setData((prev) => ({
          ...prev,
          riskLimits: prev.riskLimits.map(item => 
            item.id === formState.originalId ? { ...item, type: rType.trim(), value: rValue.toString().trim() } : item
          )
        }));
      }
    } else {
      if (!inputValue.trim()) return;
      
      const normalizedInput = inputValue.trim().toLowerCase();
      const isDuplicate = data[activeCategory].some(item => item.toLowerCase() === normalizedInput && item.toLowerCase() !== formState.originalId?.toLowerCase());
      if (isDuplicate) {
        showToast(`"${inputValue.trim()}" already exists!`);
        return;
      }
      
      if (formState.mode === "ADD") {
        let endpoint = "";
        if (activeCategory === "setups") endpoint = "setups";
        else if (activeCategory === "timeFrames") endpoint = "time-frames";
        else if (activeCategory === "symbols") endpoint = "symbols";
        else if (activeCategory === "marketTrends") endpoint = "market-trends";
        else if (activeCategory === "marketTypes") endpoint = "market-types";
        else if (activeCategory === "mistakes") endpoint = "mistakes";
        else if (activeCategory === "rules") endpoint = "rules";

        if (endpoint) {
          await fetch(`http://localhost:8000/api/settings/${endpoint}`, { method: "POST", headers, body: JSON.stringify({ name: inputValue.trim() }) });
        }

        setData((prev) => ({
          ...prev,
          [activeCategory]: [...prev[activeCategory], inputValue.trim()]
        }));
      } else {
        let endpoint = "";
        if (activeCategory === "setups") endpoint = "setups";
        else if (activeCategory === "timeFrames") endpoint = "time-frames";
        else if (activeCategory === "symbols") endpoint = "symbols";
        else if (activeCategory === "marketTrends") endpoint = "market-trends";
        else if (activeCategory === "marketTypes") endpoint = "market-types";
        else if (activeCategory === "mistakes") endpoint = "mistakes";
        else if (activeCategory === "rules") endpoint = "rules";

        if (endpoint) {
          await fetch(`http://localhost:8000/api/settings/${endpoint}`, { method: "PUT", headers, body: JSON.stringify({ old_name: formState.originalId, new_name: inputValue.trim() }) });
        }

        setData((prev) => ({
          ...prev,
          [activeCategory]: prev[activeCategory].map(item => 
            item === formState.originalId ? inputValue.trim() : item
          )
        }));
      }
    }
    setFormState(null);
    showToast(`${activeCatDetails?.title || 'Item'} saved successfully!`);
  };

  // If a category is selected, render the dedicated Sub-Screen
  if (activeCategory) {
    return (
      <div className="page-wrapper">
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button className={styles.headerBackBtn} onClick={formState ? () => setFormState(null) : closeCategory}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
            <div>
              <h1 className={styles.title}>
                {formState 
                  ? (formState.mode === "ADD" ? `New ${activeCatDetails?.title}` : `Edit ${activeCatDetails?.title}`) 
                  : activeCatDetails?.title}
              </h1>
              <p className={styles.subtitle}>
                {formState ? "Fill out the details below" : `Manage your ${activeCatDetails?.title.toLowerCase()}`}
              </p>
            </div>
          </div>
        </header>

        <main className={styles.subScreenMain}>
          {/* === FORM VIEW === */}
          {formState ? (
            <div className={styles.formContainer}>
              {activeCategory === "breakeven" ? (
                <>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Select Symbol / Share</label>
                    <select 
                      className={styles.formInput} 
                      value={bSymbol}
                      onChange={(e) => setBSymbol(e.target.value)}
                    >
                      {data.symbols.length === 0 && <option value="">No symbols available</option>}
                      {data.symbols.map(sym => (
                        <option key={sym} value={sym}>{sym}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Breakeven Value</label>
                    <input 
                      type="text" 
                      className={styles.formInput} 
                      placeholder="e.g. ₹60 or 0.03%"
                      value={bValue}
                      onChange={(e) => setBValue(e.target.value)}
                    />
                  </div>
                </>
              ) : activeCategory === "sessions" ? (
                <>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Session Name</label>
                    <input 
                      type="text" 
                      className={styles.formInput} 
                      placeholder="e.g. Morning Session"
                      value={sName}
                      onChange={(e) => setSName(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <div className={styles.formGroup} style={{ flex: 1 }}>
                      <label className={styles.formLabel}>Start Time</label>
                      <input 
                        type="time" 
                        className={styles.formInput} 
                        value={sStartTime || ""}
                        onChange={(e) => setSStartTime(e.target.value)}
                      />
                    </div>
                    <div className={styles.formGroup} style={{ flex: 1 }}>
                      <label className={styles.formLabel}>End Time</label>
                      <input 
                        type="time" 
                        className={styles.formInput} 
                        value={sEndTime || ""}
                        onChange={(e) => setSEndTime(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              ) : activeCategory === "riskLimits" ? (
                <>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Limit Type</label>
                    <input 
                      type="text" 
                      className={styles.formInput} 
                      value={rType}
                      onChange={(e) => setRType(e.target.value)}
                      placeholder="e.g. Daily SL"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Amount (₹)</label>
                    <input 
                      type="number" 
                      className={styles.formInput} 
                      placeholder="e.g. 2000"
                      value={rValue}
                      onChange={(e) => setRValue(e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>{activeCatDetails?.title} Name</label>
                  <input 
                    type="text" 
                    className={styles.formInput} 
                    placeholder={`Enter ${activeCatDetails?.title.toLowerCase()}`}
                    value={inputValue}
                    onChange={(e) => {
                      let val = e.target.value;
                      // Enforce rules for Symbols: All Caps, No Spaces
                      if (activeCategory === "symbols") {
                        val = val.replace(/\s/g, '').toUpperCase();
                      }
                      setInputValue(val);
                    }}
                    autoFocus
                  />
                </div>
              )}

              <div className={styles.formActions}>
                <button className={styles.formCancelBtn} onClick={() => setFormState(null)}>Cancel</button>
                <button 
                  className={styles.formSaveBtn} 
                  onClick={handleSave}
                  disabled={
                    activeCategory === "breakeven" ? (!bSymbol || !bValue.trim()) : 
                    activeCategory === "sessions" ? (!sName.trim() || !sStartTime || !sEndTime) : 
                    activeCategory === "riskLimits" ? (!rType.trim() || !rValue.toString().trim()) : 
                    !inputValue.trim()
                  }
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            /* === LIST VIEW === */
            <div className={styles.fullScreenList}>
              {activeCategory !== "breakeven" && activeCategory !== "sessions" && activeCategory !== "riskLimits" && (
                <>
                  {data[activeCategory].map((item) => (
                    <div key={item} className={styles.simpleListItem} onClick={() => openEditForm(item)}>
                      <span className={styles.itemText}>{item}</span>
                      <button className={styles.deleteIconBtn} onClick={(e) => { e.stopPropagation(); requestDelete(activeCategory, item); }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--loss-red)" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  
                  <button className={styles.addBtn} onClick={openAddForm}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add {activeCatDetails?.title}
                  </button>
                </>
              )}

              {activeCategory === "sessions" && (
                <>
                  {data.sessions.map((item) => (
                    <div key={item.id} className={styles.simpleListItem} onClick={() => openEditForm(item)}>
                      <div className={styles.breakevenInfo}>
                        <span className={styles.bLabel}>{item.name}</span>
                        <span className={styles.bValue} style={{ fontSize: "14px", color: "var(--text-secondary)", fontWeight: "500" }}>
                          {item.startTime} - {item.endTime}
                        </span>
                      </div>
                      <button className={styles.deleteIconBtn} onClick={(e) => { e.stopPropagation(); requestDelete("sessions", item.id); }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--loss-red)" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <button className={styles.addBtn} onClick={openAddForm}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add Trading Session
                  </button>
                </>
              )}

              {activeCategory === "breakeven" && (
                <>
                  {data.breakeven.map((item) => (
                    <div key={item.id} className={styles.simpleListItem} onClick={() => openEditForm(item)}>
                      <div className={styles.breakevenInfo}>
                        <span className={styles.bLabel}>{item.symbol}</span>
                        <span className={styles.bValue}>{item.value}</span>
                      </div>
                      <button className={styles.deleteIconBtn} onClick={(e) => { e.stopPropagation(); requestDelete("breakeven", item.id); }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--loss-red)" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <button className={styles.addBtn} onClick={openAddForm}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add Charges Rule
                  </button>
                </>
              )}

              {activeCategory === "riskLimits" && (
                <>
                  {data.riskLimits.map((item) => (
                    <div key={item.id} className={styles.simpleListItem} onClick={() => openEditForm(item)}>
                      <div className={styles.breakevenInfo}>
                        <span className={styles.bLabel}>{item.type}</span>
                        <span className={styles.bValue} style={{ color: "var(--loss-red)" }}>₹ {item.value}</span>
                      </div>
                      <button className={styles.deleteIconBtn} onClick={(e) => { e.stopPropagation(); requestDelete("riskLimits", item.id); }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--loss-red)" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <button className={styles.addBtn} onClick={openAddForm}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add Risk Limit
                  </button>
                </>
              )}
            </div>
          )}
        </main>
        
        {/* === CUSTOM DELETE CONFIRMATION MODAL === */}
        <div className={`${styles.confirmOverlay} ${deletePrompt.isOpen ? styles.open : ""}`}>
          <div className={`${styles.confirmModal} ${deletePrompt.isOpen ? styles.open : ""}`}>
            <div className={styles.confirmIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            
            <h3 className={styles.confirmTitle}>
              {deletePrompt.step === 1 ? "Delete Item" : "Are you REALLY sure?"}
            </h3>
            
            <p className={styles.confirmText}>
              {deletePrompt.step === 1 
                ? "This action cannot be undone. Do you wish to proceed?" 
                : "Deleting this symbol might break filters for your past trades. Proceed with caution."}
            </p>
            
            <div className={styles.confirmActions}>
              <button className={styles.confirmCancelBtn} onClick={cancelDelete}>Cancel</button>
              <button className={styles.confirmDeleteBtn} onClick={confirmDelete}>
                {deletePrompt.step === 1 ? "Yes, Delete" : "I'm Sure, Delete"}
              </button>
            </div>
          </div>
        </div>
        
        {/* Toast Notification */}
        {toast.show && (
          <div className={styles.toast}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            {toast.message}
          </div>
        )}
      </div>
    );
  }

  // MASTER MENU SCREEN
  return (
    <div className="page-wrapper">
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.iconBox}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <div>
            <h1 className={styles.title}>Settings</h1>
            <p className={styles.subtitle}>Manage your trading preferences</p>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={styles.main}>
        <div className={`${styles.menuList} glass-card`}>
          {CATEGORIES.map((cat, index) => (
            <div 
              key={cat.id} 
              className={styles.menuItem} 
              style={{ animationDelay: `${0.1 * index}s` }}
              onClick={() => setActiveCategory(cat.id)}
            >
              <div className={styles.menuIcon}>{cat.icon}</div>
              <div className={styles.menuText}>
                <h4>{cat.title}</h4>
                <p>{cat.desc}</p>
              </div>
              <div className={styles.menuArrow}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>
          ))}
        </div>

        {/* Logout Button */}
        <div style={{ marginTop: "24px", padding: "0 16px" }}>
          <button 
            onClick={() => signOut({ callbackUrl: '/login' })}
            style={{
              width: "100%",
              padding: "16px",
              background: "rgba(255, 82, 82, 0.1)",
              border: "1px solid rgba(255, 82, 82, 0.3)",
              borderRadius: "16px",
              color: "#ff5252",
              fontSize: "15px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              cursor: "pointer",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Log Out
          </button>
        </div>
      </main>

      {/* Toast Notification */}
      {toast.show && (
        <div className={styles.toast}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          {toast.message}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
