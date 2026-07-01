"use client";
import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import styles from "./PnlChart.module.css";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const pnl = data.pnl;
  const dailyPnl = data.dailyPnl;

  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipDate}>{label}</p>
      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Cumulative</span>
        <span
          className={`${styles.tooltipValue} mono`}
          style={{ color: pnl >= 0 ? "var(--profit-green)" : "var(--loss-red)" }}
        >
          {pnl >= 0 ? "+" : ""}₹{pnl.toLocaleString("en-IN")}
        </span>
      </div>
      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Day PnL</span>
        <span
          className={`${styles.tooltipValue} mono`}
          style={{ color: dailyPnl >= 0 ? "var(--profit-green)" : "var(--loss-red)" }}
        >
          {dailyPnl >= 0 ? "+" : ""}₹{dailyPnl.toLocaleString("en-IN")}
        </span>
      </div>
    </div>
  );
};

export default function PnlChart({ data, isProfit }) {
  const strokeColor = isProfit ? "#00e676" : "#ff5252";

  if (!data || data.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No data for selected period</p>
      </div>
    );
  }

  // Check if data crosses zero for split coloring
  const hasNegative = data.some((d) => d.pnl < 0);
  const hasPositive = data.some((d) => d.pnl > 0);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 8, left: -15, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(255,255,255,0.04)"
          vertical={false}
        />
        <XAxis
          dataKey="date"
          tick={{ fill: "#5a5b70", fontSize: 10, fontFamily: "Inter" }}
          axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
          tickLine={false}
          interval="preserveStartEnd"
          minTickGap={40}
        />
        <YAxis
          tick={{ fill: "#5a5b70", fontSize: 10, fontFamily: "JetBrains Mono" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => {
            if (Math.abs(v) >= 100000) return `${(v / 100000).toFixed(1)}L`;
            if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(0)}K`;
            return v;
          }}
        />
        {/* Zero reference line */}
        <ReferenceLine
          y={0}
          stroke="rgba(255,255,255,0.12)"
          strokeDasharray="4 4"
          strokeWidth={1}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="pnl"
          stroke={strokeColor}
          strokeWidth={2.5}
          dot={false}
          activeDot={{
            r: 5,
            fill: strokeColor,
            stroke: "#0a0b0f",
            strokeWidth: 3,
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
