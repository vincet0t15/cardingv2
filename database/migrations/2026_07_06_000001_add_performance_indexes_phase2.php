<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add an index only if it doesn't already exist.
     */
    private function addIndexIfMissing(string $table, string|array $columns, ?string $indexName = null): void
    {
        if (! Schema::hasTable($table)) {
            return;
        }

        $name = $indexName ?? (is_array($columns)
            ? $table . '_' . implode('_', $columns) . '_index'
            : $table . '_' . $columns . '_index');

        if (! Schema::hasIndex($table, $name)) {
            Schema::table($table, function (Blueprint $t) use ($columns, $name) {
                $t->index($columns, $name);
            });
        }
    }

    public function up(): void
    {
        // adjustments: for batch period queries (comparison, print - no employee_id filter)
        $this->addIndexIfMissing('adjustments', ['pay_period_year', 'pay_period_month']);

        // hazard_pays: for date-range queries (start_date ≤ X AND end_date ≥ Y)
        $this->addIndexIfMissing('hazard_pays', ['start_date', 'end_date']);

        // clothing_allowances: for date-range queries (start_date ≤ X AND end_date ≥ Y)
        $this->addIndexIfMissing('clothing_allowances', ['start_date', 'end_date']);

        // employees: composite for filtered admin queries (office + employment status)
        $this->addIndexIfMissing('employees', ['office_id', 'employment_status_id']);

        // supplier_transactions: supplier + pr_date for year/month filtering
        $this->addIndexIfMissing('supplier_transactions', ['supplier_id', 'pr_date']);

        // claims: type + date composite for total claims by type queries
        $this->addIndexIfMissing('claims', ['claim_type_id', 'claim_date']);
    }

    public function down(): void
    {
        $indexes = [
            'adjustments'             => ['pay_period_year_pay_period_month_index'],
            'hazard_pays'             => ['start_date_end_date_index'],
            'clothing_allowances'     => ['start_date_end_date_index'],
            'employees'               => ['office_id_employment_status_id_index'],
            'supplier_transactions'   => ['supplier_id_pr_date_index'],
            'claims'                  => ['claim_type_id_claim_date_index'],
        ];

        foreach ($indexes as $table => $names) {
            if (! Schema::hasTable($table)) continue;
            foreach ($names as $name) {
                if (Schema::hasIndex($table, $name)) {
                    Schema::table($table, function (Blueprint $t) use ($name) {
                        $t->dropIndex($name);
                    });
                }
            }
        }
    }
};
