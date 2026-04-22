# Contributing to VolunteerBridge

Thank you for your interest in contributing to VolunteerBridge! This project was built for the Google Solution Challenge and we welcome contributions that help us better serve NGOs and volunteers on the ground.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Branch Naming](#branch-naming)
- [Commit Style](#commit-style)
- [Pull Request Process](#pull-request-process)
- [Project Structure](#project-structure)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

---

## Code of Conduct

Be respectful. This project exists to help communities in crisis. Discrimination, harassment, or harmful behaviour of any kind will not be tolerated.

---

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/VolunteerBridge.git
   cd VolunteerBridge
   ```
3. Set up the project by following the [README](./README.md#getting-started)
4. Create a new branch for your work (see [Branch Naming](#branch-naming))

---

## How to Contribute

### Types of contributions we welcome

- 🐛 **Bug fixes** — Found something broken? Fix it and open a PR.
- ✨ **New features** — Check open issues first or open a discussion before building large features.
- 📖 **Documentation** — Improve the README, add inline comments, write guides.
- 🎨 **UI/UX improvements** — Better responsiveness, accessibility, or visual polish.
- 🧪 **Tests** — We have no tests yet. Any coverage is a huge help.
- 🌐 **Translations** — The app is currently English-only. Multi-language support would massively expand reach.

---

## Branch Naming

Use this format:

```
<type>/<short-description>
```

| Type | When to use |
|---|---|
| `feat/` | Adding a new feature |
| `fix/` | Fixing a bug |
| `docs/` | Documentation only changes |
| `style/` | CSS/UI changes, no logic change |
| `refactor/` | Code restructuring, no behaviour change |
| `chore/` | Build tooling, deps, config |

**Examples:**
```
feat/smart-match-scoring
fix/map-blank-on-mobile
docs/add-screenshots
refactor/split-admin-dashboard
```

---

## Commit Style

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary>
```

**Examples:**
```
feat(matching): add multi-skill overlap scoring
fix(map): resolve blank tile bug on first render
docs(readme): add demo GIF and screenshots
chore(deps): upgrade vite to 8.1
```

Keep the summary under 72 characters. Use the body for context if needed.

---

## Pull Request Process

1. Make sure your branch is up to date with `main`
2. Test your changes locally with `npm run dev`
3. Run the linter: `npm run lint`
4. Open a PR against `main` with:
   - A clear title following commit style
   - A description of **what** you changed and **why**
   - Screenshots if it's a UI change
5. A maintainer will review within a few days
6. Address any review comments, then request re-review

**Do not** push directly to `main`. All changes go through PRs.

---

## Project Structure

Key areas to understand before contributing:

| Path | What it does |
|---|---|
| `frontend/src/pages/admin/AdminDashboard.jsx` | Full admin panel — issues, volunteers, approvals, smart match |
| `frontend/src/pages/volunteer/MyTasks.jsx` | Volunteer task lifecycle |
| `frontend/src/pages/issues/IssueReport.jsx` | Issue reporting form with Gemini AI enhancement |
| `frontend/src/pages/map/MapView.jsx` | Live crisis map |
| `frontend/src/context/NotificationContext.jsx` | Real-time notifications via Supabase |
| `supabase_FULL_SETUP.sql` | Full DB schema + RLS + PostGIS matching functions |

---

## Reporting Bugs

Open a GitHub Issue with:

- **Title**: Short description of the bug
- **Steps to reproduce**: Numbered list
- **Expected behaviour**: What should happen
- **Actual behaviour**: What actually happens
- **Environment**: Browser, OS, screen size
- **Screenshots** if applicable

---

## Suggesting Features

Open a GitHub Issue with the label `enhancement`. Include:

- The problem you are trying to solve
- Your proposed solution
- Any alternatives you considered
- Whether you would like to build it yourself

---

## Questions?

Open a GitHub Discussion or reach out via the contact in the repository. We are happy to help you get set up.

---

*Built for the Google Solution Challenge — using technology to accelerate humanitarian response.*
