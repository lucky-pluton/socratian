# Socratia — Interactive Socratic Mathematics Learning App

> **"Don't tell students what mathematics is. Help them discover why it works."**

Socratia is an interactive Socratic mathematics mentor built with **React + TypeScript + Tailwind CSS + Framer Motion** on the frontend and **Node.js + Express + Supabase** on the backend.

## Key Features

- **Structured Curriculum Engine**: Powered by structured curriculum data in `server/curriculum.ts` and deterministic Socratic evaluation in `server/tutorEngine.ts` (no external AI API key required). Asks one question at a time, probes reasoning behind bare numerical answers, catches misconceptions with relatable real-world examples, and auto-advances when a module's question set is completed.
- **Complete 6-Stage Addition Journey**:
  1. Discovering Addition (combining, counting forward, when to combine, zero)
  2. Addition Beyond Objects (money, distance, time, context)
  3. Negative Numbers (debt via bank balance, zero as reference, `-1` vs `-100`)
  4. Interactive Number Line Exploration (animated hops right/left, crossing zero)
  5. Discovering Hidden Patterns (Commutative, Associative, Additive Identity & Inverse — formal names stay hidden until discovered!)
  6. Real-World Mastery (temperature, elevation, multi-step problems, judging when addition applies)
- **Interactive Visualizations**: Tactile chocolate counting-on explorer, unit/context bar inspector, bank debt comparator, animated number line (`-15` to `+15` and dynamic ranges), pattern tiles, and multi-step temperature/elevation tracker.
- **6 Main Screens**: Home Dashboard, Socratic Learning Room, Concept Discovery Map, Practice Lab, Reflection Journal, and Progress & Badges Dashboard.
- **Zero-Config Local Curriculum**: Works immediately without AI API keys via `server/curriculum.ts`, and optionally syncs student progress to Supabase Postgres when configured.

## Running Locally

```bash
npm install
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001`

## Environment Variables (Optional)

Copy `.env.example` to `.env`:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
PORT=3001
```

If using Supabase, run [supabase/schema.sql](supabase/schema.sql) in your Supabase SQL editor.

## Testing & Production Build

```bash
npm test
npm run build
npm start
```
