import { calculateRisk } from "@utils/advancedRiskEngine";

export default function PredictionPanel({ selected }) {
  if (!selected) {
    return <div className="prediction-panel prediction-panel--empty">Select a manhole to view predictions.</div>;
  }

  const currentRisk = selected.currentRisk ?? calculateRisk(selected);
  const predictedRisk = selected.predictedRisk ?? currentRisk;
  const trend = selected.trend ?? 0;
  const trendLabel = trend > 0 ? "RISING" : trend < 0 ? "FALLING" : "STABLE";

  return (
    <div className="prediction-panel">
      <p className="prediction-panel__eyebrow">Prediction</p>
      <h2>{selected.name}</h2>

      <div className="prediction-panel__grid">
        <div>
          <span>Current risk</span>
          <strong>{currentRisk}</strong>
        </div>
        <div>
          <span>Predicted risk</span>
          <strong>{predictedRisk}</strong>
        </div>
        <div>
          <span>Trend</span>
          <strong>{trendLabel}</strong>
        </div>
        <div>
          <span>Delta</span>
          <strong>{trend}</strong>
        </div>
      </div>
    </div>
  );
}