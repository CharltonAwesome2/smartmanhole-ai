import { useEffect, useState, useRef, Fragment } from "react";
import { fetchManholes } from "@api/mockApi";
import {
  FaNetworkWired,
  FaTriangleExclamation,
  FaCircleExclamation,
  FaCircleCheck,
  FaChartSimple,
  FaSpinner,
  FaLocationDot,
  FaDroplet,
  FaRuler,
  FaCloudMeatball,
  FaShieldHalved,
  FaDoorOpen,
  FaDoorClosed,
  FaFan,
} from "react-icons/fa6";
import styles from "./Overview2Page.module.css";

// Real Firebase endpoint - replace with your actual URL
const FIREBASE_URL = "https://smartmanhole-xyz-default-rtdb.firebaseio.com/smartmanhole/nodes.json";

export default function Overview2Page() {
  const [nodes, setNodes] = useState([]);
  const [counts, setCounts] = useState({ total: 0, critical: 0, warning: 0, healthy: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dataSource, setDataSource] = useState("loading");
  const [refreshMode, setRefreshMode] = useState("onload");
  const intervalRef = useRef(null);
  const clockIntervalRef = useRef(null);

  // Normalize a single sensor item into the "live" shape expected by the dashboard layout
  function normalizeSensor(m, idx, source = "unknown") {
    const id = m.id ?? m.node_id ?? m.nodeId ?? `node-${idx}`;
    const gasValue = m.gas_ppm ?? m.gasLevel ?? m.gas_raw ?? m.gas ?? null;
    const waterCmValue = m.water_cm ?? m.waterLevel ?? m.water_level_cm ?? m.water_level ?? m.water_level_mm ?? null;
    const gapValue =
      m.water_distance ??
      m.gap ??
      m.waterDistance ??
      (m.water_percent !== undefined && m.water_percent !== null ? Math.max(0, 100 - Number(m.water_percent)) : null);

    const live = {
      node_id: m.node_id ?? id,
      name: m.name ?? m.node_name ?? m.label ?? null,
      location:
        m.location ??
        (m.latitude && m.longitude ? `${m.latitude}, ${m.longitude}` : m.districtName ?? "Unknown"),
      street: m.street ?? null,
      water_level_cm: waterCmValue,
      water_distance: gapValue,
      gas_raw: gasValue,
      gas_risk:
        (m.gasRisk ?? m.gas_risk ?? m.gas_risk_level ?? m.gasRiskLevel) ||
        (m.gas_alert ? "WARNING" : null),
      servo_open: m.servoOpen ?? m.servo_open ?? m.valve_open ?? false,
      fan_on: m.fanOn ?? m.fan_on ?? m.fan_on_flag ?? false,
      risk_level: (m.riskLevel ?? m.risk_level ?? m.risk)?.toString() ?? "NORMAL",
      blockage_percent: m.blockage_percent ?? null,
      rise_cm_min: m.rise_cm_min ?? null,
      timestamp: m.timestamp ?? null,
      data_source: source,
    };
    return [id, { live }];
  }

  // Fetch real data from Firebase
  async function fetchLiveData() {
    try {
      const response = await fetch(FIREBASE_URL);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      
      if (data && Object.keys(data).length > 0) {
        return { success: true, data };
      }
      return { success: false, data: null };
    } catch (err) {
      console.warn("Live data fetch failed:", err.message);
      return { success: false, data: null };
    }
  }

  // Load data - live first, then mock appended at the bottom
  async function loadData() {
    try {
      const liveResult = await fetchLiveData();
      const mockData = await fetchManholes();
      
      const normalizedArray = [];
      let total = 0,
        critical = 0,
        warning = 0,
        healthy = 0;

      // Process real data FIRST (these will appear at the top)
      let hasLiveData = false;
      if (liveResult.success && liveResult.data) {
        hasLiveData = true;
        
        for (const nodeId in liveResult.data) {
          const nodeProfile = liveResult.data[nodeId];
          if (nodeProfile.live) {
            const livePayload = nodeProfile.live ?? {};
            const metaPayload = nodeProfile.meta ?? {};

            const [id, profile] = normalizeSensor(
              {
                ...livePayload,
                ...metaPayload,
                node_id: metaPayload.node_id || livePayload.node_id || nodeId,
                location: metaPayload.location || livePayload.location,
                street: metaPayload.street,
              },
              total,
              "live"
            );
            normalizedArray.push([id, profile]);
            total++;
            const risk = (profile.live.risk_level || "NORMAL").toUpperCase();
            if (risk === "CRITICAL") critical++;
            else if (risk === "WARNING") warning++;
            else healthy++;
          }
        }
      }

      // THEN append mock data at the BOTTOM
      const mockStartIndex = normalizedArray.length;
      (mockData || []).forEach((m, idx) => {
        const [id, profile] = normalizeSensor(m, mockStartIndex + idx, "mock");
        normalizedArray.push([id, profile]);
        total++;
        const risk = (profile.live.risk_level || "NORMAL").toUpperCase();
        if (risk === "CRITICAL") critical++;
        else if (risk === "WARNING") warning++;
        else healthy++;
      });

      if (total === 0) {
        setDataSource("error");
        setNodes([]);
        setCounts({ total: 0, critical: 0, warning: 0, healthy: 0 });
        return;
      }

      if (hasLiveData && mockData && mockData.length > 0) {
        setDataSource("live+mock");
      } else if (hasLiveData) {
        setDataSource("live");
      } else if (mockData && mockData.length > 0) {
        setDataSource("mock");
      } else {
        setDataSource("error");
      }

      setNodes(normalizedArray);
      setCounts({ total, critical, warning, healthy });
    } catch (err) {
      console.error("Overview2 loadData error", err);
      setDataSource("error");
      setNodes([]);
      setCounts({ total: 0, critical: 0, warning: 0, healthy: 0 });
    }
  }

  useEffect(() => {
    loadData();
    clockIntervalRef.current = setInterval(() => setCurrentTime(new Date()), 1000);

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(clockIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    clearInterval(intervalRef.current);

    if (refreshMode === "5s") {
      loadData();
      intervalRef.current = setInterval(loadData, 5000);
      return;
    }

    if (refreshMode === "30s") {
      loadData();
      intervalRef.current = setInterval(loadData, 30000);
      return;
    }

    if (refreshMode === "onload") {
      loadData();
    }
  }, [refreshMode]);

  const getRiskClass = (risk) => {
    switch (risk.toUpperCase()) {
      case "CRITICAL":
        return styles.critical;
      case "WARNING":
        return styles.warning;
      default:
        return styles.normal;
    }
  };

  const getGasRiskColor = (risk) => {
    switch (risk?.toUpperCase()) {
      case "CRITICAL":
        return "#ff1744";
      case "WARNING":
        return "#ffab00";
      default:
        return "#00e676";
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.innerWrapper}>
        <header className={styles.header}>
          <div className={styles.brand}>
            <h1>
              SmartManhole <span>AI</span>
            </h1>
            <p>MUNICIPAL OPERATIONS MONITOR</p>
            {dataSource === "live" && (
              <span className={styles.liveBadge}>
                <span className={styles.livePulse} /> LIVE DATA
              </span>
            )}
            {dataSource === "live+mock" && (
              <span className={styles.liveMockBadge}>
                <span className={styles.livePulse} /> LIVE + MOCK (Fallback at bottom)
              </span>
            )}
            {dataSource === "mock" && (
              <span className={styles.mockBadge}>
                <span className={styles.warningPulse} /> MOCK DATA ONLY
              </span>
            )}
            {dataSource === "error" && (
              <span className={styles.errorBadge}>
                ⚠️ CONNECTION ERROR
              </span>
            )}
          </div>
          <div className={styles.systemClock}>
            <span className={styles.livePulse} />
            LIVE FEED: <span>{currentTime.toLocaleTimeString()}</span>
          </div>
        </header>

        <section className={styles.summaryBar}>
          <div className={styles.summaryCard}>
            <FaNetworkWired />
            <div className={styles.summaryData}>
              <h3>{counts.total}</h3>
              <p>Total Areas</p>
            </div>
          </div>
          <div className={styles.summaryCard}>
            <FaTriangleExclamation style={{ color: "#ff1744" }} />
            <div className={styles.summaryData}>
              <h3>{counts.critical}</h3>
              <p>Critical Threats</p>
            </div>
          </div>
          <div className={styles.summaryCard}>
            <FaCircleExclamation style={{ color: "#ffab00" }} />
            <div className={styles.summaryData}>
              <h3>{counts.warning}</h3>
              <p>Warning Areas</p>
            </div>
          </div>
          <div className={styles.summaryCard}>
            <FaCircleCheck style={{ color: "#00e676" }} />
            <div className={styles.summaryData}>
              <h3>{counts.healthy}</h3>
              <p>Healthy Areas</p>
            </div>
          </div>
        </section>

        <main>
          <div className={styles.refreshControls}>
            <span className={styles.refreshLabel}>Refresh:</span>

            <button
              type="button"
              className={`${styles.refreshButton} ${refreshMode === "onload" ? styles.refreshButtonActive : ""}`}
              onClick={() => setRefreshMode("onload")}
            >
              Default (On load)
            </button>

            <button
              type="button"
              className={`${styles.refreshButton} ${refreshMode === "5s" ? styles.refreshButtonActive : ""}`}
              onClick={() => setRefreshMode("5s")}
            >
              Five Seconds
            </button>

            <button
              type="button"
              className={`${styles.refreshButton} ${refreshMode === "30s" ? styles.refreshButtonActive : ""}`}
              onClick={() => setRefreshMode("30s")}
            >
              30 Seconds
            </button>

            <button
              type="button"
              className={`${styles.refreshButton} ${refreshMode === "none" ? styles.refreshButtonActive : ""}`}
              onClick={() => setRefreshMode("none")}
            >
              None
            </button>
          </div>

          <div className={styles.sectionTitle}>
            <FaChartSimple /> Area Infrastructure Live Metrics
            {dataSource === "live+mock" && (
              <span className={styles.mockHint}>(Live data shown first, mock data appended below)</span>
            )}
            {dataSource === "mock" && (
              <span className={styles.mockHint}>(Showing fallback mock data only)</span>
            )}
          </div>

          <div className={styles.nodesGrid}>
            {nodes.length === 0 ? (
              <div className={styles.loadingMessage}>
                <FaSpinner className={styles.spinner} /> 
                {dataSource === "error" 
                  ? "Failed to connect to data source. Check console for details." 
                  : "Fetching records from backend + mock fallback..."}
              </div>
            ) : (
              <>
                {nodes.map(([id, profile], index) => {
                  const live = profile.live || {};
                  const risk = (live.risk_level || "NORMAL").toUpperCase();
                  const riskClass = getRiskClass(risk);
                  const isFirstMock = live.data_source === "mock" && 
                                     index > 0 && 
                                     nodes[index - 1]?.[1]?.live?.data_source === "live";
                  const showSeparator = isFirstMock && nodes.some(n => n[1]?.live?.data_source === "live");

                  return (
                    <Fragment key={id}>
                      {showSeparator && (
                        <div className={styles.mockSeparator}>
                          <hr />
                          <span className={styles.mockSeparatorText}>📊 MOCK DEMO DATA</span>
                          <hr />
                        </div>
                      )}
                      <div className={`${styles.nodeCard} ${riskClass}`}>
                        <div className={styles.nodeHeader}>
                          <div className={styles.nodeTitle}>
                            <h2>
                              {live.node_id ?? id}
                              {live.data_source === "mock" && (
                                <span className={styles.mockNodeBadge}> (Mock)</span>
                              )}
                            </h2>
                            <h3>{live.name ?? "Unnamed Zone"}</h3>
                            <p>
                              <FaLocationDot /> {live.location ?? "Unknown Coordinates"}
                              {live.street ? ` · ${live.street}` : ""}
                            </p>
                          </div>
                          <span className={styles.riskBadge}>{risk}</span>
                        </div>

                        <div className={styles.metricGroup}>
                          <div className={styles.metricBox}>
                            <div className={styles.metricLabel}>
                              <FaDroplet /> Water Level
                            </div>
                            <div className={styles.metricValue}>
                              {live.water_level_cm !== null && live.water_level_cm !== undefined
                                ? live.water_level_cm
                                : "--"}
                              <span className={styles.metricUnit}>cm</span>
                            </div>
                          </div>
                          <div className={styles.metricBox}>
                            <div className={styles.metricLabel}>
                              <FaRuler /> Gap Dist
                            </div>
                            <div className={styles.metricValue}>
                              {live.water_distance !== null && live.water_distance !== undefined
                                ? live.water_distance
                                : "--"}
                              <span className={styles.metricUnit}>cm</span>
                            </div>
                          </div>
                          <div className={styles.metricBox}>
                            <div className={styles.metricLabel}>
                              <FaCloudMeatball /> Gas Reading
                            </div>
                            <div className={styles.metricValue}>
                              {live.gas_raw !== null && live.gas_raw !== undefined ? live.gas_raw : "--"}
                              <span className={styles.metricUnit}>raw</span>
                            </div>
                          </div>
                          <div className={styles.metricBox}>
                            <div className={styles.metricLabel}>
                              <FaShieldHalved /> Gas Risk
                            </div>
                            <div
                              className={styles.metricValue}
                              style={{
                                fontSize: 14,
                                textTransform: "uppercase",
                                color: getGasRiskColor(live.gas_risk || risk),
                              }}
                            >
                              {live.gas_risk ?? "UNKNOWN"}
                            </div>
                          </div>
                        </div>

                        <div className={styles.hardwareFlags}>
                          <div className={`${styles.flag} ${live.servo_open ? styles.flagActive : ""}`}>
                            {live.servo_open ? <FaDoorOpen /> : <FaDoorClosed />} Valve Cover:{" "}
                            {live.servo_open ? "OPEN" : "CLOSED"}
                          </div>
                          <div className={`${styles.flag} ${live.fan_on ? styles.flagActive : ""}`}>
                            <FaFan className={live.fan_on ? styles.spinner : ""} /> Exhaust Fan:{" "}
                            {live.fan_on ? "RUNNING" : "IDLE"}
                          </div>
                        </div>
                      </div>
                    </Fragment>
                  );
                })}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}