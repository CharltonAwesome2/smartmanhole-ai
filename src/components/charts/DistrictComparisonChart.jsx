import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART, chartMargins, shortDistrictName } from "./chartTheme";
import styles from "./charts.module.css";

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipTitle}>{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className={styles.tooltipRow}>
          <span className={styles.tooltipDot} style={{ background: entry.color }} />
          {entry.name}: <strong>{Math.round(entry.value)}%</strong>
        </p>
      ))}
    </div>
  );
}

export default function DistrictComparisonChart({ districtSummaries, limit = 8 }) {
  const data = districtSummaries.slice(0, limit).map((district) => ({
    fullName: district.districtName,
    name: shortDistrictName(district.districtName),
    water: Math.round(district.avgWater),
    gas: Math.round(district.avgGas),
    risk: Math.round(district.avgRisk),
  }));

  if (!data.length) {
    return <p className={styles.empty}>No district data to chart yet.</p>;
  }

  return (
    <div className={styles.chartWrap}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={chartMargins} barGap={4} barCategoryGap="18%">
          <CartesianGrid stroke={CHART.grid} strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: CHART.axis, fontSize: 11 }} axisLine={{ stroke: CHART.grid }} tickLine={false} />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: CHART.axis, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(0, 112, 192, 0.06)" }} />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            formatter={(value) => (value === "water" ? "Waterflow" : "Gas")}
          />
          <Bar dataKey="water" name="water" fill={CHART.water} radius={[4, 4, 0, 0]} maxBarSize={36} />
          <Bar dataKey="gas" name="gas" fill={CHART.gas} radius={[4, 4, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
