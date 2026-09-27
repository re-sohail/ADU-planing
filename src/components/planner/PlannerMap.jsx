"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import bbox from "@turf/bbox";
import clsx from "clsx";
import "leaflet/dist/leaflet.css";
import { normalizeRotation } from "@/lib/geo/footprint";
import { createInitialPlacement, evaluatePlacement, getBuildableArea } from "@/lib/geo/placement";
import { AduFootprint } from "./AduFootprint";
import { MapToolbar } from "./MapToolbar";
import { ParcelLayers } from "./ParcelLayers";
import { PlacementStatus } from "./PlacementStatus";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const MAX_ZOOM = 21;
const IMAGERY_MAX_ZOOM = 19;

const TILES = MAPBOX_TOKEN
  ? {
      url: `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/512/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`,
      tileSize: 512,
      zoomOffset: -1,
    }
  : {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      tileSize: 256,
      zoomOffset: 0,
    };

export default function PlannerMap({ parcel, adu, placement, onCommit }) {
  const [map, setMap] = useState(null);
  const [draft, setDraft] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const geometry = parcel.geometry;
  const buildable = useMemo(() => getBuildableArea(geometry), [geometry]);
  const [initialCenter] = useState(() => {
    const [minLng, minLat, maxLng, maxLat] = bbox(geometry);
    return [(minLat + maxLat) / 2, (minLng + maxLng) / 2];
  });
  const livePlacement = draft ?? placement;
  const result = useMemo(
    () => (adu && livePlacement ? evaluatePlacement(livePlacement, adu, geometry) : null),
    [adu, livePlacement, geometry]
  );

  useEffect(() => {
    map?.invalidateSize();
  }, [map, isFullscreen]);

  useEffect(() => {
    if (!isFullscreen) return;
    const handleKeyDown = (event) => event.key === "Escape" && setIsFullscreen(false);
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  function commit(next) {
    setDraft(null);
    onCommit(next, evaluatePlacement(next, adu, geometry).status);
  }

  function handleDragEnd() {
    if (draft) commit(draft);
  }

  return (
    <div className={clsx("bg-slate-900", isFullscreen ? "fixed inset-0 z-[1200]" : "relative h-full w-full")}>
      <MapContainer
        ref={setMap}
        center={initialCenter}
        zoom={19}
        maxZoom={MAX_ZOOM}
        zoomSnap={0.25}
        zoomDelta={0.5}
        wheelPxPerZoomLevel={120}
        zoomControl={false}
        attributionControl={false}
        className="h-full w-full"
      >
        <TileLayer
          {...TILES}
          maxZoom={MAX_ZOOM}
          maxNativeZoom={IMAGERY_MAX_ZOOM}
          keepBuffer={4}
          updateWhenZooming={false}
        />
        <ParcelLayers geometry={geometry} buildable={buildable} />
        {adu && livePlacement && (
          <AduFootprint
            adu={adu}
            placement={livePlacement}
            status={result.status}
            onDrag={setDraft}
            onDragEnd={handleDragEnd}
          />
        )}
      </MapContainer>

      <MapToolbar
        canEdit={Boolean(adu && placement)}
        isFullscreen={isFullscreen}
        onRotate={(degrees) => commit({ ...placement, rotation: normalizeRotation(placement.rotation + degrees) })}
        onFlip={() => commit({ ...placement, flipped: !placement.flipped })}
        onRecenter={() => commit(createInitialPlacement(geometry))}
        onZoomIn={() => map?.zoomIn()}
        onZoomOut={() => map?.zoomOut()}
        onToggleFullscreen={() => setIsFullscreen((value) => !value)}
      />

      {parcel.demo && (
        <span className="absolute top-3 right-3 z-[1000] rounded-full bg-warning px-3 py-1 text-xs font-medium text-white shadow">
          Demo lot
        </span>
      )}

      {result ? (
        <PlacementStatus result={result} rotation={livePlacement.rotation} />
      ) : (
        <p className="absolute right-3 bottom-3 left-3 z-[1000] rounded-xl bg-white/95 p-3 text-sm text-ink shadow-md sm:right-auto">
          Choose an ADU model below to place it on your lot.
        </p>
      )}
    </div>
  );
}
