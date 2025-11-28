# Enhanced Library Borrowing System — System Proposal & Design Document

**Document Version**: 1.0  
**Date**: November 13, 2025  
**Project**: Lib-sys (Enhanced Library Management System)  
**Organization**: [Your Organization]  
**Prepared by**: Development Team  
**Status**: Proposed

---

## Executive Summary

The Enhanced Library Borrowing System is a comprehensive web-based solution designed to streamline library operations, improve student engagement, and provide administrators with powerful management and analytics tools. The system supports two primary user roles — **Students** and **Administrators** — with distinct workflows and capabilities.

**Key Objectives**:
- Automate book borrowing and return workflows
- Enable self-service seat/study-space reservations
- Implement fair and configurable fine policies
- Provide real-time notifications and feedback channels
- Deliver actionable analytics and reporting for library management

**Expected Benefits**:
- Reduced manual administrative workload
- Improved student satisfaction through self-service capabilities
- Enhanced inventory visibility and utilization tracking
- Data-driven decision making via comprehensive reports

---

## 1. System Overview

### 1.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Layer (Angular)                  │
│  - Student Dashboard & Self-Service UI                           │
│  - Admin Dashboard & Management Consoles                         │
│  - Role-based Navigation & Permissions                           │
└────────────────────────┬────────────────────────────────────────┘
                         │ REST API / JWT Auth
┌────────────────────────▼────────────────────────────────────────┐
│                    API Layer (NestJS Backend)                    │
│  - Authentication & Authorization (JWT, Role-based Guards)      │
│  - 13+ Domain Controllers (Auth, Books, Borrows, etc.)          │
│  - Business Logic Services & DTOs                               │
│  - Error Handling & Validation Middleware                       │
└────────────────────────┬────────────────────────────────────────┘
                         │ Prisma ORM
┌────────────────────────▼────────────────────────────────────────┐
│                    Data Layer (PostgreSQL)                       │
│  - Users (Students, Admins, Librarians)                         │
│  - Books & Inventory                                            │
│  - Borrow Records & Fines                                       │
│  - Seats & Reservations                                         │
│  - Notifications & Feedback                                     │
└─────────────────────────────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│              External Services                                   │
│  - Cloudinary (Image Storage for Book Covers)                  │
│  - Payment Gateway (Fine Payments - TBD)                       │
│  - Email Service (Notifications - Optional)                    │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | Angular | Latest | Responsive web UI |
| | Tailwind CSS | Latest | Styling & responsive design |
| **Backend** | NestJS | Latest | REST API framework |
| | TypeScript | Latest | Type-safe backend code |
| **Database** | PostgreSQL | 12+ | Relational data storage |
| | Prisma | Latest | ORM & schema management |
| **Auth** | JWT | Standard | Stateless token-based auth |
| **Storage** | Cloudinary | API | Cloud-based image storage |
| **Deployment** | Docker | Latest | Containerization |
| | [TBD] | - | Cloud hosting (AWS/Azure/GCP) |

---

## 2. Functional Requirements

### 2.1 Student Functionalities (Primary User)

#### 2.1.1 Authentication & Profile Management
- **Register**: Self-registration with email verification (future enhancement)
- **Login**: Secure login with JWT token generation
- **Profile**: View and update personal information
- **Password Management**: Change password securely

#### 2.1.2 Book Discovery & Browsing
- **Search & Filter**: Full-text search, category filters, author search
- **View Details**: Comprehensive book information (ISBN, author, copies available, etc.)
- **Recommendations**: Personalized or category-based book suggestions
- **Categories**: Browse by predefined categories

#### 2.1.3 Book Borrowing Workflow
| Feature | Endpoint | Details |
|---------|----------|---------|
| Self-Borrow | POST `/borrows/self` | Student initiates borrow request |
| View Borrows | GET `/borrows/my-borrows` | Current and historical borrows |
| Return Book | PATCH `/borrows/:id/return-self` | Initiate return (return-confirmed in system) |
| Renew Borrow | PATCH `/borrows/:id/renew` | Extend borrow duration if allowed |
| Borrow History | GET `/borrows/my-borrows` | Search and filter past activity |

**Business Rules**:
- Max 5 concurrent books per student
- Borrow duration: 14 days (configurable by Admin)
- Renewable: 2 times per item (configurable)
- Overdue generates fines automatically

#### 2.1.4 Fine Management & Payment
- **View Fines**: GET `/borrows/my-fines` or GET `/fines/my-fines`
- **Fine Details**: Amount, due date, reason (overdue)
- **Pay Fine**: POST `/borrows/pay-fine` (integrate payment provider)
- **Payment Status**: Track pending vs. paid fines

**Fine Policy** (configurable by Admin):
- Daily fine rate: e.g., ₹5 per day after due date
- Maximum cap: e.g., ₹500 per book
- Applied automatically upon overdue detection

#### 2.1.5 Study Seat Reservations
- **Search Available Seats**: GET `/seats/available` or GET `/seats/search-by-time`
- **View Seat Details**: Floor, section, capacity, availability calendar
- **Reserve Seat**: POST `/reservations` for specific date/time slot
- **Manage Reservations**: View, modify, cancel own reservations
- **Conflict Detection**: System prevents double-booking same time slot

**Business Rules**:
- Reservations in advance: up to 30 days (configurable)
- Duration: 1-4 hours per slot (configurable)
- Max 1 active reservation per student at a time
- No-show after 15 minutes auto-releases seat

#### 2.1.6 Notifications & Communication
- **Inbox**: GET `/notifications/my-notifications`
- **Unread Count**: GET `/notifications/unread-count`
- **Notification Types**: Overdue reminders, fine alerts, reservation confirmations
- **Mark Read**: PATCH `/notifications/:id/read` and PATCH `/notifications/read-all`

#### 2.1.7 Feedback & Support
- **Submit Feedback**: POST `/feedback` (suggestions, issues, praise)
- **View Responses**: GET `/feedback/my-feedback` to see admin replies
- **Feedback Status**: Pending, Acknowledged, Resolved

---

### 2.2 Administrator Functionalities

#### 2.2.1 User Management (Full Control)
| Feature | Endpoint | Role Restricted |
|---------|----------|-----------------|
| Create User | POST `/users` | ADMIN, LIBRARIAN |
| List Users | GET `/users` (with filters) | ADMIN, LIBRARIAN |
| View User Profile | GET `/users/:id` | ADMIN, LIBRARIAN |
| Update User | PATCH `/users/:id` | ADMIN, LIBRARIAN |
| View User Activity | GET `/users/:id/activity` | ADMIN, LIBRARIAN |
| Reset Password | PATCH `/users/:id/password` | ADMIN only |
| Activate/Deactivate | PATCH `/users/:id/activate\|deactivate` | ADMIN, LIBRARIAN |
| Delete User | DELETE `/users/:id` | ADMIN only |

#### 2.2.2 Book Catalogue Management
| Feature | Endpoint | Role Restricted |
|---------|----------|-----------------|
| Create Book | POST `/books` | ADMIN, LIBRARIAN |
| Update Book | PATCH `/books/:id` | ADMIN, LIBRARIAN |
| Delete Book | DELETE `/books/:id` | ADMIN, LIBRARIAN |
| Upload Cover | POST `/books/:id/upload-cover` or `/upload/book-cover` | ADMIN, LIBRARIAN |
| List Books | GET `/books` (read-only for students) | ALL |

**Book Fields Managed**:
- Title, Author, ISBN, Publisher, Year
- Category, Description, Copies (total, available)
- Cover Image (stored in Cloudinary)

#### 2.2.3 Borrowing Operations (Librarian Actions)
| Feature | Endpoint | Notes |
|---------|----------|-------|
| Issue Book | POST `/borrows` | Admin issues to student (not self-service) |
| Register Return | PATCH `/borrows/:id/return` | Admin confirms physical return |
| View All Borrows | GET `/borrows` | Filter by student, status, date range |
| Calculate Fine | GET `/borrows/:id/calculate-fine` | Check pending fine amount |
| Renew (on behalf) | PATCH `/borrows/:id/renew` | If allowed by policy |

#### 2.2.4 Fine Configuration & Collection
| Feature | Endpoint | Access |
|---------|----------|--------|
| Update Fine Policy | POST `/borrows/fine-configuration` | ADMIN only |
| View Policy | GET `/borrows/fine-configuration/current` | ALL |
| List All Fines | GET `/fines` | ADMIN, LIBRARIAN |
| Mark Fine as Paid | PATCH `/fines/:id/pay` | ADMIN, LIBRARIAN |
| Waive Fine | PATCH `/fines/:id/waive` | ADMIN, LIBRARIAN (with reason) |
| Fine Statistics | GET `/reports/fines-timeseries` | ADMIN, LIBRARIAN |

#### 2.2.5 Seat & Reservation Management
| Feature | Endpoint | Role |
|---------|----------|------|
| Add Seat | POST `/seats` | ADMIN, LIBRARIAN |
| Update Seat | PATCH `/seats/:id` | ADMIN, LIBRARIAN |
| Delete Seat | DELETE `/seats/:id` | ADMIN, LIBRARIAN |
| Approve Reservation | PATCH `/reservations/:id/approve` | ADMIN, LIBRARIAN |
| Cancel Reservation | PATCH `/reservations/:id/cancel` | ADMIN, LIBRARIAN |
| View All Reservations | GET `/reservations` | ADMIN, LIBRARIAN |

#### 2.2.6 System Notifications
- **Create & Send**: POST `/notifications` to target users
- **Bulk Notifications**: Notify all students or specific groups
- **Types**: Maintenance alerts, policy changes, system updates, event reminders

#### 2.2.7 Feedback & Issue Management
| Feature | Endpoint | Role |
|---------|----------|------|
| View All Feedback | GET `/feedback` | ADMIN, LIBRARIAN |
| Respond to Feedback | PATCH `/feedback/:id/respond` | ADMIN, LIBRARIAN |
| Mark Read | PATCH `/feedback/:id/read` | ADMIN, LIBRARIAN |

#### 2.2.8 Reporting & Analytics
**Available Reports**:
1. **Dashboard**: Total books, active borrows, pending fines, active reservations
2. **Most Borrowed**: Top 10 (configurable) books by borrow count
3. **Borrowing Trends**: Monthly/quarterly borrowing patterns (6-month default)
4. **Fines Timeseries**: Fine collection over time with trend
5. **Seat Heatmap**: Utilization by floor/section/time-of-day
6. **Category Distribution**: Books per category (pie chart)
7. **Overdue Books**: List of overdue items and responsible students
8. **User Activity**: Per-student activity (borrows, fines, reservations)
9. **System Logs**: Recent system events (audit trail)

#### 2.2.9 System Configuration
- **Settings**: GET `/settings`, PATCH `/settings` (ADMIN only)
- **Configurable Items**:
  - Library hours (opening/closing times)
  - Borrowing policies (max books, duration)
  - Fine policy (daily rate, cap)
  - Seat policies (reservation window, duration options)
  - System name, logo, contact info

---

## 3. Non-Functional Requirements

### 3.1 Performance
- API response time: < 500ms (p95) for reads, < 1s for writes
- Concurrent users: Support minimum 1,000 simultaneous users
- Database queries: Optimized with proper indexing
- Seat availability search: < 200ms for typical library

### 3.2 Security
- **Authentication**: JWT with 24-hour expiration, refresh token support
- **Authorization**: Role-based access control (RBAC) with decorators
- **Data Protection**: HTTPS/TLS for all data in transit
- **Database**: Encrypted passwords (bcrypt), no secrets in code
- **Rate Limiting**: Prevent brute-force attacks on login/register (e.g., 5 attempts per minute)
- **Input Validation**: Server-side validation on all endpoints
- **CORS**: Properly configured for frontend domain

### 3.3 Scalability
- Horizontal scaling: API nodes behind load balancer
- Database: Read replicas for reporting queries
- Caching: Redis for frequently accessed data (optional Phase 2)
- CDN: Cloudinary handles image delivery

### 3.4 Reliability & Availability
- **Uptime Target**: 99.5% availability
- **Backup**: Daily database backups with point-in-time recovery
- **Monitoring**: Application logs, error tracking (Sentry/similar)
- **Graceful Degradation**: Offline-mode consideration for frontend (Phase 2)

### 3.5 Usability
- **Responsive Design**: Mobile-friendly interface (Tailwind CSS)
- **Accessibility**: WCAG 2.1 AA compliance
- **Internationalization**: Multi-language support (Phase 2)
- **Loading States**: Spinners and clear feedback on long operations

---

## 4. Data Model (Key Entities)

### 4.1 Core Entities

```
User
├── id (UUID)
├── email (unique, indexed)
├── password (hashed)
├── firstName, lastName
├── role (STUDENT | ADMIN | LIBRARIAN)
├── isActive (boolean)
├── createdAt, updatedAt
└── relationships: Borrows, Fines, Reservations, Feedback, Notifications

Book
├── id (UUID)
├── title, author, isbn
├── category
├── totalCopies, availableCopies
├── coverImage (URL to Cloudinary)
├── createdAt, updatedAt
└── relationships: Borrows

Borrow
├── id (UUID)
├── userId (FK)
├── bookId (FK)
├── issuedDate
├── dueDate, returnedDate (nullable)
├── status (ACTIVE | RETURNED | OVERDUE)
├── renewalCount
├── createdAt, updatedAt
└── relationships: User, Book, Fines

Fine
├── id (UUID)
├── borrowId (FK)
├── userId (FK)
├── amount
├── reason (OVERDUE | OTHER)
├── status (PENDING | PAID | WAIVED)
├── paidDate (nullable), waivedDate (nullable)
├── createdAt, updatedAt
└── relationships: Borrow, User

Seat
├── id (UUID)
├── seatNumber, floor, section
├── capacity (single or group)
├── createdAt, updatedAt
└── relationships: Reservations

Reservation
├── id (UUID)
├── seatId (FK)
├── userId (FK)
├── reservationDate
├── startTime, endTime
├── status (PENDING | APPROVED | CANCELLED)
├── createdAt, updatedAt
└── relationships: Seat, User

Notification
├── id (UUID)
├── userId (FK)
├── title, message, type
├── isRead (boolean)
├── createdAt, updatedAt
└── relationships: User

Feedback
├── id (UUID)
├── userId (FK)
├── subject, message
├── response (nullable)
├── status (SUBMITTED | ACKNOWLEDGED | RESOLVED)
├── createdAt, updatedAt
└── relationships: User

FineConfiguration
├── id (UUID)
├── dailyRate (decimal)
├── maxFineAmount (decimal)
├── effectiveDate
├── createdAt, updatedAt

SystemSettings
├── id (UUID)
├── libraryName, logo
├── openingHour, closingHour
├── maxBooksPerStudent (integer)
├── borrowDurationDays (integer)
├── maxReservationAdvanceDays (integer)
├── updatedAt
```

---

## 5. API & Integration Points

### 5.1 REST API Endpoints Summary

**Total Endpoints**: 60+

**Breakdown by Domain**:
- **Auth**: 7 endpoints (register, login, profile, password, token refresh/validate)
- **Books**: 7 endpoints (CRUD + recommendations, categories)
- **Borrows**: 10 endpoints (self-borrow, return, renew, fine config, calculate)
- **Fines**: 5 endpoints (list, view, pay, waive, totals)
- **Reservations**: 6 endpoints (CRUD, approve, cancel)
- **Seats**: 8 endpoints (CRUD, availability search, heatmap)
- **Notifications**: 5 endpoints (create, list, read, unread count)
- **Feedback**: 5 endpoints (create, respond, mark read, list)
- **Users**: 11 endpoints (full CRUD + activity, stats)
- **Reports**: 12 endpoints (dashboard, trends, usage, logs)
- **Settings**: 2 endpoints (get, update)
- **Upload**: 1 endpoint (file upload)

See `ENDPOINTS_BY_ROLE.json` and `SYSTEM_PROMPT.md` for complete API reference.

### 5.2 External Integrations

| Service | Purpose | Status |
|---------|---------|--------|
| **Cloudinary** | Book cover storage & delivery | ✅ Integrated |
| **Payment Gateway** | Fine payment processing | ⚠️ TBD (Stripe/PayPal) |
| **Email Service** | Send notifications | ⚠️ Optional (Phase 2) |
| **SMS Gateway** | SMS alerts for overdue | ⚠️ Optional (Phase 2) |

---

## 6. Implementation Roadmap

### Phase 1: MVP (Weeks 1-8)
- ✅ Backend API (all core endpoints)
- ✅ Frontend: Student & Admin dashboards
- ✅ Authentication & basic RBAC
- ✅ Book borrowing & returns
- ✅ Fine calculation & tracking
- ✅ Seat reservations (basic)
- ✅ Reports (basic dashboard)

### Phase 2 (Weeks 9-12)
- Email notifications & alerts
- Advanced reporting (export to CSV/PDF)
- Payment gateway integration
- Password reset flow
- Email verification
- Audit logging
- Performance optimization (caching)

### Phase 3 (Post-Launch)
- Mobile app (React Native)
- SMS notifications
- Analytics dashboard enhancements
- Machine learning recommendations
- Mobile payment integration
- Offline support

---

## 7. Risk Assessment & Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|-----------|
| Concurrent seat reservations conflict | High | Medium | Implement optimistic locking or transaction isolation |
| Payment gateway integration delays | High | Medium | Mock payment service for MVP, integrate later |
| Database performance under load | High | Low | Proper indexing, query optimization, load testing |
| Security vulnerabilities (OWASP) | High | Low | Security audit, SAST scanning, penetration testing |
| Scope creep (feature requests) | Medium | High | Strict change control, prioritized backlog |
| User adoption (low utilization) | Medium | Medium | User training, clear UI/UX, phased rollout |

---

## 8. Success Metrics

### Technical KPIs
- API response time: < 500ms (p95)
- System uptime: > 99.5%
- Test coverage: > 80%
- Zero critical security vulnerabilities

### Business KPIs
- Student adoption: > 80% of active students using self-borrow within 3 months
- Operational efficiency: 50% reduction in manual book-issuing time
- Fine collection: 90% of fines paid/waived within 30 days
- User satisfaction: NPS > 50, support tickets < 5 per day

---

## 9. Costs & Resource Estimate

### Development
- Backend Developer: 2 FTE × 8 weeks = 16 person-weeks
- Frontend Developer: 2 FTE × 8 weeks = 16 person-weeks
- QA/Tester: 1 FTE × 6 weeks = 6 person-weeks
- Project Manager: 0.5 FTE × 10 weeks = 5 person-weeks
- **Total Effort**: ~43 person-weeks

### Infrastructure (Annual)
- Cloud hosting (AWS/Azure/GCP): ~$3,000-5,000
- Database (managed): ~$1,000-2,000
- Cloudinary (image storage): ~$500-1,000
- Monitoring & logging: ~$500-1,000
- Domain & SSL: ~$200
- **Total Annual Cost**: ~$5,200-9,200

### Third-Party Services (Optional Phase 2)
- Payment gateway (Stripe/PayPal): 2.9% + $0.30 per transaction
- Email service (SendGrid, AWS SES): ~$50-200/month
- SMS service (Twilio): ~$0.01-0.05 per message

---

## 10. Deployment & Maintenance

### Deployment Strategy
- **Environment**: Production on cloud (AWS ECS, Azure App Service, or GCP Cloud Run)
- **CI/CD**: GitHub Actions or Jenkins for automated testing & deployment
- **Database Migrations**: Prisma migrate (zero-downtime if possible)
- **Rollback Plan**: Maintain previous version, quick revert capability

### Monitoring & Logging
- Application logs: CloudWatch / Azure Monitor / Stackdriver
- Error tracking: Sentry or similar
- Performance monitoring: New Relic or DataDog
- Uptime monitoring: Pingdom, Uptime Robot

### Support & Maintenance
- **SLA**: Response < 4 hours for critical issues, < 24 hours for normal issues
- **Updates**: Security patches applied within 48 hours
- **Backups**: Daily automated backups, tested restore monthly
- **Documentation**: API docs (Swagger), user guides, admin manuals

---

## 11. Approval & Sign-Off

| Stakeholder | Title | Signature | Date |
|-------------|-------|-----------|------|
| [Name] | Project Sponsor | _____________ | _____ |
| [Name] | Business Owner | _____________ | _____ |
| [Name] | Technical Lead | _____________ | _____ |
| [Name] | QA Lead | _____________ | _____ |

---

## 12. Appendices

### Appendix A: Glossary
- **JWT**: JSON Web Token for stateless authentication
- **RBAC**: Role-Based Access Control
- **ORM**: Object-Relational Mapping (Prisma)
- **API**: Application Programming Interface (REST)
- **UUID**: Universally Unique Identifier

### Appendix B: References
- NestJS Documentation: https://docs.nestjs.com
- Prisma Documentation: https://www.prisma.io/docs
- Angular Documentation: https://angular.io/docs
- PostgreSQL Documentation: https://www.postgresql.org/docs

### Appendix C: Document History
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | Nov 10, 2025 | Dev Team | Initial draft |
| 0.9 | Nov 12, 2025 | Dev Team | Refined requirements & estimates |
| 1.0 | Nov 13, 2025 | Dev Team | Final proposal for approval |

---

**End of Document**

*For questions or clarifications, contact: [Development Lead Email]*
