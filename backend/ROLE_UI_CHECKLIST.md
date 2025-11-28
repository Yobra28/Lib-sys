# Role-to-UI Checklist (Student & Admin)

This checklist maps high-level UI pages / components to backend endpoints and notes for implementation. Use it to guide frontend work and to confirm required permissions.

---

## Student UI

- Auth & Profile
  - Register page -> POST `/auth/register`
  - Login page -> POST `/auth/login`
  - Profile page -> GET `/auth/profile`, PATCH `/auth/profile`, POST `/auth/change-password`

- Books
  - Books listing page (search, filter, pagination) -> GET `/books`
  - Book details page -> GET `/books/:id`
  - Recommendations block -> GET `/books/recommendations`
  - Categories list -> GET `/books/categories`

- Borrowing
  - Borrow button / modal (self-borrow) -> POST `/borrows/self`
  - My borrows page -> GET `/borrows/my-borrows`
  - Return my book -> PATCH `/borrows/:id/return-self`
  - Renew (check server role/guard) -> PATCH `/borrows/:id/renew` (verify guard)

- Fines & Payments
  - My fines page -> GET `/borrows/my-fines` or GET `/fines/my-fines`
  - Pay fine flow -> POST `/borrows/pay-fine` (integrate payment gateway if needed)

- Reservations & Seats
  - Seat availability search -> GET `/seats/available` or `/seats/search-by-time`
  - Reserve seat -> POST `/reservations`
  - My reservations -> GET `/reservations/my-reservations`
  - Cancel reservation -> PATCH `/reservations/:id/cancel` (confirm owner or role check)
  - Seat details -> GET `/seats/:id` and `/seats/:id/availability`

- Notifications
  - Inbox -> GET `/notifications/my-notifications`
  - Unread count -> GET `/notifications/unread-count`
  - Mark read -> PATCH `/notifications/:id/read`
  - Mark all read -> PATCH `/notifications/read-all`

- Feedback
  - Submit feedback -> POST `/feedback`
  - My feedback list -> GET `/feedback/my-feedback`


## Admin UI

- Users
  - Users list + filters -> GET `/users`
  - Create user form -> POST `/users`
  - Edit user -> PATCH `/users/:id`
  - Activate / Deactivate user -> PATCH `/users/:id/activate`, PATCH `/users/:id/deactivate`
  - Delete user -> DELETE `/users/:id`
  - View user activity -> GET `/users/:id/activity`

- Books management
  - Create / Edit book -> POST `/books`, PATCH `/books/:id`
  - Delete book -> DELETE `/books/:id`
  - Upload cover (per-book) -> POST `/books/:id/upload-cover` or central `POST /upload/book-cover`

- Borrows & Fines
  - Issue book -> POST `/borrows`
  - Return book -> PATCH `/borrows/:id/return`
  - Fine configuration screen -> GET `/borrows/fine-configuration/current`, POST `/borrows/fine-configuration`
  - List fines -> GET `/fines`
  - Mark paid / Waive -> PATCH `/fines/:id/pay`, PATCH `/fines/:id/waive`

- Reservations & Seats
  - Reservation approvals -> GET `/reservations`, PATCH `/reservations/:id/approve`
  - Seats CRUD -> POST `/seats`, PATCH `/seats/:id`, DELETE `/seats/:id`
  - Seat heatmap / utilization -> GET `/reports/seat-heatmap`, GET `/reports/seat-usage`

- Notifications & Feedback
  - Compose notification -> POST `/notifications`
  - View & respond to feedback -> GET `/feedback`, PATCH `/feedback/:id/respond`

- Reports & Dashboard
  - Dashboard stats -> GET `/reports/dashboard`
  - Most borrowed -> GET `/reports/most-borrowed?limit=`
  - Borrowing trends -> GET `/reports/borrowing-trends?months=`
  - Fines timeseries -> GET `/reports/fines-timeseries?months=`
  - Overdue report -> GET `/reports/overdue`
  - System logs -> GET `/reports/system-logs?limit=`

- Settings
  - System settings view -> GET `/settings`
  - Update settings -> PATCH `/settings` (Admin only)

## Implementation notes / frontend considerations

- Authentication: frontend should attach Authorization: Bearer <token> to protected endpoints.
- Role checks: restrict navigation routes and UI actions client-side using the authenticated user's role, but rely on server-side roles for security.
- Error flows: surface server 403/401 responses and show friendly messages (e.g., "Insufficient permissions", "Please login").
- Confirmations: destructive actions (delete user, delete book, waive fine) should require modal confirmation.
- Concurrency: seat reservations and borrow issuance should show clear conflict feedback; consider polling or websockets for live updates.
- Payments: integrate payment gateway for POST `/borrows/pay-fine` if required; otherwise implement offline receipt upload.

---

Files written:
- `backend/ENDPOINTS_BY_ROLE.json`
- `backend/ENDPOINTS_BY_ROLE.csv`
- `backend/ROLE_UI_CHECKLIST.md`

Next steps (pick one):
- I can add missing Roles/Jwt guards to flagged endpoints and run a build/linter in `backend`.
- I can generate a Postman collection (JSON) based on the JSON and add it to `backend/docs/`.
- I can create a small set of e2e tests for register/login + borrow/pay-fine flows.

Which of those should I do next?