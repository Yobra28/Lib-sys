# Library Management System — Feature & API Prompt

## Overview
This document outlines the complete feature set for the Enhanced Library Borrowing System, organized by user role (Student and Admin). It includes endpoint paths, HTTP methods, required permissions, and UI/UX considerations for implementation.

**Project**: Lib-sys (Library Management System)  
**Repository**: Yobra28/Lib-sys  
**Current Branch**: master  
**Tech Stack**:
- Backend: NestJS (TypeScript), Prisma ORM, JWT Auth, Role-based access control (RBAC)
- Frontend: Angular, Tailwind CSS
- Database: PostgreSQL (via Prisma migrations)
- Storage: Cloudinary (book covers, media)

---

## System Roles & Permissions

### Role: **STUDENT**
- Self-register and authenticate
- Browse and search books
- Borrow books and manage borrowing history
- Return books and renew borrowings
- View and pay fines
- Reserve and manage study seats
- Submit feedback and view responses
- Receive and manage notifications

### Role: **ADMIN**
- Full user management (create, update, deactivate, delete users)
- Book catalogue management (CRUD, cover uploads)
- Issue/return books on behalf of students
- Configure fine policies
- Manage seat reservations and approve/cancel
- Manage study seats (CRUD)
- Create notifications and respond to feedback
- Access system reports and analytics
- Configure system settings

### Role: **LIBRARIAN**
- Same permissions as ADMIN except:
  - Cannot delete users
  - Cannot update system settings (Admin only)
  - Can perform most operational tasks (issue/return, manage reservations, respond to feedback)

---

## Endpoint Reference by Feature

### **Authentication & Profile** (Student & Public)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | PUBLIC | Register new student account |
| POST | `/auth/login` | PUBLIC | Login and receive JWT token |
| POST | `/auth/change-password` | STUDENT | Change own password |
| POST | `/auth/refresh` | STUDENT | Refresh JWT token |
| GET | `/auth/validate` | STUDENT | Validate current token |
| GET | `/auth/profile` | STUDENT | Retrieve authenticated user profile |
| PATCH | `/auth/profile` | STUDENT | Update authenticated user profile |

---

### **Books Management** (All roles - Student reads, Admin/Librarian full CRUD)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/books` | PUBLIC | List/search books with optional filters (pagination, category, search) |
| GET | `/books/:id` | PUBLIC | Get detailed book information |
| GET | `/books/categories` | PUBLIC | List all book categories |
| GET | `/books/recommendations` | PUBLIC | Get personalized or category-based book recommendations |
| POST | `/books` | ADMIN, LIBRARIAN | Create new book |
| PATCH | `/books/:id` | ADMIN, LIBRARIAN | Update book details |
| DELETE | `/books/:id` | ADMIN, LIBRARIAN | Delete book from catalog |
| POST | `/books/:id/upload-cover` | ADMIN, LIBRARIAN | Upload book cover image (per-book endpoint) |

---

### **Borrowing & Fines** (Core Student feature, Admin/Librarian oversight)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/borrows/self` | STUDENT | Student borrows a book (self-service) |
| GET | `/borrows/my-borrows` | STUDENT | View current and past borrows |
| PATCH | `/borrows/:id/return-self` | STUDENT | Return borrowed book (student initiates) |
| PATCH | `/borrows/:id/renew` | STUDENT | Renew borrow duration (note: verify guard) |
| GET | `/borrows/my-fines` | STUDENT | View personal fines |
| POST | `/borrows/pay-fine` | STUDENT | Pay fine (integrate payment provider) |
| POST | `/borrows` | ADMIN, LIBRARIAN | Issue book to student (admin action) |
| GET | `/borrows` | ADMIN, LIBRARIAN | View all borrow records with filters |
| PATCH | `/borrows/:id/return` | ADMIN, LIBRARIAN | Mark book returned (admin action) |
| GET | `/borrows/:id/calculate-fine` | PUBLIC | Calculate fine for a borrow (note: verify guard) |
| POST | `/borrows/fine-configuration` | ADMIN | Create/update fine policy (amount per day, max fine, etc.) |
| GET | `/borrows/fine-configuration/current` | PUBLIC | Retrieve current fine configuration |

---

### **Fines Management** (Admin/Librarian overview and collection)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/fines` | ADMIN, LIBRARIAN | List all fines with filters (userId, status) |
| GET | `/fines/my-fines` | STUDENT | View personal fines |
| GET | `/fines/total` | ADMIN, LIBRARIAN | Get total pending fines (optionally by userId) |
| GET | `/fines/:id` | STUDENT, ADMIN, LIBRARIAN | View fine details (Students see own, Admin/Librarian see all) |
| PATCH | `/fines/:id/pay` | ADMIN, LIBRARIAN | Mark fine as paid (manual or system-generated) |
| PATCH | `/fines/:id/waive` | ADMIN, LIBRARIAN | Waive fine with optional reason |

---

### **Seat Reservations & Study Spaces**

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/reservations` | STUDENT | Create seat reservation for a time slot |
| GET | `/reservations/my-reservations` | STUDENT | View own reservations (paginated) |
| GET | `/reservations` | ADMIN, LIBRARIAN | List all reservations with filters |
| GET | `/reservations/:id` | ALL | Get reservation details |
| PATCH | `/reservations/:id` | ADMIN, LIBRARIAN | Update reservation details |
| PATCH | `/reservations/:id/approve` | ADMIN, LIBRARIAN | Approve pending reservation |
| PATCH | `/reservations/:id/cancel` | STUDENT, ADMIN, LIBRARIAN | Cancel reservation (verify owner check) |
| GET | `/seats` | PUBLIC | List all seats (with optional floor/section filters) |
| GET | `/seats/:id` | PUBLIC | Get seat details |
| GET | `/seats/sections` | PUBLIC | List available study sections |
| GET | `/seats/available` | PUBLIC | Get available seats for a time slot (date, startTime, endTime) |
| GET | `/seats/search-by-time` | PUBLIC | Advanced search: available seats by time range with floor/section filters |
| GET | `/seats/:id/availability` | PUBLIC | Get detailed availability for a specific seat on a date |
| POST | `/seats` | ADMIN, LIBRARIAN | Add new seat to inventory |
| PATCH | `/seats/:id` | ADMIN, LIBRARIAN | Update seat details (floor, section, capacity, etc.) |
| DELETE | `/seats/:id` | ADMIN, LIBRARIAN | Remove seat from inventory |

---

### **Notifications**

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/notifications` | ADMIN, LIBRARIAN | Create and send notification to user(s) |
| GET | `/notifications` | ADMIN, LIBRARIAN | List all notifications (optionally by userId) |
| GET | `/notifications/my-notifications` | STUDENT | Retrieve own notifications |
| GET | `/notifications/unread-count` | STUDENT | Get count of unread notifications |
| PATCH | `/notifications/:id/read` | STUDENT | Mark notification as read |
| PATCH | `/notifications/read-all` | STUDENT | Mark all notifications as read |

---

### **Feedback & Support**

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/feedback` | STUDENT | Submit feedback or support request |
| GET | `/feedback/my-feedback` | STUDENT | View own feedback and responses |
| GET | `/feedback` | ADMIN, LIBRARIAN | List all feedback with optional filters (read status) |
| GET | `/feedback/:id` | STUDENT, ADMIN, LIBRARIAN | View feedback details |
| PATCH | `/feedback/:id/respond` | ADMIN, LIBRARIAN | Respond to feedback |
| PATCH | `/feedback/:id/read` | ADMIN, LIBRARIAN | Mark feedback as read |

---

### **User Management** (Admin/Librarian)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/users` | ADMIN, LIBRARIAN | Create new user (student, librarian, admin) |
| GET | `/users` | ADMIN, LIBRARIAN | List users with search/filter (role, active status, pagination) |
| GET | `/users/stats` | ADMIN, LIBRARIAN | Get user statistics (total users, active, by role, etc.) |
| GET | `/users/:id` | ADMIN, LIBRARIAN | Get user profile |
| GET | `/users/:id/activity` | ADMIN, LIBRARIAN | Get user activity summary (borrows, fines, feedback, etc.) |
| GET | `/users/email/:email` | ADMIN, LIBRARIAN | Lookup user by email |
| PATCH | `/users/:id` | ADMIN, LIBRARIAN | Update user details |
| PATCH | `/users/:id/password` | ADMIN | Update user password (Admin only) |
| PATCH | `/users/:id/activate` | ADMIN, LIBRARIAN | Activate deactivated account |
| PATCH | `/users/:id/deactivate` | ADMIN, LIBRARIAN | Deactivate user account |
| DELETE | `/users/:id` | ADMIN | Delete user (soft delete if records exist) |

---

### **File Uploads** (Media & Covers)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/upload/book-cover` | ADMIN, LIBRARIAN | Upload book cover to Cloudinary (central endpoint) |

---

### **Reports & Analytics** (Admin/Librarian only)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/reports/dashboard` | ADMIN, LIBRARIAN | Dashboard stats (total books, borrows, users, pending fines, etc.) |
| GET | `/reports/most-borrowed` | ADMIN, LIBRARIAN | Most borrowed books (limit parameter, default 10) |
| GET | `/reports/borrowing-trends` | ADMIN, LIBRARIAN | Borrowing trends over months (months parameter, default 6) |
| GET | `/reports/fines-timeseries` | ADMIN, LIBRARIAN | Fines collected over time (months parameter) |
| GET | `/reports/borrows-status-timeseries` | ADMIN, LIBRARIAN | Borrow status breakdown over time |
| GET | `/reports/seat-heatmap` | ADMIN, LIBRARIAN | Seat utilization heatmap (days parameter, default 7) |
| GET | `/reports/seat-usage` | ADMIN, LIBRARIAN | Seat usage summary report |
| GET | `/reports/system-logs` | ADMIN, LIBRARIAN | Recent system logs (limit parameter) |
| GET | `/reports/category-distribution` | ADMIN, LIBRARIAN | Book category distribution |
| GET | `/reports/fine-collection` | ADMIN, LIBRARIAN | Fine collection report (optional date range) |
| GET | `/reports/user-activity/:userId` | ADMIN, LIBRARIAN | User activity details |
| GET | `/reports/overdue` | ADMIN, LIBRARIAN | Overdue books report |

---

### **Settings** (System Configuration)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/settings` | ALL | Retrieve system settings (library hours, policies, etc.) |
| PATCH | `/settings` | ADMIN | Update system settings (Admin only) |

---

## Critical Implementation Notes

### Security & Guards
- **JWT Authentication**: All protected endpoints require `Authorization: Bearer <token>` header.
- **Role-based Access Control**: Verify `@Roles()` decorator on all endpoints. **Flagged endpoints needing guard verification**:
  - PATCH `/borrows/:id/renew` — currently may lack Roles decorator
  - GET `/borrows/:id/calculate-fine` — verify guard
  - PATCH `/reservations/:id/cancel` — confirm owner/role check
  - Some notification & patch endpoints may need `@UseGuards(JwtAuthGuard)`

### Payment Integration
- **POST `/borrows/pay-fine`** currently lacks payment provider integration. Options:
  - Integrate Stripe, PayPal, or local payment service
  - Or implement offline receipt upload workflow

### Concurrency & Conflicts
- **Seat reservations**: Handle time conflicts gracefully (test file `test-time-conflicts.md` exists; verify implementation)
- **Simultaneous borrows**: Ensure inventory checks prevent overbooking
- **Real-time updates**: Consider WebSocket or polling for seat availability if high concurrency expected

### Missing Features (Consider for Phase 2)
- Password reset / forgot password flow (POST `/auth/forgot-password`, POST `/auth/reset-password`)
- Email verification on registration
- Rate limiting on register/login/feedback endpoints
- Audit logging of all admin actions
- Export/download reports (CSV, PDF)

### Error Handling Standards
- **401 Unauthorized**: Invalid or missing token
- **403 Forbidden**: Valid token but insufficient role/permissions
- **400 Bad Request**: Validation errors (include field-level messages)
- **409 Conflict**: Resource conflict (e.g., email already registered, time slot taken)
- **404 Not Found**: Resource not found

### Response Format
All endpoints return:
```json
{
  "success": boolean,
  "data": {},
  "message": "string",
  "statusCode": number,
  "timestamp": "ISO8601"
}
```

---

## Frontend UI Routes Checklist

### Student Routes
- `/auth/register` → POST `/auth/register`
- `/auth/login` → POST `/auth/login`
- `/student/profile` → GET/PATCH `/auth/profile`
- `/student/books` → GET `/books`
- `/student/book/:id` → GET `/books/:id`
- `/student/my-borrows` → GET `/borrows/my-borrows`
- `/student/my-fines` → GET `/borrows/my-fines` + POST `/borrows/pay-fine`
- `/student/reservations` → POST/GET `/reservations` (my-reservations)
- `/student/seats` → GET `/seats/available` or `/seats/search-by-time`
- `/student/notifications` → GET `/notifications/my-notifications`
- `/student/feedback` → POST/GET `/feedback`

### Admin Routes
- `/admin/dashboard` → GET `/reports/dashboard`
- `/admin/users` → GET/POST `/users`, PATCH/DELETE `/users/:id`
- `/admin/books` → GET/POST `/books`, PATCH/DELETE `/books/:id`
- `/admin/borrows` → GET/POST `/borrows`, PATCH `/borrows/:id/return`
- `/admin/fines` → GET `/fines`, PATCH `/fines/:id/{pay|waive}`
- `/admin/reservations` → GET `/reservations`, PATCH `/reservations/:id/{approve|cancel}`
- `/admin/seats` → GET/POST `/seats`, PATCH/DELETE `/seats/:id`
- `/admin/reports` → GET `/reports/*`
- `/admin/settings` → GET/PATCH `/settings`
- `/admin/feedback` → GET/PATCH `/feedback`

---

## Testing Scope

### Recommended E2E Tests
1. **Auth Flow**: Register → Login → Profile Fetch
2. **Student Borrow Flow**: Search book → Borrow → View in my-borrows → Return
3. **Fine & Payment**: Incur fine → View in my-fines → Pay fine
4. **Seat Reservation**: Search available seats → Reserve → View in my-reservations → Cancel
5. **Admin Actions**: Create user → Create book → Issue borrow → Mark returned → View reports
6. **Permission Tests**: Student attempts admin endpoint (expect 403)

### Recommended Unit Tests
- Fine calculation logic
- Seat availability checking with time conflicts
- Role validation decorators
- Notification dispatch
- Report aggregation queries

---

## Documentation & Deployment Files

Refer to these files for detailed guidance:
- **`backend/ENDPOINTS_BY_ROLE.json`** — Machine-readable endpoint list by role
- **`backend/ENDPOINTS_BY_ROLE.csv`** — Spreadsheet-friendly endpoint export
- **`backend/ROLE_UI_CHECKLIST.md`** — Frontend page-to-endpoint mapping
- **Postman Collection** (if generated) — Import to test all endpoints
- **OpenAPI/Swagger** — Available at `/api/docs` (if configured in NestJS)

---

## Team Handoff Checklist

- [ ] Frontend team reviews `ROLE_UI_CHECKLIST.md` and starts UI components
- [ ] Backend verifies all flagged endpoints have Roles/Jwt guards
- [ ] Payment provider is selected and integrated (or offline flow finalized)
- [ ] Database migrations are current (`prisma migrate deploy`)
- [ ] E2E tests are written for critical flows
- [ ] Rate limiting is configured (express-rate-limit or similar)
- [ ] CORS and security headers are properly set
- [ ] Error handling and logging are centralized
- [ ] Production environment variables are documented
- [ ] User acceptance testing (UAT) date is set

---

## Questions & Support

For clarifications:
- Refer to `backend/src/*/` controller and service files
- Check `prisma/schema.prisma` for data model
- Review migration files in `prisma/migrations/` for schema history
- Contact: Backend lead or project owner

**Last Updated**: November 13, 2025  
**Maintainer**: Yobra28
