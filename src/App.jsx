import { useEffect, useState } from "react";
import MapView from "@components/MapView";
import Sidebar from "@components/Sidebar";
import PredictionPanel from "@components/PredictionPanel";
import { fetchManholes } from "@api/mockApi";

export default function App() {
  const [rain, setRain] = useState(false);
  const [selected, setSelected] = useState(null);
  const [activeDistrictName, setActiveDistrictName] = useState("");
  const [manholes, setManholes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <div className="app">
      <Sidebar
        loading={loading}
        error={error}
        rain={rain}
        manholes={manholes}
        selected={selected}
        activeDistrictName={activeDistrictName}
        onSelect={(nextSelection) => {
          setSelected(nextSelection);
          if (nextSelection?.districtName) {
            setActiveDistrictName(nextSelection.districtName);
          }
        }}
        onDistrictSelect={setActiveDistrictName}
        onClearSelection={() => {
          setSelected(null);
          setActiveDistrictName("");
        }}
        onRainToggle={setRain}
      />

      <MapView
        manholes={manholes}
        rain={rain}
        activeDistrictName={activeDistrictName}
        onSelect={(nextSelection) => {
          setSelected(nextSelection);
          if (nextSelection?.districtName) {
            setActiveDistrictName(nextSelection.districtName);
          }
        }}
        onClearSelection={() => {
          setSelected(null);
          setActiveDistrictName("");
        }}
        loading={loading}
      />

      <PredictionPanel selected={selected} />
    </div>
  );
}

// https://www.icecape.co.za/dryice