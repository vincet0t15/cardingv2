<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\BackupController;
use App\Http\Controllers\ClaimController;
use App\Http\Controllers\ClaimTypeController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DeductionTypeController;
use App\Http\Controllers\DocumentTypeController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\EmployeeDeductionController;
use App\Http\Controllers\EmployeeImportController;
use App\Http\Controllers\EmployeeSourceOfFundController;
use App\Http\Controllers\EmploymentStatusController;
use App\Http\Controllers\EmploymentTypeReportController;
use App\Http\Controllers\GeneralFundController;
use App\Http\Controllers\ManageEmployeeController;
use App\Http\Controllers\OfficeController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\PeraController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\RataController;
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

Route::middleware(['auth', 'active'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

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
    Route::middleware(['permission:employees.delete'])->delete('employees/{employee}', [EmployeeController::class, 'destroy'])->name('employees.destroy');
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
        Route::get('history/{employee}', [SalaryController::class, 'history'])->name('salaries.history');
    });
    Route::middleware(['permission:salaries.create'])->post('salaries', [SalaryController::class, 'store'])->name('salaries.store');
    Route::middleware(['permission:salaries.edit'])->put('salaries/{salary}', [SalaryController::class, 'update'])->name('salaries.update');
    Route::middleware(['permission:salaries.delete'])->delete('salaries/{salary}', [SalaryController::class, 'destroy'])->name('salaries.destroy');

    // PERA - Full CRUD (requires peras.* permissions)
    Route::middleware(['permission:peras.view'])->prefix('peras')->group(function () {
        Route::get('/', [PeraController::class, 'index'])->name('peras.index');
        Route::get('history/{employee}', [PeraController::class, 'history'])->name('peras.history');
    });
    Route::middleware(['permission:peras.create'])->post('peras', [PeraController::class, 'store'])->name('peras.store');
    Route::middleware(['permission:peras.edit'])->put('peras/{pera}', [PeraController::class, 'update'])->name('peras.update');
    Route::middleware(['permission:peras.delete'])->delete('peras/{pera}', [PeraController::class, 'destroy'])->name('peras.destroy');

    // RATA - Full CRUD (requires ratas.* permissions)
    Route::middleware(['permission:ratas.view'])->prefix('ratas')->group(function () {
        Route::get('/', [RataController::class, 'index'])->name('ratas.index');
        Route::get('history/{employee}', [RataController::class, 'history'])->name('ratas.history');
    });
    Route::middleware(['permission:ratas.create'])->post('ratas', [RataController::class, 'store'])->name('ratas.store');
    Route::middleware(['permission:ratas.edit'])->put('ratas/{rata}', [RataController::class, 'update'])->name('ratas.update');
    Route::middleware(['permission:ratas.delete'])->delete('ratas/{rata}', [RataController::class, 'destroy'])->name('ratas.destroy');

    // EMPLOYEE DEDUCTIONS - Full CRUD (requires deductions.manage permission)
    Route::middleware(['permission:deductions.manage'])->prefix('employee-deductions')->group(function () {
        Route::get('/', [EmployeeDeductionController::class, 'index'])->name('employee-deductions.index');
        Route::get('/print', [EmployeeDeductionController::class, 'print'])->name('employee-deductions.print');
        Route::get('/add', [EmployeeDeductionController::class, 'create'])->name('employee-deductions.create');
        Route::get('/bulk-add', [EmployeeDeductionController::class, 'bulkAddPage'])->name('employee-deductions.bulk-add-page');
        Route::post('/', [EmployeeDeductionController::class, 'store'])->name('employee-deductions.store');
        Route::post('bulk-store', [EmployeeDeductionController::class, 'bulkStore'])->name('employee-deductions.bulk-store');
        Route::post('bulk-update', [EmployeeDeductionController::class, 'bulkUpdate'])->name('employee-deductions.bulk-update');
        Route::post('bulk-destroy', [EmployeeDeductionController::class, 'bulkDestroy'])->name('employee-deductions.bulk-destroy');
        Route::put('{employeeDeduction}', [EmployeeDeductionController::class, 'update'])->name('employee-deductions.update');
        Route::delete('{employeeDeduction}', [EmployeeDeductionController::class, 'destroy'])->name('employee-deductions.destroy');
    });

    // MANAGE EMPLOYEE (requires employees.manage permission for view)
    Route::middleware(['permission:employees.manage'])->prefix('manage')->group(function () {
        Route::get('employees/{employee}', [ManageEmployeeController::class, 'index'])->name('manage.employees.index');
    });

    // EMPLOYEE DEDUCTIONS in Manage
    Route::middleware(['permission:deductions.create'])->post('manage/employees/{employee}/deductions', [ManageEmployeeController::class, 'storeDeduction'])->name('manage.employees.deductions.store');
    Route::middleware(['permission:deductions.delete'])->delete('manage/employees/{employee}/deductions/{deduction}', [ManageEmployeeController::class, 'destroyDeduction'])->name('manage.employees.deductions.destroy');

    // CLAIMS - View
    Route::middleware(['permission:claims.view'])->get('manage/employees/{employee}/claims', [ClaimController::class, 'index'])->name('manage.employees.claims.index');
    // CLAIMS - Create
    Route::middleware(['permission:claims.create'])->post('manage/employees/{employee}/claims', [ClaimController::class, 'store'])->name('manage.employees.claims.store');
    // CLAIMS - Edit
    Route::middleware(['permission:claims.edit'])->put('manage/employees/{employee}/claims/{claim}', [ClaimController::class, 'update'])->name('manage.employees.claims.update');
    // CLAIMS - Delete
    Route::middleware(['permission:claims.delete'])->delete('manage/employees/{employee}/claims/{claim}', [ClaimController::class, 'destroy'])->name('manage.employees.claims.destroy');

    // SETTINGS - All Configuration (requires settings.manage permission)
    Route::middleware(['permission:settings.manage'])->prefix('settings')->group(function () {
        // EMPLOYMENT STATUS
        Route::get('employment-statuses', [EmploymentStatusController::class, 'index'])->name('employment-statuses.index');
        Route::post('employment-statuses', [EmploymentStatusController::class, 'store'])->name('employment-statuses.store');
        Route::put('employment-statuses/{employmentStatus}', [EmploymentStatusController::class, 'update'])->name('employment-statuses.update');
        Route::delete('employment-statuses/{employmentStatus}', [EmploymentStatusController::class, 'destroy'])->name('employment-statuses.destroy');

        // OFFICES
        Route::get('offices', [OfficeController::class, 'index'])->name('offices.index');
        Route::post('offices', [OfficeController::class, 'store'])->name('offices.store');
        Route::put('offices/{office}', [OfficeController::class, 'update'])->name('offices.update');
        Route::delete('offices/{office}', [OfficeController::class, 'destroy'])->name('offices.destroy');

        // DEDUCTION TYPES
        Route::get('deduction-types', [DeductionTypeController::class, 'index'])->name('deduction-types.index');
        Route::post('deduction-types', [DeductionTypeController::class, 'store'])->name('deduction-types.store');
        Route::put('deduction-types/{deductionType}', [DeductionTypeController::class, 'update'])->name('deduction-types.update');
        Route::delete('deduction-types/{deductionType}', [DeductionTypeController::class, 'destroy'])->name('deduction-types.destroy');

        // DOCUMENT TYPES
        Route::get('document-types', [DocumentTypeController::class, 'index'])->name('document-types.index');
        Route::post('document-types', [DocumentTypeController::class, 'store'])->name('document-types.store');
        Route::put('document-types/{documentType}', [DocumentTypeController::class, 'update'])->name('document-types.update');
        Route::delete('document-types/{documentType}', [DocumentTypeController::class, 'destroy'])->name('document-types.destroy');

        // CLAIM TYPES
        Route::get('claim-types', [ClaimTypeController::class, 'index'])->name('claim-types.index');
        Route::post('claim-types', [ClaimTypeController::class, 'store'])->name('claim-types.store');
        Route::put('claim-types/{claimType}', [ClaimTypeController::class, 'update'])->name('claim-types.update');
        Route::delete('claim-types/{claimType}', [ClaimTypeController::class, 'destroy'])->name('claim-types.destroy');
    });

    // ACCOUNTS - User Management (requires accounts.manage permission)
    Route::middleware(['permission:accounts.manage'])->get('accounts', [AccountController::class, 'index'])->name('accounts.index');
    Route::middleware(['permission:accounts.manage'])->put('accounts/{user}', [AccountController::class, 'update'])->name('accounts.update');

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
        Route::get('/', [AuditLogController::class, 'index'])->name('audit-logs.index');
        Route::get('/{auditLog}', [AuditLogController::class, 'show'])->name('audit-logs.show');
        Route::get('/export/csv', [AuditLogController::class, 'export'])->name('audit-logs.export');
    });
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
