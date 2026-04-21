<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('source_of_fund_codes', function (Blueprint $table) {
            $table->foreignId('parent_id')->nullable()->after('id')->constrained('source_of_fund_codes')->nullOnDelete();
            $table->boolean('is_category')->default(false)->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('source_of_fund_codes', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table->dropColumn(['parent_id', 'is_category']);
        });
    }
};
