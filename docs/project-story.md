# The ADU Planner: How It Works

## The story

A lot of homeowners have space in their backyard and want to add a small second home there. In the US this is called an **ADU**, an Accessory Dwelling Unit. People build them for aging parents, for grown-up kids, or to rent out.

The first question every homeowner asks is simple:

> "Will it actually fit in my backyard?"

Before this tool, answering that meant calling a company, waiting for someone to visit, and looking at drawings days later. Many people gave up before they even started.

We built the ADU Planner so anyone can answer that question in about a minute, from home, on their own:

1. Type your address.
2. See your real property from above, with your lot lines drawn on it.
3. Pick a home model and drag it into your backyard, at its real size.
4. The planner tells you right away if it fits.
5. If you like what you see, book a free consultation.

The first version of this project had the idea, but it did not work well. The house image could be stretched to any size, it was not drawn to real scale, and the "does it fit?" check often gave the wrong answer, especially once you rotated the house. We rebuilt it from the ground up so the answer you get is one you can trust.

## The big picture

Here is the journey a homeowner takes, and what happens behind the scenes at each step:

| What the homeowner does | What happens behind the scenes |
| --- | --- |
| Types their address | Google suggests addresses and gives us the exact map location |
| Sees their lot | We ask Regrid, a public property records service, for the shape of the lot |
| Picks a home model | We draw the floor plan on the map at its true size in feet |
| Moves and turns the home | Every movement is checked against the lot lines in real time |
| Books a consultation | The details are checked and saved in our database |

The rest of this document walks through each step.

## Step 1: Finding the property

When you start typing an address, the search box asks **Google Places** for suggestions after a short pause (a quarter of a second), so we don't send a request on every key press. Suggestions are limited to the United States.

When you pick a suggestion, Google gives us two things:

- The full, clean address, for example "5525 Willis Ave, Dallas, TX 75206, USA".
- The exact **latitude and longitude** of that address.

Latitude and longitude are the property's location on the globe. Everything else in the planner starts from this point.

A small detail that saves money: Google charges for address searches, but if every suggestion and the final pick belong to the same "session", Google counts them as one search. We create a session token when you start typing and throw it away once you pick an address.

## Step 2: Drawing the property boundary

Now we know where the house is, but we don't know where the property starts and ends. For that we use **Regrid**, a service that collects official property records (called *parcels*) from county offices across the US.

We send Regrid the latitude and longitude, and it sends back the **parcel polygon**: a list of corner points that, joined together, trace the outline of the lot.

### The "point on the street" problem

While testing we noticed that Google sometimes places an address point on the street in front of the house, not on the lot itself. If we asked Regrid "which lot is at this exact point?", the answer was "none".

So instead we ask Regrid for all lots **within 25 metres** of the point, and then pick the right one in this order:

1. **The lot that contains the point.** If the point is inside a lot, that's the one.
2. **The lot with the same house number.** If you searched "5525 Willis Ave", we pick the lot whose address starts with 5525.
3. **The closest lot.** As a last resort, the lot whose edge is nearest to the point.

This happens on our server, so the Regrid key is never exposed in the browser.

### The setback line

Homes can't be built right up against the property line. Rules require a gap between a new building and the lot edge. This gap is called a **setback**. For ADUs in California, the side and rear setback is **4 feet**, and we use that as our standard rule.

To show this on the map, we take the lot outline and shrink it inward by 4 feet on every side. In mapping terms this is a **negative buffer**, and we use a geometry library called **Turf.js** to do it. The result is a smaller shape inside the lot: the area where you're allowed to build.

On the map you see two lines:

- A **solid white line** for the real property boundary.
- A **dashed yellow line** for the buildable area inside the setback.

## Step 3: Placing the home on the lot

This is the heart of the planner. The goal is that when you see a 30 × 20 foot home on the map, it covers exactly 30 × 20 feet of your real backyard.

### Every model has real dimensions

Each home model has a width and a depth in feet, for example "Garden One" is 30 ft wide and 20 ft deep. Each also has a top-down floor plan drawing, made so that 10 drawing units equal 1 foot. The drawing always matches the real shape of the home.

### Turning feet into map positions

A map works in latitude and longitude, not feet, so we have to convert. We place the home using its **center point** and **rotation** (which way it faces, in degrees), then work out where its four corners land.

Here is how it works, in plain words:

1. **Feet to metres.** One foot is 0.3048 metres.
2. **Find each corner relative to the center.** The corners sit half the width to the left or right, and half the depth forwards or backwards.
3. **Turn the corners.** We spin those four corner points around the center by the rotation angle, using basic trigonometry (sine and cosine).
4. **Metres to latitude and longitude.**
   - Moving north or south: one degree of latitude is always about 111 kilometres.
   - Moving east or west is trickier: the distance covered by one degree of longitude shrinks as you move away from the equator. Near Dallas it's about 94 km, and near Seattle about 75 km. We correct for this using the cosine of the latitude.

That last point was one of the bugs in the old version. It used the same number for both directions, so every home came out stretched sideways, and it was also about four times too big. We added automatic tests that check the corners are exactly the right distance apart at different places on Earth.

### Drawing the floor plan image

Once we know the four corners, we lay the floor plan image onto the map. We use a small Leaflet plugin that places an image using three of its corners (top-left, top-right, bottom-left). From those three points the browser works out the fourth corner, the rotation and the scale by itself, so the image always lines up exactly with the home's outline, at any angle.

**Flip** is simple: we swap the left and right corners, so the floor plan appears mirrored without changing where the home sits.

### Where the home starts

When you pick a model, we don't just drop it in the middle of the map. We look for the best starting spot:

- **The most open spot on the lot.** We lay an invisible 20 × 20 grid over the lot, and for each grid point inside the lot we measure how far it is from the nearest lot line. The point with the most space around it wins. This works even on L-shaped lots, where the middle of the lot might actually be outside it.
- **Lined up with the lot.** We find the longest edge of the lot and turn the home to run parallel to it, so it sits square with the property from the start.

### Moving and turning the home

You can move and turn the home in several ways:

- **Drag the home itself**, or the dark dot in its middle, to move it.
- **Drag the white dot beside it** to rotate it freely. We work out the angle from the center of the home to your cursor, the same way a compass bearing works.
- **Toolbar buttons:** rotate 15° left or right, rotate 90°, flip, and reset to the best starting spot.

While you're dragging, the home moves smoothly on screen. When you let go, the final position is saved, so it's still there if you reload the page.

## Step 4: Checking if it fits

Every time the home moves, even by a tiny amount, we check it against the lot. There are three possible answers:

| Result | Colour | Meaning |
| --- | --- | --- |
| **Fits your lot** | Green | Fully inside the lot and at least 4 ft from every lot line |
| **Too close to the lot line** | Amber | Inside the lot, but closer than 4 ft to an edge |
| **Outside your lot** | Red | Part of the home crosses the lot line |

The **Continue** button only works when the result is green.

### How the check works

We treat both the home and the lot as **polygons**: shapes made of corner points joined by straight lines. The check has two parts.

**1. Is the home completely inside the lot?**

We use a geometry test called **"within"** from Turf.js. It checks that every part of the home's shape lies inside the lot's shape. Some properties are made of several separate pieces of land (a *multi-polygon*), so we check whether the home fits completely inside any one of them.

If the home isn't fully inside, the answer is red: **Outside your lot**.

**2. How close is it to the edge?**

If the home is inside, we measure the shortest distance between the home and the lot boundary, in feet. We measure in both directions:

- From each **corner of the home** to every **edge of the lot**.
- From each **corner of the lot** to every **edge of the home**.

The smallest of all these distances is the real gap between them. We need both directions because on an oddly shaped lot, a corner of the lot can poke in close to the side of the home even when all four corners of the home are far from the edges.

If that smallest gap is 4 feet or more, it's green. Less than 4 feet, it's amber. The exact distance is shown on screen, for example "17.4 ft from the nearest lot line".

### Why the old check was wrong

The old version never checked the real shape of the house. It drew an invisible, upright box around the image and checked that box instead. As soon as you rotated the house, the box got bigger than the house, so a house that fit perfectly could be reported as "outside". The old version also only checked after you finished dragging, never after rotating, and it popped up a separate error message for every edge of the lot.

Now we check the true, rotated shape of the home on every movement, and show one clear message.

## Step 5: Booking the consultation

When the home fits, the homeowner continues to a short form: name, email, phone, property address, and an appointment date and time.

- **Checked twice.** The same rules check the form in the browser (for instant feedback) and again on our server (so nobody can skip them). Opening hours are built in: Monday and Wednesday to Saturday 9 am to 5 pm, Tuesday 11 am to 5 pm, closed Sunday. You can't pick a past date.
- **Saved with the placement.** The booking is saved in our database (PostgreSQL, hosted on Neon) together with the chosen model and exactly where and how the home was placed on the lot, so the team can see the customer's plan before the call.
- **Spam protection.** A hidden form field that real people never see catches most bots. If a bot fills it in, we quietly ignore the request.

## How we keep it reliable

- **Automatic tests** for the maths: corner positions at different latitudes, rotation, homes crossing the line, homes too close to the line, L-shaped lots, and multi-piece lots.
- **Hydration checks.** The website is first built on the server and then comes alive in the browser; we automatically test that both versions of every page match, so pages never flicker or break.
- **No secrets in the code.** All keys (Google, Mapbox, Regrid, database) live in a private settings file that is never uploaded.

## What it doesn't do yet

It's important to be clear about the limits:

- **It doesn't detect existing buildings.** The planner knows the lot lines, but not where the main house, garage or pool are, so the new home can be placed on top of them. Adding this needs building outline data, which is a paid add-on from Regrid.
- **The 4 ft setback is a general rule.** Each city can have its own extra rules, so this is a preview, not a permit approval.
- **Lot lines come from public records** and can be slightly off from the real fence line.

## Suggested video outline

A simple flow for recording, about 3 to 5 minutes:

1. **The problem (30 sec).** A homeowner wonders if a backyard home will fit. Today that takes calls and site visits.
2. **The idea (20 sec).** Show the planner's opening page: "Find the perfect spot for your ADU".
3. **Search (30 sec).** Type an address, pick the suggestion, and the map opens right on the property. Explain how Google finds the location.
4. **The lot (40 sec).** Point out the white property line and the yellow dashed setback line. Explain parcel records and the 4 ft rule.
5. **Place the home (60 sec).** Pick a model and show that it appears at real size, lined up with the lot. Drag it, rotate it with the handle, flip it. Explain feet to map coordinates in one or two sentences.
6. **The fit check (60 sec).** Drag the home toward the edge and watch it turn amber, then red when it crosses the line. Show the distance in feet changing. Explain the "inside" test and the shortest-distance measurement.
7. **Book (30 sec).** Continue to the form, fill it in, and show the confirmation.
8. **Wrap up (20 sec).** What's next: detecting existing buildings and local zoning rules.

**Good addresses for the demo:** 5525 Willis Ave, Dallas, TX or 4424 Mockingbird Pkwy, Dallas, TX. Both are normal houses with clear lots, and both work with the current property data key.
