import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { calculateRisk, getRiskHistory } from "@utils/advancedRiskEngine";
import { CHART, chartMargins } from "./chartTheme";
import styles from "./charts.module.css";

function buildSeries(selected) {
  if (!selected) return [];

  const history = getRiskHistory(selected.id);
  const current = selected.currentRisk ?? calculateRisk(selected);
  const predicted = selected.predictedRisk ?? current;

  if (history.length >= 2) {
    return history.map((risk, index) => ({
      label: index === history.length - 1 ? "Now" : `−${history.length - 1 - index}`,
      risk: Math.round(risk),
      type: index === history.length - 1 ? "current" : "history",
    }));
  }

  const trend = selected.trend ?? 0;
  const step = Math.max(2, Math.abs(trend) || 4);

  return [
    { label: "−4", risk: Math.max(0, Math.round(current - step * 2)), type: "history" },
    { label: "−3", risk: Math.max(0, Math.round(current - step * 1.5)), type: "history" },
    { label: "−2", risk: Math.max(0, Math.round(current - step)), type: "history" },
    { label: "−1", risk: Math.max(0, Math.round(current - step * 0.5)), type: "history" },
    { label: "Now", risk: Math.round(current), type: "current" },
    { label: "Pred", risk: Math.round(predicted), type: "predicted" },
  ];
}

function RiskTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipTitle}>{point.label}</p>
      <p className={styles.tooltipRow}>
        Risk index: <strong>{point.risk}</strong>
      </p>
    </div>
  );
}

export default function RiskTrendChart({ selected }) {
  const data = useMemo(() => buildSeries(selected), [selected]);

  if (!selected) {
    return <p className={styles.empty}>Select a sensor on the Map tab to view its risk trend.</p>;
  }

  return (
    <div className={styles.chartWrap}>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={chartMargins}>
          <CartesianGrid stroke={CHART.grid} strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: CHART.axis, fontSize: 11 }} axisLine={{ stroke: CHART.grid }} tickLine={false} />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: CHART.axis, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<RiskTooltip />} />
          <ReferenceLine y={40} stroke={CHART.success} strokeDasharray="6 4" label={{ value: "Normal", position: "insideTopRight", fontSize: 10, fill: CHART.success }} />
          <ReferenceLine y={70} stroke={CHART.warning} strokeDasharray="6 4" label={{ value: "Warning", position: "insideTopRight", fontSize: 10, fill: CHART.warning }} />
          <Line
            type="monotone"
            dataKey="risk"
            stroke={CHART.accent}
            strokeWidth={2.5}
            dot={{ r: 4, fill: CHART.accent, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: CHART.accentLight }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
