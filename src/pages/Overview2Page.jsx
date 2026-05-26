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
  FaArrowTrendUp,
  FaArrowTrendDown,
  FaMinus,
  FaFilter,
  FaClockRotateLeft,
  FaTriangleExclamation as FaWarning,
} from "react-icons/fa6";
import styles from "./Overview2Page.module.css";

// Real Firebase endpoint - replace with your actual URL
const FIREBASE_URL = "https://smartmanhole-xyz-default-rtdb.firebaseio.com/smartmanhole/nodes.json";
const REFRESH_MODE_KEY = "overview2-refresh-mode";
const SOURCE_MODE_KEY = "overview2-source-mode";
const HISTORY_POINTS = 18;

export default function Overview2Page() {
  const [nodes, setNodes] = useState([]);
  const [counts, setCounts] = useState({ total: 0, critical: 0, warning: 0, healthy: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dataSource, setDataSource] = useState("loading");
  const [refreshMode, setRefreshMode] = useState(() => {
    if (typeof window === "undefined") return "refresh";
    return window.localStorage.getItem(REFRESH_MODE_KEY) ?? "refresh";
  });
  const [sourceMode, setSourceMode] = useState(() => {
    if (typeof window === "undefined") return "live+mock";
    return window.localStorage.getItem(SOURCE_MODE_KEY) ?? "live+mock";
  });
  const [riskFilter, setRiskFilter] = useState("all");
  const [pauseOnError, setPauseOnError] = useState(true);
  const [failedFetchCount, setFailedFetchCount] = useState(0);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const [lastSuccessAt, setLastSuccessAt] = useState(null);
  const [refreshMsRemaining, setRefreshMsRemaining] = useState(0);
  const [refreshMsTotal, setRefreshMsTotal] = useState(0);
  const intervalRef = useRef(null);
  const clockIntervalRef = useRef(null);
  const countdownRef = useRef(null);
  const previousMetricsRef = useRef({});
  const historyRef = useRef({});

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

  function toNumberOrNull(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function attachTrendMetrics(normalizedArray) {
    const nextPreviousMetrics = { ...previousMetricsRef.current };

    const trended = normalizedArray.map(([id, profile]) => {
      const live = profile.live ?? {};
      const water = toNumberOrNull(live.water_level_cm);
      const gas = toNumberOrNull(live.gas_raw);
      const previous = previousMetricsRef.current[id] ?? {};

      const deltaWater = water !== null && previous.water !== undefined ? water - previous.water : null;
      const deltaGas = gas !== null && previous.gas !== undefined ? gas - previous.gas : null;

      const previousHistory = historyRef.current[id] ?? { water: [], gas: [] };
      const waterHistory = water !== null ? [...previousHistory.water, water].slice(-HISTORY_POINTS) : previousHistory.water;
      const gasHistory = gas !== null ? [...previousHistory.gas, gas].slice(-HISTORY_POINTS) : previousHistory.gas;

      historyRef.current[id] = {
        water: waterHistory,
        gas: gasHistory,
      };

      if (water !== null || gas !== null) {
        nextPreviousMetrics[id] = {
          water: water !== null ? water : previous.water,
          gas: gas !== null ? gas : previous.gas,
        };
      }

      return [
        id,
        {
          ...profile,
          live: {
            ...live,
            delta_water: deltaWater,
            delta_gas: deltaGas,
            water_history: waterHistory,
            gas_history: gasHistory,
          },
        },
      ];
    });

    previousMetricsRef.current = nextPreviousMetrics;
    return trended;
  }

  function markFetchFailure() {
    setFailedFetchCount((current) => current + 1);
    setConsecutiveFailures((current) => current + 1);
  }

  function markFetchSuccess() {
    setConsecutiveFailures(0);
    setLastSuccessAt(new Date());
  }

  // Load data - live first, then mock appended at the bottom
  async function loadData() {
    try {
      const wantsLive = sourceMode === "live" || sourceMode === "live+mock";
      const wantsMock = sourceMode === "mock" || sourceMode === "live+mock";

      const liveResult = wantsLive ? await fetchLiveData() : { success: false, data: null };
      const mockData = wantsMock ? await fetchManholes() : [];
      
      const normalizedArray = [];
      let total = 0,
        critical = 0,
        warning = 0,
        healthy = 0;

      // Process real data first (if enabled)
      let hasLiveData = false;
      let hasMockData = false;

      if (wantsLive && liveResult.success && liveResult.data) {
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

      // Append mock data after live (if enabled)
      if (wantsMock && mockData && mockData.length > 0) {
        hasMockData = true;
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
      }

      if (total === 0) {
        markFetchFailure();
        setDataSource("error");
        setNodes([]);
        setCounts({ total: 0, critical: 0, warning: 0, healthy: 0 });
        return;
      }

      if (wantsLive && !hasLiveData) {
        markFetchFailure();
      } else {
        markFetchSuccess();
      }

      if (hasLiveData && hasMockData) {
        setDataSource("live+mock");
      } else if (hasLiveData) {
        setDataSource("live");
      } else if (hasMockData) {
        setDataSource("mock");
      } else {
        setDataSource("error");
      }

      setNodes(attachTrendMetrics(normalizedArray));
      setCounts({ total, critical, warning, healthy });
    } catch (err) {
      console.error("Overview2 loadData error", err);
      markFetchFailure();
      setDataSource("error");
      setNodes([]);
      setCounts({ total: 0, critical: 0, warning: 0, healthy: 0 });
    }
  }

  function stopRefreshCountdown() {
    clearInterval(countdownRef.current);
    setRefreshMsRemaining(0);
    setRefreshMsTotal(0);
  }

  function startRefreshCountdown(totalMs) {
    clearInterval(countdownRef.current);
    setRefreshMsTotal(totalMs);
    setRefreshMsRemaining(totalMs);

    countdownRef.current = setInterval(() => {
      setRefreshMsRemaining((previous) => (previous <= 100 ? 0 : previous - 100));
    }, 100);
  }

  useEffect(() => {
    clockIntervalRef.current = setInterval(() => setCurrentTime(new Date()), 1000);

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(clockIntervalRef.current);
      clearInterval(countdownRef.current);
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(REFRESH_MODE_KEY, refreshMode);
  }, [refreshMode]);

  useEffect(() => {
    window.localStorage.setItem(SOURCE_MODE_KEY, sourceMode);
    void loadData();
  }, [sourceMode]);

  useEffect(() => {
    clearInterval(intervalRef.current);
    clearInterval(countdownRef.current);

    if (pauseOnError && consecutiveFailures >= 3) {
      stopRefreshCountdown();
      return;
    }

    if (refreshMode === "5s") {
      const durationMs = 5000;
      const runRefresh = async () => {
        await loadData();
        startRefreshCountdown(durationMs);
      };

      void runRefresh();
      intervalRef.current = setInterval(() => {
        void runRefresh();
      }, durationMs);
      return;
    }

    if (refreshMode === "30s") {
      const durationMs = 30000;
      const runRefresh = async () => {
        await loadData();
        startRefreshCountdown(durationMs);
      };

      void runRefresh();
      intervalRef.current = setInterval(() => {
        void runRefresh();
      }, durationMs);
      return;
    }

    if (refreshMode === "refresh") {
      stopRefreshCountdown();
      void loadData();
      return;
    }

    if (refreshMode === "none") {
      stopRefreshCountdown();
    }
  }, [refreshMode, pauseOnError, consecutiveFailures]);

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

  function formatDelta(value) {
    if (value === null || value === undefined || Number.isNaN(value)) return "--";
    const rounded = Math.round(value * 10) / 10;
    return `${rounded > 0 ? "+" : ""}${rounded}`;
  }

  function renderTrendIcon(value) {
    if (value === null || value === undefined || Number.isNaN(value) || value === 0) {
      return <FaMinus className={styles.deltaNeutralIcon} />;
    }

    return value > 0 ? <FaArrowTrendUp className={styles.deltaUpIcon} /> : <FaArrowTrendDown className={styles.deltaDownIcon} />;
  }

  function sparklinePath(values, width, height) {
    if (!values.length) return "";
    if (values.length === 1) {
      const y = height / 2;
      return `M 0 ${y} L ${width} ${y}`;
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    return values
      .map((value, index) => {
        const x = (index / (values.length - 1)) * width;
        const y = height - ((value - min) / range) * height;
        return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");
  }

  function Sparkline({ values, tone = "water" }) {
    const width = 88;
    const height = 22;
    const path = sparklinePath(values, width, height);

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className={styles.sparkline} aria-hidden>
        <path d={path} className={tone === "water" ? styles.sparklineWater : styles.sparklineGas} fill="none" />
      </svg>
    );
  }

  const filteredNodes = nodes.filter(([, profile]) => {
    if (riskFilter === "all") return true;
    const risk = (profile?.live?.risk_level || "NORMAL").toUpperCase();
    return risk === riskFilter;
  });

  const isRefreshPaused = pauseOnError && consecutiveFailures >= 3;

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

            <div className={styles.fetchMetaRow}>
              <span className={styles.fetchMetaPill}>
                <FaClockRotateLeft /> Last success: {lastSuccessAt ? lastSuccessAt.toLocaleTimeString() : "--"}
              </span>
              <span className={styles.fetchMetaPillError}>
                <FaWarning /> Failures: {failedFetchCount} (consecutive: {consecutiveFailures})
              </span>
            </div>
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
          <div className={styles.controlRow}>
            <div className={styles.sourceControls}>
              <span className={styles.refreshLabel}>Source:</span>
              <button
                type="button"
                className={`${styles.refreshButton} ${sourceMode === "live+mock" ? styles.refreshButtonActive : ""}`}
                onClick={() => setSourceMode("live+mock")}
              >
                Live + Mock
              </button>
              <button
                type="button"
                className={`${styles.refreshButton} ${sourceMode === "live" ? styles.refreshButtonActive : ""}`}
                onClick={() => setSourceMode("live")}
              >
                Live only
              </button>
              <button
                type="button"
                className={`${styles.refreshButton} ${sourceMode === "mock" ? styles.refreshButtonActive : ""}`}
                onClick={() => setSourceMode("mock")}
              >
                Mock only
              </button>
            </div>

            <label className={styles.pauseToggle}>
              <input
                type="checkbox"
                checked={pauseOnError}
                onChange={(event) => {
                  setPauseOnError(event.target.checked);
                  if (!event.target.checked) {
                    setConsecutiveFailures(0);
                  }
                }}
              />
              <span>Pause on repeated errors</span>
            </label>
          </div>

          <div className={styles.refreshControls}>
            <span className={styles.refreshLabel}>Refresh:</span>

            <button
              type="button"
              className={`${styles.refreshButton} ${refreshMode === "refresh" ? styles.refreshButtonActive : ""}`}
              onClick={() => setRefreshMode("refresh")}
            >
              Refresh now
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

          {(refreshMode === "5s" || refreshMode === "30s") && refreshMsTotal > 0 ? (
            <div className={styles.refreshProgressWrap}>
              <div className={styles.refreshProgressMeta}>
                <span>
                  {isRefreshPaused
                    ? "Auto-refresh paused after repeated errors"
                    : `Next refresh in ${(refreshMsRemaining / 1000).toFixed(1)}s`}
                </span>
                <span>{refreshMode === "5s" ? "5s cycle" : "30s cycle"}</span>
              </div>
              <div className={styles.refreshProgressTrack}>
                <div
                  className={styles.refreshProgressFill}
                  style={{ width: `${Math.max(0, (refreshMsRemaining / refreshMsTotal) * 100)}%` }}
                />
              </div>
            </div>
          ) : null}

          <div className={styles.filterControls}>
            <span className={styles.refreshLabel}><FaFilter /> Filter:</span>
            <button
              type="button"
              className={`${styles.refreshButton} ${riskFilter === "all" ? styles.refreshButtonActive : ""}`}
              onClick={() => setRiskFilter("all")}
            >
              All
            </button>
            <button
              type="button"
              className={`${styles.refreshButton} ${riskFilter === "CRITICAL" ? styles.refreshButtonActive : ""}`}
              onClick={() => setRiskFilter("CRITICAL")}
            >
              Critical
            </button>
            <button
              type="button"
              className={`${styles.refreshButton} ${riskFilter === "WARNING" ? styles.refreshButtonActive : ""}`}
              onClick={() => setRiskFilter("WARNING")}
            >
              Warning
            </button>
            <button
              type="button"
              className={`${styles.refreshButton} ${riskFilter === "NORMAL" ? styles.refreshButtonActive : ""}`}
              onClick={() => setRiskFilter("NORMAL")}
            >
              Normal
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
            {filteredNodes.length === 0 ? (
              <div className={styles.loadingMessage}>
                <FaSpinner className={styles.spinner} /> 
                {nodes.length === 0
                  ? (dataSource === "error"
                    ? "Failed to connect to data source. Check console for details."
                    : "Fetching records from backend + mock fallback...")
                  : "No nodes match the selected risk filter."}
              </div>
            ) : (
              <>
                {filteredNodes.map(([id, profile], index) => {
                  const live = profile.live || {};
                  const risk = (live.risk_level || "NORMAL").toUpperCase();
                  const riskClass = getRiskClass(risk);
                  const isFirstMock = live.data_source === "mock" && 
                                     index > 0 && 
                                     filteredNodes[index - 1]?.[1]?.live?.data_source === "live";
                  const showSeparator = isFirstMock && filteredNodes.some(n => n[1]?.live?.data_source === "live");

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
                            <div className={styles.metricDelta}>
                              {renderTrendIcon(live.delta_water)}
                              <span>{formatDelta(live.delta_water)} since last refresh</span>
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
                            <div className={styles.metricDelta}>
                              {renderTrendIcon(live.delta_gas)}
                              <span>{formatDelta(live.delta_gas)} since last refresh</span>
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

                        <div className={styles.sparklineRow}>
                          <div className={styles.sparklineBox}>
                            <span>Water trend</span>
                            <Sparkline values={live.water_history ?? []} tone="water" />
                          </div>
                          <div className={styles.sparklineBox}>
                            <span>Gas trend</span>
                            <Sparkline values={live.gas_history ?? []} tone="gas" />
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