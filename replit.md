# BandaBazaar

## Overview

Hyperlocal grocery delivery web app for Banda district, UP (210001). Connects local kirana/grocery store owners with customers — similar to Blinkit/Zepto but built for small-town India.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS (artifacts/bandabazaar)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Business Model

- Platform connects kirana store owners with customers in Banda district
- 8% commission on every completed order, auto-calculated
- No platform delivery staff — shop owners arrange own delivery
- COD (Cash on Delivery) payment; UPI planned for later

## Three Portals

### Customer App (routes: /)
- `/` — Homepage: store listing, category filters, search
- `/store/:storeId` — Store page with product catalogue + add to cart
- `/cart` — Cart, customer details, place order (COD)
- `/order/:orderId` — Order tracking stepper
- `/orders` — Order history by phone number

### Shop Owner Dashboard (routes: /owner)
- `/owner` — Phone number login (no OTP, localStorage session)
- `/owner/register` — Register new store
- `/owner/dashboard` — Stats, incoming orders, update status
- `/owner/products` — CRUD for products

### Admin Panel (routes: /admin)
- `/admin` — PIN login (PIN: 1234)
- `/admin/dashboard` — Platform-wide stats
- `/admin/stores` — Approve/reject/block stores
- `/admin/commissions` — Commission tracking per order

## Database Schema

- `stores` — store info, status (pending/approved/rejected/blocked), ratings
- `products` — product catalogue per store, with Hindi names
- `orders` — full order records with items JSON, commission tracking

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Seed Data

5 stores seeded: Sharma Kirana Store, Gupta General Stores, Verma Dairy & Snacks, Patel Vegetables & Fruits (all approved), Ravi Mobile & Grocery (pending).
21 products and 5 demo orders across stores.

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (auto-set by Replit)
- `SESSION_SECRET` — Session secret

## Notes

- Bilingual UI: Hindi text alongside English for key labels
- Mobile-first design (375px screens)
- Rupee symbol (₹) for all prices
- Commission: 8% of order subtotal, auto-calculated on order placement
