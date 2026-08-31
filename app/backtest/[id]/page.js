"use client";
import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "../../components/BottomNav";
import s from "../backtest.module.css";
import { fetchSettings, getBacktest, updateBacktest, shareBacktest, removeShareBacktest } from "../../utils/tradeUtils";

export default function BacktestDetail({ params }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  
  const router = useRouter();
  const [bt, setBt] = useState(null);
  const [data, setData] = useState([]);
  const [symbols, setSymbols] = useState([]);
  const [activeSplitFilters, setActiveSplitFilters] = useState([]);
  const [pendingFilters, setPendingFilters] = useState([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Sharing state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareRole, setShareRole] = useState("viewer");

  // Story Mode State
  const [isStoryMode, setIsStoryMode] = useState(false);
  const [smCurrent, setSmCurrent] = useState(0);
  const [smAnswers, setSmAnswers] = useState({});
  const [smHistory, setSmHistory] = useState([]);
  const [smInput, setSmInput] = useState("");
  const [smSelectedRules, setSmSelectedRules] = useState([]);

  // Add Column Modal State
  const [showAddColModal, setShowAddColModal] = useState(false);
  const [editTargetCol, setEditTargetCol] = useState(null);
  const [newColName, setNewColName] = useState("");
  const [newColQues, setNewColQues] = useState("");
  const [newColType, setNewColType] = useState("text");
  const [newColOptions, setNewColOptions] = useState("");

  const [toastMsg, setToastMsg] = useState("");
  const hoveredCellRef = useRef(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2000);
  };

  const processImageFile = (file, callback) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) { height = Math.round((height * MAX_WIDTH) / width); width = MAX_WIDTH; }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height);
        callback(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };
  useEffect(() => {
    // Fetch global symbols for auto-suggest
    fetchSettings()
      .then(d => {
        if (d && d.symbols) {
          setSymbols(d.symbols.map(sym => sym.name.trim()));
        }
      })
      .catch(err => console.error("Failed to fetch symbols", err));

    // Fetch backtest from API
    getBacktest(id)
      .then(d => {
        setBt(d);
        setData(d.data || []);
      })
      .catch(err => {
        console.error(err);
        alert("Failed to load backtest or unauthorized.");
        router.push('/backtest');
      });
  }, [id, router]);

  const saveTable = async (newData) => {
    setData(newData);
    if (!bt) return;
    try {
      await updateBacktest(id, { data: newData });
      showToast("Data Saved Successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to save data. You might be a viewer only.");
    }
  };

  const saveBtConfig = async (newBtConfig) => {
    setBt(newBtConfig);
    try {
      await updateBacktest(id, {
         columns: newBtConfig.columns,
         columnConfig: newBtConfig.columnConfig,
         rules: newBtConfig.rules
      });
      showToast("Config Saved Successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to save config. You might be a viewer only.");
    }
  };

  const handleShare = async () => {
    if (!shareEmail) return;
    try {
      const res = await shareBacktest(id, shareEmail, shareRole);
      setBt({ ...bt, sharedWithUsers: res.shared_with });
      setShareEmail("");
      alert("Shared successfully!");
    } catch (e) {
      alert(e.message || "Failed to share.");
    }
  };

  const handleRemoveShare = async (userId) => {
    if (!confirm("Remove access for this user?")) return;
    try {
      const res = await removeShareBacktest(id, userId);
      setBt({ ...bt, sharedWithUsers: res.shared_with });
    } catch (e) {
      alert(e.message || "Failed to remove share.");
    }
  };

  const openAddColumn = () => {
    setEditTargetCol(null);
    setNewColName("");
    setNewColQues("");
    setNewColType("text");
    setNewColOptions("");
    setShowAddColModal(true);
  };

  const openEditColumn = (col) => {
    const conf = bt?.columnConfig?.[col] || {};
    setEditTargetCol(col);
    setNewColName(col);
    setNewColQues(getQuestionForCol(col));
    setNewColType(conf.type || getInputTypeForCol(col));
    setNewColOptions(conf.options ? conf.options.join(", ") : "");
    setShowAddColModal(true);
  };

  const confirmSaveColumn = () => {
    if (!newColName.trim()) return;
    const trimmed = newColName.trim();
    
    if (editTargetCol) {
      // EDIT MODE
      if (trimmed !== editTargetCol && bt.columns.includes(trimmed)) {
        alert("Column already exists!");
        return;
      }
      
      const newConfig = { ...(bt.columnConfig || {}) };
      delete newConfig[editTargetCol];
      const opts = newColType === 'select' ? newColOptions.split(',').map(s=>s.trim()).filter(Boolean) : undefined;
      newConfig[trimmed] = { type: newColType, question: newColQues.trim(), options: opts };
      
      const newCols = bt.columns.map(c => c === editTargetCol ? trimmed : c);
      
      saveBtConfig({ ...bt, columns: newCols, columnConfig: newConfig });
      
      if (trimmed !== editTargetCol) {
        const newData = data.map(r => {
           const { [editTargetCol]: oldVal, ...rest } = r;
           return { ...rest, [trimmed]: oldVal };
        });
        saveTable(newData);
      }
    } else {
      // ADD MODE
      if (bt.columns.includes(trimmed)) {
        alert("Column already exists!");
        return;
      }
      
      const newConfig = { ...(bt.columnConfig || {}) };
      const opts = newColType === 'select' ? newColOptions.split(',').map(s=>s.trim()).filter(Boolean) : undefined;
      newConfig[trimmed] = { 
        type: newColType, 
        question: newColQues.trim(),
        options: opts
      };

      saveBtConfig({ ...bt, columns: [...bt.columns, trimmed], columnConfig: newConfig });
    }
    
    setShowAddColModal(false);
  };

  const deleteColumn = () => {
    if (!editTargetCol) return;
    if (bt.columns.length <= 1) {
      alert("You must have at least one column.");
      return;
    }
    if (confirm(`Are you sure you want to delete the column "${editTargetCol}"? This will remove its data from all rows.`)) {
      const newCols = bt.columns.filter(c => c !== editTargetCol);
      const newConfig = { ...bt.columnConfig };
      delete newConfig[editTargetCol];
      saveBtConfig({ ...bt, columns: newCols, columnConfig: newConfig });
      
      const newData = data.map(r => {
         const { [editTargetCol]: oldVal, ...rest } = r;
         return rest;
      });
      saveTable(newData);
      setShowAddColModal(false);
    }
  };

  const moveColumn = (index, direction) => {
    if (direction === -1 && index === 0) return;
    if (direction === 1 && index === bt.columns.length - 1) return;
    
    const newCols = [...bt.columns];
    const temp = newCols[index];
    newCols[index] = newCols[index + direction];
    newCols[index + direction] = temp;
    
    saveBtConfig({ ...bt, columns: newCols });
  };

  const addNewRule = () => {
    const name = prompt("Enter new rule:");
    if (!name || name.trim() === "") return;
    const trimmed = name.trim();
    if (bt.rules.includes(trimmed)) return alert("Rule already exists!");
    saveBtConfig({ ...bt, rules: [...bt.rules, trimmed] });
  };

  const toggleRowRule = (rowId, rule) => {
    const newData = data.map(row => {
      if (row.id === rowId) {
        const currentRules = row.followedRules || [];
        const newRules = currentRules.includes(rule) 
          ? currentRules.filter(r => r !== rule)
          : [...currentRules, rule];
        return { ...row, followedRules: newRules };
      }
      return row;
    });
    saveTable(newData);
  };

  const addRow = () => {
    const newRow = { id: Date.now().toString() };
    bt.columns.forEach(col => newRow[col] = "");
    saveTable([...data, newRow]);
  };

  const updateCell = (rowId, colName, value) => {
    const newData = data.map(row => {
      if (row.id === rowId) {
        return { ...row, [colName]: value };
      }
      return row;
    });
    saveTable(newData);
  };

  const deleteRow = (rowId) => {
    if (confirm("Are you sure you want to delete this row?")) {
      const newData = data.filter(r => r.id !== rowId);
      saveTable(newData);
    }
  };

  // Compute Stats
  let stats = { overall: { winRate: 0, avgRR: 0, total: 0 } };
  if (bt) {
    const wlCol = bt.columns.find(c => c.toLowerCase().includes('w/l') || c.toLowerCase().includes('win') || c.toLowerCase().includes('status'));
    const rrCol = bt.columns.find(c => c.toLowerCase().includes('rr') || c.toLowerCase().includes('reward'));

    const calcForSet = (dataset) => {
      let wins = 0;
      let total = 0;
      let totalRR = 0;
      let rrCount = 0;
      
      dataset.forEach(row => {
        let isWin = false;
        let isLoss = false;
        if (wlCol && row[wlCol]) {
          const val = row[wlCol].toUpperCase().trim();
          if (val === 'W' || val === 'WIN' || val === 'TG' || val.includes('PROFIT')) isWin = true;
          else if (val === 'L' || val === 'LOSS' || val === 'SL' || val === 'TL') isLoss = true;
        }
        if (isWin || isLoss) total++;
        if (isWin) wins++;

        if (rrCol && row[rrCol]) {
          // If the RR is "1:4" or "1:3.5", we want the "4" or "3.5"
          const parts = String(row[rrCol]).split(':');
          const rewardStr = parts.length > 1 ? parts[1] : parts[0];
          const rrMatch = rewardStr.match(/[\d.]+/);
          if (rrMatch) {
            totalRR += parseFloat(rrMatch[0]);
            rrCount++;
          }
        }
      });

      return {
        winRate: total > 0 ? ((wins / total) * 100).toFixed(1) : 0,
        avgRR: rrCount > 0 ? (totalRR / rrCount).toFixed(2) : 0,
        total
      };
    };

    // Filter the table rows based on active split filters (showing only matched rows)
    const filteredData = activeSplitFilters.length > 0 ? data.filter(r => {
      return activeSplitFilters.every(f => {
        if (f.type === 'rule') return r.followedRules?.includes(f.value);
        if (f.type === 'col') return r[f.colName] === f.value;
        if (f.type === 'symbol') {
           const symCols = bt.columns.filter(col => col.toLowerCase().includes('share') || col.toLowerCase().includes('symbol') || col.toLowerCase().includes('stock'));
           return symCols.some(col => r[col] === f.value);
        }
        return true;
      });
    }) : data;

    if (activeSplitFilters.length === 0) {
      stats.overall = calcForSet(data);
    } else {
      let followed = filteredData;
      let notFollowed = data.filter(r => !filteredData.includes(r));
      
      stats.followed = calcForSet(followed);
      stats.notFollowed = calcForSet(notFollowed);
    }
  }

  const displayData = activeSplitFilters.length > 0 ? data.filter(r => {
    return activeSplitFilters.every(f => {
      if (f.type === 'rule') return r.followedRules?.includes(f.value);
      if (f.type === 'col') return r[f.colName] === f.value;
      if (f.type === 'symbol') {
         const symCols = bt.columns.filter(col => col.toLowerCase().includes('share') || col.toLowerCase().includes('symbol') || col.toLowerCase().includes('stock'));
         return symCols.some(col => r[col] === f.value);
      }
      return true;
    });
  }) : data;

  const togglePendingFilter = (f) => {
    setPendingFilters(prev => {
      const exists = prev.some(p => p.type === f.type && p.value === f.value && p.colName === f.colName);
      if (exists) return prev.filter(p => !(p.type === f.type && p.value === f.value && p.colName === f.colName));
      return [...prev, f];
    });
  };

  const startStoryMode = () => {
    setIsStoryMode(true);
    setSmCurrent(0);
    setSmAnswers({});
    setSmHistory([]);
    setSmSelectedRules([]);

    const firstType = smSteps[0]?.type;
    if (firstType === 'time') {
      setSmInput(new Date().toTimeString().slice(0,5));
    } else if (firstType === 'date') {
      const offset = new Date().getTimezoneOffset() * 60000;
      setSmInput(new Date(Date.now() - offset).toISOString().slice(0,10));
    } else {
      setSmInput("");
    }
  };

  const exportToCSV = () => {
    if (!bt || !displayData.length) {
      alert("No data to export");
      return;
    }
    const headers = [...bt.columns, "Rules Followed"];
    const csvRows = [headers.join(',')];
    
    displayData.forEach(r => {
       const rowData = bt.columns.map(col => {
          let val = r[col] || "";
          val = String(val).replace(/"/g, '""');
          if (val.includes(',')) val = `"${val}"`;
          return val;
       });
       rowData.push(`"${(r.followedRules || []).join(', ')}"`);
       csvRows.push(rowData.join(','));
    });
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backtest_${bt.name}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getQuestionForCol = (col) => {
    if (bt && bt.columnConfig && bt.columnConfig[col] && bt.columnConfig[col].question) {
      return bt.columnConfig[col].question;
    }
    const lower = col.toLowerCase();
    if (lower.includes('time') || lower.includes('entry')) return `${col} kya tha?`;
    if (lower.includes('w/l') || lower.includes('win')) return `Result kya raha (W / L)?`;
    if (lower.includes('rr') || lower.includes('reward')) return `Kitna RR achieve hua?`;
    if (lower.includes('gain')) return `Maximum kitna profit gaya tha? (Top Gain)`;
    if (lower.includes('share') || lower.includes('symbol')) return `Kaunsa stock/share tha?`;
    return `${col} ki value type karein:`;
  };

  const getInputTypeForCol = (col) => {
    if (bt && bt.columnConfig && bt.columnConfig[col] && bt.columnConfig[col].type) {
      return bt.columnConfig[col].type;
    }
    return col.toLowerCase().includes('time') ? 'time' : 'text';
  };

  const smSteps = bt ? bt.columns.map(col => {
    const conf = bt.columnConfig?.[col] || {};
    return { 
      key: col, 
      type: conf.type || getInputTypeForCol(col), 
      q: getQuestionForCol(col),
      options: conf.options
    };
  }) : [];
  if (bt && bt.rules.length > 0) {
    smSteps.push({ key: 'followedRules', type: 'rules', q: 'Is trade me aapne kaunse rules follow kiye the?' });
  }

  const handleSmSubmit = (forceValue) => {
    const step = smSteps[smCurrent];
    let val = forceValue !== undefined ? forceValue : smInput;
    if (typeof val === 'string') val = val.trim();
    
    if (step.type === 'rules') {
      val = smSelectedRules;
    } else if (step.type === 'image') {
      // allow empty array or string
    } else {
      if (!val) return; // Require answer
    }

    setSmAnswers(prev => ({ ...prev, [step.key]: val }));
    setSmHistory(prev => [...prev, { q: step.q, a: step.type === 'rules' ? val.join(', ') || 'None' : val, type: step.type }]);
    
    const next = smCurrent + 1;
    if (next >= smSteps.length) {
      // Complete
      const newRow = { id: Date.now().toString(), ...smAnswers, [step.key]: val };
      saveTable([...data, newRow]);
      setIsStoryMode(false);
    } else {
      setSmCurrent(next);
      const nextType = smSteps[next].type;
      if (nextType === 'time') {
        setSmInput(new Date().toTimeString().slice(0,5));
      } else if (nextType === 'date') {
        const offset = new Date().getTimezoneOffset() * 60000;
        setSmInput(new Date(Date.now() - offset).toISOString().slice(0,10));
      } else if (nextType === 'image') {
        setSmInput([]);
      } else {
        setSmInput("");
      }
    }
  };

  useEffect(() => {
    const handleGlobalPaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      let pastedFiles = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          pastedFiles.push(items[i].getAsFile());
        }
      }
      if (pastedFiles.length === 0) return;

      if (isStoryMode) {
        if (smSteps[smCurrent]?.type === 'image') {
           let count = 0;
           let arr = [];
           pastedFiles.slice(0, 3).forEach(file => {
             processImageFile(file, (base64) => {
               arr.push(base64);
               count++;
               if (count === Math.min(pastedFiles.length, 3)) {
                 setSmInput(prev => {
                   const existing = Array.isArray(prev) ? prev : [];
                   return [...existing, ...arr].slice(0, 3);
                 });
               }
             });
           });
        }
      } else {
        if (hoveredCellRef.current) {
          const { rowId, col } = hoveredCellRef.current;
          const conf = bt?.columnConfig?.[col];
          const type = conf?.type || (col.toLowerCase().includes('time') ? 'time' : 'text');
          if (type === 'image') {
             const row = data.find(r => r.id === rowId);
             if (row) {
                 let count = 0;
                 let arr = [];
                 pastedFiles.slice(0, 3).forEach(file => {
                   processImageFile(file, (base64) => {
                     arr.push(base64);
                     count++;
                     if (count === Math.min(pastedFiles.length, 3)) {
                       const existing = row[col] || [];
                       const newData = data.map(r => {
                         if (r.id === rowId) {
                           return { ...r, [col]: [...existing, ...arr].slice(0, 3) };
                         }
                         return r;
                       });
                       setData(newData);
                       if (bt) {
                          updateBacktest(id, { data: newData }).catch(e => console.error(e));
                       }
                     }
                   });
                 });
             }
          }
        }
      }
    };
    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [isStoryMode, smCurrent, smSteps, data, bt, id]);

  if (!bt) return <div className="page-wrapper"><div style={{padding:'40px'}}>Loading...</div></div>;

  return (
    <div className="page-wrapper">
      {toastMsg && (
        <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', background: 'var(--profit-green)', color: '#000', padding: '10px 20px', borderRadius: '30px', fontWeight: 'bold', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.3)', animation: 'fadeIn 0.3s' }}>
          {toastMsg}
        </div>
      )}
      <header className={s.header} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button onClick={() => router.push('/backtest')} style={{background:'transparent', border:'none', color:'var(--text-muted)', fontSize:'18px', marginRight:'16px', cursor:'pointer'}}>←</button>
          <div className={s.headerTitle} style={{ margin: 0 }}>{bt.name}</div>
        </div>
        {!isStoryMode && (!bt.is_shared || bt.role === 'editor') && (
          <button onClick={startStoryMode} style={{background: 'var(--accent-purple)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold'}}>+ Add Entry</button>
        )}
      </header>

      <main className={s.main} style={{ maxWidth: '1200px' }}>
        <div className={s.topBar}>
          <div>
            <h2 style={{margin:'0 0 8px 0', fontSize:'22px'}}>{bt.name}</h2>
            <div style={{fontSize:'13px', color:'var(--text-muted)'}}>
              <b>Setup:</b> {bt.setup || 'N/A'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {bt.is_owner && (
              <button className={s.newBtn} onClick={() => setShowShareModal(true)} style={{padding: '8px 12px', fontSize: '13px', background: 'var(--accent-blue)', border: 'none', color: '#fff'}}>👥 Share</button>
            )}
            {(!bt.is_shared || bt.role === 'editor') && (
              <button className={s.newBtn} onClick={openAddColumn} style={{padding: '8px 12px', fontSize: '13px'}}>+ Add Column</button>
            )}
          </div>
        </div>

        {/* Rules & Analytics Panel */}
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', margin: '0 0 20px 0', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <button onClick={() => { setPendingFilters(activeSplitFilters); setShowFilterModal(true); }} style={{ background: 'var(--card-bg)', border: '1px solid var(--border-medium)', color: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🔍 Filters & Analytics</span>
              </button>
              
              {activeSplitFilters.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Active:</span>
                  {activeSplitFilters.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--accent-purple)' }}>
                        {f.type === 'col' ? `${f.colName}: ${f.value}` : f.type === 'symbol' ? `Sym: ${f.value}` : `Rule: ${f.value}`}
                      </span>
                      <button onClick={() => setActiveSplitFilters(prev => prev.filter((_, idx) => idx !== i))} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px' }}>&times;</button>
                    </div>
                  ))}
                  <button onClick={() => setActiveSplitFilters([])} style={{ background: 'transparent', border: '1px solid var(--loss-red)', color: 'var(--loss-red)', cursor: 'pointer', fontSize: '11px', padding: '2px 8px', borderRadius: '4px', marginLeft: '4px', fontWeight: 'bold' }}>Clear All</button>
                </div>
              )}
            </div>
            <button onClick={exportToCSV} style={{ background: 'transparent', border: '1px solid var(--profit-green)', color: 'var(--profit-green)', padding: '5px 12px', borderRadius: '16px', fontSize: '12px', cursor: 'pointer' }}>Export to Excel (CSV)</button>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', gap: '32px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            {activeSplitFilters.length > 0 ? (
              <>
                <div style={{flex: 1}}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    If ALL active filters MATCH
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--profit-green)', marginTop: '4px' }}>Win Rate: {stats.followed.winRate}% <span style={{fontSize:'12px', color:'var(--text-muted)', fontWeight:'normal'}}>({stats.followed.total} trades)</span></div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>Avg RR: {stats.followed.avgRR}</div>
                </div>
                <div style={{ width: '1px', background: 'var(--border-subtle)' }} />
                <div style={{flex: 1}}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    If ANY active filter FAILS
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--loss-red)', marginTop: '4px' }}>Win Rate: {stats.notFollowed.winRate}% <span style={{fontSize:'12px', color:'var(--text-muted)', fontWeight:'normal'}}>({stats.notFollowed.total} trades)</span></div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>Avg RR: {stats.notFollowed.avgRR}</div>
                </div>
              </>
            ) : (
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Overall Performance (All Data)</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '4px' }}>Win Rate: {stats.overall.winRate}% <span style={{fontSize:'12px', color:'var(--text-muted)', fontWeight:'normal'}}>({stats.overall.total} trades)</span></div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>Avg RR: {stats.overall.avgRR}</div>
              </div>
            )}
          </div>
        </div>

        {/* Share Modal */}
        {showShareModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
            <div style={{ background: '#121212', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-subtle)', width: '90%', maxWidth: '500px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
                <h3 style={{ margin: 0 }}>Share Backtest</h3>
                <button onClick={() => setShowShareModal(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>User Email</label>
                <input type="email" value={shareEmail} onChange={e => setShareEmail(e.target.value)} placeholder="friend@example.com" style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-medium)', borderRadius: '6px', color: '#fff', marginBottom: '16px' }} />
                
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Role</label>
                <select value={shareRole} onChange={e => setShareRole(e.target.value)} style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-medium)', borderRadius: '6px', color: '#fff', marginBottom: '16px' }}>
                  <option value="viewer" style={{ background: '#1a1a1a', color: '#fff' }}>Viewer (Can only view)</option>
                  <option value="editor" style={{ background: '#1a1a1a', color: '#fff' }}>Editor (Can add/edit rows & columns)</option>
                </select>

                <button onClick={handleShare} style={{ background: 'var(--accent-blue)', border: 'none', color: '#fff', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>Share Backtest</button>
              </div>

              {bt.sharedWithUsers && bt.sharedWithUsers.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '14px', marginBottom: '10px', color: 'var(--text-secondary)' }}>Shared with:</h4>
                  {bt.sharedWithUsers.map(u => (
                    <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{u.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{u.email} • {u.pivot?.role}</div>
                      </div>
                      <button onClick={() => handleRemoveShare(u.id)} style={{ background: 'transparent', border: '1px solid var(--loss-red)', color: 'var(--loss-red)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Filter Modal */}
        {showFilterModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
            <div style={{ background: '#121212', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-subtle)', width: '90%', maxWidth: '700px', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
                <h3 style={{ margin: 0 }}>Select Filter for Analytics</h3>
                <button onClick={() => setShowFilterModal(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Strategy Rules */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <strong style={{ fontSize: '12px', color: 'var(--text-muted)', width: '120px' }}>Strategy Rules:</strong>
                  {bt.rules.map(r => {
                    const isSel = pendingFilters.some(p => p.type === 'rule' && p.value === r);
                    return (
                      <button 
                        key={`rule-${r}`}
                        onClick={() => togglePendingFilter({ type: 'rule', value: r })}
                        style={{ 
                          background: isSel ? 'var(--accent-purple)' : 'rgba(255,255,255,0.05)', 
                          border: `1px solid ${isSel ? 'var(--accent-purple)' : 'var(--border-medium)'}`,
                          color: isSel ? '#fff' : 'var(--text-secondary)',
                          padding: '5px 12px', borderRadius: '16px', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s'
                        }}
                      >
                        {r}
                      </button>
                    );
                  })}
                  <button onClick={addNewRule} style={{ background: 'transparent', border: '1px dashed var(--accent-purple)', color: 'var(--accent-purple)', padding: '5px 12px', borderRadius: '16px', fontSize: '12px', cursor: 'pointer' }}>+ Add Rule</button>
                </div>

                {/* Column Options */}
                {bt.columns.map(col => {
                  const conf = bt.columnConfig?.[col];
                  if (conf?.type === 'select' && conf.options) {
                    return (
                      <div key={`col-filter-${col}`} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <strong style={{ fontSize: '12px', color: 'var(--text-muted)', width: '120px' }}>{col}:</strong>
                        {conf.options.map(opt => {
                          const isSel = pendingFilters.some(p => p.type === 'col' && p.colName === col && p.value === opt);
                          return (
                            <button 
                              key={`col-${col}-${opt}`}
                              onClick={() => togglePendingFilter({ type: 'col', colName: col, value: opt })}
                              style={{ 
                                background: isSel ? 'var(--accent-purple)' : 'rgba(255,255,255,0.05)', 
                                border: `1px solid ${isSel ? 'var(--accent-purple)' : 'var(--border-medium)'}`,
                                color: isSel ? '#fff' : 'var(--text-secondary)',
                                padding: '5px 12px', borderRadius: '16px', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s'
                              }}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    );
                  }
                  return null;
                })}

                {/* Symbols */}
                {(() => {
                   const symCols = bt.columns.filter(col => col.toLowerCase().includes('share') || col.toLowerCase().includes('symbol') || col.toLowerCase().includes('stock'));
                   const uniqueSymbols = [];
                   symCols.forEach(col => {
                      data.forEach(r => {
                         if (r[col] && !uniqueSymbols.includes(r[col])) uniqueSymbols.push(r[col]);
                      });
                   });
                   uniqueSymbols.sort();
                   
                   if (uniqueSymbols.length > 0) {
                     return (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                          <strong style={{ fontSize: '12px', color: 'var(--text-muted)', width: '120px' }}>Symbols:</strong>
                          {uniqueSymbols.map(sym => {
                             const isSel = pendingFilters.some(p => p.type === 'symbol' && p.value === sym);
                             return (
                                <button 
                                  key={`sym-${sym}`}
                                  onClick={() => togglePendingFilter({ type: 'symbol', value: sym })}
                                  style={{ 
                                    background: isSel ? 'var(--accent-purple)' : 'rgba(255,255,255,0.05)', 
                                    border: `1px solid ${isSel ? 'var(--accent-purple)' : 'var(--border-medium)'}`,
                                    color: isSel ? '#fff' : 'var(--text-secondary)',
                                    padding: '5px 12px', borderRadius: '16px', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s'
                                  }}
                                >
                                  {sym}
                                </button>
                             );
                          })}
                        </div>
                     );
                   }
                   return null;
                })()}
              </div>

              <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                {pendingFilters.length > 0 && (
                   <button onClick={() => setPendingFilters([])} style={{ background: 'transparent', border: '1px solid var(--loss-red)', color: 'var(--loss-red)', padding: '8px 24px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Clear Selection</button>
                )}
                <button onClick={() => setShowFilterModal(false)} style={{ background: 'transparent', border: '1px solid var(--border-medium)', color: '#fff', padding: '8px 24px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
                <button onClick={() => { setActiveSplitFilters(pendingFilters); setShowFilterModal(false); }} style={{ background: 'var(--accent-purple)', border: 'none', color: '#fff', padding: '8px 24px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Apply Filters</button>
              </div>
            </div>
          </div>
        )}

        <datalist id="symbol-suggestions">
          {symbols.map(sym => <option key={sym} value={sym} />)}
        </datalist>

        {/* Add/Edit Column Modal overlay */}
        {showAddColModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
            <div style={{ background: '#121212', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-subtle)', width: '90%', maxWidth: '400px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
              <h3 style={{ margin: '0 0 16px 0' }}>{editTargetCol ? "Edit Column" : "Add Custom Column"}</h3>
              
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Column Name (Table Header)</label>
              <input type="text" value={newColName} onChange={e => setNewColName(e.target.value)} placeholder="e.g. Risk, Notes, Time" style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-medium)', borderRadius: '6px', color: '#fff', marginBottom: '16px' }} />
              
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Input Type</label>
              <select value={newColType} onChange={e => setNewColType(e.target.value)} style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-medium)', borderRadius: '6px', color: '#fff', marginBottom: '16px' }}>
                <option value="text" style={{ background: '#1a1a1a', color: '#fff' }}>Text (Normal)</option>
                <option value="number" style={{ background: '#1a1a1a', color: '#fff' }}>Number</option>
                <option value="time" style={{ background: '#1a1a1a', color: '#fff' }}>Time</option>
                <option value="date" style={{ background: '#1a1a1a', color: '#fff' }}>Date</option>
                <option value="image" style={{ background: '#1a1a1a', color: '#fff' }}>Images (Max 3)</option>
                <option value="select" style={{ background: '#1a1a1a', color: '#fff' }}>Dropdown / Options (e.g. Top Gainer)</option>
              </select>

              {newColType === 'select' && (
                <>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Options (comma separated)</label>
                  <input type="text" value={newColOptions} onChange={e => setNewColOptions(e.target.value)} placeholder="e.g. Top Gainer, Top Loser, Flat" style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-medium)', borderRadius: '6px', color: '#fff', marginBottom: '16px' }} />
                </>
              )}

              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Question for Story Mode (Optional)</label>
              <input type="text" value={newColQues} onChange={e => setNewColQues(e.target.value)} placeholder="e.g. Is trade ka reason kya tha?" style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-medium)', borderRadius: '6px', color: '#fff', marginBottom: '24px' }} />

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
                {editTargetCol ? (
                  <button onClick={deleteColumn} style={{ background: 'rgba(255, 60, 60, 0.1)', border: '1px solid var(--loss-red)', color: 'var(--loss-red)', cursor: 'pointer', padding: '8px 16px', borderRadius: '6px' }}>Delete Column</button>
                ) : (
                  <div></div>
                )}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => setShowAddColModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px 16px' }}>Cancel</button>
                  <button onClick={confirmSaveColumn} style={{ background: 'var(--accent-purple)', border: 'none', color: '#fff', cursor: 'pointer', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold' }}>Save Column</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Table View */}
        {!isStoryMode ? (
          <div className={s.tableWrapper}>
            <table className={s.btTable}>
              <thead>
                <tr>
                  {bt.columns.map((col, cIdx) => (
                    <th key={col}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <span>{col}</span>
                        </div>
                        {(!bt.is_shared || bt.role === 'editor') && (
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <button onClick={() => openEditColumn(col)} style={{ background:'transparent', border:'none', color:'var(--text-muted)', cursor:'pointer', padding:'2px', fontSize:'12px' }} title="Edit Column">⚙️</button>
                            {cIdx > 0 && (
                              <button onClick={() => moveColumn(cIdx, -1)} style={{ background:'transparent', border:'none', color:'var(--text-muted)', cursor:'pointer', padding:'2px', fontSize:'12px' }}>←</button>
                            )}
                            {cIdx < bt.columns.length - 1 && (
                              <button onClick={() => moveColumn(cIdx, 1)} style={{ background:'transparent', border:'none', color:'var(--text-muted)', cursor:'pointer', padding:'2px', fontSize:'12px' }}>→</button>
                            )}
                          </div>
                        )}
                      </div>
                    </th>
                  ))}
                  {bt.rules.length > 0 && <th style={{width: '200px'}}>Rules Followed?</th>}
                  <th style={{width: '50px'}}></th>
                </tr>
              </thead>
              <tbody>
                {displayData.map((row, idx) => {
                  const isExpanded = expandedRows.has(row.id);
                  return (
                  <tr key={row.id} className={!isExpanded ? s.mobileCollapsed : ''}>
                    {bt.columns.map(col => {
                    const colLower = col.toLowerCase();
                    const isSymbolCol = colLower.includes('share') || colLower.includes('symbol') || colLower.includes('stock');
                    const isDateCol = (colLower.includes('date') || colLower.includes('time')) && !colLower.includes('pull back') && !colLower.includes('pullback') && !colLower.includes('time of entry');
                    const isWLCol = colLower.includes('w/l') || colLower.includes('win') || colLower.includes('loss') || colLower.includes('result');
                    const isEntryCol = colLower.includes('entry') && !colLower.includes('time of entry');
                    const isSLCol = colLower.includes('sl') || colLower.includes('stoploss') || colLower.includes('stop loss');
                    const alwaysVis = isSymbolCol || isDateCol || isWLCol || isEntryCol || isSLCol;

                    const inputType = getInputTypeForCol(col);
                    const conf = bt.columnConfig?.[col];
                    
                    return (
                      <td key={col} data-label={col} className={alwaysVis ? s.alwaysVisibleCol : ''} onMouseEnter={() => { if(inputType === 'image') hoveredCellRef.current = { rowId: row.id, col }; }} onMouseLeave={() => { hoveredCellRef.current = null; }}>
                        {inputType === 'select' && conf?.options ? (
                          <select 
                            value={row[col] || ""} 
                            onChange={(e) => updateCell(row.id, col, e.target.value)}
                            disabled={bt.is_shared && bt.role === 'viewer'}
                          >
                            <option value="" style={{ background: '#1a1a1a', color: '#fff' }}>Select...</option>
                            {conf.options.map(o => <option key={o} value={o} style={{ background: '#1a1a1a', color: '#fff' }}>{o}</option>)}
                          </select>
                        ) : inputType === 'image' ? (
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {(row[col] || []).map((imgUrl, i) => (
                              <div key={i} style={{ position: 'relative' }}>
                                <img 
                                  src={imgUrl} 
                                  onClick={() => setPreviewImage(imgUrl)}
                                  style={{ width: '30px', height: '30px', objectFit: 'cover', borderRadius: '4px', cursor: 'zoom-in', border: '1px solid var(--border-medium)' }} 
                                  alt="trade"
                                />
                                {(!bt.is_shared || bt.role === 'editor') && (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if(confirm("Remove this image?")) {
                                        const existing = row[col] || [];
                                        const newImages = existing.filter((_, idx) => idx !== i);
                                        updateCell(row.id, col, newImages);
                                      }
                                    }}
                                    style={{ position: 'absolute', top: '-6px', right: '-6px', background: 'var(--loss-red)', color: 'white', border: 'none', borderRadius: '50%', width: '14px', height: '14px', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                                    title="Delete Image"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            ))}
                            {(!bt.is_shared || bt.role === 'editor') && (!row[col] || row[col].length < 3) && (
                              <label style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: '1px dashed var(--border-medium)', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', color:'var(--text-muted)' }}>
                                +
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  multiple
                                  style={{ display: 'none' }} 
                                  onChange={(e) => {
                                    const files = Array.from(e.target.files);
                                    if(files.length > 0) {
                                      let count = 0;
                                      let arr = [];
                                      files.slice(0, 3).forEach(file => {
                                        processImageFile(file, (base64) => {
                                          arr.push(base64);
                                          count++;
                                          if(count === Math.min(files.length, 3)) {
                                            const existing = row[col] || [];
                                            updateCell(row.id, col, [...existing, ...arr].slice(0, 3));
                                          }
                                        });
                                      });
                                    }
                                  }} 
                                />
                              </label>
                            )}
                          </div>
                        ) : inputType === 'date' ? (
                          <div style={{ position: 'relative', display: 'inline-flex', width: '100%', minWidth: '90px', alignItems: 'center' }}>
                            <span style={{ flex: 1, color: row[col] ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                              {row[col] ? (() => {
                                const d = new Date(row[col]);
                                if(isNaN(d.getTime())) return row[col];
                                const m = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                                return `${d.getDate().toString().padStart(2, '0')} ${m[d.getMonth()]} ${d.getFullYear()}`;
                              })() : "Select Date"}
                            </span>
                            <input 
                              type="date"
                              value={row[col] || ""} 
                              onChange={(e) => updateCell(row.id, col, e.target.value)}
                              disabled={bt.is_shared && bt.role === 'viewer'}
                              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                            />
                          </div>
                        ) : (
                          <input 
                            list={isSymbolCol ? "symbol-suggestions" : undefined}
                            type={inputType}
                            value={row[col] || ""} 
                            onChange={(e) => updateCell(row.id, col, e.target.value)}
                            disabled={bt.is_shared && bt.role === 'viewer'}
                            placeholder={`Enter ${col}`}
                          />
                        )}
                      </td>
                    );
                  })}
                    {bt.rules.length > 0 && (
                      <td data-label="Rules Followed?">
                        <div style={{display: 'flex', gap: '4px', flexWrap: 'wrap'}}>
                          {bt.rules.map(r => {
                            const isChecked = row.followedRules?.includes(r);
                            return (
                                <button
                                  key={r}
                                  onClick={() => toggleRowRule(row.id, r)}
                                  disabled={bt.is_shared && bt.role === 'viewer'}
                                  style={{
                                    background: isChecked ? 'rgba(0, 230, 118, 0.1)' : 'transparent',
                                    border: `1px solid ${isChecked ? 'var(--profit-green)' : 'var(--border-subtle)'}`,
                                    color: isChecked ? 'var(--profit-green)' : 'var(--text-muted)',
                                    padding: '2px 6px', borderRadius: '4px', fontSize: '10px', cursor: (bt.is_shared && bt.role === 'viewer') ? 'not-allowed' : 'pointer'
                                  }}
                                  title={r}
                                >
                                  {isChecked ? '✓ ' : ''}{r.substring(0, 8)}..
                                </button>
                              )
                            })}
                          </div>
                        </td>
                      )}
                      <td data-label="Actions">
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <button className={s.mobileOnlyExpandBtn} onClick={() => {
                             setExpandedRows(prev => {
                               const next = new Set(prev);
                               if (next.has(row.id)) next.delete(row.id);
                               else next.add(row.id);
                               return next;
                             });
                          }} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '4px', padding: '4px 8px', fontSize: '10px' }}>
                            {isExpanded ? 'Collapse ▲' : 'Expand ▼'}
                          </button>
                          {(!bt.is_shared || bt.role === 'editor') && (
                            <button onClick={() => deleteRow(row.id)} style={{ background:'transparent', border:'none', color:'var(--loss-red)', cursor:'pointer', fontSize:'14px', opacity: 0.7 }}>✕</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
              {(!bt.is_shared || bt.role === 'editor') && (
                <button className={s.addRowBtn} onClick={startStoryMode} style={{background: 'rgba(124, 77, 255, 0.1)', color: '#c4a1ff', border: '1px dashed var(--accent-purple)'}}>+ Add Entry (Story Mode)</button>
              )}
            </div>
        ) : (
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-medium)', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Log Trade via Story</h3>
              <button onClick={() => setIsStoryMode(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>Cancel</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              {smHistory.map((item, i) => (
                <div key={i} style={{ opacity: 0.6 }}>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #24183d, #3a1f6e)', color: '#c4a1ff', display: 'grid', placeItems: 'center', fontSize: '10px', fontWeight: 'bold' }}>AI</div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '4px 14px 14px 14px', fontSize: '14px', border: '1px solid var(--border-subtle)' }}>{item.q}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ background: 'rgba(124, 77, 255, 0.12)', padding: '8px 14px', borderRadius: '14px 4px 14px 14px', fontSize: '14px', color: '#c4a1ff', border: '1px solid rgba(124, 77, 255, 0.25)' }}>
                      {item.type === 'image' && Array.isArray(item.a) ? (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {item.a.map((imgUrl, idx) => (
                            <img key={idx} src={imgUrl} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }} onClick={() => setPreviewImage(imgUrl)} alt="uploaded" />
                          ))}
                        </div>
                      ) : (
                        item.a
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Current Question */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #24183d, #3a1f6e)', color: '#c4a1ff', display: 'grid', placeItems: 'center', fontSize: '10px', fontWeight: 'bold' }}>AI</div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '4px 14px 14px 14px', fontSize: '14px', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                  {smSteps[smCurrent]?.q}
                </div>
              </div>

              {/* Input for Current Question */}
              <div style={{ marginLeft: '38px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {smSteps[smCurrent]?.type === 'rules' ? (
                  <>
                    {bt.rules.map(r => {
                      const isSel = smSelectedRules.includes(r);
                      return (
                        <button key={r} onClick={() => {
                          if (isSel) setSmSelectedRules(prev => prev.filter(x => x !== r));
                          else setSmSelectedRules(prev => [...prev, r]);
                        }} style={{ background: isSel ? 'var(--accent-purple)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isSel ? 'var(--accent-purple)' : 'var(--border-medium)'}`, color: isSel ? '#fff' : 'var(--text-secondary)', padding: '8px 14px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer' }}>
                          {r}
                        </button>
                      )
                    })}
                  </>
                ) : smSteps[smCurrent]?.type === 'image' ? (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {(Array.isArray(smInput) ? smInput : []).map((imgUrl, i) => (
                      <img key={i} src={imgUrl} onClick={() => setPreviewImage(imgUrl)} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', cursor: 'zoom-in', border: '1px solid var(--border-medium)' }} alt="upload" />
                    ))}
                    {(!Array.isArray(smInput) || smInput.length < 3) && (
                      <label style={{ width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: '1px dashed var(--border-medium)', borderRadius: '8px', cursor: 'pointer', fontSize: '20px', color: 'var(--text-muted)' }}>
                        +
                        <input 
                          type="file" 
                          accept="image/*" 
                          multiple
                          style={{ display: 'none' }} 
                          onChange={(e) => {
                            const files = Array.from(e.target.files);
                            if(files.length > 0) {
                              let count = 0;
                              let arr = [];
                              files.slice(0, 3).forEach(file => {
                                processImageFile(file, (base64) => {
                                  arr.push(base64);
                                  count++;
                                  if(count === Math.min(files.length, 3)) {
                                    setSmInput(prev => {
                                      const existing = Array.isArray(prev) ? prev : [];
                                      return [...existing, ...arr].slice(0, 3);
                                    });
                                  }
                                });
                              });
                            }
                          }} 
                        />
                      </label>
                    )}
                  </div>
                ) : smSteps[smCurrent]?.type === 'select' ? (
                  <>
                    {smSteps[smCurrent].options?.map(opt => (
                      <button 
                        key={opt} 
                        onClick={() => handleSmSubmit(opt)}
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-medium)', color: '#fff', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', flex: '1 1 auto', textAlign: 'center' }}
                      >
                        {opt}
                      </button>
                    ))}
                  </>
                ) : (
                  <>
                    <input 
                      type={getInputTypeForCol(smSteps[smCurrent]?.key)} 
                      value={smInput} 
                      onChange={e => setSmInput(e.target.value)} 
                      onKeyDown={e => e.key === 'Enter' && handleSmSubmit()}
                      list={['share', 'symbol', 'stock'].some(s => smSteps[smCurrent]?.key.toLowerCase().includes(s)) ? "symbol-suggestions" : undefined}
                      autoFocus
                      style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--accent-purple)', borderRadius: '10px', padding: '10px 14px', color: '#fff', fontSize: '14px', outline: 'none' }}
                    />
                    {['share', 'symbol', 'stock'].some(s => smSteps[smCurrent]?.key.toLowerCase().includes(s)) && (
                      <datalist id="symbol-suggestions">
                        {Array.from(new Set(data.map(d => d[smSteps[smCurrent]?.key]).filter(Boolean))).map(sym => (
                          <option key={sym} value={sym} />
                        ))}
                      </datalist>
                    )}
                  </>
                )}
                
                {smSteps[smCurrent]?.type !== 'select' && (
                  <button onClick={() => handleSmSubmit()} style={{ background: 'var(--accent-purple)', border: 'none', color: '#fff', padding: '0 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                    {smSteps[smCurrent]?.type === 'rules' ? 'Done' : '→'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Full Image Preview Modal */}
        {previewImage && (
          <div 
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, cursor: 'zoom-out', backdropFilter: 'blur(5px)' }}
            onClick={() => setPreviewImage(null)}
          >
            <img src={previewImage} style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }} alt="preview" />
          </div>
        )}

      </main>

      <BottomNav />
    </div>
  );
}
