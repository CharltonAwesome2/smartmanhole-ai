import { manholes } from "@data/mockSensorData";

let liveData = structuredClone(manholes);

// simulate network latency
const delay = (ms) => new Promise(res => setTimeout(res, ms));

export async function fetchManholes() {
  await delay(300);
  return structuredClone(liveData);
}

export async function updateManholes(newData) {
  await delay(200);
  liveData = structuredClone(newData);
  return { status: "OK" };
}

// Optional: Simulate real-time updates
export async function fetchSingleManhole(id) {
  await delay(100);
  const found = liveData.find(m => m.id === id);
  return found ? structuredClone(found) : null;
}

// Optional: Update single manhole
export async function updateSingleManhole(id, updates) {
  await delay(150);
  const index = liveData.findIndex(m => m.id === id);
  if (index !== -1) {
    liveData[index] = { ...liveData[index], ...updates };
    return { status: "OK", data: structuredClone(liveData[index]) };
  }
  return { status: "NOT_FOUND" };
}