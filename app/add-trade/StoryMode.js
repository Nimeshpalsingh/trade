"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "next-auth/react";
import { API_URL } from "../utils/apiConfig";
import s from "./storymode.module.css";

// Build steps dynamically from settings
function buildSteps(settings, rawTimeFrames) {
  const entryTFs = settings.timeFrames.filter(tfName => {
    const hasAnyEntry = rawTimeFrames.some(t => t.is_entry);
    if (!hasAnyEntry) return true;
    const found = rawTimeFrames.find(t => t.name.trim() === tfName);
    return found && found.is_entry;
  });

  return [
    { key:'marketType', q:'Kis market mein trade kiya?', hint:'Market type choose karo.', type:'options', opts: settings.marketTypes, sentence: v => `<span class="answer">${v}</span> market mein ` },
    { key:'date', q:'Trade kis date ka hai?', hint:'Date select karo.', type:'date', sentence: v => `<span class="answer">${v}</span> ko ` },
    { key:'type', q:'Buy (LONG) kiya ya Sell (SHORT)?', hint:'Trade direction choose karo.', type:'options', opts:['LONG','SHORT'], sentence: v => `<span class="answer">${v}</span> trade liya ` },
    { key:'symbol', q:'Kaunsa symbol / stock tha?', hint:'Symbol choose karo.', type:'select', opts: settings.symbols, sentence: v => `<span class="answer">${v}</span> ka. ` },
    { key:'riskAmount', q:'Kitna risk liya tha? (₹)', hint:'Risk amount type karo.', type:'text', placeholder:'e.g. 1000', sentence: v => `Risk <span class="answer">₹${v}</span> rakha. ` },
    { key:'entry', q:'Entry kis price par li?', hint:'Entry price type karo.', type:'text', placeholder:'e.g. 2865.50', sentence: v => `Entry <span class="answer">₹${v}</span> par li. ` },
    { key:'slPoints', q:'Stop Loss kitne points ka tha?', hint:'SL points mein type karo.', type:'text', placeholder:'e.g. 15', sentence: v => `SL <span class="answer">${v} points</span> ka rakha. ` },
    { key:'rewardRatio', q:'Reward Ratios kya the? (comma separated)', hint:'e.g. 2, 3 for partial exits', type:'text', placeholder:'2, 3', sentence: v => `Target <span class="answer">${v}R</span> rakha. ` },
    { key:'strategy', q:'Kaunsa setup / strategy use kiya?', hint:'Strategy choose karo.', type:'select', opts: settings.setups, sentence: v => `<span class="answer">${v}</span> setup dekha. ` },
    { key:'rules', q:'Strategy rules check karo.', hint:'Jo rule follow hua hai usko tick karo.', type:'rules', sentence: () => '' },
    { key:'timeFrame', q:'Kis time frame par entry li?', hint:'Time frame choose karo.', type:'select', opts: entryTFs, sentence: v => `Time frame <span class="answer">${v}</span> tha. ` },
    { key:'session', q:'Kaunsi session mein trade tha?', hint:'Session choose karo.', type:'select', opts: settings.sessions.map(ss => ss.name), sentence: v => `Session <span class="answer">${v}</span> thi. ` },
    { key:'marketTrend', q:'Market condition kya thi?', hint:'Market trend choose karo.', type:'select', opts: settings.marketTrends, sentence: v => `Market <span class="answer">${v}</span> tha. ` },
    { key:'biases', q:'Multi-timeframe bias kya tha? (Optional)', hint:'Har TF ka bias set karo, phir Continue.', type:'bias', sentence: () => '' },
    { key:'exitType', q:'Trade kaise exit hua?', hint:'Exit type choose karo.', type:'options', opts:['Target Hit','SL Hit','Partial Exit','Trailing Exit','Manual Exit'], sentence: v => `Trade <span class="answer">${v}</span> hua. ` },
    { key:'exitPrice', q:'Exit kis price par hua?', hint:'Exit price type karo.', type:'text', placeholder:'e.g. 2895', sentence: v => `Exit <span class="answer">₹${v}</span> par kiya. ` },
    { key:'moods', q:'Pre-market mood kaisa tha?', hint:'Mood chips choose karo, phir Continue.', type:'chips', opts: settings.preMarketMoods || [], sentence: v => v ? `Mood: <span class="answer">${v}</span>. ` : '' },
    { key:'mistakes', q:'Koi mistake hui? (Optional)', hint:'Mistake chips choose karo, phir Continue.', type:'chips', opts: settings.mistakes, sentence: v => v ? `Mistakes: <span class="answer">${v}</span>. ` : '' },
    { key:'notes', q:'Journal notes likho (Optional)', hint:'Apni language mein likho — skip bhi kar sakte ho.', type:'text', placeholder:'Why did you take this trade?', sentence: v => v ? `Notes: <span class="answer">${v}</span>. ` : '' },
    { key:'maxRr', q:'Maximum RR kitna bana? (Optional)', hint:'e.g. 5 (for 1:5)', type:'text', placeholder:'e.g. 5', sentence: v => v ? `Max RR <span class="answer">${v}R</span> mila. ` : '' },
  ];
}

export default function StoryMode({ settings, rawSymbols, rawTimeFrames, defaultSettings }) {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({ date: new Date().toISOString().split("T")[0] });
  const [storyHtml, setStoryHtml] = useState("Aaj maine ");
  const [chatHistory, setChatHistory] = useState([]);
  const [inputVal, setInputVal] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [selectedChips, setSelectedChips] = useState([]);
  const [checkedRules, setCheckedRules] = useState([]);
  const [biases, setBiases] = useState({});
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  const steps = buildSteps(settings, rawTimeFrames);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [current, chatHistory, isComplete]);

  // Auto-focus input
  useEffect(() => {
    if (steps[current]?.type === 'text' || steps[current]?.type === 'date') {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [current]);

  // Apply defaults
  useEffect(() => {
    if (defaultSettings?.marketType && settings.marketTypes.includes(defaultSettings.marketType)) {
      // Pre-fill but don't auto-advance
    }
  }, []);

  const filteredSymbols = [...new Set(rawSymbols.filter(sym => {
    if (!answers.marketType) return true;
    if (!sym.market_type) return true;
    return sym.market_type === answers.marketType;
  }).map(sym => sym.name.trim()))];

  const appendStory = (html) => {
    setStoryHtml(prev => prev + html);
  };

  const answer = (key, value) => {
    const step = steps[current];
    setAnswers(prev => ({ ...prev, [key]: value }));

    // Add to chat history
    setChatHistory(prev => [...prev, { q: step.q, a: value, key }]);

    // Build story sentence
    const sentenceHtml = step.sentence(value);
    if (sentenceHtml) appendStory(sentenceHtml);

    // Move to next
    const next = current + 1;
    if (next >= steps.length) {
      setIsComplete(true);
    } else {
      setCurrent(next);
    }
    setInputVal("");
    setSelectedChips([]);
  };

  const handleTextSubmit = () => {
    const val = inputVal.trim();
    const step = steps[current];
    // Allow skip for optional steps
    const optionalKeys = ['notes', 'maxRr'];
    if (!val && !optionalKeys.includes(step.key)) return;
    answer(step.key, val);
  };

  const handleSkip = () => {
    const step = steps[current];
    answer(step.key, "");
  };

  const handleChipsDone = () => {
    const step = steps[current];
    const val = selectedChips.join(", ");
    setAnswers(prev => ({ ...prev, [step.key]: selectedChips }));
    setChatHistory(prev => [...prev, { q: step.q, a: val || "None", key: step.key }]);
    if (val) appendStory(step.sentence(val));
    setSelectedChips([]);
    const next = current + 1;
    if (next >= steps.length) setIsComplete(true);
    else setCurrent(next);
  };

  const handleRulesDone = () => {
    const allRules = settings.rules;
    const missed = allRules.filter(r => !checkedRules.includes(r));
    setAnswers(prev => ({ ...prev, followedRules: checkedRules, missedRules: missed }));

    let rulesHtml = `<span class="rulesBlock"><br><b>Rules check:</b><br>`;
    checkedRules.forEach(r => { rulesHtml += `<span class="ruleFollowed">☑ ${r}</span>`; });
    missed.forEach(r => { rulesHtml += `<span class="ruleMissed">☐ ${r}</span>`; });
    rulesHtml += `<span class="rulesSummary">${checkedRules.length}/${allRules.length} rules followed.</span></span>`;
    appendStory(rulesHtml);

    setChatHistory(prev => [...prev, { q: steps[current].q, a: `${checkedRules.length}/${allRules.length} followed`, key: 'rules' }]);
    setCheckedRules([]);
    const next = current + 1;
    if (next >= steps.length) setIsComplete(true);
    else setCurrent(next);
  };

  const handleBiasDone = () => {
    setAnswers(prev => ({ ...prev, biases }));
    const entries = Object.entries(biases).filter(([, v]) => v);
    const val = entries.map(([tf, b]) => `${tf}:${b}`).join(", ") || "None set";
    setChatHistory(prev => [...prev, { q: steps[current].q, a: val, key: 'biases' }]);
    if (entries.length > 0) {
      appendStory(`Bias: <span class="answer">${val}</span>. `);
    }
    setBiases({});
    const next = current + 1;
    if (next >= steps.length) setIsComplete(true);
    else setCurrent(next);
  };

  // Calculate and submit
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const en = parseFloat(answers.entry) || 0;
      const slPts = parseFloat(answers.slPoints) || 0;
      const tradeType = answers.type || "LONG";
      const slPrice = tradeType === "LONG" ? en - slPts : en + slPts;

      // Calculate qty from risk
      const risk = parseFloat(answers.riskAmount) || 0;
      const isCrypto = answers.marketType?.toLowerCase().includes("crypto");
      let qty = 0;
      if (slPts > 0 && risk > 0) {
        if (isCrypto) {
          const riskUsdt = risk / 86;
          qty = Math.floor((riskUsdt / slPts) * 100) / 100;
        } else {
          qty = Math.round(risk / slPts);
        }
      }

      // Build exits from RR
      const rrStr = answers.rewardRatio || "2";
      const rrValues = rrStr.split(",").map(x => parseFloat(x.trim())).filter(n => !isNaN(n));
      let exits = [];
      
      // Check if SL Hit
      if (answers.exitType === "SL Hit") {
        exits = [{ qty, price: slPrice }];
      } else if (answers.exitPrice) {
        exits = [{ qty, price: parseFloat(answers.exitPrice) }];
      } else {
        const splitQty = Math.floor(qty / rrValues.length);
        const remainder = qty % rrValues.length;
        exits = rrValues.map((rr, i) => {
          const tpPts = slPts * rr;
          const tpPrice = tradeType === "LONG" ? en + tpPts : en - tpPts;
          return { qty: i === 0 ? splitQty + remainder : splitQty, price: parseFloat(tpPrice.toFixed(2)) };
        });
      }

      const biasEntries = answers.biases ? Object.entries(answers.biases).filter(([, v]) => v).map(([tf, b]) => ({ time_frame: tf, bias: b })) : [];

      const payload = {
        date: answers.date || new Date().toISOString().split("T")[0],
        symbol: answers.symbol,
        type: tradeType,
        qty,
        entry_price: en,
        sl: slPrice || null,
        setup: answers.strategy,
        time_frame: answers.timeFrame,
        market_trend: answers.marketTrend,
        market_type: answers.marketType,
        session: answers.session || "",
        notes: answers.notes || "",
        video_link: "",
        exits: exits.filter(e => e.qty > 0 && e.price > 0),
        biases: biasEntries,
        rules: answers.followedRules || [],
        mistakes: Array.isArray(answers.mistakes) ? answers.mistakes : [],
        pre_market_moods: Array.isArray(answers.moods) ? answers.moods : [],
        maximum_rr: answers.maxRr ? parseFloat(answers.maxRr) : null,
        images: [],
      };

      const session = await getSession();
      if (!session?.apiToken) throw new Error("Not authenticated");
      const res = await fetch(`${API_URL}/trades`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${session.apiToken}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed");
      setSaveMsg("✓ Trade saved!");
    } catch (e) {
      console.error(e);
      setSaveMsg("✗ Error saving trade");
    } finally {
      setIsSaving(false);
    }
  };

  const restart = () => {
    setCurrent(0);
    setAnswers({ date: new Date().toISOString().split("T")[0] });
    setStoryHtml("Aaj maine ");
    setChatHistory([]);
    setIsComplete(false);
    setSaveMsg("");
    setSelectedChips([]);
    setCheckedRules([]);
    setBiases({});
  };

  // Get current step's opts (with dynamic symbol filtering)
  const currentStep = steps[current];
  const currentOpts = currentStep?.key === 'symbol' ? filteredSymbols : currentStep?.opts;

  return (
    <div className={s.storyContainer}>
      {/* Story Card */}
      <div className={s.storyCard}>
        <div className={s.storyTitle}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          Trade Story
        </div>
        <div className={s.storyText} dangerouslySetInnerHTML={{ __html: storyHtml }} />
        {!isComplete && <span className={s.cursor} />}
      </div>

      {/* Chat History (answered) */}
      <div className={s.chatArea}>
        {chatHistory.map((item, i) => (
          <div key={i} className={s.answeredBubble}>
            <div className={s.aiMessage}>
              <div className={s.avatar}>AI</div>
              <div className={s.bubble}>
                <div className={s.question}>{item.q}</div>
              </div>
            </div>
            <div className={s.userAnswer}>
              <div className={s.userBubble}>{item.a}</div>
            </div>
          </div>
        ))}

        {/* Current Question */}
        {!isComplete && currentStep && (
          <>
            <div className={s.aiMessage}>
              <div className={s.avatar}>AI</div>
              <div className={s.bubble}>
                <div className={s.question}>{currentStep.q}</div>
                <div className={s.hint}>{currentStep.hint}</div>
              </div>
            </div>

            {/* Options */}
            {currentStep.type === 'options' && currentOpts && (
              <div className={s.optionsRow}>
                {currentOpts.map(opt => (
                  <button key={opt} className={s.optionBtn} onClick={() => answer(currentStep.key, opt)}>{opt}</button>
                ))}
              </div>
            )}

            {/* Select (rendered as options) */}
            {currentStep.type === 'select' && currentOpts && (
              <div className={s.optionsRow}>
                {currentOpts.map(opt => (
                  <button key={opt} className={s.optionBtn} onClick={() => {
                    if (currentStep.key === 'symbol') {
                      // Auto-set defaults for symbol
                      const foundSym = rawSymbols.find(sym => sym.name.trim() === opt);
                      if (foundSym?.default_risk) {
                        setAnswers(prev => ({ ...prev, riskAmount: foundSym.default_risk }));
                      }
                    }
                    answer(currentStep.key, opt);
                  }}>{opt}</button>
                ))}
              </div>
            )}

            {/* Text / Date input */}
            {(currentStep.type === 'text' || currentStep.type === 'date') && (
              <div className={s.inputRow}>
                <input
                  ref={inputRef}
                  type={currentStep.type === 'date' ? 'date' : 'text'}
                  className={s.chatInput}
                  placeholder={currentStep.placeholder || ''}
                  value={currentStep.type === 'date' ? (answers.date || '') : inputVal}
                  onChange={e => {
                    if (currentStep.type === 'date') {
                      setAnswers(prev => ({ ...prev, date: e.target.value }));
                    } else {
                      setInputVal(e.target.value);
                    }
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      if (currentStep.type === 'date') answer(currentStep.key, answers.date);
                      else handleTextSubmit();
                    }
                  }}
                />
                <button className={s.sendBtn} onClick={() => {
                  if (currentStep.type === 'date') answer(currentStep.key, answers.date);
                  else handleTextSubmit();
                }}>Continue</button>
                {['notes', 'maxRr'].includes(currentStep.key) && (
                  <button className={s.sendBtn} style={{ background: 'transparent', border: '1px solid var(--border-medium)', color: 'var(--text-muted)' }} onClick={handleSkip}>Skip</button>
                )}
              </div>
            )}

            {/* Rules checklist */}
            {currentStep.type === 'rules' && (
              <div className={s.rulesBox}>
                <div className={s.rulesTitle}>
                  <h4>Strategy Rules</h4>
                  <span className={s.rulesCount}>{checkedRules.length} / {settings.rules.length}</span>
                </div>
                {settings.rules.map(rule => (
                  <div key={rule} className={s.ruleItem} onClick={() => setCheckedRules(prev => prev.includes(rule) ? prev.filter(r => r !== rule) : [...prev, rule])}>
                    <div className={`${s.ruleCheckbox} ${checkedRules.includes(rule) ? s.ruleCheckboxChecked : ''}`}>
                      {checkedRules.includes(rule) && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      )}
                    </div>
                    <span>{rule}</span>
                  </div>
                ))}
                <button className={s.continueBtn} onClick={handleRulesDone}>Continue Story →</button>
              </div>
            )}

            {/* Chips (moods, mistakes) */}
            {currentStep.type === 'chips' && (
              <>
                <div className={s.chipsRow}>
                  {(currentOpts || []).map(chip => (
                    <button key={chip} className={`${s.chipBtn} ${selectedChips.includes(chip) ? s.chipActive : ''}`}
                      onClick={() => setSelectedChips(prev => prev.includes(chip) ? prev.filter(c => c !== chip) : [...prev, chip])}
                    >{chip}</button>
                  ))}
                </div>
                <div className={s.chipsDone}>
                  <button className={s.chipsDoneBtn} onClick={handleChipsDone}>
                    {selectedChips.length > 0 ? `Continue with ${selectedChips.length} selected →` : 'Skip →'}
                  </button>
                </div>
              </>
            )}

            {/* Bias */}
            {currentStep.type === 'bias' && (
              <>
                <div className={s.biasGrid}>
                  {settings.timeFrames.map(tf => (
                    <div key={tf} className={s.biasRow}>
                      <span className={s.biasTf}>{tf}</span>
                      <div className={s.biasOptions}>
                        <button className={`${s.biasBtn} ${biases[tf] === 'Up' ? s.biasUp : ''}`}
                          onClick={() => setBiases(prev => ({ ...prev, [tf]: prev[tf] === 'Up' ? null : 'Up' }))}>Up</button>
                        <button className={`${s.biasBtn} ${biases[tf] === 'Down' ? s.biasDown : ''}`}
                          onClick={() => setBiases(prev => ({ ...prev, [tf]: prev[tf] === 'Down' ? null : 'Down' }))}>Down</button>
                        <button className={`${s.biasBtn} ${biases[tf] === 'Not Sure' ? s.biasNeutral : ''}`}
                          onClick={() => setBiases(prev => ({ ...prev, [tf]: prev[tf] === 'Not Sure' ? null : 'Not Sure' }))}>?</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className={s.chipsDone}>
                  <button className={s.chipsDoneBtn} onClick={handleBiasDone}>Continue →</button>
                </div>
              </>
            )}
          </>
        )}

        {/* Complete */}
        {isComplete && (
          <div className={s.completeBox}>
            <div className={s.completeIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <div className={s.completeTitle}>Trade Story Complete ✓</div>
            <div className={s.completeSubtext}>
              {saveMsg || "Ab tumhare paas ek readable trade diary entry hai — form data nahi."}
            </div>
            <div className={s.completeActions}>
              {!saveMsg && (
                <button className={s.newTradeBtn} onClick={handleSave} disabled={isSaving}>
                  {isSaving && <span className={s.savingSpinner} />}
                  {isSaving ? "Saving..." : "💾 Save Trade"}
                </button>
              )}
              {saveMsg && (
                <button className={s.newTradeBtn} onClick={restart}>＋ New Trade</button>
              )}
              <button className={s.viewJournalBtn} onClick={() => router.push("/journal")}>View Journal</button>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>
    </div>
  );
}
