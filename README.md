# 🎬 Watchlist — Movies & TV Shows Tracker

A modern, cinematic, independent full-stack web application to track movies and TV series, log episode progress with 1 click, maintain ratings and personal reviews, and import backlogs via TMDB (The Movie Database).

---

## ✨ Features

- **Instant TMDB Search (`Ctrl+K`):** Type any title to fetch official posters, release years, synopsis, genres, and TMDB scores in real-time.
- **1-Click Episode Tracker:** Single-click `+1 Next Ep` button on cards for running TV shows. Automatically updates current episode and progress bar without page reloads.
- **Batch Backlog Import:** Paste up to 50 titles (e.g. from notes or Instagram saves) at once; the system matches them against TMDB and imports them into your *Plan to Watch* list with 1 click.
- **Cinematic Dark Theme:** Sleek deep-dark palette (`#090a0f`), backdrop blur, responsive card grids, and status badges (*Watching, Plan to Watch, Completed, Dropped*).
- **Personal Ratings & Notes:** Score from 1 to 10 stars and jot down personal reviews or reasons why you saved each item.
- **Future-Proof Multi-User Architecture:** Built with Prisma ORM and SQLite (local dev), pre-seeded with single-user focus, but fully relational with `userId` ready for multi-tenant deployment to PostgreSQL or Oracle Cloud VPS.

---

## 🚀 Quick Start

### 1. Environment Variables
Copy `.env.example` to `.env`:
```env
DATABASE_URL="file:./dev.db"
# Get your free TMDB API Read Access Token or API Key from: https://www.themoviedb.org/settings/api
TMDB_API_KEY=""
DEFAULT_USER_EMAIL="furkan@watchlist.local"
```

### 2. Install & Sync Database
```bash
npm install
npx prisma db push
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm run start
```
