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
        Schema::create('adjustments', function (Blueprint $table) {
            $table->id();

            // Employee reference
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');

            // Adjustment details
            $table->string('adjustment_type'); // Salary Refund, Underpayment, Overtime, Late, Deduction Refund, Correction
            $table->decimal('amount', 12, 2); // Can be positive (addition) or negative (deduction)
            $table->string('currency')->default('PHP');

            // Period information
            $table->integer('pay_period_month'); // 1-12
            $table->integer('pay_period_year'); // e.g., 2026
            $table->date('effectivity_date'); // When the adjustment takes effect

            // Reference tracking
            $table->string('reference_id')->nullable(); // Link to DTR record, biometric log, etc.
            $table->string('reference_type')->nullable(); // 'dtr', 'biometric', 'payroll', 'deduction'

            // Status tracking
            $table->string('status')->default('pending'); // pending, approved, rejected, processed
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable();

            // Description and remarks
            $table->text('reason'); // Why is this adjustment needed?
            $table->text('remarks')->nullable(); // Additional notes

            // Audit trail
            $table->foreignId('created_by')->constrained('users')->onDelete('restrict');
            $table->timestamp('processed_at')->nullable(); // When was it applied to payroll
            $table->string('processed_by')->nullable();

            $table->timestamps();
            $table->softDeletes(); // For audit trail, never truly delete

            // Indexes for performance
            $table->index(['employee_id', 'pay_period_year', 'pay_period_month']);
            $table->index(['status', 'adjustment_type']);
            $table->index('effectivity_date');
            $table->index('reference_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('adjustments');
    }
};
