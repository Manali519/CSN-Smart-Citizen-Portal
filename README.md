# Smart City Portal

## Introduction

Smart City Portal is a civic services platform for Chhatrapati Sambhajinagar. Citizens can report problems, book city services and pay for them online. Municipal officers handle the work, and administrators track how the city is doing.
The project has two parts: a React frontend and an Express API. 

### Key features

- **Citizen accounts** – sign up with email and a one-time password (OTP), or sign in with Google.
- **Complaint registration** – report water, sanitation, roads, street lighting or administrative issues with a photo and location. Each complaint is sent to the right department.
- **AI complaint checks** – Google Gemini reviews the photo and description. Suspected fakes and duplicate photos are held for an admin to review.
- **Service bookings** – book a water tanker from a verified water source, or book a garbage collection van.
- **Online payments** – pay for bookings through Razorpay.
- **Officer dashboard** – officers see requests for their department, accept them and mark them complete.
- **Admin dashboard** – weekly statistics, citizen ratings and a review queue for flagged complaints.
- **Public city information** – a complaint map, city statistics, daily updates, transport, facilities and city history.

## Installation and setup

### Requirements

- Node.js 24.x
- A MongoDB Atlas cluster
- A Google OAuth client ID, an SMTP account for OTP emails, and a Gemini API key
- Razorpay keys (optional; payment routes return 503 without them)

### 1. Clone the repository

```bash
git clone <link>
```

### 2. Set up the backend

```bash
cd backend
npm install
```

```bash
npm run dev
```

### 3. Create staff accounts

Admins and officers can't sign up from the app. Create them from the `backend` folder:

```bash
npm run create-admin -- <email> <password> [name]
npm run create-officer -- <officerId> <password> <department> [name]
```

Passwords must be at least 8 characters. Valid departments are `water`, `sanitation`, `administration`, `roads`, `electrical` and `others`. If the account already exists, the script resets its password.

In PowerShell, use `npm.cmd` instead of `npm` and put arguments in single quotes.

### 4. Set up the frontend

```bash
cd ../frontend
npm install
npm run dev
```

### 5. Deploy to Vercel

1. Create two Vercel projects from this repository: one with root directory `backend`, one with root directory `frontend`.
2. Add the backend environment variables in the backend project's settings under **Production**.
3. In `frontend/vercel.json`, point the `/api` rewrite to your backend URL.
4. Push to `main`. Redeploy after any change to environment variables.

## Project structure and uses

```
.
├── backend/                 Express API (runs as a Vercel Function)
│   ├── api/index.js         Vercel entry point
│   ├── scripts/             create-admin and create-officer commands
│   ├── src/
│   │   ├── config/          Environment, database, complaint categories
│   │   ├── controllers/     Request handlers for each feature
│   │   ├── middleware/      Auth, rate limits, validation, file uploads
│   │   ├── models/          Mongoose schemas (User, Complaint, Officer, Admin, ...)
│   │   ├── routes/          API routes under /api
│   │   ├── utils/           Gemini, email, OTP, payments, image hashing
│   │   ├── app.js           Express app setup
│   │   └── server.js        Local server
│   ├── tests/               Node test runner tests
│   └── vercel.json
├── frontend/                React + Vite web app
│   ├── public/assets/       Images and logo
│   ├── src/
│   │   ├── api/             HTTP client and session handling
│   │   ├── components/      Shared UI (navbar, map, stats, ratings)
│   │   ├── context/         Auth state
│   │   ├── hooks/           Google sign-in and Razorpay checkout
│   │   ├── pages/           One file per screen
│   │   └── services/        API calls grouped by feature
│   ├── vite.config.js
│   └── vercel.json          API rewrite and security headers
└── package.json             Root scripts
```

### API overview

| Route                         | Purpose                                         |
| ----------------------------- | ----------------------------------------------- |
| `/api/auth`                   | Citizen register, OTP, login, Google sign-in, profile |
| `/api/complaints`             | File complaints, track them, give feedback, review queue |
| `/api/tanker`                 | Water sources and tanker bookings               |
| `/api/services/garbage-van`   | Garbage van bookings                            |
| `/api/requests`               | A citizen's service requests                    |
| `/api/officer`                | Officer login, accept and complete requests     |
| `/api/admin`                  | Admin login and dashboard statistics            |
| `/api/payments`               | Razorpay orders, verification, payment history  |
| `/api/public`                 | City statistics and the complaint map           |

### Root scripts

```bash
npm run dev:backend      # start the API
npm run dev:frontend     # start the web app
npm run build:frontend   # production build of the web app
```

## Conclusion

Smart City Portal brings complaints, service bookings and payments into one place, so a request can go from a citizen to the right department and on to completion without standing in a queue. Officers know what action to take and upload a resolution proof, administrators can see how well the city is responding and its statistics. Because the frontend and API are deployed separately, each can be updated and scaled on its own.
