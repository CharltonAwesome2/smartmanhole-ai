import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from "react-leaflet";
import { useEffect, useState } from "react";
import L from "leaflet";

import { manholes as baseData } from "../data/mockSensorData";
import { calculateRisk, getStatus } from "../utils/riskCalculator";
import { defaultIcon } from "../utils/leafletFix";

L.Marker.prototype.options.icon = defaultIcon;

export default function MapView({ rain }) {
  const [data, setData] = useState(baseData);

  const center = [-33.9249, 18.4241];

  // 🌧️ IoT simulation engine
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev =>
        prev.map(m => {
          const coastalBoost = m.lat < -33.92 ? 1.3 : 1;

          return {
            ...m,
            waterLevel: Math.max(0, Math.min(100,
              m.waterLevel + (Math.random() - 0.3) * 8 * coastalBoost * (rain ? 1.5 : 1)
            )),
            gasLevel: Math.max(0, Math.min(100,
              m.gasLevel + (Math.random() - 0.5) * 5
            )),
            moisture: Math.max(0, Math.min(100,
              m.moisture + (Math.random() - 0.4) * 6 * (rain ? 1.3 : 1)
            )),
          };
        })
      );
    }, 2500);

    return () => clearInterval(interval);
  }, [rain]);

  return (
    <div style={{ flex: 1 }}>
      <MapContainer center={center} zoom={13} style={{ height: "100vh" }}>
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {data.map(m => {
          const risk = calculateRisk(m);
          const status = getStatus(risk);

          const color =
            status === "NORMAL"
              ? "green"
              : status === "WARNING"
              ? "orange"
              : "red";

          return (
            <div key={m.id}>
              <Marker position={[m.lat, m.lng]}>
                <Popup>
                  <h3>{m.name}</h3>
                  <p>Risk Score: {risk}</p>
                  <p>Status: {status}</p>
                  <p>Water: {m.waterLevel.toFixed(1)}%</p>
                  <p>Gas: {m.gasLevel.toFixed(1)}%</p>
                  <p>Moisture: {m.moisture.toFixed(1)}%</p>
                </Popup>
              </Marker>

              {/* glow indicator */}
              <CircleMarker
                center={[m.lat, m.lng]}
                radius={12}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: 0.4,
                }}
                className={status === "CRITICAL" ? "critical-pulse" : ""}
              />
            </div>
          );
        })}
      </MapContainer>
    </div>
  );
}