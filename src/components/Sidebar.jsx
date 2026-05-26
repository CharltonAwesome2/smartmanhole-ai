import { useEffect, useMemo, useState } from "react";
import { calculateRisk, getStatus, predictFutureRisk } from "@utils/advancedRiskEngine";

function toPercent(value) {
  return `${Math.round(value)}%`;
}

function summarize(manholes) {
  if (!manholes.length) {
    return { averageRisk: 0, criticalCount: 0 };
  }

  const risks = manholes.map(calculateRisk);

  return {
    averageRisk: risks.reduce((sum, risk) => sum + risk, 0) / risks.length,
    criticalCount: risks.filter((risk) => risk > 70).length,
  };
}

export default function Sidebar({ loading, error, rain, manholes, selected, activeDistrictName, onSelect, onDistrictSelect, onClearSelection, onRainToggle }) {
  const [expandedDistricts, setExpandedDistricts] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const { averageRisk, criticalCount } = summarize(manholes);

  const groupedManholes = useMemo(() => {
    const groups = new Map();
    const normalizedQuery = searchQuery.trim().toLowerCase();

    for (const manhole of manholes) {
      const districtName = manhole.districtName || `District ${manhole.district}` || "Unknown district";

      if (normalizedQuery) {
        const searchableText = `${districtName} ${manhole.name ?? ""}`.toLowerCase();

        if (!searchableText.includes(normalizedQuery)) {
          continue;
        }
      }

      if (!groups.has(districtName)) {
        groups.set(districtName, []);
      }

      groups.get(districtName).push(manhole);
    }

    return Array.from(groups.entries()).sort(([left], [right]) => left.localeCompare(right));
  }, [manholes, searchQuery]);

  useEffect(() => {
    if (!selected?.districtName) return;

    setExpandedDistricts((current) => ({
      ...current,
      [selected.districtName]: true,
    }));
  }, [selected?.districtName]);

  useEffect(() => {
    if (!activeDistrictName) return;

    setExpandedDistricts((current) => ({
      ...current,
      [activeDistrictName]: true,
    }));
  }, [activeDistrictName]);

  function toggleDistrict(districtName) {
    setExpandedDistricts((current) => ({
      ...current,
      [districtName]: !current[districtName],
    }));
  }

  function getRiskCounts(districtManholes) {
    return districtManholes.reduce(
      (counts, manhole) => {
        const risk = calculateRisk(manhole);

        if (risk <= 40) {
          counts.normal += 1;
        } else if (risk <= 70) {
          counts.warning += 1;
        } else {
          counts.critical += 1;
        }

        return counts;
      },
      { normal: 0, warning: 0, critical: 0 }
    );
  }

  const hasSearch = searchQuery.trim().length > 0;

  return (
    <div className="sidebar">
      <div className="sidebar__hero">
        <p className="sidebar__eyebrow">SmartManhole AI</p>
        <h1>Live infrastructure risk monitoring</h1>
        <p className="sidebar__lede">Mock sensors, rolling risk predictions, and a map that updates while the rain simulation is on.</p>
      </div>

      <button className={`rain-toggle ${rain ? "rain-toggle--active" : ""}`} onClick={() => onRainToggle((prev) => !prev)}>
        {rain ? "Rain simulation active" : "Enable rain simulation"}
      </button>

      <label className="sidebar-search">
        <span>Search district or node</span>
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Type to filter the list"
        />
      </label>

      <div className="sidebar__stats">
        <div>
          <span className="sidebar__stat-label">Average risk</span>
          <strong>{toPercent(averageRisk)}</strong>
        </div>
        <div>
          <span className="sidebar__stat-label">Critical nodes</span>
          <strong>{criticalCount}</strong>
        </div>
      </div>

      {error ? <div className="sidebar__alert">{error}</div> : null}

      <div className="sidebar__section">
        <div className="sidebar__section-header">
          <h2>Sensor list</h2>
          <div className="sidebar__section-actions">
            <span>{loading ? "Loading" : hasSearch ? `${groupedManholes.reduce((sum, [, districtManholes]) => sum + districtManholes.length, 0)} matches` : `${manholes.length} nodes`}</span>
            <button type="button" className="sidebar-clear" onClick={onClearSelection}>Clear selection</button>
          </div>
        </div>

        <div className="sidebar-legend" aria-label="Map legend">
          <span><i className="legend-dot legend-dot--normal" /> Normal</span>
          <span><i className="legend-dot legend-dot--warning" /> Warning</span>
          <span><i className="legend-dot legend-dot--critical" /> Critical</span>
          <span><i className="legend-dot legend-dot--dim" /> Outside active district</span>
        </div>

        <div className="sidebar__list sidebar__list--grouped">
          {groupedManholes.map(([districtName, districtManholes]) => {
            const isExpanded = hasSearch || Boolean(expandedDistricts[districtName]);
            const riskCounts = getRiskCounts(districtManholes);
            const averageDistrictRisk = summarize(districtManholes).averageRisk;

            return (
              <div key={districtName} className="sidebar-group">
                <button
                  type="button"
                  className={`sidebar-group__header ${activeDistrictName === districtName ? "sidebar-group__header--active" : ""}`}
                  onClick={() => {
                    toggleDistrict(districtName);
                    onDistrictSelect(districtName);
                  }}
                  aria-expanded={isExpanded}
                >
                  <div>
                    <strong>{districtName}</strong>
                    <span>{districtManholes.length} node{districtManholes.length === 1 ? "" : "s"}</span>
                  </div>
                  <div className="sidebar-group__badges">
                    <span className="sidebar-badge sidebar-badge--normal">{riskCounts.normal}</span>
                    <span className="sidebar-badge sidebar-badge--warning">{riskCounts.warning}</span>
                    <span className="sidebar-badge sidebar-badge--critical">{riskCounts.critical}</span>
                    <b>{isExpanded ? "−" : "+"}</b>
                  </div>
                </button>

                <div className="sidebar-group__summary">
                  <span>Avg risk {toPercent(averageDistrictRisk)}</span>
                  <span>{riskCounts.normal} normal · {riskCounts.warning} warning · {riskCounts.critical} critical</span>
                </div>

                {isExpanded ? (
                  <div className="sidebar-group__items">
                    {districtManholes.map((manhole) => {
                      const risk = calculateRisk(manhole);
                      const status = getStatus(risk);
                      const isSelected = selected?.id === manhole.id;

                      return (
                        <button
                          type="button"
                          key={manhole.id}
                          className={`sidebar-card ${isSelected ? "sidebar-card--selected" : ""}`}
                          onClick={() => {
                            onDistrictSelect(districtName);
                            onSelect({ ...manhole, ...predictFutureRisk(manhole) });
                          }}
                        >
                          <div>
                            <strong>{manhole.name}</strong>
                            <span>{status}</span>
                          </div>
                          <b>{toPercent(risk)}</b>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
