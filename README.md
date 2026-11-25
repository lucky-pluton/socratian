# Socratia — Interactive Socratic Mathematics Learning App

> **"Don't tell students what mathematics is. Help them discover why it works."**

Socratia is an interactive, AI-powered Socratic mathematics mentor built with **React + TypeScript + Tailwind CSS + Framer Motion** on the frontend and **Node.js + Express + `@google/genai` (Gemini Interactions API) + Supabase** on the backend.

## Key Features

- **Adaptive Socratic AI Mentor**: Asks one question at a time, probes reasoning behind bare numerical answers, catches misconceptions (like `-100 > -1` or mixing mismatched units) with relatable real-world counterexamples, and honors "Ask Why?" at any moment.
- **Complete 6-Stage Addition Journey**:
  1. Discovering Addition (combining, counting forward, when to combine, zero)
  2. Addition Beyond Objects (money, distance, time, context)
  3. Negative Numbers (debt via bank balance, zero as reference, `-1` vs `-100`)
  4. Interactive Number Line Exploration (animated hops right/left, crossing zero)
  5. Discovering Hidden Patterns (Commutative, Associative, Additive Identity & Inverse — formal names stay hidden until discovered!)
  6. Real-World Mastery (temperature, elevation, multi-step problems, judging when addition applies)
- **Interactive Visualizations**: Tactile chocolate counting-on explorer, unit/context bar inspector, bank debt comparator, animated number line (`-15` to `+15` and dynamic ranges), pattern tiles, and multi-step temperature/elevation tracker.
- **6 Main Screens**: Home Dashboard, Socratic Learning Room, Concept Discovery Map, Practice Lab, Reflection Journal, and Progress & Badges Dashboard.
- **Zero-Config Demo Mode**: Works immediately without API keys via an intelligent backend Socratic reasoning engine, and seamlessly upgrades to live Gemini AI (`gemini-3.8-flash`) and Supabase Postgres when environment variables are provided.

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
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.8-flash
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
