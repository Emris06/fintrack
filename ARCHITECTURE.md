# FinTrack - Personal Finance Management System
## System Architecture Document

---

## 1. HIGH-LEVEL SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                              │
│  React + Vite + TailwindCSS + React Router + Zustand        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │Dashboard │ │Accounts  │ │Analytics │ │Budgets   │       │
│  │Component │ │Module    │ │Charts    │ │Planner   │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                        │                                     │
│              Axios HTTP Client + JWT Interceptor              │
└────────────────────────┼────────────────────────────────────┘
                         │ REST/JSON
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY LAYER                          │
│  Spring Security Filter Chain + JWT Authentication           │
│  CORS Configuration + Rate Limiting                          │
│  Global Exception Handler (@ControllerAdvice)                │
└────────────────────────┼────────────────────────────────────┘
                         │
┌────────────────────────┼────────────────────────────────────┐
│                    CONTROLLER LAYER                           │
│  @RestController endpoints organized by domain module        │
│  Request validation (@Valid) + DTO mapping                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │Auth      │ │Account   │ │Transact  │ │Analytics │       │
│  │Controller│ │Controller│ │Controller│ │Controller│       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└────────────────────────┼────────────────────────────────────┘
                         │
┌────────────────────────┼────────────────────────────────────┐
│                    SERVICE LAYER                              │
│  Business logic + Transaction management (@Transactional)    │
│  ┌──────────────────────────────────────────────────┐       │
│  │ AccountService   - Balance mgmt, multi-currency  │       │
│  │ TransactionSvc   - Income/Expense/Transfer ACID  │       │
│  │ BudgetService    - Planning, limits, tracking     │       │
│  │ DebtService      - Debts & receivables lifecycle  │       │
│  │ AnalyticsService - Aggregation, time-series       │       │
│  │ AIService        - Category prediction, anomalies │       │
│  │ NotificationSvc  - Alerts, reminders              │       │
│  │ AuditService     - Immutable audit trail          │       │
│  └──────────────────────────────────────────────────┘       │
└────────────────────────┼────────────────────────────────────┘
                         │
┌────────────────────────┼────────────────────────────────────┐
│                    REPOSITORY LAYER                           │
│  Spring Data JPA + Custom JPQL queries                       │
│  Optimistic locking (@Version)                               │
│  Pagination + Sorting support                                │
└────────────────────────┼────────────────────────────────────┘
                         │
┌────────────────────────┼────────────────────────────────────┐
│                    DATA LAYER                                 │
│  PostgreSQL (prod) / H2 (dev)                                │
│  Flyway migrations                                           │
│  ┌──────────────────────────────────────────────────┐       │
│  │ users / accounts / transactions / categories     │       │
│  │ budgets / debts / audit_logs / notifications     │       │
│  │ family_groups / family_members / ai_rules        │       │
│  │ exchange_rates / transfer_records                 │       │
│  └──────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. DATABASE SCHEMA (Entity Relationship)

### Tables & Relationships:

```
users (1) ──── (N) accounts
users (1) ──── (N) transactions
users (1) ──── (N) budgets
users (1) ──── (N) debts
users (1) ──── (N) notifications
users (1) ──── (N) ai_rules
users (N) ──── (N) family_groups (via family_members)

accounts (1) ──── (N) transactions
accounts (1) ──── (N) transfer_records (as source)
accounts (1) ──── (N) transfer_records (as target)

categories (1) ──── (N) transactions
categories (1) ──── (N) budgets

transactions (1) ──── (0..1) transfer_records
```

### Key Design Decisions:

1. **BigDecimal for all monetary values** - 19,4 precision
2. **Optimistic locking** on accounts (version column) for concurrent balance updates
3. **Immutable transactions** - no UPDATE on amount/account after creation, only soft-delete
4. **Audit trail** - separate audit_logs table for all financial mutations
5. **Soft delete** on transactions, hard delete nowhere for financial data
6. **Currency stored per-account** - ISO 4217 codes (USD, EUR, UZS, etc.)

---

## 3. REST API STRUCTURE

### Auth Module
- POST   /api/auth/register
- POST   /api/auth/login
- POST   /api/auth/refresh
- GET    /api/auth/me

### Accounts Module
- GET    /api/accounts              (list user accounts)
- POST   /api/accounts              (create account)
- GET    /api/accounts/{id}         (get account detail)
- PUT    /api/accounts/{id}         (update account metadata)
- DELETE /api/accounts/{id}         (soft-delete)
- GET    /api/accounts/{id}/balance (computed balance)

### Transactions Module (Income + Expenses)
- GET    /api/transactions                     (list with filters)
- POST   /api/transactions                     (create income/expense)
- GET    /api/transactions/{id}                (detail)
- PUT    /api/transactions/{id}                (edit - creates adjustment)
- DELETE /api/transactions/{id}                (soft-delete + reverse balance)
- GET    /api/transactions/categories          (list categories)

### Transfers Module
- POST   /api/transfers                        (atomic transfer)
- GET    /api/transfers                        (transfer history)
- GET    /api/transfers/{id}                   (detail with rate info)

### Debts Module
- GET    /api/debts                            (list)
- POST   /api/debts                            (create)
- PUT    /api/debts/{id}                       (update)
- PATCH  /api/debts/{id}/close                 (mark as closed)
- DELETE /api/debts/{id}                       (soft-delete)

### Budgets Module
- GET    /api/budgets                          (list)
- POST   /api/budgets                          (create budget)
- PUT    /api/budgets/{id}                     (update)
- DELETE /api/budgets/{id}                     (delete)
- GET    /api/budgets/performance              (planned vs actual)

### Analytics Module
- GET    /api/analytics/summary                (income/expense/net for period)
- GET    /api/analytics/category-breakdown     (by category)
- GET    /api/analytics/trend                  (time-series data)
- GET    /api/analytics/calendar               (daily totals for month)
- GET    /api/analytics/savings-rate           (net savings %)

### AI Module
- GET    /api/ai/predict-category?description= (category suggestion)
- GET    /api/ai/anomalies                     (spending anomalies)
- GET    /api/ai/insights                      (budget alerts + tips)

### Notifications Module
- GET    /api/notifications                    (list)
- PATCH  /api/notifications/{id}/read          (mark read)

### Family Module
- POST   /api/family/groups                    (create group)
- POST   /api/family/groups/{id}/members       (add member)
- GET    /api/family/groups/{id}/accounts      (shared accounts)

---

## 4. DATA FLOW: BALANCE UPDATES

### Expense Flow:
1. User creates expense → validate account exists, belongs to user
2. @Transactional: Insert transaction record
3. Update account.balance -= amount (with optimistic lock check)
4. Insert audit_log entry
5. Trigger AI: check anomaly, update category stats
6. Return success + updated balance

### Income Flow:
Same as expense but account.balance += amount

### Transfer Flow:
1. Validate both accounts exist, belong to user
2. If different currencies: fetch exchange rate, compute converted amount
3. @Transactional:
   a. Debit source account (balance -= amount)
   b. Credit target account (balance += converted_amount)
   c. Insert transfer_record with rate info
   d. Insert 2 transaction records (TRANSFER_OUT + TRANSFER_IN)
   e. Insert audit_log
4. If optimistic lock fails → retry up to 3 times

---

## 5. TRANSACTION ATOMICITY STRATEGY
- All balance-affecting operations wrapped in @Transactional
- Optimistic locking via @Version on Account entity
- ObjectOptimisticLockingFailureException caught and retried
- No partial commits possible: entire operation succeeds or rolls back

## 6. CONCURRENCY HANDLING
- @Version field on accounts table (optimistic locking)
- RetryTemplate for lock failures (max 3 retries)
- Idempotency key on transfers to prevent double-submission

## 7. CURRENCY PRECISION
- All amounts: BigDecimal(19,4) in DB, BigDecimal in Java
- Exchange rates: BigDecimal(19,6)
- RoundingMode.HALF_UP for conversions
- No floating-point math anywhere

## 8. AUDIT TRAIL
- audit_logs table: entity_type, entity_id, action, old_value (JSON), new_value (JSON), user_id, timestamp
- Written on every financial mutation
- Immutable: INSERT only, no UPDATE/DELETE

## 9. SECURITY MODEL
- JWT-based stateless authentication
- Access token (15min) + Refresh token (7d)
- BCrypt password hashing
- Spring Security filter chain
- All /api/** endpoints require authentication except /api/auth/**
- User isolation: all queries filtered by authenticated user ID

## 10. AI LOGIC DESIGN
- **Category Prediction**: Keyword-to-category mapping stored in ai_category_rules table
  - "uber", "taxi", "lyft" → Transportation
  - "restaurant", "cafe", "pizza" → Food & Dining
  - Falls back to "Other" if no match
- **Anomaly Detection**: Compare current month spending per category vs 3-month rolling average
  - Alert if >30% above average
- **Budget Alerts**: Check spending vs budget limits, alert at 80% and 100%
- **Bill Reminders**: Check debts with due dates approaching (7 days, 1 day)
