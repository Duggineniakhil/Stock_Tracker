# StockFolio — Investment Tracker

A full-stack stock portfolio and watchlist tracker with intelligent alerts, interactive charts, and a professional dark-mode dashboard. Built with **Node.js/Express** + **React/Vite**, backed by **SQLite**, and secured with **JWT authentication**.

![Status](https://img.shields.io/badge/Status-Production%20Ready-success)
![Node.js](https://img.shields.io/badge/Node.js-v20+-green)
![React](https://img.shields.io/badge/React-v19+-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## ✨ Features

### 🔐 Authentication & Security
- JWT-based login/register with **refresh tokens** (7-day expiry)
- **Account lockout** after 5 failed login attempts (15-min cooldown)
- **Password strength enforcement** (min 8 chars, uppercase, number)
- Secure HTTP headers via **Helmet.js**, CORS, request body size limits

### 📊 Dashboard
- **Portfolio summary cards** — total value, P/L, top gainer/loser
- **Top performers panel** — side-by-side gainers & losers from watchlist
- **Recent activity timeline** — latest 6 alerts with relative timestamps
- **Quick actions** — one-click nav to portfolio, alerts, and API docs
- **Interactive price chart** (Chart.js) with 1D / 5D / 1M / 6M / YTD / 1Y / MAX ranges
- Live stock detail metrics: previous close, day range, volume, market cap

### 💼 Portfolio
- Track holdings with purchase price, quantity, and buy date
- Real-time P/L calculation per holding and overall
- Portfolio allocation pie chart
- Add, edit, and remove holdings

### 🔔 Alerts System
- **3 alert templates**: Percentage Change, Target Price, Volume Spike
- **4 priority levels**: LOW / MEDIUM / HIGH / CRITICAL
- Create, toggle active/inactive, and delete alert rules
- Alert history with per-stock filtering and clear-all
- **Background alert engine** runs every hour via `node-cron`
- Email notifications via Nodemailer

### 🛠️ Backend Engineering
- **API versioning** — all routes at `/api/v1/`
- **Swagger/OpenAPI 3.0** docs at `/api/v1/docs`
- **Winston logger** with rotating log files (`error.log`, `combined.log`)
- **Rate limiting** — 3-tier (general: 100/min, auth: 10/min, stock: 30/min)
- **Global error handler** with structured JSON responses
- **Database migrations** system (SQLite WAL mode, foreign keys enabled)
- **Health check** endpoint at `/api/v1/health`

### 🧪 Testing
- **Backend**: Jest unit tests (models, services) + Supertest integration tests
- **Frontend**: Vitest + React Testing Library component tests
- Coverage reports for both

### 🚀 DevOps
- Multi-stage **Dockerfiles** for backend (non-root, HEALTHCHECK) and frontend (Vite → Nginx)
- **docker-compose.yml** with health-check service dependencies
- **GitHub Actions CI** — runs tests then builds Docker images on `main`

---

## 🏗️ Architecture

```
stock-tracker-agent-main/
├── .github/
│   └── workflows/ci.yml          # CI: test → Docker build
│
├── backend/
│   ├── server.js                  # Express entry point (v1 API, helmet, swagger)
│   ├── routes/                    # auth, watchlist, stock, alerts, portfolio
│   ├── controllers/               # auth, watchlist, stock, alert, portfolio
│   ├── services/
│   │   ├── stockService.js        # Yahoo Finance integration
│   │   ├── portfolioService.js    # P/L aggregation
│   │   ├── alertRulesService.js   # Rule evaluation engine
│   │   ├── alertEngine.js         # Cron-driven runner
│   │   └── emailService.js        # Nodemailer
│   ├── models/                    # SQLite CRUD for all entities
│   ├── middleware/
│   │   ├── auth.js                # JWT verify
│   │   ├── errorHandler.js        # Global error + 404 handler
│   │   ├── rateLimiter.js         # 3-tier rate limits
│   │   └── requestLogger.js       # Winston HTTP logs
│   ├── utils/
│   │   ├── logger.js              # Winston config
│   │   └── errors.js              # Custom error classes
│   ├── db/
│   │   ├── database.js            # SQLite connection + migration runner
│   │   ├── schema.sql             # Initial schema
│   │   └── migrations.sql         # alert_rules, refresh_tokens, login_attempts
│   ├── swagger.js                 # OpenAPI 3.0 spec
│   ├── Dockerfile
│   ├── .env.example
│   └── tests/
│       ├── unit/                  # models.test.js, services.test.js
│       └── integration/           # api.test.js (supertest)
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx      # Main view with chart + watchlist
│   │   │   ├── Portfolio.jsx      # Holdings management
│   │   │   ├── Alerts.jsx         # Alert history & rule management
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── components/
│   │   │   ├── Navbar.jsx         # Top navigation (Dashboard / Portfolio / Alerts)
│   │   │   ├── PriceChart.jsx     # Chart.js line chart
│   │   │   ├── DashboardSummary.jsx  # 5 metric cards
│   │   │   ├── TopPerformers.jsx  # Gainers / Losers
│   │   │   ├── RecentActivity.jsx # Timeline of recent alerts
│   │   │   ├── QuickActions.jsx   # Quick nav buttons
│   │   │   ├── AllocationPieChart.jsx
│   │   │   └── ...
│   │   ├── services/api.js        # Axios instance + auto token refresh
│   │   ├── context/AuthContext.jsx
│   │   └── tests/                 # Vitest + Testing Library
│   ├── Dockerfile
│   ├── .env.example
│   └── vite.config.js             # Vitest config included
│
├── docker-compose.yml
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ and npm
- Git

### 1. Clone
```bash
git clone <repository-url>
cd stock-tracker-agent-main
```

### 2. Backend setup
```bash
cd backend
cp .env.example .env        # fill in JWT_SECRET and email config
npm install
npm run dev                 # starts on http://localhost:5000
```

### 3. Frontend setup
```bash
cd frontend
cp .env.example .env        # set VITE_API_URL if needed
npm install
npm run dev                 # starts on http://localhost:5173
```

### 4. Open the app
Navigate to **http://localhost:5173** → Register → Start tracking stocks.

---

## 🐳 Docker (Full Stack)

```bash
# copy and fill backend env first
cp backend/.env.example backend/.env

docker compose up --build
```

- Frontend → **http://localhost**
- Backend API → **http://localhost:5000/api/v1**
- Swagger UI → **http://localhost:5000/api/v1/docs**

---

## ⚙️ Environment Variables

### `backend/.env`

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Backend port |
| `NODE_ENV` | `development` | `development` or `production` |
| `JWT_SECRET` | — | **Required.** JWT signing secret |
| `JWT_REFRESH_SECRET` | — | Refresh token secret (auto-derived if blank) |
| `JWT_EXPIRES_IN` | `1h` | Access token lifetime |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token lifetime |
| `EMAIL_USER` | — | SMTP username |
| `EMAIL_PASS` | — | SMTP password / app password |
| `MAX_LOGIN_ATTEMPTS` | `5` | Lockout threshold |
| `LOCKOUT_DURATION_MINUTES` | `15` | Lockout window |

### `frontend/.env`

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:5000` | Backend base URL |

---

## 🔌 API Reference

All endpoints are prefixed with `/api/v1`. Interactive Swagger docs at `/api/v1/docs`.

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Login → access + refresh tokens |
| POST | `/auth/refresh` | Rotate access token using refresh token |
| POST | `/auth/logout` | Revoke refresh token |

### Watchlist *(JWT required)*
| Method | Path | Description |
|--------|------|-------------|
| GET | `/watchlist` | Get all watched stocks with live prices |
| POST | `/watchlist` | Add stock by symbol |
| DELETE | `/watchlist/:id` | Remove stock |

### Stock Data
| Method | Path | Description |
|--------|------|-------------|
| GET | `/stock/:symbol` | Current quote |
| GET | `/stock/:symbol/history?range=1mo` | Historical prices (1d/5d/1mo/6mo/ytd/1y/max) |

### Alerts *(JWT required)*
| Method | Path | Description |
|--------|------|-------------|
| GET | `/alerts` | Alert history (supports `limit`, `offset`, `symbol`) |
| POST | `/alerts` | Create manual alert |
| DELETE | `/alerts/:id` | Delete alert |
| DELETE | `/alerts/history/clear` | Clear all history |
| GET | `/alerts/rules` | Get alert rules |
| POST | `/alerts/rules` | Create rule (`PERCENTAGE_CHANGE` / `TARGET_PRICE` / `VOLUME_SPIKE`) |
| PUT | `/alerts/rules/:id` | Update / toggle rule |
| DELETE | `/alerts/rules/:id` | Delete rule |

### Portfolio *(JWT required)*
| Method | Path | Description |
|--------|------|-------------|
| GET | `/portfolio` | All holdings with live P/L |
| POST | `/portfolio` | Add holding |
| PUT | `/portfolio/:id` | Update holding |
| DELETE | `/portfolio/:id` | Remove holding |
| GET | `/portfolio/summary` | Aggregated totals |
| GET | `/portfolio/allocation` | Percentage allocation per symbol |

### System
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check (uptime, version, env) |

---

## 🧪 Running Tests

```bash
# Backend (Jest)
cd backend
npm test               # unit + integration + coverage

# Frontend (Vitest)
cd frontend
npm run test:run       # run once
npm run test:coverage  # with coverage report
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Chart.js, React Router v7 |
| Backend | Node.js 20, Express 4, SQLite3 |
| Auth | JSON Web Tokens (access + refresh), bcrypt |
| Logging | Winston (rotating files + console) |
| Docs | Swagger UI / OpenAPI 3.0 |
| Stock Data | Yahoo Finance (no API key required) |
| Email | Nodemailer (SMTP) |
| Testing | Jest, Supertest, Vitest, React Testing Library |
| DevOps | Docker, Docker Compose, GitHub Actions |
