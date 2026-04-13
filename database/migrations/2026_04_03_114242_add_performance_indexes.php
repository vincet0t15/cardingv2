<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employee_deductions', function (Blueprint $table) {
            $table->index('pay_period_month');
            $table->index('pay_period_year');
            $table->index(['pay_period_month', 'pay_period_year']);
            $table->index('employee_id');
            $table->index('deduction_type_id');
        });

        Schema::table('claims', function (Blueprint $table) {
            $table->index('claim_date');
            $table->index('employee_id');
            $table->index('claim_type_id');
            $table->index(['employee_id', 'claim_date']);
        });

        Schema::table('salaries', function (Blueprint $table) {
            $table->index('effective_date');
            $table->index('employee_id');
            $table->index(['employee_id', 'effective_date']);
        });

        Schema::table('peras', function (Blueprint $table) {
            $table->index('effective_date');
            $table->index('employee_id');
            $table->index(['employee_id', 'effective_date']);
        });

        Schema::table('ratas', function (Blueprint $table) {
            $table->index('effective_date');
            $table->index('employee_id');
            $table->index(['employee_id', 'effective_date']);
        });

        Schema::table('employees', function (Blueprint $table) {
            $table->index('last_name');
            $table->index('first_name');
            $table->index('employment_status_id');
            $table->index('office_id');
        });

        Schema::table('supplier_transactions', function (Blueprint $table) {
            $table->index('supplier_id');
            $table->index('pr_date');
            $table->index('date_processed');
        });
    }

    public function down(): void
    {
        Schema::table('employee_deductions', function (Blueprint $table) {
            $table->dropIndex(['pay_period_month']);
            $table->dropIndex(['pay_period_year']);
            $table->dropIndex(['pay_period_month', 'pay_period_year']);
            $table->dropIndex(['employee_id']);
            $table->dropIndex(['deduction_type_id']);
        });

        Schema::table('claims', function (Blueprint $table) {
            $table->dropIndex(['claim_date']);
            $table->dropIndex(['employee_id']);
            $table->dropIndex(['claim_type_id']);
            $table->dropIndex(['employee_id', 'claim_date']);
        });

        Schema::table('salaries', function (Blueprint $table) {
            $table->dropIndex(['effective_date']);
            $table->dropIndex(['employee_id']);
            $table->dropIndex(['employee_id', 'effective_date']);
        });

        Schema::table('peras', function (Blueprint $table) {
            $table->dropIndex(['effective_date']);
            $table->dropIndex(['employee_id']);
            $table->dropIndex(['employee_id', 'effective_date']);
        });

        Schema::table('ratas', function (Blueprint $table) {
            $table->dropIndex(['effective_date']);
            $table->dropIndex(['employee_id']);
            $table->dropIndex(['employee_id', 'effective_date']);
        });

        Schema::table('employees', function (Blueprint $table) {
            $table->dropIndex(['last_name']);
            $table->dropIndex(['first_name']);
            $table->dropIndex(['employment_status_id']);
            $table->dropIndex(['office_id']);
        });

        Schema::table('supplier_transactions', function (Blueprint $table) {
            $table->dropIndex(['supplier_id']);
            $table->dropIndex(['pr_date']);
            $table->dropIndex(['date_processed']);
        });
    }
};
