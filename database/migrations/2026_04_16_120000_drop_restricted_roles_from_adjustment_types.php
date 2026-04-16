<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('adjustment_types', 'restricted_roles')) {
            Schema::table('adjustment_types', function (Blueprint $table) {
                $table->dropColumn('restricted_roles');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('adjustment_types', 'restricted_roles')) {
            Schema::table('adjustment_types', function (Blueprint $table) {
                $table->string('restricted_roles')->nullable()->after('requires_approval');
            });
        }
    }
};
