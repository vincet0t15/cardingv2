# 📊 ADJUSTMENT SYSTEM - COMPLETE IMPLEMENTATION GUIDE

## ✅ WHAT'S BEEN CREATED:

### 1. **Database Migration** (`2026_04_14_000000_create_adjustments_table.php`)

Complete table structure with:

- ✅ Employee reference (foreign key)
- ✅ Adjustment types (8 types)
- ✅ Amount (positive/negative support)
- ✅ Pay period tracking (month/year)
- ✅ Effectivity date
- ✅ Reference ID (link to DTR/biometric records)
- ✅ Status workflow (pending → approved → processed)
- ✅ Approval tracking (who approved, when)
- ✅ Audit trail (soft deletes, created_by, processed_at)
- ✅ Performance indexes

### 2. **Adjustment Model** (`app/Models/Adjustment.php`)

Full-featured model with:

- ✅ 8 Adjustment Types pre-defined
- ✅ Status management (pending/approved/rejected/processed)
- ✅ Scopes for filtering (pending, approved, by period, by employee, by type)
- ✅ Helper methods (isPositive, isNegative, getDisplayAmount)
- ✅ Relationships (employee, approvedBy, createdBy)
- ✅ Auto-tracking of created_by user
- ✅ Soft deletes for audit trail

### 3. **Employee Model Updated**

- ✅ Added `adjustments()` relationship

---

## 🎯 ADJUSTMENT TYPES (Perfect for LGU):

| Type                    | Description                | Use Case                         |
| ----------------------- | -------------------------- | -------------------------------- |
| **Salary Refund**       | Return overpaid deductions | GSIS over-deduction refund       |
| **Underpayment**        | Add missing compensation   | Forgot to add PERA               |
| **Overtime Adjustment** | Correct OT pay             | ZKTeco device error              |
| **Late Adjustment**     | Correct late deductions    | Biometric sync issue             |
| **Deduction Refund**    | Return wrongful deductions | Loan paid off but still deducted |
| **Correction**          | General corrections        | Data entry errors                |
| **Absence Adjustment**  | Correct attendance         | Approved leave not reflected     |
| **Holiday Pay**         | Holiday pay adjustments    | Special holiday pay              |

---

## 📋 HOW IT INTEGRATES WITH PAYROLL:

### **PayrollService.php Update Needed:**

```php
public function calculatePayroll($employee, int $year, int $month): array
{

    // GET APPROVED ADJUSTMENTS FOR THIS PERIOD
    $adjustments = $employee->adjustments()
        ->forPeriod($month, $year)
        ->where('status', Adjustment::STATUS_PROCESSED)
        ->sum('amount');

    $grossPay = $salary + $pera + $rata + $hazardPay + $clothingAllowance;
    $netPay = $grossPay - $totalDeductions + $adjustments; // ← ADJUSTMENTS ADDED HERE

    return [
        // ... existing fields ...
        'adjustments' => $adjustments, // ← NEW
        'net_pay' => $netPay,
    ];
}
```

---

## 💡 HOW IT WORKS WITH DEDUCTIONS:

### **Scenario 1: Deduction Refund**

```
Employee: Juan Dela Cruz
Deduction: GSIS Premium (₱500)
Issue: Over-deducted, should be ₱450
Action: Create Adjustment
  - Type: Deduction Refund
  - Amount: +₱50 (positive = refund to employee)
  - Reason: "GSIS over-deduction for March 2026"
  - Reference: "DED-2026-03-001"
  - Status: Pending → Approved → Processed

Result: Net pay increases by ₱50
```

### **Scenario 2: Missing Compensation**

```
Employee: Maria Santos
Issue: Forgot to add PERA (₱1,000) for February
Action: Create Adjustment
  - Type: Underpayment
  - Amount: +₱1,000
  - Reason: "PERA not included in Feb payroll"
  - Effectivity: 2026-02-28

Result: Net pay increases by ₱1,000
```

### **Scenario 3: Late Deduction Correction**

```
Employee: Pedro Reyes
Issue: Marked late but biometric shows on-time
Action: Create Adjustment
  - Type: Late Adjustment
  - Amount: +₱200 (refunded late penalty)
  - Reference: "DTR-2026-03-15-001"
  - Reason: "ZKTeco device error - employee was on time"

Result: Net pay increases by ₱200
```

---

## 📊 REPORTING INTEGRATION:

### **1. Employee Deductions Report (With Adjustments)**

```
EMPLOYEE DEDUCTION SUMMARY - March 2026
========================================
Employee: Juan Dela Cruz
Position: Administrative Aide II
Office: Municipal Hall

DEDUCTIONS:
  GSIS Premium:        ₱500.00
  PhilHealth:          ₱200.00
  PAG-IBIG:            ₱100.00
  Withholding Tax:     ₱300.00
  ─────────────────────────────
  Total Deductions:    ₱1,100.00

ADJUSTMENTS:
  Deduction Refund:    +₱50.00  (GSIS over-deduction)
  Late Adjustment:     +₱200.00 (Biometric error)
  ─────────────────────────────
  Total Adjustments:   +₱250.00

NET DEDUCTIONS:        ₱850.00  (1,100 - 250)
```

### **2. Payroll Summary Report (With Adjustments)**

```
PAYROLL SUMMARY - March 2026
=============================
Employee          | Gross Pay | Deductions | Adjustments | Net Pay
──────────────────┼───────────┼────────────┼─────────────┼─────────
Juan Dela Cruz    | 25,000.00 | 1,100.00   | +250.00     | 24,150.00
Maria Santos      | 30,000.00 | 1,500.00   | +1,000.00   | 29,500.00
Pedro Reyes       | 28,000.00 | 1,200.00   | +200.00     | 27,000.00
──────────────────┼───────────┼────────────┼─────────────┼─────────
TOTALS:           | 83,000.00 | 3,800.00   | +1,450.00   | 80,650.00
```

### **3. Adjustment Audit Report**

```
ADJUSTMENT AUDIT TRAIL - March 2026
====================================
Date       | Employee        | Type            | Amount  | Status   | Approved By
───────────┼─────────────────┼─────────────────┼─────────┼──────────┼────────────
2026-03-05 | Juan Dela Cruz  | Deduction Refund| +50.00  | Approved | Admin User
2026-03-10 | Maria Santos    | Underpayment    | +1,000  | Approved | HR Manager
2026-03-15 | Pedro Reyes     | Late Adjustment | +200.00 | Pending  | -
───────────┼─────────────────┼─────────────────┼─────────┼──────────┼────────────
TOTAL ADJUSTMENTS: +₱1,250.00
```

---

## 🚀 NEXT STEPS TO IMPLEMENT:

### **Phase 1: Backend (1-2 days)**

1. ✅ Migration created
2. ✅ Model created
3. ⏳ Update PayrollService to include adjustments
4. ⏳ Create AdjustmentController (CRUD operations)
5. ⏳ Create AdjustmentPolicy (authorization)
6. ⏳ Add routes in web.php

### **Phase 2: Frontend (2-3 days)**

1. ⏳ Create Adjustments/Index.tsx (list view with filters)
2. ⏳ Create Adjustments/Create.tsx (form to create adjustments)
3. ⏳ Create Adjustments/Show.tsx (detail view with audit trail)
4. ⏳ Add "Adjustments" tab in Employee Management
5. ⏳ Add adjustment summary in Payroll page
6. ⏳ Add approval workflow (approve/reject buttons)

### **Phase 3: Reports (1-2 days)**

1. ⏳ Create Adjustment Report page
2. ⏳ Update Employee Deduction report to include adjustments
3. ⏳ Update Payroll Summary report to include adjustments
4. ⏳ Add adjustment export (Excel/PDF)
5. ⏳ Create Adjustment Audit Trail report

### **Phase 4: Integration (1 day)**

1. ⏳ Add adjustment link in sidebar
2. ⏳ Update dashboard with pending adjustments count
3. ⏳ Add notifications for pending approvals
4. ⏳ Create bulk adjustment upload (Excel import)

---

## 🎨 UI/UX DESIGN SUGGESTIONS:

### **1. Adjustment Form Fields:**

```
┌─────────────────────────────────────┐
│ CREATE ADJUSTMENT                   │
├─────────────────────────────────────┤
│ Employee:         [Search/Select]   │
│ Adjustment Type:  [Dropdown ▼]      │
│ Amount:           [₱ _____]         │
│ Pay Period:       [Month] [Year]    │
│ Effectivity Date: [Date Picker]     │
│ Reference ID:     [Optional]        │
│ Reason:           [Required]        │
│ Remarks:          [Optional]        │
│                                     │
│ [Cancel]  [Submit for Approval]     │
└─────────────────────────────────────┘
```

### **2. Adjustment List View:**

```
┌──────────────────────────────────────────────────────┐
│ ADJUSTMENTS                        [+ Add] [Filter]  │
├──────┬────────────┬──────────┬────────┬────────┬─────┤
│ Date │ Employee   │ Type     │ Amount │ Status │ Act │
├──────┼────────────┼──────────┼────────┼────────┼─────┤
│ 03-05│ Juan Cruz  │ Refund   | +50.00 │ ✓ App  │ 👁  │
│ 03-10│ Maria San  │ Underpay | +1,000 │ ✓ App  │ 👁  │
│ 03-15│ Pedro Rey  │ Late     | +200   │ ⏳ Pen │ ✏️✓ │
└──────┴────────────┴──────────┴────────┴────────┴─────┘
```

### **3. Color Coding:**

- 🟢 **Green** - Positive adjustments (refunds, additions)
- 🔴 **Red** - Negative adjustments (additional deductions)
- 🟡 **Yellow** - Pending approval
- 🔵 **Blue** - Approved
- ⚫ **Gray** - Rejected

---

## 📈 BENEFITS FOR LGU:

1. ✅ **Full Audit Trail** - Every adjustment is tracked with who, when, why
2. ✅ **Biometric Integration Ready** - Reference ID links to DTR/ZKTeco records
3. ✅ **Deduction Tracking** - See adjustments alongside deductions in reports
4. ✅ **Approval Workflow** - Prevents unauthorized adjustments
5. ✅ **Flexible** - Covers all types of payroll corrections
6. ✅ **Report-Ready** - Easy to generate adjustment reports for COA audit
7. ✅ **Soft Deletes** - Nothing is truly deleted, perfect for compliance
8. ✅ **Period Tracking** - Adjustments tied to specific payroll periods

---

**Ready to proceed with Phase 1 backend implementation?** 🚀
