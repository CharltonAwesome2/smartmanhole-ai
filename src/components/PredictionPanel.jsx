import { HiOutlineBeaker, HiOutlineBolt, HiOutlineCloud } from "react-icons/hi2";
import DistrictComparisonChart from "@components/charts/DistrictComparisonChart";
import FleetRiskChart from "@components/charts/FleetRiskChart";
import RiskTrendChart from "@components/charts/RiskTrendChart";
import { calculateRisk } from "@utils/advancedRiskEngine";
import { Card, CardBody, CardPanelHeader } from "@components/ui/Card";
import Icon from "@components/ui/Icon";
import iconStyles from "@components/ui/icon.module.css";
import patterns from "@components/ui/patterns.module.css";
import styles from "./PredictionPanel.module.css";

const SIGNAL_ICONS = {
  water: HiOutlineCloud,
  gas: HiOutlineBolt,
  moisture: HiOutlineBeaker,
};

function toPercent(value) {
  return `${Math.round(value)}%`;
}

function SignalBar({ label, value, tone }) {
  const SignalIcon = SIGNAL_ICONS[tone];

  return (
    <div className={styles.signalBar}>
      <div className={styles.signalBarLabel}>
        <span className={styles.signalBarLabelText}>
          {SignalIcon ? <Icon as={SignalIcon} size={16} className={iconStyles.icon} /> : null}
          {label}
        </span>
        <strong>{toPercent(value)}</strong>
      </div>
      <div className={styles.signalBarTrack}>
        <span
          className={`${styles.signalBarFill} ${styles[`signalBarFill--${tone}`]}`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}

export default function PredictionPanel({
  selected,
  dashboardStats,
  districtSummaries,
  alerts,
  triggerSettings,
  onTriggerChange,
  activeDistrictName,
}) {
  const currentRisk = selected ? selected.currentRisk ?? calculateRisk(selected) : 0;
  const predictedRisk = selected ? selected.predictedRisk ?? currentRisk : 0;
  const trend = selected?.trend ?? 0;
  const trendLabel = trend > 0 ? "Rising" : trend < 0 ? "Falling" : "Stable";

  return (
    <div className={styles.panel}>
      <div className={styles.chartRow}>
        <Card variant="panel" className={styles.chartCard}>
          <CardPanelHeader
            eyebrow="District comparison"
            title="Waterflow vs gas by district"
            note="Grouped averages (%)"
          />
          <CardBody className={styles.chartBody}>
            <DistrictComparisonChart districtSummaries={districtSummaries} />
          </CardBody>
        </Card>

        <Card variant="panel" className={styles.chartCard}>
          <CardPanelHeader
            eyebrow="Fleet risk"
            title="Average risk by district"
            note="Sorted by severity"
          />
          <CardBody className={styles.chartBody}>
            <FleetRiskChart districtSummaries={districtSummaries} />
          </CardBody>
        </Card>
      </div>

      <div className={styles.detailRow}>
        <Card variant="panel" className={styles.detailCard}>
          <CardPanelHeader
            eyebrow="Selected sensor"
            title={selected?.name ?? "No manhole selected"}
            note={selected?.districtName || activeDistrictName || "—"}
          />
          <CardBody>
            {selected ? (
              <>
                <div className={styles.metricGrid}>
                  <div className={styles.metricTile}>
                    <span className={styles.metricLabel}>Current risk</span>
                    <strong className={styles.metricValue}>{currentRisk}</strong>
                  </div>
                  <div className={styles.metricTile}>
                    <span className={styles.metricLabel}>Predicted</span>
                    <strong className={styles.metricValue}>{predictedRisk}</strong>
                  </div>
                  <div className={styles.metricTile}>
                    <span className={styles.metricLabel}>Trend</span>
                    <strong className={styles.metricValue}>{trendLabel}</strong>
                  </div>
                  <div className={styles.metricTile}>
                    <span className={styles.metricLabel}>Delta</span>
                    <strong className={styles.metricValue}>{trend}</strong>
                  </div>
                </div>

                <div className={styles.signalGrid}>
                  <SignalBar label="Waterflow" value={selected.waterLevel ?? 0} tone="water" />
                  <SignalBar label="Gas build-up" value={selected.gasLevel ?? 0} tone="gas" />
                  <SignalBar label="Moisture" value={selected.moisture ?? 0} tone="moisture" />
                </div>
              </>
            ) : (
              <div className={patterns.listEmpty}>Select a manhole on the Map tab to inspect live readings.</div>
            )}
          </CardBody>
        </Card>

        <Card variant="panel" className={styles.detailCard}>
          <CardPanelHeader eyebrow="Risk trend" title="Rolling risk index" note={selected ? "Live history" : "—"} />
          <CardBody className={styles.chartBody}>
            <RiskTrendChart selected={selected} />
          </CardBody>
        </Card>
      </div>

      <div className={styles.bottomRow}>
        <Card variant="panel">
          <CardPanelHeader eyebrow="Trigger settings" title="Signal thresholds" note="Waterflow-first response" />
          <CardBody relaxed>
            <div className={styles.triggerForm}>
              <label className={styles.triggerField}>
                Waterflow critical
                <div className={styles.triggerRow}>
                  <input
                    type="range"
                    min="40"
                    max="100"
                    value={triggerSettings.waterCritical}
                    onChange={(event) => onTriggerChange("waterCritical", Number(event.target.value))}
                  />
                  <strong>{triggerSettings.waterCritical}%</strong>
                </div>
              </label>

              <label className={styles.triggerField}>
                Gas critical
                <div className={styles.triggerRow}>
                  <input
                    type="range"
                    min="30"
                    max="100"
                    value={triggerSettings.gasCritical}
                    onChange={(event) => onTriggerChange("gasCritical", Number(event.target.value))}
                  />
                  <strong>{triggerSettings.gasCritical}%</strong>
                </div>
              </label>

              <label className={styles.triggerField}>
                Moisture warning
                <div className={styles.triggerRow}>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={triggerSettings.moistureWarning}
                    onChange={(event) => onTriggerChange("moistureWarning", Number(event.target.value))}
                  />
                  <strong>{triggerSettings.moistureWarning}%</strong>
                </div>
              </label>

              <label className={styles.triggerToggle}>
                <input
                  type="checkbox"
                  checked={triggerSettings.combinedSpike}
                  onChange={(event) => onTriggerChange("combinedSpike", event.target.checked)}
                />
                Alert on combined waterflow + gas spikes
              </label>

              <label className={styles.triggerToggle}>
                <input
                  type="checkbox"
                  checked={triggerSettings.sustainedBreaches}
                  onChange={(event) => onTriggerChange("sustainedBreaches", event.target.checked)}
                />
                Require sustained breaches
              </label>
            </div>
          </CardBody>
        </Card>

        <Card variant="panel">
          <CardPanelHeader eyebrow="Live alerts" title="Triggered feed" note={`${alerts.length} active`} />
          <CardBody relaxed>
            <div className={`${patterns.list} ${patterns["list--relaxed"]}`}>
              {alerts.length ? (
                alerts.map((alert) => (
                  <Card key={alert.id} variant={alert.severity} className={patterns.listItem}>
                    <strong>{alert.label}</strong>
                    <span>{alert.detail}</span>
                  </Card>
                ))
              ) : (
                <div className={patterns.listEmpty}>No active trigger breaches right now.</div>
              )}
            </div>
          </CardBody>
        </Card>

        <Card variant="panel">
          <CardPanelHeader eyebrow="Fleet snapshot" title="District overview" note={`${dashboardStats.totalNodes} nodes`} />
          <CardBody>
            <div className={patterns.list}>
              {districtSummaries.slice(0, 5).map((district) => (
                <Card key={district.districtName} variant="nested" className={patterns.listItem}>
                  <strong>{district.districtName}</strong>
                  <span>{toPercent(district.avgRisk)} average risk</span>
                  <small>
                    {district.criticalCount} critical · {district.warningCount} warning
                  </small>
                </Card>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
