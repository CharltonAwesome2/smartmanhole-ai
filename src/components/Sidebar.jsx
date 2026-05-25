import { manholes } from "../data/mockSensorData";
import { calculateRisk } from "../utils/riskCalculator";

export default function Sidebar({ onRainToggle }) {
  return (
    <div className="sidebar">
      <h2>SmartManhole AI</h2>

      <button
        onClick={() => onRainToggle((prev) => !prev)}
        style={{
          marginTop: 20,
          padding: "10px",
          cursor: "pointer",
        }}
      >
        Toggle Rain Simulation
      </button>

      <p style={{ marginTop: 20 }}>Live infrastructure risk monitoring system</p>
    </div>
  );
}
