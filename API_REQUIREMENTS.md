# LMS Frontend - Required API Endpoints

This document lists all API endpoints required by the frontend with expected request/response formats.

**Base URL**: `http://localhost:8000` (configurable via `NEXT_PUBLIC_API_BASE_URL`)
**Authentication**: Bearer token (JWT) from `/auth/login` required on all requests

---

## 1. Dashboard APIs

### GET `/dashboard/stats`
Returns dashboard overview statistics.

**Response:**
```json
{
  "total_active_loans": 156,
  "total_disbursed": 45000000,
  "total_collections": 38500000,
  "total_overdue": 6500000,
  "overdue_count": 23,
  "default_rate": 4.2,
  "recovery_rate": 85.5,
  "disbursement_trend": [
    { "month": "Jan", "disbursed": 4200000, "collected": 3800000 },
    { "month": "Feb", "disbursed": 4800000, "collected": 4100000 },
    { "month": "Mar", "disbursed": 5100000, "collected": 4900000 }
  ],
  "loan_status_distribution": [
    { "status": "disbursed", "count": 85, "amount": 25000000 },
    { "status": "overdue", "count": 23, "amount": 6500000 },
    { "status": "cleared", "count": 45, "amount": 12000000 },
    { "status": "defaulted", "count": 3, "amount": 1500000 }
  ],
  "overdue_aging": [
    { "range": "1-7 days", "count": 10, "amount": 2500000 },
    { "range": "8-14 days", "count": 6, "amount": 1800000 },
    { "range": "15-30 days", "count": 4, "amount": 1200000 },
    { "range": "30+ days", "count": 3, "amount": 1000000 }
  ],
  "recent_activity": [
    {
      "id": "act-001",
      "type": "loan_disbursed",
      "description": "Loan disbursed to John Doe",
      "amount": 500000,
      "timestamp": "2026-01-10T10:30:00Z"
    }
  ]
}
```

---

## 2. Agents APIs

### GET `/agents`
List all agents with pagination and filters.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | int | Page number (default: 1) |
| page_size | int | Items per page (default: 10) |
| search | string | Search by name, agent_id, email |
| status | string | Filter by status: `active`, `pending`, `inactive`, `suspended` |
| sort_by | string | Field to sort by |
| sort_order | string | `asc` or `desc` |

**Response:**
```json
{
  "data": [
    {
      "id": "uuid-123",
      "agent_id": "3ISO0056",
      "full_name": "John Doe",
      "email": "john@example.com",
      "phone_number": "+256700123456",
      "national_id_number": "CM12345678901234",
      "employer_name": "Interswitch Uganda Ltd",
      "employment_status": "full_time",
      "monthly_income": 2500000,
      "consents_to_credit_check": true,
      "default_product_id": "prod-001",
      "status": "active",
      "created_at": "2025-06-15T10:30:00Z",
      "updated_at": "2026-01-01T14:22:00Z"
    }
  ],
  "total": 156,
  "page": 1,
  "page_size": 10,
  "total_pages": 16
}
```

### GET `/agents/{agent_id}`
Get single agent details.

**Response:**
```json
{
  "id": "uuid-123",
  "agent_id": "3ISO0056",
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone_number": "+256700123456",
  "national_id_number": "CM12345678901234",
  "employer_name": "Interswitch Uganda Ltd",
  "employment_status": "full_time",
  "monthly_income": 2500000,
  "consents_to_credit_check": true,
  "default_product_id": "prod-001",
  "status": "active",
  "created_at": "2025-06-15T10:30:00Z",
  "updated_at": "2026-01-01T14:22:00Z"
}
```

### POST `/agents`
Create a new agent.

**Request Body:**
```json
{
  "agent_id": "3ISO0057",
  "full_name": "Jane Smith",
  "email": "jane@example.com",
  "phone_number": "+256700123457",
  "national_id_number": "CM12345678901235",
  "employer_name": "MTN Uganda",
  "employment_status": "full_time",
  "monthly_income": 3000000,
  "consents_to_credit_check": true
}
```

**Response:** Same as GET `/agents/{agent_id}`

### PUT `/agents/{agent_id}`
Update an agent.

**Request Body:** (partial update supported)
```json
{
  "full_name": "Jane Doe",
  "status": "active"
}
```

---

## 3. Loans APIs

### GET `/loans`
List all loans with pagination and filters.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | int | Page number (default: 1) |
| page_size | int | Items per page (default: 10) |
| status | string | Filter: `pending`, `approved`, `disbursed`, `overdue`, `defaulted`, `cleared` |
| agent_id | string | Filter by agent |
| product_id | string | Filter by product |
| is_overdue | boolean | Filter overdue loans |
| date_from | string | Start date (ISO format) |
| date_to | string | End date (ISO format) |

**Response:**
```json
{
  "data": [
    {
      "id": "loan-001",
      "agent_id": "3ISO0056",
      "product_id": "prod-001",
      "principal_amount": 500000,
      "interest_rate": 10,
      "penalty_rate": 1,
      "interest_amount": 50000,
      "penalty_amount": 0,
      "total_paid": 200000,
      "outstanding_balance": 350000,
      "tenure_days": 30,
      "due_date": "2026-02-04T10:30:00Z",
      "disbursed_at": "2026-01-05T10:30:00Z",
      "cleared_at": null,
      "status": "disbursed",
      "is_overdue": false,
      "days_overdue": 0,
      "disbursement_reference": "DSB-001-2026",
      "created_at": "2026-01-05T10:30:00Z",
      "updated_at": "2026-01-05T10:30:00Z"
    }
  ],
  "total": 156,
  "page": 1,
  "page_size": 10,
  "total_pages": 16
}
```

### GET `/loans/{loan_id}`
Get basic loan info.

**Response:** Single loan object (same as item in list)

### GET `/loans/{loan_id}/detail`
Get loan with related agent, product, and payments.

**Response:**
```json
{
  "loan": {
    "id": "loan-001",
    "agent_id": "3ISO0056",
    "product_id": "prod-001",
    "principal_amount": 500000,
    "interest_rate": 10,
    "penalty_rate": 1,
    "interest_amount": 50000,
    "penalty_amount": 5000,
    "total_paid": 200000,
    "outstanding_balance": 355000,
    "tenure_days": 30,
    "due_date": "2026-02-04T10:30:00Z",
    "disbursed_at": "2026-01-05T10:30:00Z",
    "cleared_at": null,
    "status": "overdue",
    "is_overdue": true,
    "days_overdue": 5,
    "disbursement_reference": "DSB-001-2026",
    "created_at": "2026-01-05T10:30:00Z",
    "updated_at": "2026-01-10T10:30:00Z"
  },
  "agent": {
    "id": "uuid-123",
    "agent_id": "3ISO0056",
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone_number": "+256700123456",
    "status": "active"
  },
  "product": {
    "id": "prod-001",
    "name": "Quick Loan 30",
    "interest_rate": 10,
    "penalty_rate": 1,
    "tenure_days": 30
  },
  "payments": [
    {
      "id": "pay-001",
      "loan_id": "loan-001",
      "amount": 100000,
      "payment_reference": "PAY-001-2026",
      "channel": "mobile_money",
      "status": "posted",
      "payment_date": "2026-01-15T10:30:00Z",
      "created_at": "2026-01-15T10:30:00Z"
    }
  ]
}
```

### GET `/loans/{agent_id}/balance`
Get current loan balance for an agent.

**Response:**
```json
{
  "agent_id": "3ISO0056",
  "has_loan": true,
  "loan_id": "loan-001",
  "status": "disbursed",
  "principal_amount": 500000,
  "interest_rate": 10,
  "interest": 50000,
  "penalty": 0,
  "surcharge": 50000,
  "loan_balance": 550000,
  "total_paid": 0,
  "disbursed_at": "2026-01-05T10:30:00Z",
  "due_date": "2026-02-04T10:30:00Z",
  "tenure_days": 30,
  "days_since_disbursement": 5,
  "is_overdue": false,
  "days_overdue": 0,
  "is_cleared": false,
  "product_id": "prod-001",
  "product_name": "Quick Loan 30"
}
```

### GET `/loans/{loan_id}/statement`
Get loan statement/ledger.

**Response:**
```json
{
  "loan_id": "loan-001",
  "agent_id": "3ISO0056",
  "entries": [
    {
      "date": "2026-01-05",
      "description": "Loan Disbursement",
      "debit": 500000,
      "credit": 0,
      "balance": 500000,
      "reference": "DSB-001"
    },
    {
      "date": "2026-01-05",
      "description": "Interest Charge",
      "debit": 50000,
      "credit": 0,
      "balance": 550000,
      "reference": "INT-001"
    },
    {
      "date": "2026-01-15",
      "description": "Payment Received",
      "debit": 0,
      "credit": 100000,
      "balance": 450000,
      "reference": "PAY-001"
    }
  ],
  "opening_balance": 0,
  "closing_balance": 450000
}
```

### POST `/loans/applications`
Create/apply for a new loan (auto-approves and disburses).

**Request Body:**
```json
{
  "agent_id": "3ISO0056",
  "product_id": "prod-001",
  "principal_amount": 500000
}
```

**Response:** Loan object

### PATCH `/loans/{loan_id}/clear`
Mark loan as cleared.

**Response:** Updated loan object

### PATCH `/loans/{loan_id}/write-off`
Write off a defaulted loan.

**Response:** Updated loan object

---

## 4. Products APIs

### GET `/products`
List all loan products.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | int | Page number |
| page_size | int | Items per page |
| is_active | boolean | Filter active products |

**Response:**
```json
{
  "data": [
    {
      "id": "prod-001",
      "name": "Quick Loan 30",
      "description": "Short-term loan for agents",
      "min_amount": 50000,
      "max_amount": 500000,
      "interest_rate": 10,
      "penalty_rate": 1,
      "tenure_days": 30,
      "grace_period_days": 2,
      "requires_payroll": false,
      "is_default": true,
      "is_active": true,
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "page_size": 10,
  "total_pages": 1
}
```

### GET `/products/{product_id}`
Get single product.

### POST `/products`
Create product.

### PUT `/products/{product_id}`
Update product.

### DELETE `/products/{product_id}`
Delete/deactivate product.

---

## 5. Payments APIs

### GET `/payments`
List all payments.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | int | Page number |
| page_size | int | Items per page |
| loan_id | string | Filter by loan |
| agent_id | string | Filter by agent |
| status | string | Filter: `posted`, `pending`, `failed`, `reversed` |
| channel | string | Filter: `bank_transfer`, `mobile_money`, `card`, `cash`, `auto_debit` |
| date_from | string | Start date |
| date_to | string | End date |

**Response:**
```json
{
  "data": [
    {
      "id": "pay-001",
      "loan_id": "loan-001",
      "amount": 100000,
      "payment_reference": "PAY-001-2026",
      "channel": "mobile_money",
      "status": "posted",
      "payment_date": "2026-01-15T10:30:00Z",
      "created_at": "2026-01-15T10:30:00Z"
    }
  ],
  "total": 250,
  "page": 1,
  "page_size": 10,
  "total_pages": 25
}
```

### POST `/payments`
Post a manual payment.

**Request Body:**
```json
{
  "loan_id": "loan-001",
  "amount": 50000,
  "payment_reference": "MANUAL-001",
  "channel": "cash"
}
```

---

## 6. Users APIs (Admin)

### GET `/users`
List admin users.

**Response:**
```json
{
  "data": [
    {
      "id": "user-001",
      "username": "admin_jake",
      "email": "jake@interswitch.com",
      "agent_id": "ADMIN001",
      "first_name": "Jake",
      "last_name": "Adams",
      "phone_number": "+256700111222",
      "is_active": true,
      "is_admin": true,
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "page_size": 10,
  "total_pages": 1
}
```

### POST `/users`
Create admin user.

### PUT `/users/{user_id}`
Update user.

### DELETE `/users/{user_id}`
Deactivate user.

---

## 7. API Clients APIs

### GET `/api-clients`
List API clients/keys.

**Response:**
```json
{
  "data": [
    {
      "id": "client-001",
      "name": "Mobile App Production",
      "api_key": "sk_live_********************4a2b",
      "allowed_ips": ["192.168.1.1"],
      "is_active": true,
      "last_used_at": "2026-01-10T10:00:00Z",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "total": 3,
  "page": 1,
  "page_size": 10,
  "total_pages": 1
}
```

### POST `/api-clients`
Create new API client (returns full key once).

**Request Body:**
```json
{
  "name": "New Integration",
  "allowed_ips": ["10.0.0.1"]
}
```

**Response:**
```json
{
  "id": "client-002",
  "name": "New Integration",
  "api_key": "sk_live_abcdef123456789...",
  "allowed_ips": ["10.0.0.1"],
  "is_active": true,
  "created_at": "2026-01-10T10:00:00Z"
}
```

### DELETE `/api-clients/{client_id}`
Revoke API client.

---

## 8. Reports APIs

### GET `/reports/portfolio`
Portfolio analysis report.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| date_from | string | Start date |
| date_to | string | End date |

**Response:**
```json
{
  "par_30": 4.2,
  "par_60": 2.1,
  "par_90": 0.8,
  "total_portfolio": 45000000,
  "active_loans_count": 156,
  "average_loan_size": 288462,
  "by_product": [
    {
      "product_id": "prod-001",
      "product_name": "Quick Loan 30",
      "total_disbursed": 25000000,
      "active_count": 85,
      "overdue_count": 12
    }
  ]
}
```

### GET `/reports/collections`
Collections report.

### GET `/reports/disbursements`
Disbursements report.

---

## Error Response Format

All error responses should follow this format:

```json
{
  "detail": "Error message here",
  "code": "ERROR_CODE",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `204` - No Content (successful delete)
- `400` - Bad Request
- `401` - Unauthorized (missing/invalid API key)
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Server Error

---

## Notes

1. All dates are in ISO 8601 format (UTC)
2. All monetary amounts are in UGX (Ugandan Shillings) as integers
3. Pagination uses `page` and `page_size` parameters
4. Bearer token authentication (JWT from `/auth/login`) is required for all endpoints
5. Employment status options: `full_time`, `part_time`, `contract`, `self_employed`, `unemployed`
6. Agent status options: `pending`, `active`, `inactive`, `suspended`, `blacklisted`
7. Loan status options: `pending`, `approved`, `disbursed`, `overdue`, `defaulted`, `cleared`, `failed`
8. Payment status options: `posted`, `pending`, `failed`, `reversed`
9. Payment channel options: `bank_transfer`, `mobile_money`, `card`, `wallet`, `cash`, `auto_debit`
