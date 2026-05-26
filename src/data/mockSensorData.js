// Import ALL converted stormwater data for Cape Winelands
import allStormwaterSensors from './allStormwaterSensors.json';

// Export all data - no filtering to Bellville
export const manholes = allStormwaterSensors;

// Optional: Add helper to filter by district when needed
export function getSensorsByDistrict(districtCode) {
  return manholes.filter(m => m.district === districtCode);
}

export function getSensorsByRegion(regionName) {
  return manholes.filter(m => 
    m.districtName?.toLowerCase().includes(regionName.toLowerCase())
  );
}

// Real-time simulation update
export function refreshSensorReadings() {
  return manholes.map(m => ({
    ...m,
    waterLevel: simulateChange(m.waterLevel, 15),
    gasLevel: simulateChange(m.gasLevel, 10),
    moisture: simulateChange(m.moisture, 8),
    riskLevel: recalculateRisk(m.waterLevel, m.gasLevel)
  }));
}

function simulateChange(current, maxChange) {
  const change = (Math.random() - 0.5) * maxChange;
  let newValue = current + change;
  return Math.min(100, Math.max(0, newValue));
}

function recalculateRisk(waterLevel, gasLevel) {
  if (waterLevel > 70 || gasLevel > 70) return 'CRITICAL';
  if (waterLevel > 50 || gasLevel > 50) return 'WARNING';
  return 'NORMAL';
}