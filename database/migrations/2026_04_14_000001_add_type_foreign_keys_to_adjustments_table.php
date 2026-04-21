<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('adjustments', function (Blueprint $table) {
            // Add foreign key columns
            $table->foreignId('adjustment_type_id')->nullable()->after('employee_id')->constrained('adjustment_types')->cascadeOnDelete();
            $table->foreignId('reference_type_id')->nullable()->after('adjustment_type_id')->constrained('reference_types')->cascadeOnDelete();

            // Keep old columns for backward compatibility (will be removed later)
            // $table->string('adjustment_type')->nullable()->change();
            // $table->string('reference_type')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('adjustments', function (Blueprint $table) {
            $table->dropForeign(['adjustment_type_id']);
            $table->dropForeign(['reference_type_id']);
            $table->dropColumn(['adjustment_type_id', 'reference_type_id']);
        });
    }
};
