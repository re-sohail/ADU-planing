"use client";

import { createContext, useContext, useEffect, useMemo, useReducer } from "react";

const STORAGE_KEY = "adu-planner";

const initialState = {
  hydrated: false,
  location: null,
  aduId: null,
  placement: null,
  placementStatus: null,
  submitted: false,
};

function reducer(state, action) {
  switch (action.type) {
    case "hydrate":
      return { ...state, ...action.state, hydrated: true };
    case "setLocation":
      return { ...state, location: action.location, placement: null, placementStatus: null, submitted: false };
    case "selectAdu":
      return { ...state, aduId: action.aduId, placement: null, placementStatus: null, submitted: false };
    case "updatePlacement":
      return { ...state, placement: action.placement, placementStatus: action.status };
    case "submitted":
      return { ...state, submitted: true };
    case "reset":
      return { ...initialState, hydrated: true };
    default:
      return state;
  }
}

function readStoredState() {
  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function writeStoredState(state) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be blocked in private mode; the planner keeps working in memory.
  }
}

const PlannerContext = createContext(null);

export function PlannerProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    dispatch({ type: "hydrate", state: readStoredState() });
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    const { hydrated, ...persisted } = state;
    writeStoredState(persisted);
  }, [state]);

  const actions = useMemo(
    () => ({
      setLocation: (location) => dispatch({ type: "setLocation", location }),
      selectAdu: (aduId) => dispatch({ type: "selectAdu", aduId }),
      updatePlacement: (placement, status) => dispatch({ type: "updatePlacement", placement, status }),
      markSubmitted: () => dispatch({ type: "submitted" }),
      reset: () => dispatch({ type: "reset" }),
    }),
    []
  );

  const value = useMemo(() => ({ ...state, ...actions }), [state, actions]);

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
}

export function usePlanner() {
  const context = useContext(PlannerContext);
  if (!context) throw new Error("usePlanner must be used inside PlannerProvider");
  return context;
}
