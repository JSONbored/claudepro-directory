# Raycast Store Release Checklist

- Confirm `author` is the Raycast account username.
- Confirm `license` is `MIT`.
- Confirm `package-lock.json` is committed.
- Confirm `assets/icon.png` is a custom 512 x 512 PNG.
- Run `npm ci`.
- Run `npm run lint`.
- Run `npm run build`.
- Open the extension from a distribution build and smoke test search, details, copy, paste, favorites, refresh, and offline cache behavior.
- Capture at least three 2000 x 1250 PNG screenshots with Raycast Window Capture and save them to extension metadata before publishing.
- Publish with `npm run publish`.
