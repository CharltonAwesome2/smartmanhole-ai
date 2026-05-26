/** Chart colours aligned with dashboard tokens. */
export const CHART = {
  water: "rgb(var(--color-water-rgb))",
  waterLight: "rgb(var(--color-water-soft-rgb))",
  gas: "rgb(var(--color-gas-rgb))",
  gasLight: "rgb(var(--color-gas-soft-rgb))",
  accent: "rgb(var(--color-accent-rgb))",
  accentLight: "rgb(var(--color-info-rgb))",
  success: "rgb(var(--color-success-rgb))",
  warning: "rgb(var(--color-warning-rgb))",
  danger: "rgb(var(--color-danger-rgb))",
  grid: "rgba(var(--color-border-rgb), 0.35)",
  axis: "rgb(var(--color-text-soft-rgb))",
  tooltipBg: "rgb(var(--color-surface-rgb))",
  tooltipBorder: "rgb(var(--color-border-rgb))",
};

export const chartMargins = { top: 12, right: 16, left: 4, bottom: 4 };

export function shortDistrictName(name, max = 14) {
  if (!name || name.length <= max) return name ?? "";
  return `${name.slice(0, max - 1)}…`;
}
