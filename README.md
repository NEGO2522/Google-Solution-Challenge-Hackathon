# ReliefLink — AI-Powered Volunteer Allocation System

> Submitted to **Google Solution Challenge**

ReliefLink is an AI-powered platform that intelligently matches verified volunteers to disaster relief and community crisis situations in real time. It uses a smart scoring algorithm that weighs volunteer skills, geographic proximity, trust score, and issue urgency to dispatch the right help — faster.

---

## The Problem

During natural disasters and community crises, NGOs and relief coordinators struggle to quickly identify and deploy the right volunteers. Manual coordination is slow, error-prone, and leaves critical gaps in response time — costing lives.

## Our Solution

ReliefLink provides a unified platform where:
- NGO admins can report crisis issues and see AI-matched volunteers instantly.
- Volunteers receive real-time task assignments based on their verified skills and location.
- A trust score system ensures accountability and quality over time.

---

## Features

- Auth — Role-based authentication for Volunteers and NGO Admins
- Live Map — Real-time crisis issue pins powered by React Leaflet
- Smart Match — AI scoring engine using skills, distance, trust score, and urgency
- Admin Console — Manage issues, volunteers, and approvals from one dashboard
- Task Tracking — Volunteers can accept, start, and complete tasks with proof of work
- Ratings & Trust Score — Reputation system that rewards reliable volunteers
- Notifications — Real-time updates via Supabase Realtime

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite |
| Maps | React Leaflet + Leaflet.js |
| Backend & Auth | Supabase (Postgres, PostGIS, Auth, Realtime) |
| Hosting | Firebase / Vercel |
| Language | JavaScript (ES Modules) |

---

## Project Structure

```
ReliefLink-AI-Smart-Volunteer-Allocation-System/
├── frontend/
│   ├── public/                      # Static assets
│   ├── src/
│   │   ├── assets/                  # Images and icons
│   │   ├── components/
│   │   │   ├── NotificationBell.jsx # Real-time notification component
│   │   │   └── TrustScore.jsx       # Volunteer trust score display
│   │   ├── context/                 # React context providers
│   │   ├── lib/                     # Supabase client & utilities
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   │   ├── AdminDashboard.jsx   # NGO admin panel
│   │   │   │   └── RatingPanel.jsx      # Rate & review volunteers
│   │   │   ├── auth/                    # Login & signup pages
│   │   │   ├── issues/
│   │   │   │   └── IssueReport.jsx      # Report a crisis issue
│   │   │   ├── map/                     # Live crisis map view
│   │   │   ├── volunteer/
│   │   │   │   ├── MyTasks.jsx          # Volunteer task dashboard
│   │   │   │   └── VolunteerProfile.jsx # Profile & skills management
│   │   │   └── Dashboard.jsx            # Main landing dashboard
│   │   ├── App.jsx                  # App routes
│   │   └── main.jsx                 # Entry point
│   ├── index.html
│   ├── vite.config.js
│   ├── firebase.json                # Firebase hosting config
│   └── vercel.json                  # Vercel deployment config
├── supabase_FULL_SETUP.sql          # Full Supabase DB schema
├── seed_volunteers_with_auth.sql    # Seed data for testing
├── LICENSE
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- A [Supabase](https://supabase.com) project with PostGIS enabled

### 1. Clone the repository

```bash
git clone https://github.com/your-username/ReliefLink-AI-Smart-Volunteer-Allocation-System.git
cd ReliefLink-AI-Smart-Volunteer-Allocation-System
```

### 2. Set up the database

Run the SQL scripts in your Supabase SQL editor in this order:

```
1. supabase_FULL_SETUP.sql
2. seed_volunteers_with_auth.sql   (optional, for test data)
```

### 3. Configure environment variables

Create a `.env` file inside the `frontend/` directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Install dependencies and run

```bash
cd frontend
npm install
npm run dev
```

The app will be running at `http://localhost:5173`.

---

## How the AI Matching Works

When an NGO admin posts a crisis issue, the system scores every available volunteer using a weighted formula:

```
Match Score = (Skill Match × 0.4) + (Proximity Score × 0.3) + (Trust Score × 0.2) + (Urgency Bonus × 0.1)
```

The top-scored volunteers are surfaced to the admin for dispatch. This ensures the most qualified, closest, and most reliable volunteers are always assigned first.

---

## UN Sustainable Development Goals Addressed

- **SDG 11** — Sustainable Cities and Communities
- **SDG 13** — Climate Action (disaster response)
- **SDG 17** — Partnerships for the Goals

---

## Team

Built for the **Google Solution Challenge** by a team solvers passionate about using technology to accelerate humanitarian response.

---

## License

This project is licensed under the terms of the [LICENSE](./LICENSE) file.
