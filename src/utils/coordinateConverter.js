// utils/coordinateConverter.js
import proj4 from 'proj4';

// Define Cape Town's projected coordinate system (Hartebeesthoek94 / LO19)
// You may need to verify the exact EPSG code from City of Cape Town's GIS portal
const projectedCrs = '+proj=tmerc +lat_0=0 +lon_0=19 +k=1 +x_0=0 +y_0=0 +ellps=WGS84 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
const wgs84 = '+proj=longlat +datum=WGS84 +no_defs';

export function convertToLatLon(x, y) {
  const [lon, lat] = proj4(projectedCrs, wgs84, [x, y]);
  return { lat, lon };
}