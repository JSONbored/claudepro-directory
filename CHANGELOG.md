# Changelog
## 2026-04-30 - 1.0.0

### Added

- various new features (trending, PWA, updated submit form w/ API) (#12)

- improve metadata, trending algorithm, and partner page function (#13)

- optimize Vercel resource usage and reduce costs by 50-70% (#14)

- Complete detail page template system & comprehensive optimizations (#22)

- SEO content update + content sidebar update (#24)

- Major Content Restructure & Quality Improvements (#25)

- major platform overhaul - complete src/ migration, PWA implementation, and API infrastructure (#33)

- optimize Redis cache usage (#121)

- major migration to database-first architecture (#153)

- auth/sign-in updates & design changes (#156)

- migrations + refactors from codebase -> database (llms.txt, RSS/Atom feeds, sitemap generator, etc) (#159)

- edge function migrations / webhook-router + seo-api (#163)

- major API migration, companies system, and codebase modernization (#180)

- split newsletter component into focused, tree-shakeable modules (#182)

- relaunch heyclaude with rebuilt catalog, workers runtime, and hardened content pipeline (#297)

- harden API, MCP, Raycast, and jobs (#311)



### Build

- Bump tj-actions/changed-files (#7)



### CI

- optimize workflows with intelligent path filtering (#37)

- Bump treosh/lighthouse-ci-action from 11 to 12 (#52)

- Bump hashicorp/nextjs-bundle-analysis from 0.3.0 to 0.5.0 (#51)

- Bump actions/labeler from 5 to 6 (#50)

- harden action pinning and dependency automation policy (#302)



### Changed

- major overhaul (next.js migration, feature additions, etc) (#6)

- major overhaul (next.js migration, feature additions, etc) (#8)

- hardcode static config and simplify build pipeline (#216)

- run scripts directly via tsx instead of compiled js (#224)

- improve auth layout styling, error handling, and add type-safe action hooks (#225)



### Docs

- Update README with current tech stack and accurate information



### Feat

- design-system token consolidation and edge API routes (#228)



### Fix

- Import Card component

- Debug and resolve site errors

- Fuzzy search not working



### Fixed

- resolve production CSP violations and service worker errors (#26)

- restore Umami analytics with proper async rendering and defer strategy (#39)

- resolve CSP violations and update Umami analytics configuration (#40)

- update reddit-mcp-buddy schema compliance (#41)

- add CSP strict-dynamic, JSON-LD nonces, and trending hybrid scoring (#42)

- build issue resolution

- vercel build issues (#219)

- vercel build issues (#220)

- fix vercel + umami analytics + edge functions (#221)

- vercel build config



### Maintenance

- fix README badges (#38)

- Bump @react-email/render from 1.3.1 to 1.3.2 (#58)

- Bump knip from 5.64.1 to 5.64.2 (#57)

- Bump zod from 4.1.11 to 4.1.12 (#55)

- Bump @upstash/redis in the infrastructure group (#54)

- Bump @types/node in the typescript group (#53)

- Bump @react-email/components from 0.5.5 to 0.5.6 (#56)

- Bump fumadocs-ui from 15.8.2 to 15.8.3 (#35)

- Bump fumadocs-openapi from 9.4.0 to 9.4.1 (#34)

- update outdated dependencies



### Refactor

- Apply cursor.directory styling



### security

- Add comprehensive security policy and automated scanning



