# CSUN Map Location Quiz

This project is a Google Maps JavaScript game where the player double-clicks locations on the CSUN map.

## Why local-config.js exists

Google Maps JavaScript runs in the browser, so the API key is always visible at runtime.
You should never hardcode that key in tracked files in a public repository.

This project loads the key from a local file named `local-config.js` that is ignored by git.

## Setup

1. Make sure this line exists in `.gitignore`:
   - `local-config.js`
2. Create a file in the project root named `local-config.js`.
3. Add your key in that file:

```js
window.MAPS_API_KEY = "YOUR_GOOGLE_MAPS_API_KEY";
```

4. Open `index.html` in Chrome.

## Notes for public GitHub repos

- Do not commit `local-config.js`.
- Restrict your key in Google Cloud Console:
  - Application restrictions: HTTP referrers
  - API restrictions: Google Maps JavaScript API only
- If a key is ever exposed, rotate it immediately.

## Game summary

- 5 rounds total
- Double-click to answer each location
- Correct answer shows green target area
- Incorrect answer shows red correct target area
- Final score shown at the end
- Map panning/zooming disabled for gameplay consistency
- Extra features: timer and high score (localStorage)
