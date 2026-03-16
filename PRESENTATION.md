# FinTrack - Personal Finance Management System

## Full-Stack Web Application | Presentation Document

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [System Architecture](#3-system-architecture)
4. [Database Design](#4-database-design)
5. [Backend Implementation](#5-backend-implementation)
6. [Frontend Implementation](#6-frontend-implementation)
7. [Core Features](#7-core-features)
8. [Advanced Features](#8-advanced-features)
9. [Security](#9-security)
10. [API Reference](#10-api-reference)
11. [Project Statistics](#11-project-statistics)
12. [Demo Account](#12-demo-account)

---

## 1. Project Overview

**FinTrack** is a production-grade personal finance management system that helps users track income, expenses, budgets, debts, and household bills — all in one place.

### Key Highlights

- Full-stack application with **Spring Boot** backend and **React** frontend
- **Multi-currency** support with real-time conversion (USD, UZS, RUB)
- **AI-powered** category prediction, anomaly detection, and financial insights
- **Voice assistant** for hands-free financial commands
- **Family sharing** — create groups and share accounts with family members
- **My House** module — track household utility services, bills, and payments
- **My Cars** module — manage vehicles and traffic fines
- **87+ REST API endpoints** across 16 controllers
- **22 database entities** with Flyway-managed migrations
- Responsive design with dark theme

---

## 2. Technology Stack

### Backend

| Layer | Technology |
|-------|-----------|
| Framework | Spring Boot 3.5.0 (Java 17) |
| Build Tool | Gradle 8.14.4 |
| Database | PostgreSQL (prod) / H2 (dev) |
| ORM | Spring Data JPA (Hibernate) |
| Migrations | Flyway |
| Auth | JWT (JJWT 0.12.6) + Spring Security |
| Validation | Jakarta Bean Validation |
| Boilerplate | Lombok |

### Frontend

| Layer | Technology |
|-------|-----------|
| Framework | React 19.2.0 + TypeScript 5.9.3 |
| Build Tool | Vite 7.3.1 |
| State Management | Zustand 5.0.11 |
| Server State | TanStack React Query 5.90.21 |
| HTTP Client | Axios 1.13.6 |
| UI Components | Radix UI + shadcn/ui |
| Styling | Tailwind CSS 4.2.1 |
| Icons | Lucide React |
| Charts | Recharts 2.15.4 |
| Routing | React Router 7.13.1 |
| Forms | React Hook Form + Zod validation |
| Animations | Framer Motion 12.34.3 |
| Toasts | Sonner 2.0.7 |

---

## 3. System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                             │
│   React 19 + Vite + TypeScript + Tailwind + Zustand           │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│   │Dashboard │ │Accounts  │ │Analytics │ │My House  │       │
│   │  + 11    │ │& Wallet  │ │& Charts  │ │& Bills   │       │
│   │  modules │ │          │ │          │ │          │       │
│   └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                       │                                       │
│             Axios HTTP Client + JWT Interceptor                │
└───────────────────────┼──────────────────────────────────────┘
                        │  REST / JSON
                        ▼
┌───────────────────────┼──────────────────────────────────────┐
│                  API GATEWAY LAYER                             │
│   Spring Security Filter Chain + JWT Authentication           │
│   CORS Configuration + Global Exception Handler               │
└───────────────────────┼──────────────────────────────────────┘
                        │
┌───────────────────────┼──────────────────────────────────────┐
│                 CONTROLLER LAYER (16 controllers)             │
│   @RestController + @Valid + DTO Request/Response mapping     │
└───────────────────────┼──────────────────────────────────────┘
                        │
┌───────────────────────┼──────────────────────────────────────┐
│                  SERVICE LAYER (14 services)                   │
│   Business Logic + @Transactional + Audit Logging             │
│   ┌───────────────────────────────────────────────────┐       │
│   │ AccountService    - Balance mgmt, multi-currency  │       │
│   │ TransactionSvc    - Income/Expense ACID ops       │       │
│   │ TransferService   - Cross-account/currency xfer   │       │
│   │ BudgetService     - Planning, limits, tracking    │       │
│   │ AnalyticsService  - Aggregation, time-series      │       │
│   │ AiService         - Predictions, anomaly detect   │       │
│   │ HouseModuleService- Utilities, bills, payments    │       │
│   │ VoiceAssistant    - NLP command processing        │       │
│   └───────────────────────────────────────────────────┘       │
└───────────────────────┼──────────────────────────────────────┘
                        │
┌───────────────────────┼──────────────────────────────────────┐
│                REPOSITORY LAYER (22 repositories)             │
│   Spring Data JPA + Custom JPQL + Optimistic Locking          │
└───────────────────────┼──────────────────────────────────────┘
                        │
┌───────────────────────┼──────────────────────────────────────┐
│                   DATA LAYER                                   │
│   PostgreSQL / H2 + Flyway (7 migration scripts)              │
│   22 tables + 12 enums                                        │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. Database Design

### Entity Relationship Overview

```
users (1) ──── (N) accounts
users (1) ──── (N) transactions
users (1) ──── (N) budgets
users (1) ──── (N) debts
users (1) ──── (N) houses ──── (N) house_services ──── (N) bills
users (1) ──── (N) cars ──── (N) fines
users (1) ──── (N) notifications
users (N) ──── (N) family_groups  (via family_members)

accounts (1) ──── (N) transactions
categories (1) ──── (N) transactions
categories (1) ──── (N) budgets

bills (1) ──── (N) bill_payments ──── (1) transactions
```

### 22 Database Tables

| # | Table | Purpose |
|---|-------|---------|
| 1 | users | User accounts with credentials |
| 2 | accounts | Financial accounts (card, cash, savings) |
| 3 | transactions | Income/expense/transfer records |
| 4 | categories | Transaction categories (system + custom) |
| 5 | budgets | Spending limits by category/period |
| 6 | debts | Personal debts and receivables |
| 7 | transfer_records | Cross-account transfer details |
| 8 | audit_logs | Immutable financial mutation log |
| 9 | notifications | User alerts and reminders |
| 10 | ai_category_rules | Keyword-to-category ML rules |
| 11 | exchange_rates | Multi-currency conversion rates |
| 12 | refresh_tokens | JWT refresh token storage |
| 13 | family_groups | Family/group definitions |
| 14 | family_members | Group membership (M:N) |
| 15 | shared_accounts | Accounts shared with groups |
| 16 | reminders | Date-based reminders |
| 17 | houses | User properties/homes |
| 18 | house_services | Utility services per house |
| 19 | bills | Monthly utility bills |
| 20 | bill_payments | Bill payment records linked to transactions |
| 21 | cars | User vehicles |
| 22 | fines | Traffic fines per vehicle |

### Key Design Decisions

- **BigDecimal(19,4)** for all monetary values — no floating-point math
- **Optimistic locking** via `@Version` on accounts for concurrent balance updates
- **Soft deletes** on transactions and debts — financial data is never hard-deleted
- **Immutable audit trail** — INSERT-only `audit_logs` table
- **Currency per account** — ISO 4217 codes (USD, UZS, RUB)
- **Cascading deletes** on parent-child relationships (house → services → bills)

---

## 5. Backend Implementation

### Layered Architecture

```
Controller Layer    →  Request validation, DTO mapping, SecurityUtils
Service Layer       →  Business logic, @Transactional, audit logging
Repository Layer    →  JPA queries, pagination, custom JPQL
Entity Layer        →  JPA entities, enums, lifecycle hooks
```

### Transaction Flow Example (Expense)

```
1. User POST /api/transactions  (amount: 50000, type: EXPENSE)
2. Controller: validate request (@Valid), extract userId
3. Service:
   a. Load Account (with optimistic lock)
   b. Load Category
   c. account.debit(50000)        ← BigDecimal subtraction
   d. Save Transaction record
   e. Save Account (version++)    ← concurrent-safe
   f. Create AuditLog entry
4. Return TransactionResponse DTO
```

### Bill Payment Flow (My House → Transactions Integration)

```
1. User POST /api/houses/bills/{billId}/pay  (accountId: 5)
2. Service:
   a. Load Bill, verify ownership chain (bill → service → house → user)
   b. Load Account, verify belongs to user
   c. account.debit(bill.amount)
   d. Create EXPENSE Transaction (category: "Bills & Utilities")
   e. Mark bill status = PAID
   f. Create BillPayment record (links bill ↔ transaction)
3. Account balance updated, transaction visible in history
```

---

## 6. Frontend Implementation

### Application Structure

```
src/
├── pages/              15 feature modules (lazy-loaded)
│   ├── dashboard/      Welcome screen, balance, recent transactions
│   ├── accounts/       Account management + detail view
│   ├── transactions/   Transaction list with filters
│   ├── transfers/      Inter-account transfers
│   ├── budgets/        Budget planning and tracking
│   ├── debts/          Debt and receivable management
│   ├── analytics/      Charts, trends, category breakdown
│   ├── calendar/       Monthly calendar with daily totals
│   ├── family/         Family groups and shared accounts
│   ├── houses/         Household utility management
│   ├── cars/           Vehicle and fine tracking
│   ├── ai-insights/    AI-powered financial insights
│   ├── notifications/  Alert center
│   ├── auth/           Login and registration
│   └── settings/       User profile
├── components/
│   ├── ui/             30+ shadcn/ui components
│   ├── layout/         Sidebar, topbar, app shell
│   ├── charts/         Recharts wrappers
│   ├── voice/          Voice assistant UI
│   └── shared/         Reusable form components
├── api/                API layer (Axios calls)
├── hooks/              React Query hooks per module
├── store/              Zustand stores (auth, app state)
├── types/              TypeScript interfaces
└── lib/                Utilities, constants, axios config
```

### State Management Strategy

| State Type | Tool | Example |
|------------|------|---------|
| Server state | React Query | Accounts, transactions, bills |
| Client state | Zustand | Auth tokens, sidebar open/close |
| Form state | React Hook Form | Add account, create bill |
| URL state | React Router | Current page, route params |

### Key Frontend Patterns

- **Lazy loading** — all pages loaded on demand via `React.lazy()`
- **Query key architecture** — structured cache keys for granular invalidation
- **Optimistic UI** — mutations invalidate related queries on success
- **Skeleton loading** — consistent loading states across all pages
- **Responsive design** — mobile sidebar + desktop fixed sidebar
- **Dark theme** — full dark mode with custom design system

---

## 7. Core Features

### 7.1 Dashboard

- Welcome greeting with user name
- Total account balance with visibility toggle
- Multi-currency balance conversion
- Recent transactions list (last 10)
- Quick action buttons: Add Transaction, Transfer
- Notification badge with unread count

### 7.2 Accounts Management

- Create multiple accounts: Card, Cash, Savings, Investment
- Per-account currency (USD, UZS, RUB)
- Balance tracking with initial balance
- Custom icons and colors
- Account detail view with transaction history

### 7.3 Transactions

- Record income and expenses
- Assign categories with icons/colors
- Filter by type, account, category, date range
- Paginated list with sorting
- Soft-delete with automatic balance reversal

### 7.4 Transfers

- Transfer between accounts
- Automatic currency conversion with exchange rates
- Idempotency key to prevent double-submission
- Creates paired TRANSFER_OUT + TRANSFER_IN records

### 7.5 Budgets

- Create budgets by category (weekly/monthly/yearly)
- Real-time spent vs. limit tracking
- Progress bar with percentage used
- Alerts at 80% (warning) and 100% (exceeded)

### 7.6 Debts

- Track debts (I owe) and receivables (owed to me)
- Due date tracking with overdue detection
- Status lifecycle: OPEN → CLOSED / OVERDUE
- Close debt when paid off

### 7.7 Analytics

- Income vs. Expense summary for any period
- Category breakdown with pie/bar charts
- Spending trends over time (daily/weekly/monthly)
- Savings rate calculation
- Calendar view with daily totals

---

## 8. Advanced Features

### 8.1 AI-Powered Insights

- **Category Prediction**: Automatically suggests categories based on transaction description keywords
- **Anomaly Detection**: Compares monthly spending per category vs. 3-month rolling average; alerts when spending exceeds 130% of average
- **Budget Alerts**: Real-time monitoring with severity levels (WARNING at 80%, CRITICAL at 100%)
- **Debt Reminders**: Alerts for debts due within 7 days or overdue

### 8.2 Voice Assistant

- Natural language command processing
- Supported commands:
  - "Check my balance" → Navigate to accounts
  - "Add expense 50000 for groceries" → Create transaction
  - "Transfer 100 from Card to Savings" → Execute transfer
  - "Create debt 500000 for John" → Record debt
  - "Set reminder for March 20" → Create reminder
- Two-step confirmation workflow for financial actions

### 8.3 Family Groups & Shared Accounts

- Create family groups and invite members by email
- Share specific accounts with groups
- Multi-user access to shared accounts
- Role-based membership (Owner/Member)

### 8.4 My House — Household Utility Management

- Create multiple house profiles with addresses
- Add utility services: Electricity, Gas, Water, Internet, TV, HOA, Garbage, Security
- Track monthly bills per service (PENDING/PAID status)
- **Pay bills directly** — deducts from selected account and creates a transaction
- Total due amount per house
- Service icons for visual identification

### 8.5 My Cars — Vehicle & Fine Tracking

- Register multiple vehicles with license plates
- View traffic fines per vehicle
- Pay fines with one click
- Unpaid fines summary per car

### 8.6 Multi-Currency Support

- Supported currencies: USD, UZS, RUB
- Per-account currency setting
- Automatic conversion on cross-currency transfers
- Exchange rate management
- Dashboard shows total in user's default currency

### 8.7 Notification Center

- Budget warnings and exceeded alerts
- Spending anomaly notifications
- Debt/bill reminders
- Unread count badge in sidebar
- Mark as read / mark all as read

---

## 9. Security

### Authentication Flow

```
Registration → BCrypt hash password → Store user → Return JWT

Login → Verify credentials → Generate access token (15min) + refresh token (7d)

API Request → JWT filter → Extract userId → Inject SecurityContext

Token Expired → POST /auth/refresh → New access token
```

### Security Measures

| Measure | Implementation |
|---------|---------------|
| Password hashing | BCrypt |
| Token-based auth | JWT (stateless) |
| Token expiry | Access: 15min, Refresh: 7d |
| User isolation | All queries filtered by authenticated userId |
| Input validation | Jakarta @Valid + custom constraints |
| CORS | Configured for frontend origin |
| SQL injection | Prevented by JPA parameterized queries |
| XSS | React auto-escapes output |
| Concurrent access | Optimistic locking on accounts |

---

## 10. API Reference

### All Endpoints (87+)

#### Authentication (4 endpoints)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | User registration |
| POST | /api/auth/login | Login, returns JWT tokens |
| POST | /api/auth/refresh | Refresh access token |
| GET | /api/auth/me | Get current user info |

#### Accounts (6 endpoints)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/accounts | List user accounts |
| POST | /api/accounts | Create account |
| GET | /api/accounts/{id} | Account details |
| PUT | /api/accounts/{id} | Update account |
| DELETE | /api/accounts/{id} | Soft-delete account |
| GET | /api/accounts/balance-summary | Balance across all accounts |

#### Transactions (5 endpoints)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/transactions | List with filters & pagination |
| POST | /api/transactions | Create income/expense |
| GET | /api/transactions/{id} | Transaction detail |
| PUT | /api/transactions/{id} | Update transaction |
| DELETE | /api/transactions/{id} | Soft-delete + reverse balance |

#### Transfers (3 endpoints)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/transfers | Atomic cross-account transfer |
| GET | /api/transfers | Transfer history |
| GET | /api/transfers/{id} | Transfer detail with rate |

#### Budgets (5 endpoints)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/budgets | List budgets |
| POST | /api/budgets | Create budget |
| PUT | /api/budgets/{id} | Update budget |
| DELETE | /api/budgets/{id} | Delete budget |
| GET | /api/budgets/performance | Planned vs actual |

#### Debts (5 endpoints)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/debts | List debts/receivables |
| POST | /api/debts | Create debt |
| PUT | /api/debts/{id} | Update debt |
| PATCH | /api/debts/{id}/close | Close debt |
| DELETE | /api/debts/{id} | Soft-delete |

#### Analytics (6 endpoints)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/analytics/summary | Income/expense/net |
| GET | /api/analytics/category-breakdown | By category |
| GET | /api/analytics/trend | Time-series data |
| GET | /api/analytics/category-comparison | Compare categories |
| GET | /api/analytics/calendar | Daily totals for month |
| GET | /api/analytics/savings-rate | Net savings % |

#### AI & Insights (3 endpoints)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/ai/predict-category | Category prediction |
| GET | /api/ai/anomalies | Spending anomaly detection |
| GET | /api/ai/insights | Combined financial insights |

#### Houses (14 endpoints)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/houses | List houses |
| POST | /api/houses | Create house |
| GET | /api/houses/{id} | House details |
| PUT | /api/houses/{id} | Update house |
| DELETE | /api/houses/{id} | Delete house |
| GET | /api/houses/{id}/services | List services |
| POST | /api/houses/{id}/services | Add service |
| PUT | /api/houses/{id}/services/{sId} | Update service |
| DELETE | /api/houses/{id}/services/{sId} | Remove service |
| GET | /api/houses/{id}/services/{sId}/bills | List bills |
| POST | /api/houses/{id}/services/{sId}/bills | Add bill |
| PUT | /api/houses/bills/{billId} | Update bill |
| DELETE | /api/houses/bills/{billId} | Delete bill |
| POST | /api/houses/bills/{billId}/pay | Pay bill |

#### Cars (5 endpoints)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/cars | List cars |
| POST | /api/cars | Add car |
| DELETE | /api/cars/{id} | Remove car |
| GET | /api/cars/{carId}/fines | List fines |
| POST | /api/cars/{carId}/fines/{fineId}/pay | Pay fine |

#### Other Modules
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/notifications | List notifications |
| GET | /api/notifications/unread-count | Unread badge count |
| PATCH | /api/notifications/{id}/read | Mark as read |
| PATCH | /api/notifications/read-all | Mark all as read |
| GET | /api/categories | List categories |
| GET | /api/currency/rates | Exchange rates |
| GET | /api/currency/convert | Convert amount |
| POST | /api/voice/command | Voice command |
| POST | /api/voice/confirm | Confirm voice action |
| GET/POST/DELETE | /api/reminders/* | Reminder CRUD |
| GET/POST/DELETE | /api/family/* | Family groups |

---

## 11. Project Statistics

### Code Metrics

| Metric | Count |
|--------|-------|
| Total backend Java files | ~150 |
| Total frontend TS/TSX files | ~115 |
| REST API endpoints | 87+ |
| Database tables | 22 |
| Entity enums | 12 |
| Controllers | 16 |
| Services | 14 |
| Repositories | 22 |
| Frontend pages/modules | 15 |
| UI components | 30+ |
| Flyway migrations | 7 |
| npm dependencies | 50+ |

### Feature Module Summary

| Module | Backend | Frontend | Tables |
|--------|---------|----------|--------|
| Auth | Controller + Service + JWT | Login/Register pages | users, refresh_tokens |
| Accounts | Full CRUD + balance logic | List + detail pages | accounts |
| Transactions | CRUD + balance effects | Filtered list page | transactions |
| Transfers | Atomic transfer + FX | Transfer page | transfer_records |
| Budgets | CRUD + performance calc | Budget planner page | budgets |
| Debts | CRUD + status lifecycle | Debt tracker page | debts |
| Analytics | 6 aggregate queries | Charts + calendar | (reads transactions) |
| AI | Predict + anomaly + insights | Insights page | ai_category_rules |
| Family | Groups + sharing | Family management page | 3 tables |
| Houses | CRUD + bill payment | Multi-view page | 4 tables |
| Cars | CRUD + fine payment | Card-based page | 2 tables |
| Voice | NLP + confirmation | Floating assistant | (uses other services) |
| Notifications | Auto-generate + CRUD | Alert center | notifications |

---

## 12. Demo Account

| Field | Value |
|-------|-------|
| Email | demo@fintrack.com |
| Password | demo123 |

### Pre-loaded Demo Data

- **Accounts**: Multiple accounts with different currencies
- **Transactions**: 30+ demo transactions across categories
- **Budgets**: Sample budgets for Food, Transport, Entertainment
- **Debts**: Active debts and receivables
- **Houses**: 2 houses (My Apartment, Parents House) with 8 utility services and 16 bills
- **Cars**: 2 vehicles with 6 traffic fines
- **Exchange Rates**: USD/UZS/RUB conversion rates
- **Categories**: 17 system categories with icons and colors

---

## How to Run

### Backend
```bash
cd backend
./gradlew bootRun
# Runs on http://localhost:8080
# H2 console at /h2-console (dev profile)
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

---

*FinTrack — Your complete personal finance companion.*
