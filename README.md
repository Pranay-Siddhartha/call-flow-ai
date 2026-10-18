# Cold Call Copilot — DeepThought FDE Challenge

> A live, caller-facing cold-call companion application built for the **DeepThought CultureTech Forward Deployed Engineer (FDE)** recruitment assignment.
> Designed to sit beside a salesperson during live telephone conversations with enterprise prospects, providing structured stage navigation, evidence-based prospect responses, one-tap outcome logging, verbatim word capture, and real-time AI coaching.

---

## 🚀 Live Deployments & URLs

- **Frontend Application (Vercel):** [https://cold-call-copilot.vercel.app](https://cold-call-copilot.vercel.app) *(or your deployed Vercel URL)*
- **Backend Service (Render):** [https://cold-call-copilot-api.onrender.com](https://cold-call-copilot-api.onrender.com) *(or your deployed Render URL)*
- **Backend Health Check Endpoint:** [`/api/health`](https://cold-call-copilot-api.onrender.com/api/health)
- **GitHub Repository:** Public repository containing frontend, backend, Supabase schema SQL, and documentation.

---

## 📋 The 8-Stage Cold Call Structure

Following the authoritative DeepThought call structure ([deepthought.education/fde-hyderabad-v2/structure](https://sainikpuri.deepthought.education/fde-hyderabad-v2/structure)) and empirical analysis of **100 cold-call transcripts** (`T001–T100`), the application guides callers through all eight stages:

| # | Stage | Purpose | Transcript-Derived Typical Reactions | One-Tap Controls |
|---|-------|---------|--------------------------------------|------------------|
| **1** | **Opening** | Reach the right person and say who you are. The prospect decides in the first 10s if the call is worth a minute. | *"Yes, who's this?"* · *"I'm driving, but I can speak."* · *"I left last year."* | Target reached · Busy / in meeting · Assistant / gatekeeper · Left company / wrong person |
| **2** | **Purpose** | Say in 1–2 repeatable sentences why you called. A purpose they cannot repeat is one they did not hear. | *"What is this regarding?"* · *"What does your company do?"* · *"Where did you get my number?"* | Asked what we do · Asked where we got number · Said it is a sales call · Let me go on |
| **3** | **Permission** | Confirm willingness to talk now. A clear yes, no, or callback time are all good; talking on without one is not. | *"Ah, yes. Go ahead."* · *"Can you call after 30 minutes?"* · *"In a meeting, call back in an hour."* | Agreed to talk now · Call back later · Send on WhatsApp/email · Refused to speak |
| **4** | **Their business** | Ask about their company and work before pitching yours. People talk about what they do. | *"We are a manufacturing unit making light housings."* · *"I'm not an exporter anymore."* · *"Did you research us?"* | Shared operations & scope · Corrected my assumptions · Challenged my research · Guarded 1-line answer |
| **5** | **Their need, in their words** | Hear what they are trying to do or struggling with, in their own words. **Crucial:** caller records verbatim words. | *"We need a clearer idea of our products and where to push them."* · *"Distributor in Hyderabad handles that."* | Named specific need/goal · Referred to plant/partner · Asked what we can do · Said no need / all fine |
| **6** | **Objection** | Hear the reason for a no and understand it. A reason understood can be answered; a reason talked over cannot. | *"Meri internal team hai."* · *"We are an MNC with global consultants."* · *"Not on the line manager side."* | Has agency / in-house team · Send proposal in writing · Not decision maker · Not interested / brush off |
| **7** | **Next step** | Agree one concrete thing: document on WhatsApp/email, call at named time, or meeting with technical founder. | *"Tuesday after 2 PM is a good day for a working session."* · *"Send the deck over WhatsApp first."* | Meeting agreed (date & time) · Agreed to receive doc/report · Specific callback agreed · Referral given |
| **8** | **Close** | End the call clearly and log the outcome, next step, and prospect's exact words from stage 5. | *"Right, got it. See you Tuesday."* · *"I will call you in an hour. Thank you."* · *"Abrupt disconnect / hung up."* | Confirmed next step & closed · Polite goodbye after no · Sent invite / WhatsApp details · Line dropped / hung up |

---

## 🧠 LLM Feature: Real-Time AI Coach & Post-Call Synthesizer

- **Model Used:** Google Gemini 1.5 Flash (`gemini-1.5-flash`) via the official `@google/generative-ai` SDK.
- **Why Gemini 1.5 Flash:** Ultra-fast sub-second response times critical for live call coaching, generous free-tier limits (15 RPM / 1M TPM), and strong reasoning on structured context.

### 1. In-Call Real-Time Guidance ("What Should I Say?")
- **The Problem:** During an unscripted cold call, callers often get flustered by pushbacks, questions about data utilities, or objections regarding global vendors.
- **How It Works:** When the caller enters the prospect's actual words and clicks **"Get AI Suggestion"**, the backend passes the current stage, purpose, prior stage history, and the prospect's exact words to Gemini.
- **Strict Guardrails:** The prompt explicitly instructs: *"Do not invent facts about the prospect. Only use information the caller provided. Keep your suggestion to 2–3 actionable sentences."* The caller remains in control; suggestions serve as a co-pilot, never overwriting the caller's notes.
- **Resilience:** If the API key is not configured or network drops, the application provides pre-computed contextual heuristic tips for each of the 8 stages, ensuring the caller is never left hanging.

### 2. Post-Call Intelligence Summary
- **How It Works:** When a call is ended from any stage, the backend synthesizes all recorded stage outcomes, prospect quotations, and caller notes into a crisp narrative summary saved to `calls.call_summary`.
- **Value:** Prevents post-call amnesia and standardizes CRM documentation for sales leadership.

---

## 🛠️ Architecture & Tech Stack

```
┌─────────────────────────────────┐
│     Caller Screen (React)       │◄── Single-page React 18, Vite, TailwindCSS
│  - Sticky progress indicator    │    Deployed on Vercel
│  - 4 one-tap outcome buttons    │
│  - Verbatim quotation capture   │
└────────────────┬────────────────┘
                 │ REST API (JSON)
┌────────────────▼────────────────┐
│      Express REST Backend       │◄── Node.js Express API
│  - /api/health (Health check)   │    Deployed on Render
│  - /api/calls (CRUD sessions)   │
│  - /api/calls/:id/stages        │
│  - /api/ai/suggest & summarize  │
└───────┬──────────────────┬──────┘
        │                  │
┌───────▼────────┐  ┌──────▼────────┐
│  Supabase SQL  │  │ Google Gemini │
│  (PostgreSQL)  │  │  (1.5 Flash)  │
└────────────────┘  └───────────────┘
```

- **Frontend:** React 18, React Router v6, TailwindCSS, Lucide Icons, Vite
- **Backend:** Node.js, Express 4, CORS, `@supabase/supabase-js`, `@google/generative-ai`
- **Database:** Supabase PostgreSQL with relational tables (`calls`, `stage_results`), UUID keys, cascade deletes, and timestamp indices.
- **Hosting:** Vercel (Frontend SPA) + Render (Backend Web Service)

---

## 🗄️ Database Setup (Supabase)

The complete SQL schema is located in [`supabase/schema.sql`](supabase/schema.sql).

1. Log in to [Supabase](https://supabase.com) and create a new project.
2. Navigate to the **SQL Editor** in the left sidebar.
3. Open [`supabase/schema.sql`](supabase/schema.sql), paste the entire file into the SQL Editor, and click **Run**.
4. Retrieve your **Project URL** and **Service Role Key** (under Project Settings > API).

### Schema Summary
- `calls`: Stores call sessions, prospect name, company, live status (`in_progress`, `completed`, `abandoned`), last stage reached (1–8), final outcome, and AI call summary.
- `stage_results`: Stores stage-by-stage progression with a unique constraint on `(call_id, stage_number)`, capturing the stage-specific outcome label, the prospect's verbatim words, personal caller notes, and AI coaching text.

---

## 💻 Local Development Setup

### 1. Prerequisites
- Node.js 18+ and npm
- A free Supabase project
- A free Google Gemini API Key from [Google AI Studio](https://aistudio.google.com/)

### 2. Backend Setup
```bash
cd server
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials:
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_SERVICE_KEY=your-supabase-service-role-key
# GEMINI_API_KEY=your-gemini-api-key
# PORT=3001
# FRONTEND_URL=http://localhost:5173

# Start development server
npm run dev

# Run automated backend test suite
npm test
```

Verify backend health at `http://localhost:3001/api/health`.

### 3. Frontend Setup
```bash
cd client
npm install

# Copy environment template
cp .env.example .env

# Verify VITE_API_URL points to backend:
# VITE_API_URL=http://localhost:3001/api

# Start client development server
npm run dev
```

Visit `http://localhost:5173` to test the full caller interface.

---

## 🚢 Production Deployment

### Backend (Render)
1. Push your repository to GitHub.
2. In [Render Dashboard](https://dashboard.render.com/), click **New > Web Service** and link your repo.
3. Configure settings:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`
4. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `SUPABASE_URL`: `https://your-project.supabase.co`
   - `SUPABASE_SERVICE_KEY`: `your-service-role-key`
   - `GEMINI_API_KEY`: `your-gemini-api-key`
   - `FRONTEND_URL`: `https://your-app.vercel.app`
5. Click **Create Web Service**. Verify `https://<render-url>/api/health`.

### Frontend (Vercel)
1. In [Vercel Dashboard](https://vercel.com/), click **Add New > Project** and import your repo.
2. Configure settings:
   - **Root Directory:** `client`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Add Environment Variable:
   - `VITE_API_URL`: `https://<your-render-url>/api`
4. Deploy. Vercel SPA routing is configured automatically via `client/vercel.json`.

---

## 📹 Six-Minute Demonstration Video Outline

Demonstration outline for the 6-minute Google Drive submission video (developer visible on camera side-by-side with screen):

| Timestamp | Section | Talking Points & Actions |
|-----------|---------|--------------------------|
| **0:00 – 0:40** | **The Problem & Concept** | Introduce yourself as Forward Deployed Engineer candidate. Explain why cold-calling requires a structured companion (sales reps lose control of conversation, fail to record exact prospect words, or miss agreed next steps). |
| **0:40 – 2:30** | **Live Call Walkthrough (Transcript T001)** | Start a call for *Dev ji* at *Kalpana Chem Supplies*. Step through Stage 1 (Opening) -> Stage 2 (Purpose: "Let me go on") -> Stage 3 (Permission: "Ah, yes. Go ahead") -> Stage 5 (Their need: *"We would have a clearer idea of our products and where to push them"* entered verbatim) -> Stage 7 (Next Step: *"Tuesday after 2 PM Google Meet"*). Demonstrate the tactile one-tap buttons and live timer. |
| **2:30 – 3:30** | **Persistence & Call History** | Show ending the call with outcome *"Meeting Booked"*. Navigate to Call History screen. Refresh the page to prove persistence in Supabase. Drill into the Call Detail view to highlight the stage-by-stage timeline. |
| **3:30 – 4:30** | **AI Coach Demonstration & Guardrails** | Show the AI suggestion feature. Explain the prompt engineering guardrails: it does not hallucinate facts or overwrite prospect quotes; it gives concise, contextual pivot advice. Show fallback behavior if API fails. |
| **4:30 – 5:30** | **Key Design Decision** | Explain the decision to implement **stage-specific one-tap outcome buttons** (derived from 100 actual transcripts) rather than generic "positive/neutral/negative" buttons. Explain how reducing typing allows the caller to listen 80% of the time, especially at Stage 5. |
| **5:30 – 6:00** | **Deployed Architecture & Wrap-Up** | Show the live Render health check endpoint, Vercel frontend, and summarize the delivery. |

---

## 🔒 Security & Privacy Notice

- **No Restricted Transcripts Committed:** Transcript files (`T001–T100`) and extracted text archives are strictly excluded via `.gitignore`.
- **No Hardcoded Secrets:** All Supabase and Gemini credentials reside in environment variables and are never bundled into client-side code.
