# Wander Lust Store

A full-stack, portfolio-quality e-commerce application: a **NestJS + Prisma**
REST API, a **Next.js** customer storefront, and a separate **Next.js** admin
panel — all in one repository.

> Outdoor & travel gear shop. Built to demonstrate clean architecture,
> server-side security, and a real (not mocked) frontend ↔ backend integration.

![status](https://img.shields.io/badge/tests-passing-brightgreen)

## Architecture

```
wander-lust-store/
├── backend/     NestJS 11 REST API + Prisma (PostgreSQL)   → http://localhost:3000/api
├── frontend/    Next.js 14 storefront (App Router)         → http://localhost:3100
└── admin/       Next.js 14 admin panel (App Router)        → http://localhost:3200
```

- **Backend** owns all business logic and security. Global JWT authentication,
  role-based authorization, DTO validation, and **server-side pricing** (the
  client never dictates prices or totals).
- **Storefront** and **Admin** are independent Next.js apps that consume the
  same API over HTTP. Neither holds any secret — they only ever use the public
  `NEXT_PUBLIC_API_URL`.

### Tech stack

| Layer     | Tech |
|-----------|------|
| API       | NestJS 11, Passport (JWT + local), Prisma 6, PostgreSQL, class-validator, bcryptjs |
| Frontend  | Next.js 14 (App Router), React 18, Tailwind CSS, Vitest + Testing Library |
| Admin     | Next.js 14 (App Router), React 18, Tailwind CSS |
| Tooling   | TypeScript, Jest (backend), Vitest (frontend) |

## Domain model

`User` · `Category` (self-referencing tree) · `Product` (+ `ProductImage`,
`ProductVariant`) · `Order` (+ `OrderItem`) · `ShippingAddress` · `WishlistItem`
· `Coupon`. See [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma).

## Security model

- **Global JWT guard** — every route requires a valid token unless marked
  `@Public()`. **Global roles guard** — `@Roles('ADMIN')` gates all mutations.
- **Passwords** are bcrypt-hashed and never returned by the API.
- **Ownership** is enforced server-side: customers can only read/cancel their
  own orders; admins can see everything.
- **Order pricing** (subtotal, tax, shipping, total) and **stock decrement**
  are computed on the server inside a transaction — oversells are rejected and
  rolled back.
- The frontend's client-side auth checks are **UX only**; the API is the
  source of truth.
- No secrets are committed. `.env` files are git-ignored; only
  `.env.local.example` (public API URL) is tracked.

## Getting started

### Prerequisites

- Node.js 20+ and npm
- A PostgreSQL database. The repo is preconfigured for a **local Prisma
  Postgres** dev server (`npx prisma dev`), but any Postgres URL works.

### 1. Backend

```bash
cd backend
npm install
cp .env .env            # ensure DATABASE_URL is set (see .env)

# Start the local Prisma Postgres dev server in a separate terminal:
npx prisma dev

# Apply migrations and seed sample data (admin + categories + products):
npx prisma migrate deploy      # or: npx prisma migrate dev
npm run db:seed

# Run the API:
npm run build && npm run start:prod   # or: npm run start:dev
# → http://localhost:3000/api
```

The seed creates an admin account:

```
email:    admin@wanderlust.dev
password: changeme123          # override with ADMIN_PASSWORD env
```

> ⚠️ Set a strong `JWT_SECRET` (and `ADMIN_PASSWORD`) in the environment for
> anything beyond local development. The code falls back to a dev-only
> placeholder secret when `JWT_SECRET` is unset.

### 2. Storefront

```bash
cd frontend
npm install
cp .env.local.example .env.local      # NEXT_PUBLIC_API_URL=http://localhost:3000/api
npm run dev                            # → http://localhost:3100
```

### 3. Admin panel

```bash
cd admin
npm install
cp .env.local.example .env.local
npm run dev                            # → http://localhost:3200
# Sign in with the seeded admin account. Non-admin accounts are rejected.
```

## API overview

Base URL: `/api`

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/auth/register` | public | Create a customer account |
| POST | `/auth/login` | public | Get a JWT |
| GET  | `/products` | public | List/filter/paginate products |
| GET  | `/products/slug/:slug` | public | Product by slug |
| GET  | `/categories`, `/categories/tree`, `/categories/slug/:slug` | public | Browse categories |
| POST/PATCH/DELETE | `/products`, `/categories` | **admin** | Manage catalog |
| POST | `/orders` | customer | Place an order (server-priced) |
| GET  | `/orders/mine`, `/orders/:id` | customer | Own orders (ownership-scoped) |
| PATCH | `/orders/:id/cancel` | customer | Cancel own order |
| GET  | `/orders` | **admin** | All orders |
| PATCH | `/orders/:id/status` | **admin** | Advance order status (state machine) |
| GET  | `/admin/dashboard` | **admin** | Aggregated metrics |

## Testing

```bash
# Backend unit tests (64 tests: auth, categories, products, orders, admin)
cd backend && npm test

# Frontend unit/component tests (Vitest + Testing Library)
cd frontend && npm test
```

## Scripts reference

**backend:** `build`, `start:dev`, `start:prod`, `test`, `db:seed`,
`prisma:generate`
**frontend:** `dev`, `build`, `start`, `test`
**admin:** `dev`, `build`, `start`

## License

Portfolio project — MIT.
