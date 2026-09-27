"use client";

import { useEffect, useEffectEvent, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-imageoverlay-rotated";
import { bearingDegrees, feetToMeters, getFootprintCorners, pointAlongRotation } from "@/lib/geo/footprint";
import { PLACEMENT_STATUS } from "@/lib/geo/placement";
import { getAduArea } from "@/data/aduCatalog";

const HANDLE_GAP_M = 2.5;
const MIN_EDIT_ZOOM = 19;

const STATUS_COLORS = {
  [PLACEMENT_STATUS.OK]: "#22c55e",
  [PLACEMENT_STATUS.SETBACK]: "#f59e0b",
  [PLACEMENT_STATUS.OUTSIDE]: "#ef4444",
};

function handleIcon(variant) {
  return L.divIcon({ className: `map-handle map-handle-${variant}`, iconSize: [16, 16], iconAnchor: [8, 8] });
}

function getGeometry(placement, adu) {
  const center = { lat: placement.lat, lng: placement.lng };
  const [topLeft, topRight, bottomRight, bottomLeft] = getFootprintCorners(
    { center, rotation: placement.rotation },
    adu
  );
  const halfDepth = feetToMeters(adu.depthFt) / 2;

  return {
    center,
    outline: [topLeft, topRight, bottomRight, bottomLeft],
    image: placement.flipped ? [topRight, topLeft, bottomRight] : [topLeft, topRight, bottomLeft],
    rotateHandle: pointAlongRotation(center, placement.rotation, halfDepth + HANDLE_GAP_M),
    label: { lat: Math.min(topLeft.lat, topRight.lat, bottomRight.lat, bottomLeft.lat), lng: center.lng },
  };
}

export function AduFootprint({ adu, placement, status, onDrag, onDragEnd }) {
  const map = useMap();
  const layers = useRef(null);

  const getPlacement = useEffectEvent(() => placement);
  const getStatusColor = useEffectEvent(() => STATUS_COLORS[status]);
  const emitDrag = useEffectEvent((next) => onDrag(next));
  const emitDragEnd = useEffectEvent(() => onDragEnd());

  useEffect(() => {
    const geometry = getGeometry(getPlacement(), adu);

    const image = L.imageOverlay.rotated(adu.plan, ...geometry.image, { opacity: 0.92 }).addTo(map);
    const outline = L.polygon(geometry.outline, {
      weight: 3,
      color: getStatusColor(),
      fillOpacity: 0,
      className: "cursor-move",
    }).addTo(map);
    const moveHandle = L.marker(geometry.center, {
      draggable: true,
      keyboard: false,
      title: "Drag to move",
      icon: handleIcon("move"),
    }).addTo(map);
    const rotateHandle = L.marker(geometry.rotateHandle, {
      draggable: true,
      keyboard: false,
      title: "Drag to rotate",
      icon: handleIcon("rotate"),
    }).addTo(map);
    const label = L.tooltip({ permanent: true, direction: "bottom", offset: [0, 8], className: "footprint-label" })
      .setLatLng(geometry.label)
      .setContent(`${adu.widthFt} × ${adu.depthFt} ft · ${getAduArea(adu)} sq ft`)
      .addTo(map);

    moveHandle.on("drag", (event) => emitDrag({ ...getPlacement(), lat: event.latlng.lat, lng: event.latlng.lng }));
    moveHandle.on("dragend", () => emitDragEnd());

    rotateHandle.on("drag", (event) => {
      const current = getPlacement();
      emitDrag({ ...current, rotation: bearingDegrees(current, event.latlng) });
    });
    rotateHandle.on("dragend", () => emitDragEnd());

    let dragStart = null;

    const handleBodyMove = (event) => {
      emitDrag({
        ...dragStart.placement,
        lat: dragStart.placement.lat + event.latlng.lat - dragStart.latlng.lat,
        lng: dragStart.placement.lng + event.latlng.lng - dragStart.latlng.lng,
      });
    };

    const handleBodyEnd = () => {
      map.off("mousemove", handleBodyMove);
      L.DomEvent.off(document, "mouseup", handleBodyEnd);
      map.dragging.enable();
      dragStart = null;
      emitDragEnd();
    };

    outline.on("mousedown", (event) => {
      dragStart = { latlng: event.latlng, placement: getPlacement() };
      map.dragging.disable();
      map.on("mousemove", handleBodyMove);
      L.DomEvent.on(document, "mouseup", handleBodyEnd);
    });

    layers.current = { image, outline, moveHandle, rotateHandle, label };

    if (map.getZoom() < MIN_EDIT_ZOOM) {
      map.setView(geometry.center, MIN_EDIT_ZOOM);
    }

    return () => {
      map.off("mousemove", handleBodyMove);
      L.DomEvent.off(document, "mouseup", handleBodyEnd);
      map.dragging.enable();
      [image, outline, moveHandle, rotateHandle, label].forEach((layer) => layer.remove());
      layers.current = null;
    };
  }, [map, adu]);

  useEffect(() => {
    if (!layers.current) return;
    const { image, outline, moveHandle, rotateHandle, label } = layers.current;
    const geometry = getGeometry(placement, adu);

    image.reposition(...geometry.image);
    outline.setLatLngs(geometry.outline);
    moveHandle.setLatLng(geometry.center);
    rotateHandle.setLatLng(geometry.rotateHandle);
    label.setLatLng(geometry.label);
  }, [placement, adu]);

  useEffect(() => {
    layers.current?.outline.setStyle({ color: STATUS_COLORS[status] });
  }, [status]);

  return null;
}
