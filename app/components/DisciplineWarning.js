"use client";
import { useEffect, useState } from "react";
import { fetchAndProcessTrades } from "../utils/tradeUtils";
import { usePathname } from "next/navigation";

export default function DisciplineWarning() {
  const [isOpen, setIsOpen] = useState(false);
  const [mistakes, setMistakes] = useState([]);
  const [timeLeft, setTimeLeft] = useState(10);
  const [tradeIdToAck, setTradeIdToAck] = useState(null);
  const pathname = usePathname();

  useEffect(() => {
    const checkDiscipline = async () => {
      if (pathname === "/login" || pathname === "/register") return;

      const trades = await fetchAndProcessTrades();
      if (!trades || trades.length === 0) return;

      // Filter for trades made today
      const today = new Date();
      const todayStr = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, '0') + "-" + String(today.getDate()).padStart(2, '0');
      
      const todaysTrades = trades.filter(t => t.date.startsWith(todayStr));
      if (todaysTrades.length === 0) return;

      // Sort to get the absolute latest trade today
      todaysTrades.sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date));
      const latestTrade = todaysTrades[0];

      if (latestTrade.mistakes && latestTrade.mistakes.length > 0) {
        const lastAckId = localStorage.getItem("discipline_ack_trade_id");
        
        // If we haven't acknowledged THIS specific trade's mistakes yet
        if (lastAckId !== latestTrade.id.toString()) {
          setMistakes(latestTrade.mistakes);
          setTradeIdToAck(latestTrade.id.toString());
          setIsOpen(true);
          setTimeLeft(10);
        }
      }
    };

    checkDiscipline();
  }, [pathname]);

  useEffect(() => {
    let timer;
    if (isOpen && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, timeLeft]);

  const handleAcknowledge = () => {
    if (timeLeft > 0) return; // Prevent closing if time isn't up
    
    if (tradeIdToAck) {
      localStorage.setItem("discipline_ack_trade_id", tradeIdToAck);
    }
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={iconStyle}>⚠️</div>
        <h1 style={titleStyle}>WAKE UP!</h1>
        <p style={subtitleStyle}>You are breaking your rules and making mistakes today.</p>
        
        <div style={mistakesContainerStyle}>
          <div style={mistakesLabelStyle}>MISTAKES LOGGED ON YOUR LAST TRADE:</div>
          <div style={mistakesListStyle}>
            {mistakes.map((m, i) => (
              <span key={i} style={mistakeTagStyle}>{m}</span>
            ))}
          </div>
        </div>

        <p style={warningTextStyle}>
          Trading without discipline is just gambling. Stare at your mistakes and realize what you are doing to your capital.
        </p>

        {timeLeft > 0 ? (
          <button style={btnDisabledStyle} disabled>
            Acknowledge in {timeLeft}s...
          </button>
        ) : (
          <button style={btnActiveStyle} onClick={handleAcknowledge}>
            ✕ I Understand. I Will Do Better.
          </button>
        )}
      </div>
    </div>
  );
}

// Inline Styles for simplicity and reliability
const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(10, 0, 0, 0.95)", // Very dark, slightly red
  backdropFilter: "blur(10px)",
  zIndex: 99999, // On top of EVERYTHING
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "20px",
  animation: "fadeIn 0.3s ease-out"
};

const modalStyle = {
  backgroundColor: "#1a0b0f",
  border: "2px solid #ff3333",
  borderRadius: "16px",
  padding: "40px 30px",
  maxWidth: "400px",
  width: "100%",
  textAlign: "center",
  boxShadow: "0 20px 50px rgba(255, 0, 0, 0.2)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "20px"
};

const iconStyle = {
  fontSize: "64px",
  lineHeight: "1",
  animation: "pulse 1s infinite alternate"
};

const titleStyle = {
  fontSize: "28px",
  fontWeight: "900",
  color: "#ff3333",
  margin: 0,
  letterSpacing: "2px"
};

const subtitleStyle = {
  fontSize: "16px",
  color: "#ff9999",
  margin: 0,
  lineHeight: "1.4"
};

const mistakesContainerStyle = {
  width: "100%",
  backgroundColor: "rgba(255, 51, 51, 0.1)",
  borderRadius: "12px",
  padding: "16px",
  border: "1px dashed rgba(255, 51, 51, 0.3)"
};

const mistakesLabelStyle = {
  fontSize: "11px",
  color: "#ff6666",
  fontWeight: "bold",
  letterSpacing: "1px",
  marginBottom: "10px"
};

const mistakesListStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  justifyContent: "center"
};

const mistakeTagStyle = {
  backgroundColor: "#ff3333",
  color: "#fff",
  padding: "6px 12px",
  borderRadius: "6px",
  fontSize: "13px",
  fontWeight: "bold"
};

const warningTextStyle = {
  fontSize: "14px",
  color: "#a3a3a3",
  fontStyle: "italic",
  lineHeight: "1.5"
};

const btnDisabledStyle = {
  width: "100%",
  padding: "16px",
  backgroundColor: "#333",
  color: "#888",
  border: "none",
  borderRadius: "8px",
  fontSize: "15px",
  fontWeight: "bold",
  cursor: "not-allowed",
  marginTop: "10px"
};

const btnActiveStyle = {
  width: "100%",
  padding: "16px",
  backgroundColor: "#ff3333",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  fontSize: "15px",
  fontWeight: "bold",
  cursor: "pointer",
  marginTop: "10px",
  transition: "all 0.2s",
  boxShadow: "0 4px 15px rgba(255, 51, 51, 0.4)"
};
