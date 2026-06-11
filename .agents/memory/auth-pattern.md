---
name: Auth system pattern
description: JWT auth implementation details and how frontend/backend are wired together
---

## Pattern

- Backend: HMAC-SHA256 JWT in HTTP-only cookie (`bb_token`), `crypto.scrypt` for password hashing
- Frontend: `AuthContext.tsx` calls `refreshUser()` on mount (reads from cookie via `/api/auth/me`)
- Route protection: `ProtectedRoute` component wraps protected routes in `App.tsx`, checks `user.role`
- `UserRole` type exported from `AuthContext.tsx` — used by `ProtectedRoute`

## Admin credentials (seeded)
- Phone: 9999999999 / Password: 1234

## Owner pages use user.storeId directly
- Owner pages (Dashboard, Products, Promotions) get `storeId` from `useAuth().user.storeId`
- No more `localStorage.getItem("bb_owner_phone")` or `useListStores({ search: phone })`
- Use `useGetStore(storeId)` for full store object in Dashboard

**Why:** Old pattern used localStorage which doesn't survive server restarts or incognito. JWT cookies persist across tabs and page refreshes.

**How to apply:** Any new owner/admin page should import `useAuth` and use `user.storeId` or `user.role` directly. Wrap new protected routes in `ProtectedRoute` in `App.tsx`.
