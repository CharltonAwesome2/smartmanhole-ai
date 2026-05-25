export function calculateRisk(sensor) {
  const risk =
    sensor.waterLevel * 0.5 +
    sensor.gasLevel * 0.3 +
    sensor.moisture * 0.2;

  return Math.min(100, Math.round(risk));
}

export function getStatus(risk) {
  if (risk <= 40) return "NORMAL";
  if (risk <= 70) return "WARNING";
  return "CRITICAL";
}