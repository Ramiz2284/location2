# Copilot Instructions for Route Planner

## Project Overview

**Route Planner** is a React + Vite web application that helps users build and visualize routes on Google Maps. Key capabilities:

- Parse links/addresses to extract geographic coordinates
- Create multi-point routes with custom names
- Visualize routes on interactive Google Maps
- Share routes via compact base64url-encoded tokens

**Architecture**: Frontend-first with two serverless API endpoints for URL shortening and link resolution.

---

## Core Architecture

### Frontend Components (React)

- **`App.jsx`**: Main container managing route state (`points[]`, `route` polyline). Orchestrates `LocationForm` and `MapView`.
- **`LocationForm.jsx`**: Input interface accepting Google Maps URLs, addresses, or coordinates. Validates, parses, and triggers point addition.
- **`MapView.jsx`**: Google Maps renderer using `@react-google-maps/api`. Displays numbered markers, polylines, and popup labels for points.

### Utility Modules

- **`googleMapsApi.js`**: Wraps Google Maps JavaScript Geocoder API (client-side). Functions: `geocodeAddress()`, `getCoordsByPlaceId()`.
- **`extractCoords.js`**: Core parsing logic. Handles three input types: full Google Maps URLs (extracts `!3d`/`!4d` or `@lat,lng`), short links (via `/api/resolve`), and plain text addresses (geocoding fallback).
- **`shortlink.js`**: Base64url encoding/decoding. `encodeCoords({lat,lng})` → token; `decodeToken(token)` → coords.

### Serverless API Endpoints (Vercel)

Located in `api/`:

- **`resolve.js`**: Unshorteens Google Maps short links (`maps.app.goo.gl/`). Strategy: fetch with redirects → extract `!3d!4d` or `@lat,lng` patterns → fallback to embed HTML parsing.
- **`short.js`**: Redirects token (`t=...`) to full Google Maps URL (`https://www.google.com/maps/@lat,lng,18z`).

### Data Flow

```
User Input (URL/address)
  → LocationForm validation
  → extractCoordsFromLink()
    → [if short link] → /api/resolve
    → [if address] → geocodeAddress()
    → [if full URL] → regex extraction
  → {lat,lng} object
  → stored in points[]
  → MapView renders markers + polyline
```

---

## Key Patterns & Conventions

### Coordinate Extraction Strategy

**Three-tier fallback approach:**

1. **Regex extraction** from full URLs: Look for `!3d{lat}!4d{lng}` or `@{lat},{lng}` patterns.
2. **Google Geocoder API** (client-side): If plain text address, use `window.google.maps.Geocoder.geocode()`.
3. **Short link resolution** via `/api/resolve`: Only triggered by `maps.app.goo.gl/` domain detection.

**Important**: Do NOT make direct HTTP geocoding requests. Always use the browser's built-in Geocoder (see `googleMapsApi.js` header comment).

### Error Handling & User Feedback

- Errors are logged to console with prefixes: `[coords:error]`, `[resolve]`, etc.
- User-facing alerts should be shown for failures (missing API, invalid link format).
- Fallback mechanisms are crucial: if short link resolution fails, try iframe extraction or suggest manual URL copy.

### Styling Approach

- **Inline CSS objects** defined in component files (not separate CSS modules).
- **Dark theme**: `background: '#1a1a1a'`, text `'#ffffff'`, accent `'#3B82F6'` (blue).
- **Responsive flex layout**: `display: 'flex'`, `flexDirection: 'column'`, `gap` for spacing.

### URL Shortening Mechanism

- Coordinates encoded as `{base64url}` token: `"lat,lng"` → UTF-8 → base64 → URL-safe (replace `+`, `/`, remove `=`).
- Short link: `/api/short?t={token}` (user-shareable).
- Decoding in `shortlink.js` handles reverse transformation with padding normalization.

---

## Developer Workflows

### Build & Development

```powershell
npm run dev        # Vite dev server (HMR enabled)
npm run build      # Production build (vite build)
npm run lint       # ESLint check
npm run preview    # Local preview of built app
```

### Environment Setup

- **Google Maps API Key**: Required as `VITE_GOOGLE_MAPS_API_KEY` env var (read in `MapView.jsx` via `import.meta.env`).
- **Vercel Deployment**: `vercel.json` present; serverless functions in `api/` auto-deployed.

### Testing/Debugging Tips

- Check browser console for `[coords:*]` and `[resolve]` logs when debugging coordinate extraction.
- MapView shows "Загрузка карты..." while API loads; verify API key validity if stuck.
- Short link resolution times out after 10s in `extractCoordsFromShortLink()`.

---

## Integration Points & Dependencies

### External APIs

- **Google Maps JavaScript API**: Loaded via `useJsApiLoader` in MapView. Required for map rendering and Geocoder.
- **Google Maps URLs**: Full URLs follow pattern `https://maps.google.com/?...` or `https://maps.app.goo.gl/...`.

### Third-Party Libraries

- `@react-google-maps/api` (v2.20.7): React wrapper for Google Maps.

### Configuration

- **ESLint**: `eslint.config.js` — React Refresh & hooks rules enabled.
- **Vite**: Minimal config with React plugin (@vitejs/plugin-react).

---

## Code Additions & Modifications

### When Adding Features

1. **New coordinate extraction method**: Add to `extractCoords.js`, respect the three-tier fallback.
2. **New UI component**: Keep inline styles consistent with dark theme; use component folder structure.
3. **New API endpoint**: Create in `api/` as default export `handler(req, res)` (Vercel serverless format).
4. **New utility**: Place in `src/utils/`, export functions with clear logging prefixes.

### Common Pitfalls

- **Cross-origin issues**: Short link extraction via iframe/popup may fail silently due to CORS—use `/api/resolve` instead.
- **API key missing**: Map won't load if `VITE_GOOGLE_MAPS_API_KEY` is undefined; check `.env` file.
- **Async coordinate parsing**: `extractCoordsFromLink()` is async—always `await` it in components.
- **Direct HTTP requests**: Don't make geocoding calls to Google servers directly; use client-side Geocoder API.

---

## File Structure Reference

```
src/
  App.jsx                    # Main app state & layout
  components/
    LocationForm.jsx         # Input & parsing UI
    MapView.jsx              # Google Maps renderer
  utils/
    extractCoords.js         # Coordinate parsing (3-tier fallback)
    googleMapsApi.js         # Google Maps Geocoder wrapper
    shortlink.js             # Base64url token encoding/decoding
api/
  resolve.js                 # Unshorten short links
  short.js                   # Token → full URL redirect
```

---

**Last Updated**: December 2025 | For questions, check console logs and `googleMapsApi.js` comments for API strategy.
