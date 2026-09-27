const EARTH_RADIUS_M = 6371008.8;
const METERS_PER_DEGREE = (Math.PI * EARTH_RADIUS_M) / 180;
const METERS_PER_FOOT = 0.3048;

const toRadians = (degrees) => (degrees * Math.PI) / 180;

export const feetToMeters = (feet) => feet * METERS_PER_FOOT;

export function normalizeRotation(degrees) {
  return ((Math.round(degrees) % 360) + 360) % 360;
}

export function offsetLatLng({ lat, lng }, eastMeters, northMeters) {
  return {
    lat: lat + northMeters / METERS_PER_DEGREE,
    lng: lng + eastMeters / (METERS_PER_DEGREE * Math.cos(toRadians(lat))),
  };
}

export function bearingDegrees(from, to) {
  const east = (to.lng - from.lng) * METERS_PER_DEGREE * Math.cos(toRadians(from.lat));
  const north = (to.lat - from.lat) * METERS_PER_DEGREE;
  return normalizeRotation((Math.atan2(east, north) * 180) / Math.PI);
}

function rotateOffset(east, north, rotation) {
  const angle = toRadians(rotation);
  return [
    east * Math.cos(angle) + north * Math.sin(angle),
    -east * Math.sin(angle) + north * Math.cos(angle),
  ];
}

export function pointAlongRotation(center, rotation, meters) {
  const [east, north] = rotateOffset(0, meters, rotation);
  return offsetLatLng(center, east, north);
}

export function getFootprintCorners({ center, rotation }, { widthFt, depthFt }) {
  const halfWidth = feetToMeters(widthFt) / 2;
  const halfDepth = feetToMeters(depthFt) / 2;

  return [
    [-halfWidth, halfDepth],
    [halfWidth, halfDepth],
    [halfWidth, -halfDepth],
    [-halfWidth, -halfDepth],
  ].map(([east, north]) => offsetLatLng(center, ...rotateOffset(east, north, rotation)));
}

export function cornersToPolygon(corners) {
  const ring = corners.map(({ lat, lng }) => [lng, lat]);
  return { type: "Polygon", coordinates: [[...ring, ring[0]]] };
}
