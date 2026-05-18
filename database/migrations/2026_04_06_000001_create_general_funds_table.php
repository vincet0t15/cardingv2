<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('general_funds', function (Blueprint $table) {
            $table->id();
            $table->string('code');
            $table->string('description')->nullable();
            $table->boolean('status')->default(true);
            $table->timestamps();
        });

        Schema::table('source_of_fund_codes', function (Blueprint $table) {
            $table->foreignId('general_fund_id')->nullable()->after('parent_id')->constrained('general_funds')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('source_of_fund_codes', function (Blueprint $table) {
            $table->dropForeign(['general_fund_id']);
            $table->dropColumn('general_fund_id');
        });

        Schema::dropIfExists('general_funds');
    }
};
