const historyMap = new Map();

export function calculateRisk(sensor) {
  const base =
    sensor.waterLevel * 0.45 +
    sensor.gasLevel * 0.35 +
    sensor.moisture * 0.2;

  return Math.min(100, Math.round(base));
}

export function predictFutureRisk(sensor) {
  const id = sensor.id;

  if (!historyMap.has(id)) {
    historyMap.set(id, []);
  }

  const history = historyMap.get(id);

  const currentRisk = calculateRisk(sensor);
  history.push(currentRisk);

  if (history.length > 5) history.shift();

  const trend =
    history.length > 1
      ? history[history.length - 1] - history[0]
      : 0;

  // prediction logic (simple but VERY convincing)
  const predictedRisk = Math.min(
    100,
    Math.max(0, currentRisk + trend * 2)
  );

  return {
    currentRisk,
    predictedRisk,
    trend
  };
}

export function getStatus(risk) {
  if (risk <= 40) return "NORMAL";
  if (risk <= 70) return "WARNING";
  return "CRITICAL";
}

export function getRiskHistory(sensorId) {
  if (!sensorId) return [];
  return [...(historyMap.get(sensorId) ?? [])];
}