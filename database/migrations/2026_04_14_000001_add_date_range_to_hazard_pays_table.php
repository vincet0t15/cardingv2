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
        Schema::table('hazard_pays', function (Blueprint $table) {
            // Rename effective_date to start_date for clarity
            $table->renameColumn('effective_date', 'start_date');
            // Add end_date for date range support
            $table->date('end_date')->nullable()->after('start_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('hazard_pays', function (Blueprint $table) {
            $table->renameColumn('start_date', 'effective_date');
            $table->dropColumn('end_date');
        });
    }
};
