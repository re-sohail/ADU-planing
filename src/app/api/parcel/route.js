import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { cornersToPolygon, feetToMeters, offsetLatLng } from "@/lib/geo/footprint";
import { distanceToLotLineFt } from "@/lib/geo/placement";

const REGRID_POINT_URL = "https://app.regrid.com/api/v2/parcels/point";
const DEMO_LOT_FT = { width: 70, depth: 130 };
const SEARCH_RADIUS_M = 25;
const MAX_CANDIDATES = 5;

function parseCoordinate(value, limit) {
  const number = Number(value);
  return value !== null && value !== "" && Number.isFinite(number) && Math.abs(number) <= limit ? number : null;
}

function demoParcel(center) {
  const halfWidth = feetToMeters(DEMO_LOT_FT.width) / 2;
  const halfDepth = feetToMeters(DEMO_LOT_FT.depth) / 2;
  const corners = [
    [-halfWidth, halfDepth],
    [halfWidth, halfDepth],
    [halfWidth, -halfDepth],
    [-halfWidth, -halfDepth],
  ].map(([east, north]) => offsetLatLng(center, east, north));

  return { geometry: cornersToPolygon(corners), address: null, demo: true };
}

function houseNumber(address) {
  return address?.trim().match(/^\d+/)?.[0] ?? null;
}

function pickParcel(features, lat, lng, address) {
  const candidates = features.filter((feature) => ["Polygon", "MultiPolygon"].includes(feature?.geometry?.type));
  const point = [lng, lat];

  const containing = candidates.find((feature) => booleanPointInPolygon(point, feature.geometry));
  if (containing) return containing;

  const number = houseNumber(address);
  const matching = number && candidates.find((feature) => houseNumber(feature.properties?.headline) === number);
  if (matching) return matching;

  const probe = { type: "Polygon", coordinates: [[point, point, point, point]] };
  return candidates.reduce(
    (nearest, feature) => {
      const distance = distanceToLotLineFt(probe, feature.geometry);
      return distance < nearest.distance ? { feature, distance } : nearest;
    },
    { feature: null, distance: Infinity }
  ).feature;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = parseCoordinate(searchParams.get("lat"), 90);
  const lng = parseCoordinate(searchParams.get("lng"), 180);

  if (lat === null || lng === null) {
    return Response.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  const token = process.env.REGRID_TOKEN;
  if (!token) {
    if (process.env.NODE_ENV === "production") {
      console.error("REGRID_TOKEN is not configured");
      return Response.json({ error: "Parcel lookup is unavailable" }, { status: 503 });
    }
    return Response.json({ parcel: demoParcel({ lat, lng }) });
  }

  const url = new URL(REGRID_POINT_URL);
  url.search = new URLSearchParams({ lat, lon: lng, radius: SEARCH_RADIUS_M, limit: MAX_CANDIDATES, token });

  let data;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000), cache: "no-store" });
    if (!response.ok) {
      console.error("Regrid request failed", response.status);
      return Response.json({ error: "Parcel lookup is unavailable" }, { status: 502 });
    }
    data = await response.json();
  } catch (error) {
    console.error("Regrid request error", error.name);
    return Response.json({ error: "Parcel lookup timed out" }, { status: 504 });
  }

  const feature = pickParcel(data?.parcels?.features ?? [], lat, lng, searchParams.get("address"));
  if (!feature) {
    return Response.json({ error: "No parcel found at this address" }, { status: 404 });
  }

  return Response.json(
    { parcel: { geometry: feature.geometry, address: feature.properties?.headline ?? null, demo: false } },
    { headers: { "Cache-Control": "private, max-age=3600" } }
  );
}
