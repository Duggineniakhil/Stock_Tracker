# Quotra

A comprehensive, full-stack stock portfolio and market tracking application — **Simplified**. Built with Node.js, Express, React, and SQLite.

![Status](https://img.shields.io/badge/Status-Production%20Ready-success)
![Node.js](https://img.shields.io/badge/Node.js-v20+-green)
![React](https://img.shields.io/badge/React-v19+-blue)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## Live Demo & Deployment

- **Live Application:** [Quotra Web App](https://stock-tracker-1-sj4n.onrender.com)
- **Backend API Base URL:** [Quotra API](https://stock-tracker-dsut.onrender.com)

---

## Key Features

### Interactive Dashboard & Portfolio Management
- **Real-Time Data:** Live stock price tracking via Yahoo Finance integration with 30-second auto-refresh.
- **Portfolio Tracking:** Manage holdings, track purchase prices, calculate real-time P/L, and visualize allocation with interactive chart overlays.
- **Advanced Charting:** View historical price trends ranging from 1D, 5D, 1M, YTD up to Max using Chart.js.
- **Dark Mode UI:** A professional and sleek dark-themed interface crafted for a modern user experience.

### Intelligent Alerts Engine
- **Automated Rules:** Configure alerts for percentage drops/gains, target prices, or volume spikes.
- **Background Cron Jobs:** Reliable background engine runs every hour to evaluate rules and trigger notifications.
- **Multi-channel Notifications:** Receive instant updates via in-app dashboard alerts and email notifications (Nodemailer).

### Robust Security & Auth
- **JWT Authentication:** Secure login flow with short-lived access tokens and 7-day refresh tokens.
- **Brute-Force Protection:** Account lockouts after 5 failed login attempts (15-minute cooldown).
- **Hardened API:** Structured with Helmet.js for secure HTTP headers, automated rate limiters, and CORS protection.

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite, Tailwind CSS, Chart.js, React Router v7 |
| **Backend** | Node.js 20, Express 4, SQLite3, node-cron, Nodemailer |
| **Authentication**| JSON Web Tokens (JWT), bcrypt |
| **Testing** | Backend: Jest, Supertest \| Frontend: Vitest, React Testing Library |
| **DevOps** | Docker, Docker Compose, GitHub Actions (CI/CD) |

---

## System Architecture

```text
stock-tracker-agent-main/
├── .github/workflows/       # CI pipelines and Docker builds
├── backend/                 # Node.js + Express API
│   ├── src/controllers/     # Request handlers
│   ├── src/services/        # Business logic (Yahoo Finance, rules, emails)
│   ├── src/models/          # SQLite models
│   ├── src/middleware/      # Auth, global error handling, rate limiting
│   └── tests/               # Unit and integration test suites
├── frontend/                # React + Vite Client
│   ├── src/pages/           # Main application views
│   ├── src/components/      # Reusable UI components
│   └── src/context/         # Global auth state management
└── docker-compose.yml       # container orchestration
```

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/en/) (v20+)
- [Docker](https://www.docker.com/) & Docker Compose (optional but recommended)
- Git

### Installation (Docker - Recommended)

The easiest way to get the full stack running is via Docker Compose.

```bash
# 1. Clone the repository
git clone https://github.com/Duggineniakhil/Stock_Tracker.git
cd Stock_Tracker

# 2. Setup environment variables for the backend
cp backend/.env.example backend/.env

# 3. Build and spin up the containers
docker compose up --build
```
- Frontend will be available at: `http://localhost`
- Backend API will be available at: `http://localhost:5000/api/v1`
- Swagger API Docs will be available at: `http://localhost:5000/api/v1/docs`

### Installation (Manual - Local Dev)

If you prefer to run the services natively:

**1. Start the Backend API**
```bash
cd backend
cp .env.example .env   # Configure JWT_SECRET and SMTP details
npm install
npm run dev            # Starts server on port 5000
```

**2. Start the Frontend Client**
```bash
cd frontend
cp .env.example .env   # Map VITE_API_URL if needed
npm install
npm run dev            # Starts server on port 5173
```

Navigate to `http://localhost:5173`, create a new account, and start managing your portfolio!

---

## Environment Configuration

Ensure you have configured the following crucial environment variables:

**`backend/.env`**
| Variable | Description | Default / Example |
|----------|-------------|-------------------|
| `PORT` | API Port | `5000` |
| `JWT_SECRET` | Secret key for signing Access Tokens | *Required* |
| `EMAIL_USER` | SMTP username for alert emails | *Required* |
| `EMAIL_PASS` | SMTP application password | *Required* |
| `MAX_LOGIN_ATTEMPTS` | Brute-force threshold | `5` |

**`frontend/.env`**
| Variable | Description | Default / Example |
|----------|-------------|-------------------|
| `VITE_API_URL` | Endpoint for backend services | `http://localhost:5000` |

---

## API Reference Highlights

Complete interactive documentation can be found via Swagger UI at `/api/v1/docs`.

### Authentication
- `POST /api/v1/auth/register` - Create a new user account.
- `POST /api/v1/auth/login` - Authenticate and receive JWT + Refresh Token.

### Portfolio & Watchlist
- `GET /api/v1/portfolio` - Fetch all active holdings with aggregated P/L.
- `POST /api/v1/watchlist` - Add a stock symbol to your real-time tracking list.

### Alerts System
- `GET /api/v1/alerts/rules` - Retrieve configured monitoring rules.
- `POST /api/v1/alerts/rules` - Configure a new alert (e.g. `PERCENTAGE_CHANGE`).

---

## Testing

```bash
# Run backend test suite (Unit & Integration)
cd backend && npm test

# Run frontend tests with coverage
cd frontend && npm run test:coverage
```

---

## License & Credits

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
Stock data powered by [Yahoo Finance](https://finance.yahoo.com/).
