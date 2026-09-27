"use client";

import { useEffect, useState } from "react";

let catalogRequest = null;

function loadCatalog() {
  catalogRequest ??= fetch("/api/adus")
    .then((response) => {
      if (!response.ok) throw new Error(`Catalog request failed with ${response.status}`);
      return response.json();
    })
    .then((data) => data.adus)
    .catch((error) => {
      catalogRequest = null;
      throw error;
    });
  return catalogRequest;
}

export function useAduCatalog() {
  const [state, setState] = useState({ adus: null, error: null });

  useEffect(() => {
    let active = true;
    loadCatalog()
      .then((adus) => active && setState({ adus, error: null }))
      .catch((error) => {
        console.error(error);
        if (active) setState({ adus: null, error: "We could not load the ADU models." });
      });
    return () => {
      active = false;
    };
  }, []);

  return state;
}
