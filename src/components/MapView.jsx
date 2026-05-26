import { MapContainer, TileLayer, CircleMarker, useMap } from "react-leaflet";
import { useEffect, useMemo, useState } from "react";
import { predictFutureRisk, getStatus } from "@utils/advancedRiskEngine";

function webMercatorToLatLng(sensor) {
  if (!Number.isFinite(sensor.originalX) || !Number.isFinite(sensor.originalY)) {
    return [sensor.lat ?? 0, sensor.lng ?? 0];
  }

  const radius = 6378137;
  const longitude = (sensor.originalX / radius) * (180 / Math.PI);
  const latitude = (2 * Math.atan(Math.exp(sensor.originalY / radius)) - Math.PI / 2) * (180 / Math.PI);

  return [latitude, longitude];
}

function MapBoundsController({ points, activeDistrictName }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;

    const nextPoints = activeDistrictName
      ? points.filter((point) => point.districtName === activeDistrictName)
      : points;

    if (!nextPoints.length) return;

    const bounds = nextPoints.map((point) => point.position);

    if (bounds.length === 1) {
      map.setView(bounds[0], 14);
      return;
    }

    map.fitBounds(bounds, { padding: [24, 24] });
  }, [activeDistrictName, map, points]);

  return null;
}

export default function MapView({ manholes, rain, onSelect, activeDistrictName, onClearSelection, loading }) {
  const [mapData, setMapData] = useState([]);

  const initialCenter = [-33.9315, 18.6345];

  useEffect(() => {
    setMapData(manholes);
  }, [manholes]);

  const points = useMemo(
    () =>
      mapData.map((manhole) => ({
        districtName: manhole.districtName,
        position: webMercatorToLatLng(manhole),
      })),
    [mapData]
  );

  if (loading && !mapData.length) {
    return <div className="map-shell map-shell--loading">Loading CPUT Bellville sensor network…</div>;
  }

  return (
    <MapContainer center={initialCenter} zoom={12} className="map-shell">
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapBoundsController points={points} activeDistrictName={activeDistrictName} />

      {mapData.map((m) => {
        const prediction = predictFutureRisk(m);
        const status = getStatus(prediction.currentRisk);
        const center = webMercatorToLatLng(m);
        const isActiveDistrict = !activeDistrictName || m.districtName === activeDistrictName;

        const color = status === "NORMAL" ? "green" : status === "WARNING" ? "orange" : "red";

        return (
          <CircleMarker
            key={m.id}
            center={center}
            radius={8}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: isActiveDistrict ? 0.6 : 0.18,
              opacity: isActiveDistrict ? 1 : 0.25,
            }}
            eventHandlers={{
              click: () => {
                if (!isActiveDistrict && activeDistrictName) {
                  onClearSelection?.();
                }

                onSelect({ ...m, ...prediction });
              },
            }}
          />
        );
      })}
    </MapContainer>
  );
}
