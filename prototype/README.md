# Aqlios / LeafEase prototype

Open `index.html` in Chrome, Edge, Safari or Firefox. It runs offline; no server or install is needed.

Sign in with any role. The demo email is filled in and any password works:
- **Vertical Admin** / **Super Admin** — Aqlios vertical hub (businesses, templates, roles, settings), then into a business
- **Business Manager** — the business dashboard, EHR, CRM, HRM, Finance and Settings
- **Clinician** — clinician view (rota, activity tracker, leave)
- **Patient** — patient portal

The "Interface" switch (bottom right, vertical pages) flips between the Classic and Refined designs.
"Reset" (bottom right) restores the demo data. Changes you make are kept in this browser only.

## Folder structure
- `index.html` — the app; every screen is a route inside it (e.g. `index.html#/private`)
- `assets/css/` — app styles plus local copies of the Poppins and Remix Icon fonts' stylesheets
- `assets/fonts/` — Poppins (SIL OFL) and Remix Icon (Apache 2.0) font files
- `assets/js/` — app scripts, loaded in the order listed in `index.html`
- `images/` — business logo sprite and account avatar

There is no `inner-pages/` folder: the prototype is a single-page app, so all screens live in `index.html`.
