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
        if (! Schema::hasTable('adjustment_types')) {
            // If the table doesn't exist at all, create it with the full shape.
            Schema::create('adjustment_types', function (Blueprint $table) {
                $table->id();
                $table->string('name')->unique();
                $table->text('description')->nullable();
                $table->enum('effect', ['positive', 'negative'])->default('positive');
                $table->boolean('taxable')->default(false);
                $table->boolean('include_in_payroll')->default(false);
                $table->boolean('requires_approval')->default(true);
                $table->string('restricted_roles')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->softDeletes();
                $table->timestamps();
            });
            return;
        }

        // Table exists — add missing columns safely
        Schema::table('adjustment_types', function (Blueprint $table) {
            if (! Schema::hasColumn('adjustment_types', 'taxable')) {
                $table->boolean('taxable')->default(false)->after('effect');
            }

            if (! Schema::hasColumn('adjustment_types', 'include_in_payroll')) {
                $table->boolean('include_in_payroll')->default(false)->after('taxable');
            }

            if (! Schema::hasColumn('adjustment_types', 'requires_approval')) {
                $table->boolean('requires_approval')->default(true)->after('include_in_payroll');
            }

            if (! Schema::hasColumn('adjustment_types', 'restricted_roles')) {
                $table->string('restricted_roles')->nullable()->after('requires_approval');
            }

            if (! Schema::hasColumn('adjustment_types', 'created_by')) {
                $table->foreignId('created_by')->nullable()->after('restricted_roles')->constrained('users')->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('adjustment_types')) {
            return;
        }

        Schema::table('adjustment_types', function (Blueprint $table) {
            if (Schema::hasColumn('adjustment_types', 'taxable')) {
                $table->dropColumn('taxable');
            }

            if (Schema::hasColumn('adjustment_types', 'include_in_payroll')) {
                $table->dropColumn('include_in_payroll');
            }

            if (Schema::hasColumn('adjustment_types', 'requires_approval')) {
                $table->dropColumn('requires_approval');
            }

            if (Schema::hasColumn('adjustment_types', 'restricted_roles')) {
                $table->dropColumn('restricted_roles');
            }

            if (Schema::hasColumn('adjustment_types', 'created_by')) {
                // drop foreign key first if exists
                try {
                    $table->dropForeign(['created_by']);
                } catch (\Exception $e) {
                    // ignore if constraint doesn't exist
                }
                $table->dropColumn('created_by');
            }
        });
    }
};
