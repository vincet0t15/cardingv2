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
        Schema::create('sss_contribution_tables', function (Blueprint $table) {
            $table->id();
            $table->decimal('salary_from', 12, 2);
            $table->decimal('salary_to', 12, 2);
            $table->decimal('monthly_salary_credit', 10, 2);
            $table->decimal('employee_share', 10, 2);
            $table->decimal('employer_share', 10, 2);
            $table->decimal('total_contribution', 10, 2);
            $table->integer('year');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['year', 'is_active']);
            $table->index(['salary_from', 'salary_to']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sss_contribution_tables');
    }
};