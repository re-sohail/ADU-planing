import bbox from "@turf/bbox";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import booleanWithin from "@turf/boolean-within";
import buffer from "@turf/buffer";
import pointToLineDistance from "@turf/point-to-line-distance";
import { lineString, point } from "@turf/helpers";
import { bearingDegrees, cornersToPolygon, getFootprintCorners } from "./footprint";

export const SETBACK_FT = 4;

export const PLACEMENT_STATUS = {
  OK: "ok",
  SETBACK: "setback",
  OUTSIDE: "outside",
};

function polygonRings(geometry) {
  if (geometry.type === "Polygon") return geometry.coordinates;
  return geometry.coordinates.flat();
}

function minDistanceToRings(points, rings) {
  let min = Infinity;
  for (const ring of rings) {
    const line = lineString(ring);
    for (const coordinates of points) {
      const distance = pointToLineDistance(point(coordinates), line, { units: "feet" });
      if (distance < min) min = distance;
    }
  }
  return min;
}

export function distanceToLotLineFt(footprint, parcel) {
  const footprintRing = footprint.coordinates[0];
  const parcelRings = polygonRings(parcel);

  return Math.min(
    minDistanceToRings(footprintRing, parcelRings),
    minDistanceToRings(parcelRings.flat(), [footprintRing])
  );
}

export function isWithinParcel(footprint, parcel) {
  if (parcel.type === "Polygon") return booleanWithin(footprint, parcel);
  return parcel.coordinates.some((coordinates) =>
    booleanWithin(footprint, { type: "Polygon", coordinates })
  );
}

export function validatePlacement(footprint, parcel, setbackFt = SETBACK_FT) {
  if (!isWithinParcel(footprint, parcel)) {
    return { status: PLACEMENT_STATUS.OUTSIDE, distanceFt: null };
  }

  const distanceFt = distanceToLotLineFt(footprint, parcel);
  const status = distanceFt >= setbackFt ? PLACEMENT_STATUS.OK : PLACEMENT_STATUS.SETBACK;
  return { status, distanceFt };
}

export function getBuildableArea(parcel, setbackFt = SETBACK_FT) {
  const area = buffer(parcel, -setbackFt, { units: "feet" });
  return area?.geometry ?? null;
}

export function getParcelAnchor(parcel, gridSize = 20) {
  const [minLng, minLat, maxLng, maxLat] = bbox(parcel);
  const rings = polygonRings(parcel);
  let best = null;
  let bestDistance = -1;

  for (let row = 0; row <= gridSize; row += 1) {
    for (let col = 0; col <= gridSize; col += 1) {
      const coordinates = [
        minLng + ((maxLng - minLng) * col) / gridSize,
        minLat + ((maxLat - minLat) * row) / gridSize,
      ];
      if (!booleanPointInPolygon(coordinates, parcel)) continue;

      const distance = minDistanceToRings([coordinates], rings);
      if (distance > bestDistance) {
        bestDistance = distance;
        best = coordinates;
      }
    }
  }

  const [lng, lat] = best ?? [(minLng + maxLng) / 2, (minLat + maxLat) / 2];
  return { lat, lng };
}

function largestOuterRing(geometry) {
  if (geometry.type === "Polygon") return geometry.coordinates[0];
  return geometry.coordinates
    .map((polygon) => polygon[0])
    .reduce((largest, ring) => (ring.length > largest.length ? ring : largest));
}

export function getParcelOrientation(geometry) {
  const ring = largestOuterRing(geometry);
  let longest = 0;
  let orientation = 0;

  for (let index = 0; index < ring.length - 1; index += 1) {
    const from = { lng: ring[index][0], lat: ring[index][1] };
    const to = { lng: ring[index + 1][0], lat: ring[index + 1][1] };
    const length = (to.lat - from.lat) ** 2 + ((to.lng - from.lng) * Math.cos((from.lat * Math.PI) / 180)) ** 2;
    if (length > longest) {
      longest = length;
      orientation = bearingDegrees(from, to);
    }
  }

  return (((orientation - 90) % 180) + 180) % 180;
}

export function createInitialPlacement(geometry) {
  const buildable = getBuildableArea(geometry);
  const { lat, lng } = getParcelAnchor(buildable ?? geometry);
  return { lat, lng, rotation: getParcelOrientation(geometry), flipped: false };
}

export function evaluatePlacement(placement, adu, geometry) {
  const corners = getFootprintCorners(
    { center: { lat: placement.lat, lng: placement.lng }, rotation: placement.rotation },
    adu
  );
  const footprint = cornersToPolygon(corners);
  return { corners, ...validatePlacement(footprint, geometry) };
}
