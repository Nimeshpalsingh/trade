"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "../components/BottomNav";
import s from "./backtest.module.css";
import { fetchBacktests, saveBacktest, deleteBacktest } from "../utils/tradeUtils";

export default function BacktestDashboard() {
  const router = useRouter();
  const [backtests, setBacktests] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newBt, setNewBt] = useState({ name: "", setup: "", rules: "", columns: "Entry,Top Gain,W/L,RR" });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const migrateLocalToDB = async () => {
      const saved = localStorage.getItem("tradejournal_backtests");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          setIsLoading(true);
          try {
            for (const bt of parsed) {
              // Create it on the backend
              await saveBacktest({
                name: bt.name,
                setup: bt.setup,
                rules: bt.rules || [],
                columns: bt.columns || [],
                columnConfig: bt.columnConfig || {},
                data: bt.data || []
              });
            }
            // Clear local storage after successful migration
            localStorage.removeItem("tradejournal_backtests");
            alert("Success! Tumhare purane backtests ko naye Database system me migrate kar diya gaya hai.");
          } catch (e) {
            console.error("Migration failed", e);
          }
        }
      }
      loadBacktests();
    };

    migrateLocalToDB();
  }, []);

  const loadBacktests = async () => {
    setIsLoading(true);
    const data = await fetchBacktests();
    setBacktests(data);
    setIsLoading(false);
  };

  const handleCreate = async () => {
    if (!newBt.name) return alert("Name is required");
    
    const newEntry = {
      name: newBt.name,
      setup: newBt.setup,
      rules: newBt.rules.split(',').map(r => r.trim()).filter(Boolean),
      columns: newBt.columns.split(',').map(c => c.trim()).filter(Boolean),
      data: [], // rows
    };
    
    try {
      const saved = await saveBacktest(newEntry);
      setBacktests([saved, ...backtests]);
      setShowCreate(false);
      setNewBt({ name: "", setup: "", rules: "", columns: "Entry Time,Top Gain,W/L,Pullback %,RR" });
      router.push(`/backtest/${saved.id}`);
    } catch (e) {
      alert("Error creating backtest");
    }
  };

  const deleteBt = async (id) => {
    if (confirm("Are you sure you want to delete this backtest?")) {
      try {
        await deleteBacktest(id);
        setBacktests(backtests.filter(b => b.id !== id));
      } catch (e) {
        alert("Failed to delete backtest. Make sure you are the owner.");
      }
    }
  };

  return (
    <div className="page-wrapper">
      <header className={s.header}>
        <div className={s.headerTitle}>Backtest Lab</div>
      </header>

      <main className={s.main}>
        {showCreate ? (
          <div className={s.createBox}>
            <h3 className={s.boxTitle}>Create New Backtest</h3>
            
            <div className={s.inputGroup}>
              <label>Backtest Name</label>
              <input type="text" placeholder="e.g. Nifty Pullback" value={newBt.name} onChange={e => setNewBt({...newBt, name: e.target.value})} />
            </div>

            <div className={s.inputGroup}>
              <label>Setup / Strategy</label>
              <input type="text" placeholder="e.g. 5 EMA" value={newBt.setup} onChange={e => setNewBt({...newBt, setup: e.target.value})} />
            </div>

            <div className={s.inputGroup}>
              <label>Rules (comma separated)</label>
              <input type="text" placeholder="e.g. Trend should be up, Wait for candle close" value={newBt.rules} onChange={e => setNewBt({...newBt, rules: e.target.value})} />
            </div>

            <div className={s.inputGroup}>
              <label>Table Columns (comma separated)</label>
              <input type="text" placeholder="e.g. Entry, Top Gain, W/L, RR" value={newBt.columns} onChange={e => setNewBt({...newBt, columns: e.target.value})} />
              <small style={{color:'var(--text-muted)', fontSize:'11px', marginTop:'4px', display:'block'}}>These columns will form your excel-like table.</small>
            </div>

            <div className={s.actions}>
              <button className={s.cancelBtn} onClick={() => setShowCreate(false)}>Cancel</button>
              <button className={s.saveBtn} onClick={handleCreate}>Create Backtest</button>
            </div>
          </div>
        ) : (
          <>
            <div className={s.topBar}>
              <p style={{color:'var(--text-muted)', fontSize:'14px'}}>Test your strategies with custom tables and rules.</p>
              <button className={s.newBtn} onClick={() => setShowCreate(true)}>+ New Backtest</button>
            </div>

            {backtests.length === 0 ? (
              <div className={s.emptyState}>
                <div style={{fontSize:'32px', marginBottom:'10px'}}>📊</div>
                <div>No backtests found.</div>
                <div style={{fontSize:'12px', color:'var(--text-muted)', marginTop:'5px'}}>Create one to start logging your strategy tests.</div>
              </div>
            ) : (
              <div className={s.grid}>
                {backtests.map(bt => (
                  <div key={bt.id} className={s.card} style={bt.is_shared ? { border: '1px solid var(--accent-blue)' } : {}}>
                    <div className={s.cardHeader}>
                      <h4 onClick={() => router.push(`/backtest/${bt.id}`)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {bt.name}
                        {bt.is_shared && (
                           <span style={{ fontSize: '10px', background: 'var(--accent-blue)', padding: '2px 6px', borderRadius: '4px', color: '#fff' }}>
                             Shared ({bt.role})
                           </span>
                        )}
                      </h4>
                      {!bt.is_shared && (
                        <button className={s.deleteIcon} onClick={() => deleteBt(bt.id)}>✕</button>
                      )}
                    </div>
                    <div className={s.cardBody} onClick={() => router.push(`/backtest/${bt.id}`)}>
                      <div className={s.cardRow}><span>Setup:</span> {bt.setup || 'None'}</div>
                      <div className={s.cardRow}><span>Rules:</span> {bt.rules.length} defined</div>
                      <div className={s.cardRow}><span>Entries:</span> {bt.data?.length || 0} logs</div>
                    </div>
                    <button className={s.openBtn} onClick={() => router.push(`/backtest/${bt.id}`)}>Open Table →</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
