"use client";

import { useEffect, useId, useRef, useState } from "react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import clsx from "clsx";
import { Loader2, MapPin, Search } from "lucide-react";
import { usePlanner } from "@/context/PlannerContext";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const COORDINATES_PATTERN = /^\s*(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/;
const MIN_QUERY_LENGTH = 3;

let placesRequest = null;

function loadPlaces() {
  if (!placesRequest) {
    setOptions({ key: API_KEY, v: "weekly" });
    placesRequest = importLibrary("places");
  }
  return placesRequest;
}

function parseCoordinates(text) {
  const match = text.match(COORDINATES_PATTERN);
  if (!match) return null;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng, address: `${lat.toFixed(6)}, ${lng.toFixed(6)}` };
}

export function AddressSearch() {
  const { location, setLocation } = usePlanner();
  const listId = useId();
  const sessionToken = useRef(null);
  const [query, setQuery] = useState("");
  const [syncedAddress, setSyncedAddress] = useState(null);
  const [results, setResults] = useState({ text: "", items: [] });
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState("idle");

  const address = location?.address ?? null;
  if (address !== syncedAddress) {
    setSyncedAddress(address);
    if (address) setQuery(address);
  }

  const text = query.trim();
  const shouldSuggest = Boolean(API_KEY) && text.length >= MIN_QUERY_LENGTH && !parseCoordinates(text) && text !== address;
  const suggestions = shouldSuggest && results.text === text ? results.items : [];

  useEffect(() => {
    if (!shouldSuggest) return;

    let active = true;
    const timer = setTimeout(async () => {
      try {
        const { AutocompleteSessionToken, AutocompleteSuggestion } = await loadPlaces();
        sessionToken.current ??= new AutocompleteSessionToken();
        const response = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: text,
          sessionToken: sessionToken.current,
          includedRegionCodes: ["us"],
        });
        if (!active) return;
        setResults({ text, items: response.suggestions.map((item) => item.placePrediction).filter(Boolean) });
        setActiveIndex(-1);
        setStatus("idle");
      } catch (error) {
        console.error("Address suggestions failed", error);
        if (active) setStatus("error");
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [text, shouldSuggest]);

  async function selectPrediction(prediction) {
    setIsOpen(false);
    setStatus("loading");
    try {
      const place = prediction.toPlace();
      await place.fetchFields({ fields: ["formattedAddress", "location"] });
      sessionToken.current = null;
      setLocation({ lat: place.location.lat(), lng: place.location.lng(), address: place.formattedAddress });
      setStatus("idle");
    } catch (error) {
      console.error("Place details failed", error);
      setStatus("error");
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    const coordinates = parseCoordinates(query);
    if (coordinates) {
      setIsOpen(false);
      setLocation(coordinates);
      return;
    }
    const prediction = suggestions[activeIndex] ?? suggestions[0];
    if (prediction) selectPrediction(prediction);
  }

  function handleKeyDown(event) {
    if (!isOpen || suggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  }

  const showList = isOpen && suggestions.length > 0;

  return (
    <form role="search" onSubmit={handleSubmit} className="relative w-full max-w-xl">
      <div className="flex h-12 items-center gap-2 rounded-full border border-line bg-white pr-1.5 pl-4 shadow-sm focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15">
        <MapPin className="size-5 shrink-0 text-muted" aria-hidden="true" />
        <input
          type="text"
          role="combobox"
          aria-label="Property address"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
          placeholder="Enter your property address"
          autoComplete="off"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
          onKeyDown={handleKeyDown}
          className="h-full min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-slate-400 focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Search address"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-white hover:bg-brand-hover"
        >
          {status === "loading" ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
        </button>
      </div>

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-[1100] mt-2 overflow-hidden rounded-xl border border-line bg-white py-1 shadow-lg"
        >
          {suggestions.map((prediction, index) => (
            <li
              key={prediction.placeId}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectPrediction(prediction)}
              className={clsx(
                "cursor-pointer px-4 py-2.5 text-sm",
                index === activeIndex ? "bg-surface" : "hover:bg-surface"
              )}
            >
              <span className="font-medium text-ink">{prediction.mainText?.text ?? prediction.text.text}</span>
              {prediction.secondaryText && (
                <span className="ml-1.5 text-muted">{prediction.secondaryText.text}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {status === "error" && (
        <p className="mt-2 text-center text-xs text-danger">Address search is unavailable. Please try again.</p>
      )}
      {!API_KEY && (
        <p className="mt-2 text-center text-xs text-muted">
          Address search is not configured. You can enter coordinates like 32.7767, -96.7970.
        </p>
      )}
    </form>
  );
}
