<div align="center">
  <h1>Quotra</h1>
  <p>A comprehensive, full-stack stock portfolio and market tracking application - <b>Simplified and AI-Powered</b>. Built with Node.js, Express, React, SQLite, and Google Gemini.</p>

  ![Status](https://img.shields.io/badge/Status-v1.2.0-blue)
  ![Node.js](https://img.shields.io/badge/Node.js-v24+-green)
  ![React](https://img.shields.io/badge/React-v19+-blue)
  ![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)
  ![License](https://img.shields.io/badge/License-MIT-yellow)
</div>

---

## Live Demo & Deployment

- **Live Application:** [Quotra Web App](https://stock-tracker-lime-nu.vercel.app)
- **Backend API Base URL:** [Quotra API](https://stock-tracker-dsut.onrender.com)

---

## Key Features

### Interactive Dashboard & Portfolio Management
- **Real-Time Data:** Live stock price tracking via Yahoo Finance integration with 30-second auto-refresh.
- **Portfolio Tracking:** Manage holdings, track purchase prices, calculate real-time P/L, and visualize allocation with interactive chart overlays.
- **Advanced Charting:** View historical price trends ranging from 1D, 5D, 1M, YTD up to Max using Chart.js with integrated Technical Analysis (RSI, SMA).
- **Portfolio Benchmarking:** Compare your portfolio performance directly against the S&P 500 (^GSPC) to measure relative success.
- **Dark Mode UI:** A professional and sleek dark-themed interface crafted for a modern user experience with PWA support for mobile installation.

### AI-Powered Insights
- **AI Advisor:** A Google Gemini powered chatbot that understands your portfolio and answers market questions.
- **Sentiment Analysis:** Real-time news sentiment (Bullish/Bearish) mapped to your watchlist.
- **Smart Reports:** Auto-generated portfolio health summaries highlighting diversification and risks.
- **Smart Alerts:** AI-generated plain-English explanations attached to automated price alerts.

### Intelligent Alerts Engine
- **Automated Rules:** Configure alerts for percentage drops/gains, target prices, or volume spikes.
- **Notification Center:** A real-time in-app notification inbox for tracking triggered alerts with read/unread status.
- **Background Cron Jobs:** Dedicated alert worker runs hourly outside the main Express server to evaluate rules and trigger notifications.
- **Multi-channel Notifications:** Receive instant updates via in-app dashboard alerts and email notifications.

### Robust Security & Auth
- **JWT Authentication:** Secure login flow with short-lived access tokens and 7-day refresh tokens.
- **Brute-Force Protection:** Account lockouts after 5 failed login attempts (15-minute cooldown).
- **Hardened API:** Structured with Helmet.js for secure HTTP headers, automated rate limiters, and CORS protection.
- **Admin Command Center:** Built-in administrative dashboard for managing platform health and user subscriptions.
- **User Settings & Security:** Dedicated profile management to update account details and change passwords securely.
- **Subscription Engine:** Functional pricing tier management (Free, Student, Pro) with integrated mock payment flows.
- **Data Portability:** Export your entire portfolio and performance metrics to CSV for offline analysis.

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite, TypeScript, React Router v7, Chart.js |
| **Backend** | Node.js 20, Express 4, TypeScript, SQLite3, Nodemailer, JWT auth, cron worker |
| **Authentication** | JSON Web Tokens (JWT), bcrypt, refresh-token support |
| **Testing** | Backend: Jest, Supertest | Frontend: Vitest, React Testing Library |
| **DevOps** | Docker, Docker Compose, GitHub Actions (CI/CD) |

---

## System Architecture

```text
stock-tracker-agent-main/
├── .github/workflows/       # CI pipelines and Docker builds
├── backend/                 # Node.js + Express API
│   ├── controllers/         # Request handlers
│   ├── services/            # Business logic (Yahoo Finance, rules, emails)
│   ├── models/              # SQLite models
│   ├── middleware/          # Auth, global error handling, rate limiting
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
- [Docker](https://www.docker.com/)
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

**Optional: Start the Alerts Worker**
```bash
cd backend
npm run worker         # Runs the dedicated alert rules engine separately
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
| `GEMINI_API_KEY` | Key for AI features | *Required for AI* |
| `AI_MODEL` | AI model to use | `gemini_flash` |

**`frontend/.env`**
| Variable | Description | Default / Example |
|----------|-------------|-------------------|
| `VITE_API_URL` | Endpoint for backend services | `http://localhost:5000` |

---

## API Reference Highlights

Complete interactive documentation can be found via Swagger UI at `/api/v1/docs`.

### Authentication
- `POST /api/v1/auth/register` - Create a new user account.
- `POST /api/v1/auth/login` - Authenticate and receive JWT access token; refresh token is stored securely in an HTTP-only cookie.

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
