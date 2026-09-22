# Date journal

A book-style photo journal — add books, add the pages you designed in Canva, and swipe/drag to turn pages. Books, pages, dates, and notes are saved in the browser (IndexedDB), per device.

## Project structure

```
.
├── public/
│   ├── index.html   # markup
│   ├── style.css     # styles, theming, layout
│   └── app.js         # all app logic (storage, page-turn, sheets)
├── server.js           # tiny zero-dependency static file server
├── package.json
└── render.yaml          # Render blueprint (optional one-click deploy)
```

There's no build step and no dependencies — it's plain HTML/CSS/JS. `server.js` just serves the `public/` folder.

## Run locally

Requires Node 18+.

```bash
npm start
```

Then open http://localhost:3000

(Or, since it's static, you can also just open `public/index.html` directly in a browser, or serve it with any static server / the VS Code "Live Server" extension.)

## Deploy to Render

**Option A — Blueprint (uses `render.yaml`):**
1. Push this project to a GitHub repo.
2. In the Render dashboard, click **New > Blueprint**, connect the repo, and Render will read `render.yaml` and set everything up automatically.
3. Deploy. Render will run `npm install` then `npm start`.

**Option B — Manual Web Service:**
1. Push this project to a GitHub repo.
2. In the Render dashboard, click **New > Web Service**, connect the repo.
3. Set:
   - **Build command:** `npm install`
   - **Start command:** `npm start`
4. Deploy.

Either way, Render provides `PORT` automatically — `server.js` already reads `process.env.PORT`, so no changes are needed.

## Notes

- Data is stored per-browser (IndexedDB), not synced to a server — deploying this to Render makes the app reachable at a URL, but everyone who opens it gets their own local, private set of books. If you want the journal to sync across your devices, that would need a real backend/database, which isn't in this version.
- Images are downscaled and embedded as JPEG data URLs client-side before saving.
