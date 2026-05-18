<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('employee_deductions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->foreignId('deduction_type_id')->constrained('deduction_types')->cascadeOnDelete();
            $table->decimal('amount', 15, 2);
            $table->unsignedTinyInteger('pay_period_month');
            $table->unsignedSmallInteger('pay_period_year');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            // Unique constraint to prevent duplicate deductions for same employee/type/month/year
            $table->unique(['employee_id', 'deduction_type_id', 'pay_period_month', 'pay_period_year'], 'employee_deduction_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_deductions');
    }
};
