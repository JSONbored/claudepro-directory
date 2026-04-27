# Raycast Store Release Checklist

- Confirm `author` is the Raycast account username.
- Confirm `license` is `MIT`.
- Confirm `package-lock.json` is committed.
- Confirm `assets/icon.png` is a custom 512 x 512 PNG.
- Run `npm ci`.
- Run `npm test`.
- Run `npm run lint`.
- Run `npm run build`.
- Open the extension from a distribution build and complete the manual release QA for search, details, copy, paste, favorites, refresh, offline cache behavior, and issue-first contribution actions.
- Capture at least three 2000 x 1250 PNG screenshots with Raycast Window Capture and save them to extension metadata before publishing.
- Publish with `npm run publish`.
