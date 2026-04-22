# VolunteerBridge — AI-Powered Volunteer Allocation System

> **Google Solution Challenge Submission**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Realtime-3ECF8E?logo=supabase)](https://supabase.com)
[![Gemini](https://img.shields.io/badge/Google%20Gemini-2.0%20Flash-4285F4?logo=google)](https://ai.google.dev)
[![PostGIS](https://img.shields.io/badge/PostGIS-Geospatial-336791)](https://postgis.net)

VolunteerBridge is a full-stack AI platform that intelligently matches verified volunteers to disaster relief and community crisis situations in real time. The moment an NGO admin reports a crisis, the system scores every available volunteer across skills, GPS proximity, trust score, and urgency — and surfaces the best matches in seconds.

---

## Screenshots

| Dashboard | Live Crisis Map |
|---|---|
| ![Dashboard](./screenshots/01-dashboard.png) | ![Live Map](./screenshots/02-live-map.png) |

| Smart Match Engine | Issue Report + Gemini AI |
|---|---|
| ![Smart Match](./screenshots/03-smart-match.png) | ![Issue Report](./screenshots/04-issue-report.png) |

---

## The Problem

When disasters strike, every minute matters. Yet most NGOs still coordinate volunteers through phone calls, spreadsheets, and WhatsApp groups. This chaotic process leads to the wrong people being sent to the wrong places, or nobody being sent at all — costing lives.

In India alone, there are over 3 million NGOs operating across hundreds of districts. None of them have a standardised, real-time volunteer dispatch system.

## Our Solution

VolunteerBridge replaces manual coordination with AI-driven dispatch. When a crisis is reported:

1. The **Smart Match engine** (a PostGIS SQL function) runs a weighted scoring algorithm across every verified, available volunteer within a dynamic radius.
2. The **top-matched volunteers** are surfaced to the admin instantly — with their skill match, distance, trust score, and match percentage visualised.
3. The **assigned volunteer** gets a real-time push notification and can accept, start, and complete the task from their dashboard.
4. On completion, they submit a **proof of work** text report, and their **Trust Score** is automatically recalculated.
5. The admin can then **rate** the volunteer, closing the accountability loop.

This compresses what used to take hours of phone coordination into a few seconds of AI-assisted decision-making.

---

## Live Features

| Feature | Details |
|---|---|
| Role-based Auth | Separate flows for Volunteers and NGO Admins via Supabase Auth |
| Live Crisis Map | Real-time issue pins on a dark-mode Leaflet map with urgency icons, volunteer markers, and radius overlay |
| Smart Match Engine | PostGIS `smart_match_volunteers()` SQL function scores by skill (35%), proximity (30%), trust (25%), availability (10%) |
| Volunteer Verification | Document upload (Supabase Storage) + phone OTP flow + admin approval panel |
| Task Lifecycle | Full accept to start to proof submission to resolved pipeline with Supabase Realtime sync |
| Trust Score System | Auto-recalculated via `recalculate_trust_score()` RPC after each task completion |
| Real-time Notifications | Supabase Realtime pushes task assignments, approvals, and resolution alerts |
| Gemini AI Integration | Issue description enhancement via Gemini 2.0 Flash + Gemini-powered in-app chatbot assistant |
| Admin Console | Issues table, volunteer roster, approval queue, and smart match panel in one dashboard |
| Rating System | Admins rate volunteers post-task; ratings feed directly into trust score recalculation |

---

## How the AI Matching Works

When an NGO admin assigns a volunteer to a crisis issue, the backend runs a PostGIS-powered scoring function:

```sql
match_score =
  (skill_overlap_bonus)           -- 35 pts if volunteer skills match issue category
  + (proximity_score)             -- up to 30 pts based on GPS distance vs dynamic radius
  + (trust_score / 100.0 * 25)   -- up to 25 pts from historical reputation
  + (availability_bonus)          -- 10 pts if volunteer is marked available
```

The dynamic radius scales with urgency: `critical` = 200 km, `high` = 100 km, `medium` = 75 km, `low` = 50 km.

This ensures the most qualified, closest, and most reliable volunteers are always dispatched first.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite 8 |
| Styling | Tailwind CSS 4 + custom CSS modules |
| Maps | React Leaflet + Leaflet.js (dark CartoDB tiles) |
| AI | Google Gemini 2.0 Flash (issue enhancement + chatbot) |
| Backend & Auth | Supabase — Postgres, PostGIS, Auth, Realtime, Storage |
| Geospatial | PostGIS `GEOGRAPHY(POINT, 4326)` + `ST_DWithin` + `ST_Distance` |
| Hosting | Firebase Hosting + Vercel (dual config) |
| Language | JavaScript ES Modules |

---

## Project Structure

```
Google-Solution-Challenge-Hackathon/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── NotificationBell.jsx    # Real-time notification bell with unread count
│   │   │   └── TrustScore.jsx          # Animated trust score display card
│   │   ├── context/
│   │   │   └── NotificationContext.jsx # Global notification state + Supabase Realtime
│   │   ├── lib/
│   │   │   └── supabase.js             # Supabase client initialisation
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   │   ├── AdminDashboard.jsx  # Issues, volunteer management, approvals, smart match
│   │   │   │   └── RatingPanel.jsx     # Rate completed volunteer tasks
│   │   │   ├── auth/
│   │   │   │   └── AuthPage.jsx        # Login + signup with role selection
│   │   │   ├── issues/
│   │   │   │   └── IssueReport.jsx     # Crisis report form with map pin + Gemini AI enhance
│   │   │   ├── map/
│   │   │   │   └── MapView.jsx         # Live crisis map with filters, radius, side panel
│   │   │   ├── volunteer/
│   │   │   │   ├── MyTasks.jsx         # Task list: accept, start, submit proof
│   │   │   │   └── VolunteerProfile.jsx # Skills, OTP, document upload, location
│   │   │   └── Dashboard.jsx           # Shell: sidebar nav, home overview, chatbot widget
│   │   ├── App.jsx                     # Auth gate + session management
│   │   └── main.jsx                    # Entry point
│   ├── index.html
│   ├── vite.config.js
│   ├── firebase.json
│   └── vercel.json
├── screenshots/                        # App screenshots
├── supabase_FULL_SETUP.sql             # Complete DB schema, RLS policies, PostGIS functions
├── seed_volunteers_with_auth.sql       # Demo data for testing
├── CONTRIBUTING.md                     # Contribution guide
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- A [Supabase](https://supabase.com) project with the **PostGIS** extension enabled
- A [Google AI Studio](https://aistudio.google.com) API key for Gemini

### 1. Clone the repository

```bash
git clone https://github.com/your-username/VolunteerBridge.git
cd VolunteerBridge
```

### 2. Set up the Supabase database

Open your Supabase project, go to SQL Editor, create a New Query, then run these scripts in order:

```
1. supabase_FULL_SETUP.sql       -- tables, RLS, PostGIS functions
2. seed_volunteers_with_auth.sql -- optional demo data
```

Also create a private Storage bucket named `volunteer-docs` for ID document uploads.

### 3. Configure environment variables

Create a `.env` file inside `frontend/`:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_google_gemini_api_key
```

Never commit this file. It is already covered by `.gitignore`.

### 4. Install and run

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

---

## Database Schema

| Table | Purpose |
|---|---|
| `volunteer_profiles` | Skills, GPS location, trust score, verification status |
| `ngo_profiles` | NGO name, city, admin user mapping |
| `issues` | Crisis reports with PostGIS `GEOGRAPHY(POINT)` location |
| `task_assignments` | Volunteer-to-issue assignments with full lifecycle status |
| `ratings` | Admin ratings per assignment, feeds trust score |
| `notifications` | Real-time notification queue per user |
| `otp_verifications` | Phone OTP records with expiry |

Key PostgreSQL functions:

- `smart_match_volunteers(p_issue_id, p_limit)` — returns ranked volunteer matches
- `recalculate_trust_score(p_volunteer_id)` — recomputes score from ratings and completion history
- `volunteers_near(lat, lng, radius_km)` — proximity search using PostGIS ST_DWithin

---

## UN Sustainable Development Goals

- **SDG 11** — Sustainable Cities and Communities (faster community crisis response)
- **SDG 13** — Climate Action (disaster relief volunteer coordination)
- **SDG 17** — Partnerships for the Goals (NGO and volunteer network)

---

## Google Technologies Used

- **Gemini 2.0 Flash** — AI-powered issue description enhancement and in-app chatbot
- **Firebase Hosting** — Production deployment target
- **Leaflet Maps** — Geospatial crisis mapping

---

## Contributing

We welcome contributions. Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request.

---

## Team

Built for the **Google Solution Challenge** by developers passionate about using AI to accelerate humanitarian response across India and beyond.

---

## License

This project is licensed under the terms of the [LICENSE](./LICENSE) file.
