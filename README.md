# AgriEquity AI — Frontend

Dashboard for **AI-powered farm intelligence**: upload a farms CSV, set budget and fairness constraints, and view yield forecasts, climate risk, and subsidy allocation per farm.

## Tech stack

- **Next.js 14** (App Router)
- **React 18**
- **Tailwind CSS**
- **shadcn/ui** (New York style, zinc base) — Card, Badge, Button, Input, Progress, Separator, etc.
- Dark zinc/emerald theme

## Getting started

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command      | Description              |
| ------------ | ------------------------ |
| `npm run dev`   | Start dev server (port 3000) |
| `npm run build` | Production build         |
| `npm run start` | Run production build     |
| `npm run lint`  | Run ESLint               |

## Features

- **Upload flow** — Drag-and-drop or click to select a CSV; optional total budget and fairness constraints (small farm min share, per capita ratio, need floor, max single farm share, high-risk threshold/floor).
- **Analyze API** — Sends the file and query params to the backend `POST /analyze` (e.g. ngrok or `NEXT_PUBLIC_API_URL`).
- **Dashboard** — After a successful response: summary bar (farms, budget, avg yield, small farm share) and a grid of farm panels, each with:
  - **Yield** — Score ring and progress bar
  - **Climate risk** — Gauge and LOW/MODERATE/HIGH badge
  - **Subsidy** — Allocation amount, equity badge, Gini/small share
  - **AI reasoning** — Short explanation snippet
- **Sample data** — “Load sample data” uses mock results when the backend is unavailable.

## Project structure

```
frontend/
├── app/
│   ├── globals.css
│   ├── layout.jsx
│   └── page.jsx
├── components/
│   ├── Header.jsx
│   ├── UploadZone.jsx
│   ├── FarmGrid.jsx
│   ├── YieldCard.jsx
│   ├── ClimateRiskCard.jsx
│   ├── SubsidyCard.jsx
│   ├── ReasoningCard.jsx
│   └── ui/           # shadcn components
├── contexts/
│   └── ResultsContext.jsx
├── lib/
│   ├── format.js
│   ├── mockData.js
│   └── utils.js
└── package.json
```

## Backend

The app expects a backend that:

- Accepts **POST** `/analyze` with **multipart/form-data** (file) and query params: `fairness_on`, optional `budget`, and optional fairness constraint keys.
- Returns JSON with a `farms` array; each farm includes fields used by the dashboard cards (e.g. `farm_id`, `crop`, `region`, `yield_score`, `climate_risk_score`, `subsidy_amount`, `reasoning`, etc.).

The analyze URL is set in `UploadZone.jsx` (e.g. ngrok or via `NEXT_PUBLIC_API_URL` if you switch back to env-based config).

## License

Private / project-specific.
