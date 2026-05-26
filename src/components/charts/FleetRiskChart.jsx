import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART, chartMargins, shortDistrictName } from "./chartTheme";
import styles from "./charts.module.css";

function riskColor(risk) {
  if (risk > 70) return CHART.danger;
  if (risk > 40) return CHART.warning;
  return CHART.accent;
}

export default function FleetRiskChart({ districtSummaries, limit = 10 }) {
  const data = districtSummaries.slice(0, limit).map((d) => ({
    name: shortDistrictName(d.districtName, 18),
    fullName: d.districtName,
    risk: Math.round(d.avgRisk),
  }));

  if (!data.length) {
    return <p className={styles.empty}>No fleet risk data available.</p>;
  }

  return (
    <div className={styles.chartWrap}>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} layout="vertical" margin={{ ...chartMargins, left: 8 }}>
          <CartesianGrid stroke={CHART.grid} strokeDasharray="4 4" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tick={{ fill: CHART.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            width={100}
            tick={{ fill: CHART.axis, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload }) =>
              active && payload?.[0] ? (
                <div className={styles.tooltip}>
                  <p className={styles.tooltipTitle}>{payload[0].payload.fullName}</p>
                  <p className={styles.tooltipRow}>
                    Avg risk: <strong>{payload[0].value}</strong>
                  </p>
                </div>
              ) : null
            }
            cursor={{ fill: "rgba(0, 112, 192, 0.06)" }}
          />
          <Bar dataKey="risk" name="Average risk" radius={[0, 4, 4, 0]} maxBarSize={18}>
            {data.map((entry) => (
              <Cell key={entry.fullName} fill={riskColor(entry.risk)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
