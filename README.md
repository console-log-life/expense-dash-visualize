# Personal Finance Dashboard

Track income and expenses, see where your money goes, set monthly budgets with alerts, and import bank statements from CSV. Each user has their own account and data.

**Live demo:** https://expense-dash-visualize.vercel.app (the API runs on Render's free tier, so the first request after a while can take 30–50 seconds)

**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Recharts
**Backend:** Node.js, Express, MongoDB (Mongoose), JWT auth
**Tests:** Node.js test runner, Supertest, mongodb-memory-server

## Features

- **Accounts:** sign up and log in; passwords hashed with bcrypt, sessions as JWTs that expire. Every query is filtered by the logged-in user's id, so nobody can read or change another user's data.
- **Transactions:** add, edit, delete, search and page through income and expenses for any month.
- **Dashboard:** all-time balance, this month's income and expenses with real month-over-month change, a 12-month income vs expense chart, and spending by category.
- **Budgets:** one budget per category per month, a budget-vs-actual view, and alerts when a category reaches 80% or goes over.
- **CSV import:** upload a bank statement; bad rows are reported by row number, and rows already imported are skipped, so uploading the same file twice does not create duplicates.

## How it works

### Money is stored as integer paise

Amounts are never stored as floating point rupees. In JavaScript `0.1 + 0.2 === 0.30000000000000004` and `1.15 * 100 === 114.99999999999999`, so summing float amounts slowly drifts away from the real total. Every amount is stored as a whole number of paise (₹125.50 → `12550`), and the conversion from the text the user typed works on the string itself, never on a float (`server/src/lib/money.js`). Rupees appear only when formatting for display.

### Totals are calculated in MongoDB

The dashboard numbers come from aggregation pipelines (`server/src/services/summary.js`): `$match` on the user and date range, then `$group` by month and type, or by category, with `$sum`. The server never loads every transaction into memory just to add them up. A compound index on `{ userId, date }` serves both these pipelines and the transaction list, which always asks for one user's rows newest first.

### Duplicate-safe CSV import

Each imported row gets a fingerprint: a SHA-256 hash of its date, amount, type and normalised description (`server/src/lib/importHash.js`). A unique index on `{ userId, importHash }` means the same row can never be saved twice, even if two uploads of the same file happen at the same moment. Two genuinely identical rows in one file (two ₹20 teas on the same day) get an occurrence number, so both are kept.

### Budgets use an upsert

Saving a budget is a single `findOneAndUpdate(..., { upsert: true })` on `{ userId, month, category }`, backed by a unique index. Saving twice updates the same budget instead of creating a second one.

## API

All routes except register, login and health need `Authorization: Bearer <token>`.

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Create an account |
| POST | `/api/auth/login` | Log in |
| GET | `/api/auth/me` | Current user |
| GET | `/api/transactions?month=&q=&category=&type=&page=&limit=` | List transactions |
| POST | `/api/transactions` | Add a transaction |
| PUT | `/api/transactions/:id` | Edit a transaction |
| DELETE | `/api/transactions/:id` | Delete a transaction |
| POST | `/api/transactions/import` | Import CSV (`{ "csv": "..." }`) |
| GET | `/api/budgets?month=` | List budgets |
| PUT | `/api/budgets` | Create or update a budget |
| DELETE | `/api/budgets/:id` | Delete a budget |
| GET | `/api/summary?month=YYYY-MM` | Dashboard totals, trend, categories, budget alerts |

Amounts are sent as strings (`"amount": "125.50"`) and returned as integer paise (`"amountPaise": 12550`).

### CSV format

```csv
date,description,amount,type,category
01/11/2026,Salary,50000,credit,Salary
02/11/2026,Swiggy order,-349.50,,Food & Dining
```

`date`, `description` and `amount` are required. `type` (income/expense or credit/debit) and `category` are optional; without a type, a negative amount is an expense. Dates can be `YYYY-MM-DD` or `DD/MM/YYYY`. Up to 2,000 rows per file.

## Run locally

Needs Node.js 20.6+ and a MongoDB database (a free MongoDB Atlas cluster works).

```bash
git clone https://github.com/console-log-life/expense-dash-visualize.git
cd expense-dash-visualize

# Backend
cd server
cp .env.example .env     # set MONGODB_URI and JWT_SECRET
npm install
npm run dev              # http://localhost:5000

# Frontend (new terminal, from the project root)
cp .env.example .env     # VITE_API_URL=http://localhost:5000
npm install
npm run dev              # http://localhost:8080
```

## Tests

```bash
cd server
npm test          # unit tests + API tests against an in-memory MongoDB
npm run test:unit # only the tests that need no database
```

The API tests cover auth, ownership checks between users, pagination, exact paise totals, CSV import and re-import, budget upserts and the summary numbers. GitHub Actions runs them on every push, along with a lint and build of the frontend.

## Deploy

- **Database:** MongoDB Atlas free cluster. Copy its connection string.
- **Backend:** Render web service, root directory `server`, build `npm install`, start `npm start`. Set `MONGODB_URI`, `JWT_SECRET` and `CORS_ORIGINS` (your Vercel URL).
- **Frontend:** Vercel, project root. Set `VITE_API_URL` to the Render URL. `vercel.json` sends every path to `index.html` so `/login` works on refresh.

## Project structure

```
├── src/                       React frontend
│   ├── components/            Charts, forms, lists, budgets, CSV import
│   ├── context/AuthContext    Login state
│   ├── hooks/useFinance       Loads and changes dashboard data through the API
│   ├── lib/api.ts             Fetch wrapper that adds the token
│   ├── lib/format.ts          ₹ formatting from paise
│   └── pages/                 Dashboard, Login
└── server/                    Express API
    ├── src/lib/               money, dates, CSV parsing, validation, import hash
    ├── src/models/            User, Transaction, Budget (with indexes)
    ├── src/routes/            auth, transactions, budgets, summary
    ├── src/services/          aggregation summary, CSV import
    └── tests/                 unit and API tests
```
