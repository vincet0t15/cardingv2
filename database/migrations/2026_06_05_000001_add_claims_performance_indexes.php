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
        // Claims: date-range filtering
        $this->addIndexIfMissing('claims', 'claim_date');
        // Claims: employee + date composite
        $this->addIndexIfMissing('claims', ['employee_id', 'claim_date']);

        // Salaries: effective_date for date-range lookups
        $this->addIndexIfMissing('salaries', 'effective_date');

        // Employees: user_id for portal access queries
        $this->addIndexIfMissing('employees', 'user_id');

        // Clothing allowances: start_date for date-range queries
        $this->addIndexIfMissing('clothing_allowances', 'start_date');

        // Hazard pays: start_date for date-range queries
        $this->addIndexIfMissing('hazard_pays', 'start_date');
    }

    public function down(): void
    {
        $tables = [
            'claims'       => ['claim_date', ['employee_id', 'claim_date']],
            'salaries'     => ['effective_date'],
            'employees'    => ['user_id'],
            'clothing_allowances' => ['start_date'],
            'hazard_pays'  => ['start_date'],
        ];

        foreach ($tables as $table => $indexes) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            foreach ($indexes as $columns) {
                $cols = is_array($columns) ? $columns : [$columns];
                $name = count($cols) === 1
                    ? $table . '_' . $cols[0] . '_index'
                    : $table . '_' . implode('_', $cols) . '_index';

                if (Schema::hasIndex($table, $name)) {
                    Schema::table($table, function (Blueprint $t) use ($name) {
                        $t->dropIndex($name);
                    });
                }
            }
        }
    }
};
