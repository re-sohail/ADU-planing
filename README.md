# ADU Planner

Homeowners search their address, see their lot on satellite imagery, place a true-scale ADU inside it, and book a consultation.

## How it works

1. **Address search.** Google Places (New) autocomplete gives the property coordinates.
2. **Parcel lookup.** `/api/parcel` calls Regrid on the server and returns the lot boundary.
3. **Placement.** The ADU footprint is drawn from its real width and depth in feet. Users can move, rotate and flip it, never stretch it. Turf.js checks every move:
   - **Fits.** Fully inside the lot and at least 4 ft from every lot line.
   - **Too close.** Inside the lot but within the 4 ft setback.
   - **Outside.** Crosses the lot line.
4. **Booking.** `/api/leads` validates the request and saves it to Postgres.

ADU models live in `src/data/aduCatalog.js`, with floor plan drawings in `public/plans`.

## Setup

Requires Node.js 20.9 or newer.

```bash
cp .env.example .env
npm install
npx prisma migrate deploy
npm run dev
```

Open http://localhost:3000.

### Environment variables

| Key | Used for |
| --- | --- |
| `DATABASE_URL` | Postgres connection for saving leads (Neon pooled URL) |
| `DIRECT_URL` | Direct Postgres connection used by Prisma migrations (Neon URL without `-pooler`) |
| `REGRID_TOKEN` | Parcel boundaries (server only) |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Satellite map tiles. Restrict the token to your domain. |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Address search. Enable Maps JavaScript API and Places API (New), and restrict by HTTP referrer. |

In development you can run the planner without keys:
- Without `REGRID_TOKEN`, a demo lot is drawn at the searched point.
- Without `NEXT_PUBLIC_MAPBOX_TOKEN`, Esri imagery is used.
- Without a Google key, you can type coordinates such as `32.7767, -96.7970` into the search box.

Production needs every key.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Generate the Prisma client and build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm test` | Unit tests for placement geometry and lead validation |
| `npm run test:hydration` | Rebuild the app and check every page for hydration mismatches in a real browser |
| `npm run dev:hydration` | Browse the app with a live hydration overlay |

## Hydration checks

Two tools from [hydration-proof](https://hydration.jscrate.dev) keep server and browser output in sync:

- **ESLint rules** (`eslint-plugin-hydration-proof`, Next.js preset) run with `npm run lint` and flag render code such as `Date.now()`, `window`, storage reads and invalid HTML nesting.
- **Browser check** (`hydration-proof`) runs with `npm run test:hydration`. The first time, download its browser with `npx hydration-proof install`.

`hydration-proof.config.mjs` tests each page the way visitors reach it: the planner as a new visitor, the details page after planning an ADU, and the confirmation after booking. Reports are written to `.hydration-proof/report/`.

`suppressHydrationWarning` on `<html>` and `<body>` hides attributes that browser extensions (password managers, antivirus) inject before React loads. Extensions that also change inner elements can still log a warning in development; it does not affect visitors.

## Limitations

- Existing buildings on the lot are not checked, so the ADU can overlap the main house. Regrid building footprints need a paid tier.
- The 4 ft setback is the California ADU side and rear minimum. Local zoning rules are not applied.
- Parcel lines come from public records and are approximate.
