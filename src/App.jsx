import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import {
  HiOutlineAdjustmentsHorizontal,
  HiOutlineMap,
  HiOutlineMoon,
  HiOutlineSquares2X2,
  HiOutlineSun,
} from "react-icons/hi2";
import { fetchManholes } from "@api/mockApi";
import { calculateRisk } from "@utils/advancedRiskEngine";
import { StatCard } from "@components/ui/Card";
import Icon from "@components/ui/Icon";
import iconStyles from "@components/ui/icon.module.css";
// const OverviewPage = lazy(() => import("@pages/OverviewPage"));
const Overview2Page = lazy(() => import("@pages/Overview2Page"));
const DataPage = lazy(() => import("@pages/DataPage"));
const MapPage = lazy(() => import("@pages/MapPage"));
const OperationsPage = lazy(() => import("@pages/OperationsPage"));

function formatPercent(value) {
  return `${Math.round(value)}%`;
}

export default function App() {
  const [rain, setRain] = useState(false);
  const [selected, setSelected] = useState(null);
  const [activeDistrictName, setActiveDistrictName] = useState("");
  const [activePage, setActivePage] = useState(() => {
    if (typeof window === "undefined") return "overview";

    return window.localStorage.getItem("smartmanhole-active-page") ?? "overview";
  });
  const [runtimeClock, setRuntimeClock] = useState("");
  const [themeMode, setThemeMode] = useState(() => {
    if (typeof window === "undefined") return "light";

    return window.localStorage.getItem("smartmanhole-theme") ?? "light";
  });
  const [manholes, setManholes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [triggerSettings, setTriggerSettings] = useState({
    waterCritical: 70,
    gasCritical: 65,
    moistureWarning: 60,
    combinedSpike: true,
    sustainedBreaches: true,
  });

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    window.localStorage.setItem("smartmanhole-theme", themeMode);
  }, [themeMode]);

  useEffect(() => {
    window.localStorage.setItem("smartmanhole-active-page", activePage);
  }, [activePage]);

  useEffect(() => {
    const updateClock = () => {
      setRuntimeClock(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    };

    updateClock();
    const clockInterval = window.setInterval(updateClock, 1000);

    return () => window.clearInterval(clockInterval);
  }, []);

  useEffect(() => {
    let active = true;

    fetchManholes()
      .then((nextManholes) => {
        if (!active) return;

        setManholes(nextManholes);
        setSelected(nextManholes[0] ? { ...nextManholes[0] } : null);
        setActiveDistrictName(nextManholes[0]?.districtName || "");
      })
      .catch(() => {
        if (!active) return;

        setError("Unable to load mock sensor data.");
      })
      .finally(() => {
        if (!active) return;

        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const dashboardStats = useMemo(() => {
    const activeDistrictNodes = activeDistrictName
      ? manholes.filter((manhole) => manhole.districtName === activeDistrictName)
      : manholes;

    const averageRisk = manholes.length
      ? manholes.reduce((sum, manhole) => sum + calculateRisk(manhole), 0) / manholes.length
      : 0;

    const highestWater = manholes.reduce((current, manhole) => (manhole.waterLevel > (current?.waterLevel ?? -1) ? manhole : current), null);
    const highestGas = manholes.reduce((current, manhole) => (manhole.gasLevel > (current?.gasLevel ?? -1) ? manhole : current), null);

    const criticalCount = manholes.filter((manhole) => calculateRisk(manhole) > 70).length;
    const warningCount = manholes.filter((manhole) => {
      const risk = calculateRisk(manhole);
      return risk > 40 && risk <= 70;
    }).length;

    return {
      totalNodes: manholes.length,
      activeDistrictNodes: activeDistrictNodes.length,
      averageRisk,
      criticalCount,
      warningCount,
      highestWater,
      highestGas,
      activeDistrictName: activeDistrictName || "All districts",
      districtCount: new Set(manholes.map((manhole) => manhole.districtName)).size,
      waterAverage: manholes.length ? manholes.reduce((sum, manhole) => sum + manhole.waterLevel, 0) / manholes.length : 0,
      gasAverage: manholes.length ? manholes.reduce((sum, manhole) => sum + manhole.gasLevel, 0) / manholes.length : 0,
    };
  }, [activeDistrictName, manholes]);

  const districtSummaries = useMemo(() => {
    const byDistrict = new Map();

    for (const manhole of manholes) {
      const districtName = manhole.districtName || "Unknown district";

      if (!byDistrict.has(districtName)) {
        byDistrict.set(districtName, []);
      }

      byDistrict.get(districtName).push(manhole);
    }

    return Array.from(byDistrict.entries())
      .map(([districtName, districtManholes]) => {
        const totalWater = districtManholes.reduce((sum, manhole) => sum + manhole.waterLevel, 0);
        const totalGas = districtManholes.reduce((sum, manhole) => sum + manhole.gasLevel, 0);
        const totalMoisture = districtManholes.reduce((sum, manhole) => sum + manhole.moisture, 0);
        const averageRisk = districtManholes.reduce((sum, manhole) => sum + calculateRisk(manhole), 0) / districtManholes.length;

        return {
          districtName,
          count: districtManholes.length,
          avgWater: totalWater / districtManholes.length,
          avgGas: totalGas / districtManholes.length,
          avgMoisture: totalMoisture / districtManholes.length,
          avgRisk: averageRisk,
          criticalCount: districtManholes.filter((manhole) => calculateRisk(manhole) > 70).length,
          warningCount: districtManholes.filter((manhole) => {
            const risk = calculateRisk(manhole);
            return risk > 40 && risk <= 70;
          }).length,
        };
      })
      .sort((left, right) => right.avgRisk - left.avgRisk);
  }, [manholes]);

  const alerts = useMemo(() => {
    const generated = manholes.flatMap((manhole) => {
      const items = [];

      if (manhole.waterLevel >= triggerSettings.waterCritical) {
        items.push({
          id: `${manhole.id}-water`,
          severity: "critical",
          label: `${manhole.name}: waterflow high`,
          detail: `Waterflow at ${Math.round(manhole.waterLevel)}%`,
        });
      }

      if (manhole.gasLevel >= triggerSettings.gasCritical) {
        items.push({
          id: `${manhole.id}-gas`,
          severity: "critical",
          label: `${manhole.name}: gas build-up high`,
          detail: `Gas level at ${Math.round(manhole.gasLevel)}%`,
        });
      }

      if (manhole.moisture >= triggerSettings.moistureWarning) {
        items.push({
          id: `${manhole.id}-moisture`,
          severity: "warning",
          label: `${manhole.name}: moisture elevated`,
          detail: `Moisture at ${Math.round(manhole.moisture)}%`,
        });
      }

      if (triggerSettings.combinedSpike && manhole.waterLevel >= 55 && manhole.gasLevel >= 45) {
        items.push({
          id: `${manhole.id}-combined`,
          severity: "warning",
          label: `${manhole.name}: combined flow/gas spike`,
          detail: "Both primary signals are elevated together",
        });
      }

      return items;
    });

    return generated.slice(0, 8);
  }, [manholes, triggerSettings]);

  const lastUpdated = useMemo(() => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), [manholes, loading, selected]);

  function updateTriggerSetting(key, value) {
    setTriggerSettings((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleSelection(nextSelection) {
    setSelected(nextSelection);
    if (nextSelection?.districtName) {
      setActiveDistrictName(nextSelection.districtName);
    }
  }

  function clearSelection() {
    setSelected(null);
    setActiveDistrictName("");
  }

  const navItems = [
    // { id: "overview", label: "Overview", Icon: HiOutlineSquares2X2 },
    { id: "overview2", label: "Overview 2", Icon: HiOutlineSquares2X2 },
    { id: "map", label: "Map", Icon: HiOutlineMap },
    { id: "operations", label: "Operations", Icon: HiOutlineAdjustmentsHorizontal },
    { id: "data", label: "Data" },
  ];

  const ThemeIcon = themeMode === "dark" ? HiOutlineSun : HiOutlineMoon;

  function toggleTheme() {
    setThemeMode((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  }

  return (
    <div className="app">
      <header className="dashboard-header">
        <div className="dashboard-header__brand">
          <h1>SmartManhole AI — Waterflow and gas monitoring</h1>
        </div>

        <div className="dashboard-header__status">
          <div className="system-clock" aria-live="polite">
            <span className="live-pulse" />LIVE FEED: <span>{runtimeClock || "Connecting..."}</span>
          </div>

          <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            <Icon as={ThemeIcon} size={17} className={iconStyles.icon} />
            <span>{themeMode === "dark" ? "Light mode" : "Dark mode"}</span>
          </button>
        </div>

        <nav className="dashboard-nav" aria-label="Dashboard pages">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={activePage === item.id ? "dashboard-nav__button dashboard-nav__button--active" : "dashboard-nav__button"}
              onClick={() => setActivePage(item.id)}
            >
              {item.Icon ? <Icon as={item.Icon} size={17} className={iconStyles.icon} /> : null}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </header>

      {activePage === "operations" ? (
        <div className="dashboard-subheader">
          <p className="dashboard-subheader__intro">
            ESP32-fed stormwater sensors, grouped by district, with live trigger controls and alert presentation.
          </p>
          <div className="dashboard-kpis">
            <StatCard label="Active nodes" value={dashboardStats.activeDistrictNodes} hint={dashboardStats.activeDistrictName} />
            <StatCard
              label="Critical nodes"
              value={dashboardStats.criticalCount}
              hint={`${dashboardStats.warningCount} warnings`}
            />
            <StatCard
              label="Peak waterflow"
              value={formatPercent(dashboardStats.highestWater?.waterLevel ?? 0)}
              hint={dashboardStats.highestWater?.name ?? "No data"}
            />
            <StatCard
              label="Peak gas"
              value={formatPercent(dashboardStats.highestGas?.gasLevel ?? 0)}
              hint={dashboardStats.highestGas?.name ?? "No data"}
            />
            <StatCard label="Districts" value={dashboardStats.districtCount} hint={`Last update ${lastUpdated}`} />
          </div>
        </div>
      ) : null}

      <main
        className={
          activePage === "map"
            ? "dashboard-body dashboard-body--map"
            : activePage === "overview"
              ? "dashboard-body dashboard-body--embed"
              : "dashboard-body"
        }
      >
        <Suspense
          fallback={
            <div className="dashboard-loading-shell">
              Loading section...
            </div>
          }
        >
          {/* {activePage === "overview" ? <OverviewPage /> : null} */}
          {activePage === "overview2" ? (
            <Overview2Page dashboardStats={dashboardStats} formatPercent={formatPercent} />
          ) : null}
          {activePage === "map" ? (
            <MapPage
              loading={loading}
              error={error}
              rain={rain}
              manholes={manholes}
              selected={selected}
              activeDistrictName={activeDistrictName}
              onSelect={handleSelection}
              onDistrictSelect={setActiveDistrictName}
              onClearSelection={clearSelection}
              onRainToggle={setRain}
            />
          ) : null}
          {activePage === "operations" ? (
            <OperationsPage
              selected={selected}
              dashboardStats={dashboardStats}
              districtSummaries={districtSummaries}
              alerts={alerts}
              triggerSettings={triggerSettings}
              onTriggerChange={updateTriggerSetting}
              activeDistrictName={activeDistrictName}
            />
          ) : null}
          {activePage === "data" ? <DataPage /> : null}
        </Suspense>
      </main>
    </div>
  );
}
