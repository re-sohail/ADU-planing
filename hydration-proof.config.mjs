import { defineConfig } from "hydration-proof";

const PLANNER_KEY = "adu-planner";

const plannedState = {
  location: { lat: 32.8203, lng: -96.7736, address: "5525 Willis Ave, Dallas, TX 75206, USA" },
  aduId: "one-bed-600",
  placement: { lat: 32.8203, lng: -96.7736, rotation: 90, flipped: false },
  placementStatus: "ok",
  submitted: false,
};

export default defineConfig({
  routes: {
    paths: ["/adus", "/adus/user-information", "/adus/successful-submission"],
  },
  scenarios: [
    { name: "new-visitor", include: ["/adus"] },
    {
      name: "planned",
      include: ["/adus/user-information"],
      sessionStorage: { [PLANNER_KEY]: JSON.stringify(plannedState) },
    },
    {
      name: "booked",
      include: ["/adus/successful-submission"],
      sessionStorage: { [PLANNER_KEY]: JSON.stringify({ ...plannedState, submitted: true }) },
    },
  ],
});
