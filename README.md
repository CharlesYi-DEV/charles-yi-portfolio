# Charles Yi — Personal Desktop

A personal portfolio inspired by the classic Mac OS 9 Platinum interface and the beige, recessed CRT frame of a compact Macintosh. The content focuses on Charles Yi’s current work, selected projects, and research in development.

## Run locally

```sh
npm run dev
```

Open http://127.0.0.1:4173. Node.js is required; no dependency installation is needed. The development-only route `/__preview/mobile` embeds the site at a 390px phone width.

## Check and build

```sh
npm run check
npm run build
```

The `dist/` folder contains the static website, favicon, and locally bundled font assets. No dependency installation is needed.

## Deploy with AWS Amplify Hosting

1. In the Amplify console, create a new app and select GitHub as the source.
2. Authorize access to `CharlesYi-DEV/charles-yi-portfolio` and select its `main` branch.
3. Use the repository root as the app root. This is a standalone site, not a monorepo.
4. Keep the checked-in `amplify.yml`: it runs `npm run check` and `npm run build`, then publishes `dist/`.
5. Save and deploy. Future pushes to the connected branch can trigger automatic deployments.

No environment variables, database, or backend are required. The local `server.mjs` is for development only; Amplify serves the generated static files.

See [AWS’s GitHub connection guide](https://docs.aws.amazon.com/amplify/latest/userguide/setting-up-GitHub-access.html) and [build configuration documentation](https://docs.aws.amazon.com/amplify/latest/userguide/build-settings.html).

## Portfolio contents

- About This Researcher: Charles Yi’s introduction and education.
- My Work: current AI evaluation experience at RWS, ReRouteHer, sound detection, and the developing MASCO–ESCO project.
- In Progress: MASCO 2020–ESCO 1.2.1 alignment research, with completed computational work distinguished from planned human evaluation.
- Résumé: selected education, experience, and skills.
- Contact: email, GitHub, and LinkedIn.

MASCO–ESCO is ongoing research. Completed computational work is distinguished from planned human evaluation; it is not presented as a published or fully validated national crosswalk.

## Design and interaction

- Original 32 × 32 pixel-grid SVG icons, drawn with integer geometry and rendered at native or integer-multiple sizes.
- A slim, original CSS-drawn beige Macintosh frame fills the browser viewport. A recessed CRT edge, small vents, and a floppy slot retain the hardware reference without exterior captions or controls.
- Blog opens behind About This Researcher and My Work at startup. On wide displays the two introduction windows sit side by side, overlapping the top of Blog by a small amount. Each project includes a short summary and status. Narrow displays stack the windows inside the scrollable screen.
- Chicago throughout, with a consistent regular-weight hierarchy: 40px name, 32px document titles, 24px section headings, 20px body text, 18px interface and project descriptions, and 16px metadata. Reading text uses 28–29px line spacing and keeps its size on phones; the name reduces to 36px on small phones.
- A compact menu bar, striped title bars, beveled controls, grey window interiors, Finder-style project icons, and a purple embossed desktop.
- Click or tap once to open a document. Title bars support dragging. Close and expand buttons work on desktop; Escape closes the active menu or window. On narrow displays, windows stack vertically.
- Opening a new app includes a 440ms thinking pause and stepped outline, followed by a brief window redraw. Startup lasts one second and can be replayed through View → Replay startup. Escape cancels a pending launch or startup. View → Opening animations disables these effects; the operating system’s reduced-motion preference is also respected.
- Right-click the desktop for project shortcuts, window arrangement, wallpaper, and animation settings. Icons and project rows offer Open and Get Info; windows offer focus, expand/restore, and close. Menus stay inside the display and support Shift+F10, arrow keys, Home/End, Enter, and Escape. Links and selected text retain the native browser context menu.
- View → Arrange windows restores the initial positions. View can also change the wallpaper colour.

Design references: the user-supplied Mac OS 9.2 screenshot, https://en.wikipedia.org/wiki/Mac_OS_9, and the recessed beige Macintosh casing shown at https://taoofmac.com/space/reviews/2025/11/24/1900. Original interface artwork; not an Apple product or emulator.

## Font attribution

Chicago Kare by Duane King, a bitmap-style Chicago reproduction, is bundled locally under the MIT license. Copyright (c) 2024 Duane King. The unchanged font and license are in `assets/fonts/` and are copied into production builds.

Source: https://github.com/KingDuane/Chicago-Kare
License: `assets/fonts/ChicagoKare-LICENSE.txt`

No external font requests, third-party scripts, or analytics are used.

## Desktop utilities

- **Sherlock:** full-text portfolio search with Everything, Research, Experience, and About Charles channels. File → Find, the desktop icon, and Ctrl/Command+Shift+F open it. Queries stay in memory and never leave the browser.
- **Control Panels:** three desktop colours, larger reading text, and optional opening animations. System reduced-motion preferences take priority. Appearance choices persist in localStorage, with an in-memory fallback when storage is blocked. Restore Appearance resets display settings while keeping saved projects.
- **Scrapbook:** save or remove any of the four projects using the project toolbar or right-click menu. The reading list persists on this browser only.
- **Window menu:** lists open documents and indicates the active one. Selecting a rolled-up window reopens it. Title-bar double-click, the roll-up button, and the right-click menu all toggle WindowShade-style roll-up.
- **Sleep:** View → Sleep or Control Panels → Preview Sleep runs a manually triggered starfield. Any key, click, or tap wakes the desktop and restores focus. Reduced motion displays a static sky. No inactivity timer interrupts reading.

Sherlock channels and the live Window menu take inspiration from the Mac OS 9 reference; Scrapbook, window roll-up, and the starfield are creative additions in the wider classic Macintosh style. No operating-system accounts, password storage, voice recording, or software downloads are simulated.

## Blog app

The Blog desktop icon opens a Chicago-styled reader with search, reading time, images, refresh, and links to the standalone articles. It reads public `feed.json` from the separate [Hexo + Cactus blog](https://github.com/CharlesYi-DEV/charles-yi-blog), so publishing posts does not require rebuilding this portfolio. The last successful feed is saved locally for reading when the connection fails. Article HTML is rebuilt with a semantic allowlist; feed scripts, styling, forms, and event handlers are discarded.

The public blog lives at https://blog.charlesyi.net/. Its URL is configured by `BLOG_HOME` in `blog-reader.js`. To run the reader’s feed validation, HTML sanitization, search/navigation, and offline tests:

```sh
npm ci
npm test
```

These development dependencies are not needed by the static production build.

## More classic desktop details

- **Balloon Help:** Help → Show Balloon Help enables rounded explanation balloons on pointer hover and keyboard focus. Escape dismisses a balloon before closing a window. The setting is remembered locally.
- **Pop-up folders:** My Work, Blog, and Scrapbook have bottom-edge tabs. Click to open upwards or tuck away; folder state and loaded articles survive tucking. Drag a folder title bar into the bottom 75 pixels to tuck it, or use the title-bar tab button / context menu. The tab button in an open pop-up returns it to a normal window and removes its tab. On narrow screens, folders open as stacked windows with tap controls.
- **Software Update:** the system menu opens a news panel with the five newest posts from the validated blog feed, a manual refresh, offline cache fallback, and dated project milestones. Posts open in the built-in Blog app. This does not install software.
- **Hackathon:** a desktop app reserved for future hackathon projects, currently labelled “Under deployment”.

`software-update.js` is included in the static build and local server. `npm test` covers folder lifecycle, accessible help dismissal, feed loading and offline fallback alongside the existing blog-reader checks.

Desktop icons can be dragged on wide displays. Arrow keys move a focused icon by 10 pixels (Shift: 1 pixel). Right-click the desktop or use View → Arrange Desktop Icons to restore the grid. Positions are clamped to the desktop and stored as proportional coordinates in the first-party `charles-desktop-icons-v1` cookie (`Path=/`, `SameSite=Lax`, `Secure` on HTTPS, one-year expiry). Only known icon IDs and coordinates are stored. Blocked cookies fall back to in-memory positions for the visit. Mobile keeps the compact grid without overwriting desktop coordinates.
