"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

export function ParcelLayers({ geometry, buildable }) {
  const map = useMap();

  useEffect(() => {
    const lot = L.geoJSON(geometry, {
      interactive: false,
      style: { color: "#ffffff", weight: 3, fill: false },
    }).addTo(map);

    const setback = buildable
      ? L.geoJSON(buildable, {
          interactive: false,
          style: { color: "#facc15", weight: 2, dashArray: "6 6", fill: false },
        }).addTo(map)
      : null;

    map.fitBounds(lot.getBounds(), { padding: [48, 48], maxZoom: 20 });

    return () => {
      lot.remove();
      setback?.remove();
    };
  }, [map, geometry, buildable]);

  return null;
}
