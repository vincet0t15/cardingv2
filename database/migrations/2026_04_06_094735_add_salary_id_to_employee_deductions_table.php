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
        Schema::table('employee_deductions', function (Blueprint $table) {
            $table->foreignId('salary_id')->nullable()->after('employee_id')->constrained('salaries')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employee_deductions', function (Blueprint $table) {
            $table->dropForeign(['salary_id']);
            $table->dropColumn('salary_id');
        });
    }
};
