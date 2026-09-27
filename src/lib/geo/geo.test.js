import { describe, expect, it } from "vitest";
import {
  bearingDegrees,
  cornersToPolygon,
  getFootprintCorners,
  offsetLatLng,
  pointAlongRotation,
} from "./footprint";
import {
  PLACEMENT_STATUS,
  createInitialPlacement,
  evaluatePlacement,
  getBuildableArea,
  getParcelAnchor,
  getParcelOrientation,
  validatePlacement,
} from "./placement";

const FEET = 0.3048;
const origin = { lat: 32.7766, lng: -96.797 };

function haversineFt(a, b) {
  const R = 6371008.8;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return (2 * R * Math.asin(Math.sqrt(h))) / FEET;
}

function polygonFromFeet(points) {
  const corners = points.map(([east, north]) => offsetLatLng(origin, east * FEET, north * FEET));
  return cornersToPolygon(corners);
}

const squareLot = polygonFromFeet([
  [-50, 50],
  [50, 50],
  [50, -50],
  [-50, -50],
]);

const lShapedLot = polygonFromFeet([
  [-50, 50],
  [-10, 50],
  [-10, -10],
  [50, -10],
  [50, -50],
  [-50, -50],
]);

function footprintAt(eastFt, northFt, rotation, size = { widthFt: 20, depthFt: 30 }) {
  const center = offsetLatLng(origin, eastFt * FEET, northFt * FEET);
  return cornersToPolygon(getFootprintCorners({ center, rotation }, size));
}

describe("getFootprintCorners", () => {
  it.each([0, 34, 61])("keeps true dimensions at latitude %i", (lat) => {
    const center = { lat, lng: -100 };
    const [tl, tr, br] = getFootprintCorners({ center, rotation: 0 }, { widthFt: 20, depthFt: 30 });
    expect(haversineFt(tl, tr)).toBeCloseTo(20, 1);
    expect(haversineFt(tr, br)).toBeCloseTo(30, 1);
  });

  it("keeps dimensions when rotated", () => {
    const [tl, tr, br, bl] = getFootprintCorners({ center: origin, rotation: 37 }, { widthFt: 24, depthFt: 16 });
    expect(haversineFt(tl, tr)).toBeCloseTo(24, 1);
    expect(haversineFt(tr, br)).toBeCloseTo(16, 1);
    expect(haversineFt(tl, br)).toBeCloseTo(haversineFt(tr, bl), 3);
  });

  it("points the front edge along the rotation bearing", () => {
    const front = pointAlongRotation(origin, 90, 10);
    expect(bearingDegrees(origin, front)).toBe(90);
  });
});

describe("validatePlacement", () => {
  it("accepts a centered footprint", () => {
    const result = validatePlacement(footprintAt(0, 0, 0), squareLot);
    expect(result.status).toBe(PLACEMENT_STATUS.OK);
    expect(result.distanceFt).toBeCloseTo(35, 0);
  });

  it("accepts a rotated footprint that is fully inside", () => {
    const result = validatePlacement(footprintAt(0, 0, 45), squareLot);
    expect(result.status).toBe(PLACEMENT_STATUS.OK);
  });

  it("flags a footprint crossing the lot line as outside", () => {
    const result = validatePlacement(footprintAt(45, 0, 0), squareLot);
    expect(result.status).toBe(PLACEMENT_STATUS.OUTSIDE);
  });

  it("flags a footprint closer than the setback", () => {
    const result = validatePlacement(footprintAt(38, 0, 0), squareLot);
    expect(result.status).toBe(PLACEMENT_STATUS.SETBACK);
    expect(result.distanceFt).toBeCloseTo(2, 0);
  });

  it("flags a rotated corner that pokes over the setback", () => {
    const straight = validatePlacement(footprintAt(30, 0, 0), squareLot);
    const rotated = validatePlacement(footprintAt(30, 0, 45), squareLot);
    expect(straight.status).toBe(PLACEMENT_STATUS.OK);
    expect(rotated.status).not.toBe(PLACEMENT_STATUS.OK);
  });

  it("rejects a footprint over the missing corner of an L-shaped lot", () => {
    const result = validatePlacement(footprintAt(25, 25, 0), lShapedLot);
    expect(result.status).toBe(PLACEMENT_STATUS.OUTSIDE);
  });

  it("measures distance inside the arm of an L-shaped lot", () => {
    const result = validatePlacement(footprintAt(5, 5, 0, { widthFt: 20, depthFt: 20 }), lShapedLot);
    expect(result.status).toBe(PLACEMENT_STATUS.OUTSIDE);
    const inside = validatePlacement(footprintAt(-30, 20, 0, { widthFt: 20, depthFt: 20 }), lShapedLot);
    expect(inside.status).toBe(PLACEMENT_STATUS.OK);
    expect(inside.distanceFt).toBeCloseTo(10, 0);
  });

  it("supports multipolygon parcels", () => {
    const multi = { type: "MultiPolygon", coordinates: [squareLot.coordinates] };
    expect(validatePlacement(footprintAt(0, 0, 0), multi).status).toBe(PLACEMENT_STATUS.OK);
  });
});

describe("parcel helpers", () => {
  it("builds a buildable area inset by the setback", () => {
    const area = getBuildableArea(squareLot);
    const inset = validatePlacement(footprintAt(0, 0, 0, { widthFt: 90, depthFt: 90 }), area);
    expect(inset.status).not.toBe(PLACEMENT_STATUS.OUTSIDE);
  });

  it("returns null when the lot is smaller than the setback", () => {
    const tiny = polygonFromFeet([
      [-3, 3],
      [3, 3],
      [3, -3],
      [-3, -3],
    ]);
    expect(getBuildableArea(tiny)).toBeNull();
  });

  it("anchors deep inside an L-shaped lot", () => {
    const anchor = getParcelAnchor(lShapedLot);
    const probe = cornersToPolygon(getFootprintCorners({ center: anchor, rotation: 0 }, { widthFt: 1, depthFt: 1 }));
    const result = validatePlacement(probe, lShapedLot, 0);
    expect(result.status).toBe(PLACEMENT_STATUS.OK);
    expect(result.distanceFt).toBeGreaterThan(15);
  });
});

describe("initial placement", () => {
  const deepLot = polygonFromFeet([
    [-35, 65],
    [35, 65],
    [35, -65],
    [-35, -65],
  ]);

  it("aligns the ADU width with the longest lot edge", () => {
    expect(getParcelOrientation(deepLot)).toBe(90);
    expect(getParcelOrientation(squareLot) % 90).toBe(0);
  });

  it("starts every catalog-sized ADU in a valid spot", () => {
    const placement = createInitialPlacement(deepLot);
    for (const size of [
      { widthFt: 20, depthFt: 20 },
      { widthFt: 50, depthFt: 20 },
    ]) {
      expect(evaluatePlacement(placement, size, deepLot).status).toBe(PLACEMENT_STATUS.OK);
    }
  });
});

