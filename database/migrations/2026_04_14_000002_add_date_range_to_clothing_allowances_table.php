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
        Schema::table('clothing_allowances', function (Blueprint $table) {
            // Rename effective_date to start_date for consistency
            $table->renameColumn('effective_date', 'start_date');
            // Update end_date if it doesn't exist (check first)
            if (!Schema::hasColumn('clothing_allowances', 'end_date')) {
                $table->date('end_date')->nullable()->after('start_date');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('clothing_allowances', function (Blueprint $table) {
            $table->renameColumn('start_date', 'effective_date');
            $table->dropColumn('end_date');
        });
    }
};
