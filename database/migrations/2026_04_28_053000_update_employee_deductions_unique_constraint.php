<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Allow multiple deductions for the same employee/type/period if they have different salaries
     * (e.g., deduction for old salary and deduction for new salary in the same month)
     */
    public function up(): void
    {
        Schema::table('employee_deductions', function (Blueprint $table) {
            // Drop the old unique constraint that didn't include salary_id
            $table->dropUnique('employee_deduction_unique');

            // Add new constraint that includes salary_id
            // This allows: same employee, type, month/year BUT different salaries
            $table->unique(
                ['employee_id', 'salary_id', 'deduction_type_id', 'pay_period_month', 'pay_period_year'],
                'employee_deduction_salary_unique'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employee_deductions', function (Blueprint $table) {
            // Drop the new constraint
            $table->dropUnique('employee_deduction_salary_unique');

            // Restore the old constraint
            $table->unique(
                ['employee_id', 'deduction_type_id', 'pay_period_month', 'pay_period_year'],
                'employee_deduction_unique'
            );
        });
    }
};
