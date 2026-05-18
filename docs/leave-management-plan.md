# Leave Management System - Implementation Plan

**Project:** HR & Payroll Management System Enhancement
**Date:** 2026-05-10
**Status:** Planning

---

## Context

The existing system is a Government HR & Payroll Management System built with Laravel 12 + React (Inertia.js). It currently has:

- Employee Management
- Payroll Processing (Salary, PERA, RATA, Hazard Pay, Clothing Allowance)
- Deductions & Benefits
- Claims Workflow (Travel, Overtime, Meal)
- Adjustments with Approval Workflow
- Role-based Access Control
- Audit Logging
- Employee Self-Service Dashboard (view-only)

**Missing:** Leave Management System

---

## Decision: Integrated vs Separate

**Decision:** Integrated into existing system

### Rationale

1. **Single login** - employees use one account for payroll + leave
2. **Shared infrastructure** - employee data, roles, permissions already exist
3. **Leave affects payroll** - unpaid leave = automatic deduction calculation
4. **One system to maintain** - less admin burden
5. **Consistent UX** - same design patterns, same dashboard
6. **Existing approval workflow** - can model leave approval after Adjustment workflow

---

## Scope

### Features to Build

1. **Leave Types Management**
   - VL (Vacation Leave)
   - SL (Sick Leave)
   - ML (Maternity Leave)
   - PL (Paternity Leave)
   - SPL (Special Leave)
   - Others as needed

2. **Leave Request Model**
   - Employee reference
   - Leave type
   - Start date / End date
   - Number of days
   - Reason/Purpose
   - Status (pending, approved, rejected, cancelled)
   - Approved by (user)
   - Approval date
   - Remarks

3. **Employee Leave Balance**
   - Per leave type per employee
   - Track used, remaining, total allocated
   - Annual credit system

4. **Leave Application Page (Employee)**
   - Self-service form submission
   - View own leave history
   - View remaining balance
   - Cancel pending requests

5. **Leave Approval Page (Admin/HR)**
   - List of pending requests
   - Approve/Reject with remarks
   - Bulk actions
   - Filter by employee, leave type, date range

6. **Leave Calendar View**
   - Visual display of team leaves
   - Filter by department/office

7. **Notifications**
   - Alert HR of new leave applications
   - Notify employee of approval/rejection

8. **Reports**
   - Leave utilization per employee
   - Leave balance summary

---

## Technical Approach

### Database

New tables:
- `leave_types` - master list of leave types
- `leave_requests` - individual leave applications
- `employee_leave_balances` - per-employee, per-type balance tracking

### Backend (Laravel)

- `LeaveType` model
- `LeaveRequest` model
- `EmployeeLeaveBalance` model
- `LeaveRequestController` (CRUD)
- `LeaveBalanceController` (manage balances)
- Form Request validation
- Policy for authorization

### Frontend (React)

New pages in `resources/js/pages/`:
- `leave-requests/index.tsx` - employee list of requests
- `leave-requests/create.tsx` - apply for leave
- `leave-requests/[id]/edit.tsx` - edit/cancel request
- `leave-approvals/index.tsx` - admin approval page
- `leave-balances/index.tsx` - manage balances
- `settings/leave-types/` - manage leave types

### Middleware

- Authenticated user
- Role-based access (employee vs HR/admin)

### Approval Workflow

```
Employee submits request
         ↓
    Pending status
         ↓
    HR/Admin reviews
    ↓           ↓
  Approved    Rejected
    ↓           ↓
Balance updated  Employee notified
Employee notified
```

---

## Existing Patterns to Follow

From `Adjustment` workflow:
- Model: `Adjustment.php` - status field, approval workflow
- Controller: `AdjustmentController.php` - create, update, approve, reject
- Page: `adjustments/` folder - create, edit, list
- Routes: Resource routes with custom actions

From `EmployeeDashboard`:
- Tabs for different data views
- Period filtering (month/year)
- Print functionality

---

## Dependencies

- Uses existing `Employee` model (already has `user_id` link)
- Uses existing `User` model with Spatie roles
- Uses existing notification system
- Uses existing audit logging trait

---

## Implementation Order

1. Create migrations (leave_types, leave_requests, employee_leave_balances)
2. Create models and relationships
3. Create controllers
4. Add routes
5. Build leave types settings page
6. Build employee leave application page
7. Build HR approval page
8. Build leave balance management
9. Add notifications
10. Add calendar view
11. Add reports

---

## Notes

- Leave integration with payroll: when leave is approved with "no pay", HR can add deduction manually or auto-generate
- Future: auto-deduct from payroll for unpaid leaves
- Leave credits can be manually set per employee or bulk assign at start of year