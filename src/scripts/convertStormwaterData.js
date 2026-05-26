import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { convertToLatLon } from '../utils/coordinateConverter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to your CSV file
const csvFilePath = path.join(__dirname, '../../public/data/Routine_Inland_Water_Quality_Monitoring.csv');
const outputPath = path.join(__dirname, '../../src/data/allStormwaterSensors.json');

console.log('📊 Reading CSV from:', csvFilePath);

// Check if file exists
if (!fs.existsSync(csvFilePath)) {
  console.error('❌ CSV file not found!');
  process.exit(1);
}

// Read the CSV file
const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
const lines = csvContent.split('\n');

// Get headers from first line
const headers = lines[0].split(',').map(h => h.trim());
console.log('📋 Headers found:', headers);

const results = [];

// Helper functions
function generateWaterLevel(row) {
  let baseValue = Math.random() * 60 + 20;
  if (row.WTRB_TYPE === 'Sea SW Outlet') {
    baseValue = baseValue * 0.7;
  }
  return Math.min(100, Math.max(5, Math.floor(baseValue)));
}

function generateGasLevel(row) {
  let baseValue = Math.random() * 40 + 10;
  const urbanDistricts = ['6', '5', '7'];
  if (urbanDistricts.includes(row.DSTR)) {
    baseValue = baseValue * 1.5;
  }
  return Math.min(100, Math.max(5, Math.floor(baseValue)));
}

function generateMoisture(row) {
  let baseValue = Math.random() * 50 + 20;
  if (row.WTRB_TYPE?.includes('Sea')) {
    baseValue = baseValue * 1.3;
  }
  return Math.min(95, Math.max(10, Math.floor(baseValue)));
}

function getDistrictName(code) {
  const districts = {
    '1': 'Atlantis', '2': 'Blaauwberg', '3': 'Brackenfell/Kuils River',
    '4': 'Cape Town (City)', '5': 'Central', '6': 'Bellville',
    '7': 'Parow', '8': 'Muizenberg', '9': 'Khayelitsha', '10': 'Mitchells Plain',
    '11': 'Philippi', '12': 'Fish Hoek', '13': 'Hout Bay', '14': 'Llandudno',
    '15': 'Milnerton', '16': 'Durbanville', '17': 'Kraaifontein',
    '18': 'Stellenbosch', '19': 'Paarl', '20': 'Wellington', 
    '21': 'Franschhoek', '22': 'Robertson'
  };
  return districts[code] || `District ${code}`;
}

// Parse each line (skip header row)
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  // Parse CSV line (handles quoted values)
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  
  // Create row object
  const row = {};
  headers.forEach((header, idx) => {
    row[header] = values[idx] || '';
  });
  
  // Skip if missing coordinates
  if (!row.X || !row.Y) continue;
  
  const x = parseFloat(row.X);
  const y = parseFloat(row.Y);
  
  if (isNaN(x) || isNaN(y)) continue;
  
  // Convert coordinates
  const { lat, lon } = convertToLatLon(x, y);
  
  if (!lat || !lon) continue;
  
  const waterLevel = generateWaterLevel(row);
  const gasLevel = generateGasLevel(row);
  const moisture = generateMoisture(row);
  
  results.push({
    id: parseInt(row.OBJECTID) || results.length + 1,
    name: row.LCTN_DSCR || `Stormwater Point ${row.OBJECTID}`,
    wqmId: row.WQM_ID,
    type: row.TYPE,
    monitoringType: row.MNTR_TYPE,
    waterbodyType: row.WTRB_TYPE,
    status: row.MNTR_SITE_STS,
    district: row.DSTR,
    districtName: getDistrictName(row.DSTR),
    planningRegion: row.PLNG_RGN,
    catchmentCoastal: row.CTMT_CSTL,
    serviceCode: row.SCN_SRV_CODE_NAME,
    lat: lat,
    lng: lon,
    waterLevel: waterLevel,
    gasLevel: gasLevel,
    moisture: moisture,
    riskLevel: waterLevel > 70 || gasLevel > 70 ? 'CRITICAL' : (waterLevel > 50 || gasLevel > 50 ? 'WARNING' : 'NORMAL'),
    originalX: x,
    originalY: y
  });
  
  // Show progress for first few
  if (results.length <= 5) {
    console.log(`✅ Converted: ${row.LCTN_DSCR} (District ${row.DSTR})`);
  }
}

console.log(`\n✅ Successfully converted ${results.length} monitoring points`);

// Group by district for summary
const districtSummary = results.reduce((acc, r) => {
  acc[r.district] = (acc[r.district] || 0) + 1;
  return acc;
}, {});

console.log('\n📈 Summary by district:');
Object.entries(districtSummary)
  .sort()
  .forEach(([district, count]) => {
    console.log(`   District ${district} (${getDistrictName(district)}): ${count} points`);
  });

// Save to file
fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
console.log(`\n💾 Saved to: ${outputPath}`);

// Also save as GeoJSON
const geojson = {
  type: 'FeatureCollection',
  features: results.map(r => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [r.lng, r.lat]
    },
    properties: {
      id: r.id,
      name: r.name,
      district: r.district,
      districtName: r.districtName,
      waterLevel: r.waterLevel,
      gasLevel: r.gasLevel,
      riskLevel: r.riskLevel
    }
  }))
};

const geojsonPath = path.join(__dirname, '../../src/data/allStormwaterSensors.geojson');
fs.writeFileSync(geojsonPath, JSON.stringify(geojson, null, 2));
console.log(`🗺️ GeoJSON saved to: ${geojsonPath}`);