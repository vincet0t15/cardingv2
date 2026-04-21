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
        // Add source_of_fund_code_id to salaries table
        Schema::table('salaries', function (Blueprint $table) {
            $table->foreignId('source_of_fund_code_id')
                ->nullable()
                ->after('amount')
                ->constrained('source_of_fund_codes')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove foreign key and column from salaries table
        Schema::table('salaries', function (Blueprint $table) {
            $table->dropForeign(['source_of_fund_code_id']);
            $table->dropColumn('source_of_fund_code_id');
        });
    }
};
