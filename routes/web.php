<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\AdjustmentController;
use App\Http\Controllers\AdjustmentTypeController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\BackupController;
use App\Http\Controllers\ClaimController;
use App\Http\Controllers\ClaimTypeController;
use App\Http\Controllers\ClothingAllowanceController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DeductionCategoryController;
use App\Http\Controllers\DeductionTypeController;
use App\Http\Controllers\DeleteRequestController;
use App\Http\Controllers\DocumentTypeController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\EmployeeDashboardController;
use App\Http\Controllers\EmployeeDeductionController;
use App\Http\Controllers\EmployeeImportController;
use App\Http\Controllers\EmployeeSourceOfFundController;
use App\Http\Controllers\EmploymentStatusController;
use App\Http\Controllers\EmploymentTypeReportController;
use App\Http\Controllers\GeneralFundController;
use App\Http\Controllers\HazardPayController;
use App\Http\Controllers\ManageEmployeeController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OfficeController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\PeraController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\RataController;
use App\Http\Controllers\ReferenceTypeController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SalaryController;
use App\Http\Controllers\SourceOfFundCodeController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\SupplierTransactionController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'active', 'linked'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // EMPLOYEE DASHBOARD - For linked employees
    Route::get('employee/dashboard', [EmployeeDashboardController::class, 'index'])->name('employee.dashboard');

    // CLAIMS REPORT - View and print all claims by employee
    Route::prefix('claims-report')->group(function () {
        Route::get('/', [ClaimController::class, 'report'])->name('claims.report');
        Route::get('/print', [ClaimController::class, 'reportPrint'])->name('claims.report.print');

        // EMPLOYEE DETAIL - View individual employee claims with filters and print
        Route::get('/employee/{employee}', [ClaimController::class, 'employeeDetail'])->name('claims.employee.detail');
        Route::get('/employee/{employee}/print', [ClaimController::class, 'employeeDetailPrint'])->name('claims.employee.detail.print');
    });

    // REPORTS - View and print reports (requires employees.source_of_fund.view permission)
    Route::prefix('reports')->middleware(['permission:employees.source_of_fund.view'])->group(function () {
        Route::get('employees-by-source-of-fund', [ReportController::class, 'employeesBySourceOfFund'])->name('reports.employees-by-source-of-fund');
        Route::get('employees-by-source-of-fund/print', [ReportController::class, 'employeesBySourceOfFundPrint'])->name('reports.employees-by-source-of-fund.print');

        Route::get('employment-type', [EmploymentTypeReportController::class, 'index'])->name('reports.employment-type');
        Route::get('employment-type/print', [EmploymentTypeReportController::class, 'print'])->name('reports.employment-type.print');
    });

    // ============================================
    // ALL USERS (Authenticated & Active)
    // ============================================

    // PAYROLL - View Only
    Route::prefix('payroll')->group(function () {
        Route::get('/', [PayrollController::class, 'index'])->name('payroll.index');
        // Specific routes MUST come before dynamic {employee} route
        Route::get('print', [PayrollController::class, 'print'])->name('payroll.print');
        Route::get('comparison', [PayrollController::class, 'comparison'])->name('payroll.comparison');
        // Dynamic employee route must be last
        Route::get('{employee}', [PayrollController::class, 'show'])->name('payroll.show');
    });

    // EMPLOYEES - View Only
    Route::get('employees', [EmployeeController::class, 'index'])->name('employees.index');

    // EMPLOYEES - Create (requires employees.create permission) - MUST come before {employee} routes
    Route::middleware(['permission:employees.create'])->get('employees/create', [EmployeeController::class, 'create'])->name('employees.create');
    Route::middleware(['permission:employees.create'])->post('employees', [EmployeeController::class, 'store'])->name('employees.store');

    // EMPLOYEE IMPORT (requires employees.create permission)
    Route::middleware(['permission:employees.create'])->prefix('employees/import')->group(function () {
        Route::get('/', [EmployeeImportController::class, 'create'])->name('employees.import.create');
        Route::post('/', [EmployeeImportController::class, 'store'])->name('employees.import.store');
        Route::get('/sample', [EmployeeImportController::class, 'downloadSample'])->name('employees.import.sample');
    });

    // EMPLOYEE PRINT REPORT
    Route::get('employees/{employee}/print', [ManageEmployeeController::class, 'print'])->name('employees.print');

    // EMPLOYEES BY SOURCE OF FUND (View report - requires employees.source_of_fund.view permission)
    Route::middleware(['permission:employees.source_of_fund.view'])->get('employees/source-of-fund', [EmployeeSourceOfFundController::class, 'index'])->name('employees.source-of-fund.index');

    // EMPLOYEES - View/Edit/Delete (parameterized routes must be last)
    Route::get('employees/{employee}', [EmployeeController::class, 'show'])->name('employees.show');
    Route::middleware(['permission:employees.edit'])->put('employees/{employee}', [EmployeeController::class, 'update'])->name('employees.update');
    Route::delete('employees/{employee}', [EmployeeController::class, 'destroy'])->name('employees.destroy');
    Route::middleware(['permission:employees.edit'])->post('employees/{id}/restore', [EmployeeController::class, 'restore'])->name('employees.restore');

    // SUPPLIERS - Full CRUD (requires suppliers.manage permission)
    Route::middleware(['permission:suppliers.manage'])->prefix('suppliers')->group(function () {
        Route::get('/', [SupplierController::class, 'index'])->name('suppliers.index');
        Route::post('/', [SupplierController::class, 'store'])->name('suppliers.store');
        Route::put('{supplier}', [SupplierController::class, 'update'])->name('suppliers.update');
        Route::delete('{supplier}', [SupplierController::class, 'destroy'])->name('suppliers.destroy');

        // Supplier Transactions
        Route::get('{supplier}/transactions', [SupplierTransactionController::class, 'show'])->name('suppliers.transactions.show');
        Route::get('{supplier}/transactions/{transaction}/print', [SupplierTransactionController::class, 'print'])->name('suppliers.transactions.print');
        Route::post('{supplier}/transactions', [SupplierTransactionController::class, 'store'])->name('suppliers.transactions.store');
        Route::put('{supplier}/transactions/{transaction}', [SupplierTransactionController::class, 'update'])->name('suppliers.transactions.update');
        Route::delete('{supplier}/transactions/{transaction}', [SupplierTransactionController::class, 'destroy'])->name('suppliers.transactions.destroy');
    });

    // PAYROLL - Export (requires payroll.export permission)
    Route::middleware(['permission:payroll.export'])->prefix('payroll')->group(function () {
        Route::get('export', [PayrollController::class, 'export'])->name('payroll.export');
    });

    // SALARIES - Full CRUD (requires salaries.* permissions)
    Route::middleware(['permission:salaries.view'])->prefix('salaries')->group(function () {
        Route::get('/', [SalaryController::class, 'index'])->name('salaries.index');
        Route::get('print', [SalaryController::class, 'print'])->name('salaries.print');
        Route::get('history/{employee}', [SalaryController::class, 'history'])->name('salaries.history');
    });
    Route::middleware(['permission:salaries.create'])->post('salaries', [SalaryController::class, 'store'])->name('salaries.store');
    Route::middleware(['permission:salaries.edit'])->put('salaries/{salary}', [SalaryController::class, 'update'])->name('salaries.update');
    Route::middleware(['permission:salaries.delete'])->delete('salaries/{salary}', [SalaryController::class, 'destroy'])->name('salaries.destroy');

    // PERA - Full CRUD (requires peras.* permissions)
    Route::middleware(['permission:peras.view'])->prefix('peras')->group(function () {
        Route::get('/', [PeraController::class, 'index'])->name('peras.index');
        Route::get('print', [PeraController::class, 'print'])->name('peras.print');
        Route::get('history/{employee}', [PeraController::class, 'history'])->name('peras.history');
    });
    Route::middleware(['permission:peras.create'])->post('peras', [PeraController::class, 'store'])->name('peras.store');
    Route::middleware(['permission:peras.edit'])->put('peras/{pera}', [PeraController::class, 'update'])->name('peras.update');
    Route::middleware(['permission:peras.delete'])->delete('peras/{pera}', [PeraController::class, 'destroy'])->name('peras.destroy');

    // RATA - Full CRUD (requires ratas.* permissions)
    Route::middleware(['permission:ratas.view'])->prefix('ratas')->group(function () {
        Route::get('/', [RataController::class, 'index'])->name('ratas.index');
        Route::get('print', [RataController::class, 'print'])->name('ratas.print');
        Route::get('history/{employee}', [RataController::class, 'history'])->name('ratas.history');
    });
    Route::middleware(['permission:ratas.create'])->post('ratas', [RataController::class, 'store'])->name('ratas.store');
    Route::middleware(['permission:ratas.edit'])->put('ratas/{rata}', [RataController::class, 'update'])->name('ratas.update');
    Route::middleware(['permission:ratas.delete'])->delete('ratas/{rata}', [RataController::class, 'destroy'])->name('ratas.destroy');

    // HAZARD PAY - Full CRUD (requires hazard_pays.* permissions)
    Route::middleware(['permission:hazard_pays.view'])->prefix('hazard-pays')->group(function () {
        Route::get('/', [HazardPayController::class, 'index'])->name('hazard-pays.index');
        Route::get('print', [HazardPayController::class, 'print'])->name('hazard-pays.print');
        Route::get('history/{employee}', [HazardPayController::class, 'history'])->name('hazard-pays.history');
    });
    Route::middleware(['permission:hazard_pays.create'])->post('hazard-pays', [HazardPayController::class, 'store'])->name('hazard-pays.store');
    Route::middleware(['permission:hazard_pays.edit'])->put('hazard-pays/{hazardPay}', [HazardPayController::class, 'update'])->name('hazard-pays.update');
    Route::middleware(['permission:hazard_pays.delete'])->delete('hazard-pays/{hazardPay}', [HazardPayController::class, 'destroy'])->name('hazard-pays.destroy');

    // CLOTHING ALLOWANCE - Full CRUD (requires clothing_allowances.* permissions)
    Route::middleware(['permission:clothing_allowances.view'])->prefix('clothing-allowances')->group(function () {
        Route::get('/', [ClothingAllowanceController::class, 'index'])->name('clothing-allowances.index');
        Route::get('print', [ClothingAllowanceController::class, 'print'])->name('clothing-allowances.print');
        Route::get('history/{employee}', [ClothingAllowanceController::class, 'history'])->name('clothing-allowances.history');
    });
    Route::middleware(['permission:clothing_allowances.create'])->post('clothing-allowances', [ClothingAllowanceController::class, 'store'])->name('clothing-allowances.store');
    Route::middleware(['permission:clothing_allowances.edit'])->put('clothing-allowances/{clothingAllowance}', [ClothingAllowanceController::class, 'update'])->name('clothing-allowances.update');
    Route::middleware(['permission:clothing_allowances.delete'])->delete('clothing-allowances/{clothingAllowance}', [ClothingAllowanceController::class, 'destroy'])->name('clothing-allowances.destroy');

    // EMPLOYEE DEDUCTIONS - Full CRUD (requires deductions.manage permission)
    Route::middleware(['permission:deductions.manage'])->prefix('employee-deductions')->group(function () {
        Route::get('/', [EmployeeDeductionController::class, 'index'])->name('employee-deductions.index');
        Route::get('/print', [EmployeeDeductionController::class, 'print'])->name('employee-deductions.print');
        Route::get('/add', [EmployeeDeductionController::class, 'create'])->name('employee-deductions.create');
        Route::get('/edit', [EmployeeDeductionController::class, 'edit'])->name('employee-deductions.edit');
        Route::post('/', [EmployeeDeductionController::class, 'store'])->name('employee-deductions.store');
        Route::put('{employeeDeduction}', [EmployeeDeductionController::class, 'update'])->name('employee-deductions.update');
        Route::delete('{employeeDeduction}', [EmployeeDeductionController::class, 'destroy'])->name('employee-deductions.destroy');
    });

    // MANAGE EMPLOYEE (requires employees.manage permission for view)
    Route::middleware(['permission:employees.manage'])->prefix('manage')->group(function () {
        Route::get('employees/{employee}', [ManageEmployeeController::class, 'index'])->name('manage.employees.index');
    });

    // EMPLOYEE DEDUCTIONS in Manage
    Route::middleware(['permission:deductions.create'])->post('manage/employees/{employee}/deductions', [ManageEmployeeController::class, 'storeDeduction'])->name('manage.employees.deductions.store');
    Route::delete('manage/employees/{employee}/deductions/{deduction}', [ManageEmployeeController::class, 'destroyDeduction'])->name('manage.employees.deductions.destroy');
    // Delete all deductions for a specific pay period (month + year)
    Route::delete('manage/employees/{employee}/deductions', [ManageEmployeeController::class, 'destroyDeductionsForPeriod'])->name('manage.employees.deductions.destroyPeriod');

    // ADJUSTMENTS in Manage Employee
    Route::middleware(['permission:adjustments.create'])->post('manage/employees/{employee}/adjustments', [AdjustmentController::class, 'store'])->name('manage.employees.adjustments.store');
    Route::middleware(['permission:adjustments.edit'])->put('manage/employees/{employee}/adjustments/{adjustment}', [AdjustmentController::class, 'update'])->name('manage.employees.adjustments.update');
    Route::delete('manage/employees/{employee}/adjustments/{adjustment}', [AdjustmentController::class, 'destroy'])->name('manage.employees.adjustments.destroy');

    // CLAIMS - View
    Route::middleware(['permission:claims.view'])->get('manage/employees/{employee}/claims', [ClaimController::class, 'index'])->name('manage.employees.claims.index');
    // CLAIMS - Create
    Route::middleware(['permission:claims.create'])->post('manage/employees/{employee}/claims', [ClaimController::class, 'store'])->name('manage.employees.claims.store');
    // CLAIMS - Edit
    Route::middleware(['permission:claims.edit'])->put('manage/employees/{employee}/claims/{claim}', [ClaimController::class, 'update'])->name('manage.employees.claims.update');
    // CLAIMS - Delete
    Route::delete('manage/employees/{employee}/claims/{claim}', [ClaimController::class, 'destroy'])->name('manage.employees.claims.destroy');

    // SETTINGS - Configuration Modules
    // EMPLOYMENT STATUS (requires employment_statuses.* permissions)
    Route::middleware(['permission:employment_statuses.view'])->get('settings/employment-statuses', [EmploymentStatusController::class, 'index'])->name('employment-statuses.index');
    Route::middleware(['permission:employment_statuses.create'])->post('settings/employment-statuses', [EmploymentStatusController::class, 'store'])->name('employment-statuses.store');
    Route::middleware(['permission:employment_statuses.edit'])->put('settings/employment-statuses/{employmentStatus}', [EmploymentStatusController::class, 'update'])->name('employment-statuses.update');
    Route::middleware(['permission:employment_statuses.delete'])->delete('settings/employment-statuses/{employmentStatus}', [EmploymentStatusController::class, 'destroy'])->name('employment-statuses.destroy');

    // OFFICES (requires offices.* permissions)
    Route::middleware(['permission:offices.view'])->get('settings/offices', [OfficeController::class, 'index'])->name('offices.index');
    Route::middleware(['permission:offices.create'])->post('settings/offices', [OfficeController::class, 'store'])->name('offices.store');
    Route::middleware(['permission:offices.edit'])->put('settings/offices/{office}', [OfficeController::class, 'update'])->name('offices.update');
    Route::post('settings/offices/{id}/delete-request', [OfficeController::class, 'destroy'])->name('offices.destroy');

    // DEDUCTION TYPES (requires deduction_types.* permissions)
    Route::middleware(['permission:deduction_types.view'])->get('settings/deduction-types', [DeductionTypeController::class, 'index'])->name('deduction-types.index');
    Route::middleware(['permission:deduction_types.create'])->post('settings/deduction-types', [DeductionTypeController::class, 'store'])->name('deduction-types.store');
    Route::middleware(['permission:deduction_types.edit'])->put('settings/deduction-types/{deductionType}', [DeductionTypeController::class, 'update'])->name('deduction-types.update');
    Route::middleware(['permission:deduction_types.delete'])->delete('settings/deduction-types/{deductionType}', [DeductionTypeController::class, 'destroy'])->name('deduction-types.destroy');

    // DEDUCTION CATEGORIES (requires deduction_categories.* permissions)
    Route::middleware(['permission:deduction_categories.view'])->get('settings/deduction-categories', [DeductionCategoryController::class, 'index'])->name('deduction-categories.index');
    Route::middleware(['permission:deduction_categories.create'])->post('settings/deduction-categories', [DeductionCategoryController::class, 'store'])->name('deduction-categories.store');
    Route::middleware(['permission:deduction_categories.edit'])->put('settings/deduction-categories/{deductionCategory}', [DeductionCategoryController::class, 'update'])->name('deduction-categories.update');
    Route::middleware(['permission:deduction_categories.delete'])->delete('settings/deduction-categories/{deductionCategory}', [DeductionCategoryController::class, 'destroy'])->name('deduction-categories.destroy');

    // DOCUMENT TYPES (requires document_types.* permissions)
    Route::middleware(['permission:document_types.view'])->get('settings/document-types', [DocumentTypeController::class, 'index'])->name('document-types.index');
    Route::middleware(['permission:document_types.create'])->post('settings/document-types', [DocumentTypeController::class, 'store'])->name('document-types.store');
    Route::middleware(['permission:document_types.edit'])->put('settings/document-types/{documentType}', [DocumentTypeController::class, 'update'])->name('document-types.update');
    Route::middleware(['permission:document_types.delete'])->delete('settings/document-types/{documentType}', [DocumentTypeController::class, 'destroy'])->name('document-types.destroy');

    // CLAIM TYPES (requires claim_types.* permissions)
    Route::middleware(['permission:claim_types.view'])->get('settings/claim-types', [ClaimTypeController::class, 'index'])->name('claim-types.index');
    Route::middleware(['permission:claim_types.create'])->post('settings/claim-types', [ClaimTypeController::class, 'store'])->name('claim-types.store');
    Route::middleware(['permission:claim_types.edit'])->put('settings/claim-types/{claimType}', [ClaimTypeController::class, 'update'])->name('claim-types.update');
    Route::middleware(['permission:claim_types.delete'])->delete('settings/claim-types/{claimType}', [ClaimTypeController::class, 'destroy'])->name('claim-types.destroy');

    // ACCOUNTS - User Management (requires accounts.manage permission)
    Route::middleware(['permission:accounts.manage'])->get('accounts', [AccountController::class, 'index'])->name('accounts.index');
    Route::middleware(['permission:accounts.manage'])->put('accounts/{user}', [AccountController::class, 'update'])->name('accounts.update');
    Route::middleware(['permission:accounts.manage'])->post('accounts/{user}/link', [AccountController::class, 'linkEmployee'])->name('accounts.link');
    Route::middleware(['permission:accounts.manage'])->delete('accounts/{user}/unlink', [AccountController::class, 'unlinkEmployee'])->name('accounts.unlink');

    // ROLES & PERMISSIONS (requires roles.manage and permissions.manage)
    Route::middleware(['permission:roles.manage'])->prefix('roles')->group(function () {
        Route::get('/', [RoleController::class, 'index'])->name('roles.index');
        Route::post('/', [RoleController::class, 'store'])->name('roles.store');
        Route::put('{role}', [RoleController::class, 'update'])->name('roles.update');
        Route::delete('{role}', [RoleController::class, 'destroy'])->name('roles.destroy');
    });

    Route::middleware(['permission:permissions.manage'])->prefix('permissions')->group(function () {
        Route::get('/', [PermissionController::class, 'index'])->name('permissions.index');
        Route::post('/', [PermissionController::class, 'store'])->name('permissions.store');
        Route::put('{permission}', [PermissionController::class, 'update'])->name('permissions.update');
        Route::delete('{permission}', [PermissionController::class, 'destroy'])->name('permissions.destroy');
    });

    // GENERAL FUNDS
    Route::middleware(['permission:general_funds.view'])->get('general-funds', [GeneralFundController::class, 'index'])->name('general-funds.index');
    Route::middleware(['permission:general_funds.store'])->post('general-funds', [GeneralFundController::class, 'store'])->name('general-funds.store');
    Route::middleware(['permission:general_funds.edit'])->put('general-funds/{generalFund}', [GeneralFundController::class, 'update'])->name('general-funds.update');
    Route::middleware(['permission:general_funds.delete'])->delete('general-funds/{generalFund}', [GeneralFundController::class, 'destroy'])->name('general-funds.destroy');

    // SOURCE OF FUND CODES (using general_funds.view permission for viewing)
    Route::middleware(['permission:general_funds.view'])->get('source-of-fund-codes', [SourceOfFundCodeController::class, 'index'])->name('source-of-fund-codes.index');
    Route::middleware(['permission:general_funds.store'])->post('source-of-fund-codes', [SourceOfFundCodeController::class, 'store'])->name('source-of-fund-codes.store');
    Route::middleware(['permission:general_funds.edit'])->put('source-of-fund-codes/{sourceOfFundCode}', [SourceOfFundCodeController::class, 'update'])->name('source-of-fund-codes.update');
    Route::middleware(['permission:general_funds.delete'])->delete('source-of-fund-codes/{sourceOfFundCode}', [SourceOfFundCodeController::class, 'destroy'])->name('source-of-fund-codes.destroy');

    // DATABASE BACKUP & RESTORE (requires database.backup and database.restore permissions)
    Route::middleware(['permission:database.backup'])->prefix('settings/backup')->group(function () {
        Route::get('/', [BackupController::class, 'index'])->name('settings.backup.index');
        Route::post('/create', [BackupController::class, 'create'])->name('settings.backup.create');
        Route::get('/download/{fileName}', [BackupController::class, 'download'])->name('settings.backup.download');
        Route::delete('/{fileName}', [BackupController::class, 'destroy'])->name('settings.backup.destroy');
    });
    Route::middleware(['permission:database.restore'])->prefix('settings/backup')->group(function () {
        Route::post('/restore', [BackupController::class, 'restore'])->name('settings.backup.restore');
        Route::post('/upload-restore', [BackupController::class, 'uploadRestore'])->name('settings.backup.upload-restore');
    });

    // AUDIT LOGS (requires audit_logs.view permission)
    Route::middleware(['permission:audit_logs.view'])->prefix('audit-logs')->group(function () {
        Route::get('/performance', [AuditLogController::class, 'performance'])->name('audit-logs.performance');
        Route::get('/', [AuditLogController::class, 'index'])->name('audit-logs.index');
        Route::get('/{auditLog}', [AuditLogController::class, 'show'])->name('audit-logs.show');
        Route::get('/export/csv', [AuditLogController::class, 'export'])->name('audit-logs.export');
    });

    // ADJUSTMENTS - Manage payroll adjustments with approval workflow
    Route::middleware(['permission:adjustments.view'])->prefix('adjustments')->group(function () {
        // Note: public list page removed; keep create/store and action routes
        Route::get('/create', [AdjustmentController::class, 'create'])->name('adjustments.create');
        Route::middleware(['permission:adjustments.create'])->post('/', [AdjustmentController::class, 'store'])->name('adjustments.store');
        Route::middleware(['permission:adjustments.edit'])->get('/{adjustment}/edit', [AdjustmentController::class, 'edit'])->name('adjustments.edit');
        Route::middleware(['permission:adjustments.edit'])->put('/{adjustment}', [AdjustmentController::class, 'update'])->name('adjustments.update');
        Route::middleware(['permission:adjustments.approve'])->post('/{adjustment}/approve', [AdjustmentController::class, 'approve'])->name('adjustments.approve');
        Route::middleware(['permission:adjustments.reject'])->post('/{adjustment}/reject', [AdjustmentController::class, 'reject'])->name('adjustments.reject');
        Route::middleware(['permission:adjustments.process'])->post('/{adjustment}/process', [AdjustmentController::class, 'process'])->name('adjustments.process');
        Route::delete('/{adjustment}', [AdjustmentController::class, 'destroy'])->name('adjustments.destroy');
    });

    // ADJUSTMENT TYPES (Settings CRUD)
    Route::middleware(['permission:adjustment_types.view'])->get('settings/adjustment-types', [AdjustmentTypeController::class, 'index'])->name('adjustment-types.index');
    Route::middleware(['permission:adjustment_types.store'])->post('settings/adjustment-types', [AdjustmentTypeController::class, 'store'])->name('adjustment-types.store');
    Route::middleware(['permission:adjustment_types.edit'])->put('settings/adjustment-types/{adjustmentType}', [AdjustmentTypeController::class, 'update'])->name('adjustment-types.update');
    Route::middleware(['permission:adjustment_types.delete'])->delete('settings/adjustment-types/{adjustmentType}', [AdjustmentTypeController::class, 'destroy'])->name('adjustment-types.destroy');

    // REFERENCE TYPES (Settings CRUD)
    Route::middleware(['permission:reference_types.view'])->get('settings/reference-types', [ReferenceTypeController::class, 'index'])->name('reference-types.index');
    Route::middleware(['permission:reference_types.store'])->post('settings/reference-types', [ReferenceTypeController::class, 'store'])->name('reference-types.store');
    Route::middleware(['permission:reference_types.edit'])->put('settings/reference-types/{referenceType}', [ReferenceTypeController::class, 'update'])->name('reference-types.update');
    Route::middleware(['permission:reference_types.delete'])->delete('settings/reference-types/{referenceType}', [ReferenceTypeController::class, 'destroy'])->name('reference-types.destroy');

    // DELETE REQUESTS
    Route::middleware(['permission:delete_requests.view'])->get('delete-requests', [DeleteRequestController::class, 'index'])->name('delete-requests.index');
    Route::middleware(['permission:delete_requests.view'])->get('delete-requests/my-requests', [DeleteRequestController::class, 'myRequests'])->name('delete-requests.my');
    Route::middleware(['permission:delete_requests.view'])->get('delete-requests/{deleteRequest}', [DeleteRequestController::class, 'show'])->name('delete-requests.show');
    Route::middleware(['permission:delete_requests.approve'])->post('delete-requests/{deleteRequest}/approve', [DeleteRequestController::class, 'approve'])->name('delete-requests.approve');
    Route::middleware(['permission:delete_requests.approve'])->post('delete-requests/{deleteRequest}/reject', [DeleteRequestController::class, 'reject'])->name('delete-requests.reject');

    // NOTIFICATIONS
    Route::get('notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::get('notifications/recent', [NotificationController::class, 'recent'])->name('notifications.recent');
    Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount'])->name('notifications.unread-count');
    Route::post('notifications/{notification}/mark-as-read', [NotificationController::class, 'markAsRead'])->name('notifications.mark-as-read');
    Route::post('notifications/mark-all-read', [NotificationController::class, 'markAllAsRead'])->name('notifications.mark-all-read');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
