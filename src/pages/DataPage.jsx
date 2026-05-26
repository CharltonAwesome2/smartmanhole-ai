import { useEffect, useMemo, useState } from "react";
import { onValue, ref } from "firebase/database";
import { database, firebaseReady, FIREBASE_NODE_PATH } from "@api/firebase";
import { fetchManholes } from "@api/mockApi";
import { calculateRisk } from "@utils/advancedRiskEngine";
import { Card, CardBody, CardPanelHeader, StatCard } from "@components/ui/Card";
import { PageGrid, PageShell } from "@components/ui/PageShell";
import patterns from "@components/ui/patterns.module.css";
import styles from "./DataPage.module.css";

const SOURCE_LABELS = {
  live: "Firebase live feed",
  test: "Mock test feed",
};

function clampPercent(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return 0;
  return Math.max(0, Math.min(100, Math.round(numericValue)));
}

function getSeverity(risk) {
  if (risk >= 70) return "critical";
  if (risk >= 45) return "warning";
  return "healthy";
}

function normalizeLiveFeed(payload) {
  if (!payload || typeof payload !== "object") return [];

  return Object.entries(payload).map(([key, entry]) => {
    const meta = entry?.meta ?? {};
    const live = entry?.live ?? {};
    const waterPercent = clampPercent(live.water_percent ?? live.water_cm ?? 0);
    const gasPercent = clampPercent(live.gas_ppm ? live.gas_ppm / 10 : 0);
    const blockagePercent = clampPercent(live.blockage_percent ?? 0);
    const risk = clampPercent(
      live.risk_level ?? Math.round(waterPercent * 0.4 + gasPercent * 0.35 + blockagePercent * 0.25),
    );

    return {
      id: meta.node_id ?? key,
      name: meta.node_id ?? key,
      districtName: meta.location ?? "Live feed",
      street: meta.street ?? "",
      waterLevel: waterPercent,
      gasLevel: gasPercent,
      moisture: blockagePercent,
      currentRisk: risk,
      riskBand: getSeverity(risk),
      gasAlert: Boolean(live.gas_alert),
      servoOpen: Boolean(live.servo_open),
      riseRate: Number(live.rise_cm_min ?? 0),
      timestamp: live.timestamp ?? "",
      source: "live",
    };
  });
}

function enrichRows(rows, source) {
  return rows.map((row) => {
    const currentRisk = clampPercent(row.currentRisk ?? calculateRisk(row));

    return {
      ...row,
      currentRisk,
      riskBand: row.riskBand ?? getSeverity(currentRisk),
      source,
    };
  });
}

function metricWidth(value) {
  return `${clampPercent(value)}%`;
}

function MetricTrack({ label, value, tone }) {
  return (
    <div className={styles.metricTrack}>
      <div className={styles.metricTrack__labelRow}>
        <span>{label}</span>
        <strong>{clampPercent(value)}%</strong>
      </div>
      <div className={styles.metricTrack__rail} aria-hidden>
        <div className={styles[`metricTrack__fill--${tone}`]} style={{ width: metricWidth(value) }} />
      </div>
    </div>
  );
}

function RiskComparison({ rows }) {
  const comparisonRows = rows.slice(0, 8);

  return (
    <div className={styles.comparisonChart}>
      {comparisonRows.length ? (
        comparisonRows.map((row) => (
          <article key={row.id} className={styles.comparisonRow}>
            <div className={styles.comparisonRow__meta}>
              <strong>{row.name}</strong>
              <span>{row.districtName}</span>
            </div>

            <div className={styles.comparisonRow__tracks}>
              <MetricTrack label="Water" value={row.waterLevel} tone="water" />
              <MetricTrack label="Gas" value={row.gasLevel} tone="gas" />
              <MetricTrack label="Blockage" value={row.moisture} tone="warning" />
              <MetricTrack label="Risk" value={row.currentRisk} tone={row.riskBand === "critical" ? "danger" : "risk"} />
            </div>
          </article>
        ))
      ) : (
        <p className={patterns.emptyState}>No sensor data is available yet.</p>
      )}
    </div>
  );
}

export default function DataPage() {
  const [sourceMode, setSourceMode] = useState("test");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadTestRows() {
      setLoading(true);
      setError("");

      try {
        const data = await fetchManholes();
        if (cancelled) return;

        setRows(enrichRows(data, "test"));
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : "Unable to load test data.");
          setRows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (sourceMode === "test") {
      void loadTestRows();
      return () => {
        cancelled = true;
      };
    }

    if (!firebaseReady || !database) {
      setLoading(false);
      setRows([]);
      setError("Configure the Firebase environment variables to enable the live feed.");
      return () => {
        cancelled = true;
      };
    }

    setLoading(true);
    setError("");

    const liveRef = ref(database, FIREBASE_NODE_PATH);
    const unsubscribe = onValue(
      liveRef,
      (snapshot) => {
        if (cancelled) return;

        const snapshotValue = snapshot.val();
        setRows(enrichRows(normalizeLiveFeed(snapshotValue), "live"));
        setLoading(false);
      },
      (liveError) => {
        if (cancelled) return;

        setError(liveError?.message ?? "Unable to load live Firebase data.");
        setRows([]);
        setLoading(false);
      },
    );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [sourceMode]);

  const metrics = useMemo(() => {
    const nodeCount = rows.length;
    const criticalCount = rows.filter((row) => row.currentRisk >= 70).length;
    const warningCount = rows.filter((row) => row.currentRisk >= 45 && row.currentRisk < 70).length;
    const averageRisk = nodeCount
      ? Math.round(rows.reduce((sum, row) => sum + row.currentRisk, 0) / nodeCount)
      : 0;
    const averageWater = nodeCount
      ? Math.round(rows.reduce((sum, row) => sum + row.waterLevel, 0) / nodeCount)
      : 0;

    return {
      nodeCount,
      criticalCount,
      warningCount,
      averageRisk,
      averageWater,
    };
  }, [rows]);

  const sortedRows = useMemo(
    () => [...rows].sort((left, right) => right.currentRisk - left.currentRisk),
    [rows],
  );

  const sourceLabel = SOURCE_LABELS[sourceMode];
  const liveReadyNote = sourceMode === "live" ? (firebaseReady ? "Realtime Database connected" : "Firebase env vars missing") : "Local test data";

  return (
    <PageShell>
      <PageGrid columns={4}>
        <StatCard
          label="Selected source"
          value={sourceLabel}
          hint={liveReadyNote}
          variant="stat"
          valueSize="lg"
        />
        <StatCard
          label="Nodes in view"
          value={metrics.nodeCount}
          hint={loading ? "Refreshing feed" : "Current snapshot"}
          variant="water"
          valueSize="lg"
        />
        <StatCard
          label="Average risk"
          value={`${metrics.averageRisk}%`}
          hint={`${metrics.criticalCount} critical, ${metrics.warningCount} warning`}
          variant="risk"
          valueSize="lg"
        />
        <StatCard
          label="Average water"
          value={`${metrics.averageWater}%`}
          hint="Used for quick overflow checks"
          variant="gas"
          valueSize="lg"
        />
      </PageGrid>

      <PageGrid columns={2}>
        <Card variant="panel" className={styles.dataPanel}>
          <CardPanelHeader
            eyebrow="Feed source"
            title="Live or test data"
            note={sourceMode === "live" ? "Firebase stream" : "Mock data"}
          />
          <CardBody relaxed className={styles.dataPanelBody}>
            <div className={styles.sourceToggle} role="tablist" aria-label="Choose data source">
              <button
                type="button"
                className={`${styles.sourceToggleButton} ${sourceMode === "live" ? styles["sourceToggleButton--active"] : ""}`}
                onClick={() => setSourceMode("live")}
                aria-pressed={sourceMode === "live"}
              >
                Live
              </button>
              <button
                type="button"
                className={`${styles.sourceToggleButton} ${sourceMode === "test" ? styles["sourceToggleButton--active"] : ""}`}
                onClick={() => setSourceMode("test")}
                aria-pressed={sourceMode === "test"}
              >
                Test
              </button>
            </div>

            <p className={styles.sourceDescription}>
              {sourceMode === "live"
                ? "Realtime updates are read from Firebase when the environment is configured."
                : "Test mode keeps the existing mock dataset so map and operations views stay stable."}
            </p>

            {error ? <p className={styles.sourceError}>{error}</p> : null}
            {!error && loading ? <p className={patterns.emptyState}>Loading sensor feed...</p> : null}

            {!loading && !error ? (
              <div className={styles.metaGrid}>
                {sortedRows.slice(0, 3).map((row) => (
                  <article key={row.id} className={styles.metaCard}>
                    <div className={styles.metaCard__header}>
                      <strong>{row.name}</strong>
                      <span className={`${styles.badge} ${styles[`badge--${row.riskBand}`]}`}>{row.currentRisk}%</span>
                    </div>
                    <p>{row.districtName}</p>
                    <small>
                      Water {row.waterLevel}% · Gas {row.gasLevel}% · Blockage {row.moisture}%
                    </small>
                  </article>
                ))}
              </div>
            ) : null}
          </CardBody>
        </Card>

        <Card variant="panel" className={styles.dataPanel}>
          <CardPanelHeader
            eyebrow="Graph view"
            title="Risk and sensor comparison"
            note="Water, gas, blockage, and risk"
          />
          <CardBody relaxed className={styles.dataPanelBody}>
            <RiskComparison rows={sortedRows} />
          </CardBody>
        </Card>
      </PageGrid>

      <Card variant="panel" className={styles.dataFeedPanel}>
        <CardPanelHeader
          eyebrow="Node feed"
          title="Recent sensor cards"
          note={`${sortedRows.length} records`}
        />
        <CardBody relaxed>
          <div className={styles.feedGrid}>
            {sortedRows.length ? (
              sortedRows.map((row) => (
                <article key={row.id} className={styles.feedCard}>
                  <div className={styles.feedCard__header}>
                    <div>
                      <strong>{row.name}</strong>
                      <p>
                        {row.districtName}
                        {row.street ? ` · ${row.street}` : ""}
                      </p>
                    </div>
                    <span className={`${styles.badge} ${styles[`badge--${row.riskBand}`]}`}>{row.currentRisk}%</span>
                  </div>
                  <div className={styles.feedCard__metrics}>
                    <span>Water {row.waterLevel}%</span>
                    <span>Gas {row.gasLevel}%</span>
                    <span>Blockage {row.moisture}%</span>
                  </div>
                </article>
              ))
            ) : (
              <p className={patterns.emptyState}>No nodes are available in the current feed.</p>
            )}
          </div>
        </CardBody>
      </Card>
    </PageShell>
  );
}
