"use client";

import { useEffect, useState } from "react";

export function useParcel(location) {
  const [result, setResult] = useState({ key: null, parcel: null, error: null });
  const key = location ? `${location.lat},${location.lng}` : null;
  const address = location?.address ?? "";

  useEffect(() => {
    if (!key) return;

    const controller = new AbortController();
    const [lat, lng] = key.split(",");
    const query = new URLSearchParams({ lat, lng, address });

    fetch(`/api/parcel?${query}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error ?? "Parcel lookup failed");
        setResult({ key, parcel: data.parcel, error: null });
      })
      .catch((error) => {
        if (error.name === "AbortError") return;
        setResult({ key, parcel: null, error: error.message });
      });

    return () => controller.abort();
  }, [key, address]);

  const isCurrent = key !== null && result.key === key;
  return {
    parcel: isCurrent ? result.parcel : null,
    error: isCurrent ? result.error : null,
    loading: key !== null && !isCurrent,
  };
}
