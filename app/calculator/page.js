"use client";

import { useState, useEffect, useMemo } from "react";
import BottomNav from "../components/BottomNav";
import styles from "./calculator.module.css";

export default function CryptoCalculator() {
  const [tradeType, setTradeType] = useState("Buy");
  const [market, setMarket] = useState("Crypto");
  const [entryPrice, setEntryPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [slPoints, setSlPoints] = useState("");
  const [riskInr, setRiskInr] = useState("");
  const [usdInr, setUsdInr] = useState("86");
  const [rewardRatio, setRewardRatio] = useState("3");
  const [tradingFee, setTradingFee] = useState("");

  const handleEntryChange = (val) => {
    setEntryPrice(val);
    const en = parseFloat(val);
    if (!isNaN(en)) {
      const pts = parseFloat(slPoints);
      if (!isNaN(pts)) {
        if (tradeType === "Buy") setStopLoss((en - pts).toFixed(2));
        else setStopLoss((en + pts).toFixed(2));
      } else {
        const slVal = parseFloat(stopLoss);
        if (!isNaN(slVal)) setSlPoints(Math.abs(en - slVal).toFixed(2));
      }
    }
  };

  const handleSlChange = (val) => {
    setStopLoss(val);
    const slVal = parseFloat(val);
    const en = parseFloat(entryPrice);
    if (!isNaN(slVal) && !isNaN(en)) {
      setSlPoints(Math.abs(en - slVal).toFixed(4));
    } else if (val === "") {
      setSlPoints("");
    }
  };

  const handleSlPointsChange = (val) => {
    setSlPoints(val);
    const pts = parseFloat(val);
    const en = parseFloat(entryPrice);
    if (!isNaN(pts) && !isNaN(en)) {
      if (tradeType === "Buy") {
        setStopLoss((en - pts).toFixed(4));
      } else {
        setStopLoss((en + pts).toFixed(4));
      }
    } else if (val === "") {
      setStopLoss("");
    }
  };

  const handleTradeTypeChange = (type) => {
    setTradeType(type);
    const en = parseFloat(entryPrice);
    const pts = parseFloat(slPoints);
    if (!isNaN(en) && !isNaN(pts)) {
      if (type === "Buy") setStopLoss((en - pts).toFixed(4));
      else setStopLoss((en + pts).toFixed(4));
    }
  };
  
  const [copied, setCopied] = useState(false);

  // Results
  const results = useMemo(() => {
    const entry = parseFloat(entryPrice);
    const sl = parseFloat(stopLoss);
    const risk = parseFloat(riskInr);
    const rate = market === "Crypto" ? parseFloat(usdInr) : 1;
    const rr = parseFloat(rewardRatio);
    const fee = parseFloat(tradingFee) || 0;

    if (
      isNaN(entry) || isNaN(sl) || isNaN(risk) || isNaN(rate) || isNaN(rr) ||
      entry <= 0 || sl <= 0 || risk <= 0 || rate <= 0 || rr <= 0
    ) {
      return null;
    }

    if (entry === sl) {
      return { error: "Entry price cannot equal Stop Loss price." };
    }

    if ((tradeType === "Buy" && sl >= entry) || (tradeType === "Sell" && sl <= entry)) {
       return { error: `Invalid Stop Loss for a ${tradeType} trade.` };
    }

    const slDistance = Math.abs(entry - sl);
    const riskBase = risk / rate;
    
    let quantity = riskBase / slDistance;
    if (market === "Indian") {
       quantity = Math.floor(quantity); // Whole quantity for stocks
    }
    
    const tpDistance = slDistance * rr;
    const takeProfit = tradeType === "Buy" ? entry + tpDistance : entry - tpDistance;
    
    const profitBase = riskBase * rr;
    const profitInr = profitBase * rate;

    // Optional fee calculation (simple approximation on entry position)
    const positionSizeBase = quantity * entry;
    const estimatedFeeBase = positionSizeBase * (fee / 100);
    const totalRiskBase = riskBase + estimatedFeeBase;

    return {
      slDistance: slDistance.toFixed(4),
      riskBase: riskBase.toFixed(market === "Crypto" ? 3 : 2),
      quantity: market === "Crypto" ? quantity.toFixed(3) : quantity.toString(),
      takeProfit: takeProfit.toFixed(2),
      expectedLossInr: risk.toFixed(2),
      expectedProfitInr: profitInr.toFixed(2),
      totalRiskBase: totalRiskBase.toFixed(market === "Crypto" ? 3 : 2),
    };
  }, [tradeType, entryPrice, stopLoss, riskInr, usdInr, rewardRatio, tradingFee, market]);

  const handleCopy = () => {
    if (!results || results.error) return;
    const text = `
Trade: ${tradeType}
Entry: ${entryPrice}
SL: ${stopLoss}
TP: ${results.takeProfit}
Quantity: ${results.quantity}
Risk: ₹${riskInr} ($${results.riskUsdt})
    `.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setEntryPrice("");
    setStopLoss("");
    setSlPoints("");
    setRiskInr("");
    setTradingFee("");
    // Keep defaults for USDINR and RR
  };

  return (
    <div className="page-wrapper">
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
              <rect x="9" y="9" width="6" height="6" />
              <line x1="9" y1="1" x2="9" y2="4" />
              <line x1="15" y1="1" x2="15" y2="4" />
              <line x1="9" y1="20" x2="9" y2="23" />
              <line x1="15" y1="20" x2="15" y2="23" />
              <line x1="20" y1="9" x2="23" y2="9" />
              <line x1="20" y1="14" x2="23" y2="14" />
              <line x1="1" y1="9" x2="4" y2="9" />
              <line x1="1" y1="14" x2="4" y2="14" />
            </svg>
            Position Size Calculator
          </h1>
          <p className={styles.subtitle}>Calculate risk-adjusted quantity for any market</p>
        </div>

        <div className={styles.grid}>
          {/* Inputs Section */}
          <div className={styles.card}>
            <div className={styles.tradeTypeToggle} style={{ marginBottom: '15px' }}>
              <button 
                className={`${styles.toggleBtn} ${market === "Crypto" ? styles.activeBuy : ""}`}
                onClick={() => setMarket("Crypto")}
                style={{ borderRadius: '8px' }}
              >
                Crypto (USD)
              </button>
              <button 
                className={`${styles.toggleBtn} ${market === "Indian" ? styles.activeSell : ""}`}
                onClick={() => setMarket("Indian")}
                style={{ borderRadius: '8px' }}
              >
                Indian Market (₹)
              </button>
            </div>
            
            <div className={styles.tradeTypeToggle}>
              <button 
                className={`${styles.toggleBtn} ${tradeType === "Buy" ? styles.activeBuy : ""}`}
                onClick={() => handleTradeTypeChange("Buy")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
                Long (Buy)
              </button>
              <button 
                className={`${styles.toggleBtn} ${tradeType === "Sell" ? styles.activeSell : ""}`}
                onClick={() => handleTradeTypeChange("Sell")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                  <polyline points="17 18 23 18 23 12" />
                </svg>
                Short (Sell)
              </button>
            </div>

            <div className={styles.grid} style={{ gap: "20px" }}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Entry Price</label>
                  <div className={styles.inputWrapper}>
                    <input 
                      type="number" 
                      className={styles.input} 
                      value={entryPrice}
                      onChange={(e) => handleEntryChange(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>SL Distance (Points)</label>
                  <div className={styles.inputWrapper}>
                    <input 
                      type="number" 
                      className={styles.input} 
                      value={slPoints}
                      onChange={(e) => handleSlPointsChange(e.target.value)}
                      placeholder="e.g. 1.91"
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Stop Loss Price</label>
                  <div className={styles.inputWrapper}>
                    <input 
                      type="number" 
                      className={styles.input} 
                      value={stopLoss}
                      onChange={(e) => handleSlChange(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Risk Amount (₹)</label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputPrefix}>₹</span>
                  <input 
                    type="number" 
                    className={`${styles.input} ${styles.hasPrefix}`} 
                    value={riskInr}
                    onChange={(e) => setRiskInr(e.target.value)}
                    placeholder="e.g. 1000"
                  />
                </div>
              </div>

              {market === "Crypto" && (
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>USD/INR Rate</label>
                  <div className={styles.inputWrapper}>
                    <span className={styles.inputPrefix}>₹</span>
                    <input 
                      type="number" 
                      className={`${styles.input} ${styles.hasPrefix}`} 
                      value={usdInr}
                      onChange={(e) => setUsdInr(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Reward Ratio (1:X)</label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputPrefix}>1:</span>
                  <input 
                    type="number" 
                    className={`${styles.input} ${styles.hasPrefix}`} 
                    value={rewardRatio}
                    onChange={(e) => setRewardRatio(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Trading Fee (Optional)</label>
                <div className={styles.inputWrapper}>
                  <input 
                    type="number" 
                    className={`${styles.input} ${styles.hasSuffix}`} 
                    value={tradingFee}
                    onChange={(e) => setTradingFee(e.target.value)}
                    placeholder="0.05"
                  />
                  <span className={styles.inputSuffix}>%</span>
                </div>
              </div>
            </div>
            
            <div className={styles.actions}>
              <button className={styles.resetBtn} onClick={handleReset}>Clear All</button>
            </div>
          </div>

          {/* Results Section */}
          <div className={styles.resultsCard}>
            <div className={styles.resultsHeader}>
              <h2 className={styles.resultsTitle}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                Calculation Result
              </h2>
              {results && !results.error && (
                <button className={styles.copyBtn} onClick={handleCopy}>
                  {copied ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              )}
            </div>

            {results?.error ? (
              <div className={styles.errorBox}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {results.error}
              </div>
            ) : !results ? (
              <div className={styles.resultItem} style={{ alignItems: 'center', padding: '40px 0', opacity: 0.5 }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}>
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <p>Enter trade details to see quantity</p>
              </div>
            ) : (
              <div className={styles.resultsGrid}>
                <div className={`${styles.resultItem} ${styles.fullWidth}`}>
                  <span className={styles.resultLabel}>Recommended Quantity</span>
                  <span className={styles.resultValue}>{results.quantity}</span>
                </div>

                <div className={styles.resultItem}>
                  <span className={styles.resultLabel}>Take Profit Price</span>
                  <span className={`${styles.resultValue} ${styles.textProfit}`}>{market === "Crypto" ? "$" : "₹"}{results.takeProfit}</span>
                </div>

                {market === "Crypto" && (
                  <div className={styles.resultItem}>
                    <span className={styles.resultLabel}>Risk (USDT)</span>
                    <span className={styles.resultValue}>${results.riskBase}</span>
                  </div>
                )}

                <div className={styles.resultItem}>
                  <span className={styles.resultLabel}>Expected Profit</span>
                  <span className={`${styles.resultValue} ${styles.textProfit}`}>₹{results.expectedProfitInr}</span>
                </div>

                <div className={styles.resultItem}>
                  <span className={styles.resultLabel}>Expected Loss</span>
                  <span className={`${styles.resultValue} ${styles.textLoss}`}>₹{results.expectedLossInr}</span>
                </div>
                
                <div className={styles.resultItem}>
                  <span className={styles.resultLabel}>SL Distance</span>
                  <span className={styles.resultValue}>{results.slDistance}</span>
                </div>
                
                <div className={styles.resultItem}>
                  <span className={styles.resultLabel}>Risk Reward</span>
                  <span className={styles.resultValue}>1:{rewardRatio}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
