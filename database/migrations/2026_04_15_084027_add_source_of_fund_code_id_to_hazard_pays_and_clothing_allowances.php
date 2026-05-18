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
            if (!Schema::hasColumn('hazard_pays', 'source_of_fund_code_id')) {
                $table->foreignId('source_of_fund_code_id')
                    ->nullable()
                    ->after('end_date')
                    ->constrained('source_of_fund_codes')
                    ->nullOnDelete();
            }
        });

        Schema::table('clothing_allowances', function (Blueprint $table) {
            if (!Schema::hasColumn('clothing_allowances', 'source_of_fund_code_id')) {
                $table->foreignId('source_of_fund_code_id')
                    ->nullable()
                    ->after('end_date')
                    ->constrained('source_of_fund_codes')
                    ->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('hazard_pays', function (Blueprint $table) {
            $table->dropForeign(['source_of_fund_code_id']);
            $table->dropColumn('source_of_fund_code_id');
        });

        Schema::table('clothing_allowances', function (Blueprint $table) {
            $table->dropForeign(['source_of_fund_code_id']);
            $table->dropColumn('source_of_fund_code_id');
        });
    }
};
