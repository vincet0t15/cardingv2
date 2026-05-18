<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('adjustment_types', function (Blueprint $table) {
            if (Schema::hasColumn('adjustment_types', 'taxable')) {
                $table->dropColumn('taxable');
            }
            if (Schema::hasColumn('adjustment_types', 'include_in_payroll')) {
                $table->dropColumn('include_in_payroll');
            }
        });
    }

    public function down(): void
    {
        Schema::table('adjustment_types', function (Blueprint $table) {
            if (! Schema::hasColumn('adjustment_types', 'taxable')) {
                $table->boolean('taxable')->default(false)->after('effect');
            }
            if (! Schema::hasColumn('adjustment_types', 'include_in_payroll')) {
                $table->boolean('include_in_payroll')->default(false)->after('taxable');
            }
        });
    }
};
