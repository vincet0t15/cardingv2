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
        Schema::table('deduction_types', function (Blueprint $table) {
            $table->string('contribution_code')->nullable()->after('code');
            $table->enum('calculation_method', ['percentage', 'bracket', 'fixed'])->default('percentage')->after('contribution_code');
            $table->decimal('rate', 8, 4)->nullable()->after('calculation_method');
            $table->decimal('cap_amount', 12, 2)->nullable()->after('rate');
            $table->decimal('min_amount', 12, 2)->nullable()->after('cap_amount');
            $table->boolean('is_auto_calculated')->default(false)->after('min_amount');
            $table->enum('employment_type', ['plantilla', 'cos', 'jo', 'all'])->default('all')->after('is_auto_calculated');
            $table->boolean('is_mandatory')->default(false)->after('employment_type');
            $table->string('remittance_frequency')->nullable()->after('is_mandatory');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('deduction_types', function (Blueprint $table) {
            $table->dropColumn([
                'contribution_code',
                'calculation_method',
                'rate',
                'cap_amount',
                'min_amount',
                'is_auto_calculated',
                'employment_type',
                'is_mandatory',
                'remittance_frequency',
            ]);
        });
    }
};