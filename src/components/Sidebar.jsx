import { useEffect, useMemo, useState } from "react";
import {
  HiChevronDown,
  HiChevronRight,
  HiOutlineCloud,
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
} from "react-icons/hi2";
import { calculateRisk, getStatus, predictFutureRisk } from "@utils/advancedRiskEngine";
import Icon from "@components/ui/Icon";
import iconStyles from "@components/ui/icon.module.css";
import styles from "./Sidebar.module.css";

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

export default function Sidebar({
  variant = "default",
  loading,
  error,
  rain,
  manholes,
  selected,
  activeDistrictName,
  onSelect,
  onDistrictSelect,
  onClearSelection,
  onRainToggle,
}) {
  const [expandedDistricts, setExpandedDistricts] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const { averageRisk, criticalCount } = summarize(manholes);
  const isRail = variant === "rail";

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
    <aside className={`${styles.sidebar} ${isRail ? styles["sidebar--rail"] : ""}`}>
      <div className={styles.sidebarTop}>
        {!isRail ? (
          <div className={styles["sidebar__hero"]}>
            <p className={styles["sidebar__eyebrow"]}>SmartManhole AI</p>
            <h2>Live infrastructure risk monitoring</h2>
            <p className={styles["sidebar__lede"]}>
              Mock sensors, rolling risk predictions, and a map that updates while the rain simulation is on.
            </p>
          </div>
        ) : (
          <p className={styles["sidebar__rail-title"]}>Sensor network</p>
        )}

        <button
          type="button"
          className={`${styles["rain-toggle"]} ${rain ? styles["rain-toggle--active"] : ""}`}
          onClick={() => onRainToggle((prev) => !prev)}
          aria-pressed={rain}
        >
          <Icon as={HiOutlineCloud} size={18} className={iconStyles.icon} />
          <span>{rain ? "Rain simulation on" : "Rain simulation off"}</span>
        </button>

        <label className={styles["sidebar-search"]}>
          <span>Search district or node</span>
          <div className={styles["sidebar-search__field"]}>
            <Icon as={HiOutlineMagnifyingGlass} size={16} className={styles["sidebar-search__icon"]} />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Type to filter the list"
            />
          </div>
        </label>

        <div className={styles["sidebar__stats"]}>
          <div>
            <span className={styles["sidebar__stat-label"]}>Average risk</span>
            <strong>{toPercent(averageRisk)}</strong>
          </div>
          <div>
            <span className={styles["sidebar__stat-label"]}>Critical nodes</span>
            <strong>{criticalCount}</strong>
          </div>
        </div>

        {error ? <div className={styles["sidebar__alert"]}>{error}</div> : null}
      </div>

      <div className={styles.sidebarScroll}>
        <div className={styles["sidebar__section"]}>
          <div className={styles["sidebar__section-header"]}>
            <h2>Sensor list</h2>
            <div className={styles["sidebar__section-actions"]}>
              <span>
                {loading
                  ? "Loading"
                  : hasSearch
                    ? `${groupedManholes.reduce((sum, [, districtManholes]) => sum + districtManholes.length, 0)} matches`
                    : `${manholes.length} nodes`}
              </span>
              <button
                type="button"
                className={styles["sidebar-clear"]}
                onClick={onClearSelection}
                aria-label="Clear selection"
              >
                <Icon as={HiOutlineXMark} size={14} className={iconStyles.icon} />
                <span>Clear</span>
              </button>
            </div>
          </div>

          <div className={styles["sidebar-legend"]} aria-label="Map legend">
            <span>
              <i className={`${styles["legend-dot"]} ${styles["legend-dot--normal"]}`} /> Normal
            </span>
            <span>
              <i className={`${styles["legend-dot"]} ${styles["legend-dot--warning"]}`} /> Warning
            </span>
            <span>
              <i className={`${styles["legend-dot"]} ${styles["legend-dot--critical"]}`} /> Critical
            </span>
            <span>
              <i className={`${styles["legend-dot"]} ${styles["legend-dot--dim"]}`} /> Inactive district
            </span>
          </div>

          <div className={`${styles["sidebar__list"]} ${styles["sidebar__list--grouped"]}`}>
            {groupedManholes.map(([districtName, districtManholes]) => {
              const isExpanded = hasSearch || Boolean(expandedDistricts[districtName]);
              const riskCounts = getRiskCounts(districtManholes);
              const averageDistrictRisk = summarize(districtManholes).averageRisk;

              return (
                <div key={districtName} className={styles["sidebar-group"]}>
                  <button
                    type="button"
                    className={`${styles["sidebar-group__header"]} ${activeDistrictName === districtName ? styles["sidebar-group__header--active"] : ""}`}
                    onClick={() => {
                      toggleDistrict(districtName);
                      onDistrictSelect(districtName);
                    }}
                    aria-expanded={isExpanded}
                  >
                    <div>
                      <strong>{districtName}</strong>
                      <span>
                        {districtManholes.length} node{districtManholes.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className={styles["sidebar-group__badges"]}>
                      <span className={`${styles["sidebar-badge"]} ${styles["sidebar-badge--normal"]}`}>{riskCounts.normal}</span>
                      <span className={`${styles["sidebar-badge"]} ${styles["sidebar-badge--warning"]}`}>{riskCounts.warning}</span>
                      <span className={`${styles["sidebar-badge"]} ${styles["sidebar-badge--critical"]}`}>{riskCounts.critical}</span>
                      <Icon
                        as={isExpanded ? HiChevronDown : HiChevronRight}
                        size={16}
                        className={styles["sidebar-group__chevron"]}
                      />
                    </div>
                  </button>

                  <div className={styles["sidebar-group__summary"]}>
                    <span>Avg risk {toPercent(averageDistrictRisk)}</span>
                    <span>
                      {riskCounts.normal} normal · {riskCounts.warning} warning · {riskCounts.critical} critical
                    </span>
                  </div>

                  {isExpanded ? (
                    <div className={styles["sidebar-group__items"]}>
                      {districtManholes.map((manhole) => {
                        const risk = calculateRisk(manhole);
                        const status = getStatus(risk);
                        const isSelected = selected?.id === manhole.id;

                        return (
                          <button
                            type="button"
                            key={manhole.id}
                            className={`${styles["sidebar-card"]} ${isSelected ? styles["sidebar-card--selected"] : ""}`}
                            onClick={() => {
                              onDistrictSelect(districtName);
                              onSelect({ ...manhole, ...predictFutureRisk(manhole) });
                            }}
                          >
                            <div>
                              <strong>{manhole.name}</strong>
                              <span>{status}</span>
                            </div>
                            <span className={styles["sidebar-card__risk"]}>{toPercent(risk)}</span>
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
    </aside>
  );
}
