import MapView from "@components/MapView";
import Sidebar from "@components/Sidebar";
import { MapPane, PageGrid } from "@components/ui/PageShell";

export default function MapPage({
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
  return (
    <PageGrid columns="map">
      <Sidebar
        variant="rail"
        loading={loading}
        error={error}
        rain={rain}
        manholes={manholes}
        selected={selected}
        activeDistrictName={activeDistrictName}
        onSelect={onSelect}
        onDistrictSelect={onDistrictSelect}
        onClearSelection={onClearSelection}
        onRainToggle={onRainToggle}
      />

      <MapPane>
        <MapView
          manholes={manholes}
          rain={rain}
          activeDistrictName={activeDistrictName}
          onSelect={onSelect}
          onClearSelection={onClearSelection}
          loading={loading}
        />
      </MapPane>
    </PageGrid>
  );
}
