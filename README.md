# BookMyShow Replica

A full-stack, BookMyShow-inspired movie-ticket booking workflow. Sign in with a mobile number and demo OTP, browse backend-served movies and theatres, select deterministic seats, choose dummy Card or UPI payment, and receive a SQLite-persisted ticket confirmation.

## Stack

- **Frontend:** Next.js 14, React, TypeScript
- **Backend:** Express 4, TypeScript, Zod, JWT
- **Persistence:** file-backed SQLite (`better-sqlite3`)
- **Testing:** Vitest, Supertest, Testing Library, Playwright

## Demo journey

1. Open the app and choose **Find a show**.
2. Enter any 10-digit mobile number.
3. Use OTP **`1234`**.
4. Select a movie and mapped theatre.
5. Click **Select seats** to choose `A1`, `A2`, and `A3` for Rs. 450.
6. Use Card or UPI dummy details, then pay. The processing view lasts exactly two seconds before a durable ticket is created.

## Run locally

Install each tier independently:

```bash
cd backend && npm install --no-bin-links
cd ../frontend && npm install --no-bin-links
```

Start the API in one terminal:

```bash
cd backend
PORT=4000 CORS_ORIGIN=http://localhost:3000 DATABASE_PATH=./data/bookmyshow.db npm run dev
```

Start the Next.js app in another:

```bash
cd frontend
API_SERVER_URL=http://localhost:4000 npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The backend seeds Paradise, Bloody Romeo, OG2, Sandhya 70mm, Sudharsham 70mm, Allu Cinemas, and their movie mappings on startup.

## Run with Docker Compose

```bash
docker compose up --build
```

The frontend is available at `http://localhost:3000`; the API health endpoint is `http://localhost:4000/api/health`. Compose persists SQLite data in the `booking-data` named volume.

## API

All business endpoints use `/api/v1` and require a bearer JWT after verification unless noted.

- `GET /api/health` — dependency-free health response.
- `POST /api/v1/auth/login` — body `{ "mobileNumber": "9876543210" }`.
- `POST /api/v1/auth/verify` — body `{ "mobileNumber": "9876543210", "otp": "1234" }`.
- `GET /api/v1/movies` — seeded movie catalogue.
- `GET /api/v1/theatres?movieId=1` — mapped theatre options.
- `POST /api/v1/bookings` — body `{ "movieId": 1, "theatreId": 1, "seats": ["A1","A2","A3"], "paymentMethod": "card", "totalPrice": 450 }`.

The booking API does not receive or store card number, CVV, expiry, or UPI values.

## Tests and builds

Sandbox-compatible commands invoke package entries directly because executable shims may be unavailable.

```bash
cd backend && node node_modules/typescript/bin/tsc && node node_modules/vitest/vitest.mjs run
cd frontend && node node_modules/vitest/vitest.mjs run
cd frontend && NODE_ENV=production node node_modules/next/dist/bin/next build
cd frontend && node node_modules/@playwright/test/cli.js test --config playwright.config.ts
```

## Configuration

Copy the per-tier `.env.example` files for local customization. Do not commit `.env` files. Key values include API port, allowed CORS origin, SQLite path, JWT secret, and the server-only frontend API rewrite destination.

## License

This project is private and proprietary.
