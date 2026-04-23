<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Create categories table
        Schema::create('deduction_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();
        });

        // Add nullable category_id to deduction_types
        Schema::table('deduction_types', function (Blueprint $table) {
            $table->foreignId('category_id')->nullable()->constrained('deduction_categories')->nullOnDelete()->after('code');
        });


        if (Schema::hasColumn('deduction_types', 'category')) {
            $distinct = DB::table('deduction_types')->select('category')->whereNotNull('category')->distinct()->pluck('category')->filter()->values();
            foreach ($distinct as $name) {
                DB::table('deduction_categories')->insertOrIgnore([
                    'name' => $name,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Update deduction_types.category_id matching inserted categories
            $categories = DB::table('deduction_categories')->pluck('id', 'name');
            $types = DB::table('deduction_types')->select('id', 'category')->get();
            foreach ($types as $t) {
                if ($t->category && isset($categories[$t->category])) {
                    DB::table('deduction_types')->where('id', $t->id)->update(['category_id' => $categories[$t->category]]);
                }
            }

            // Optionally drop the old string column after migration
            Schema::table('deduction_types', function (Blueprint $table) {
                $table->dropColumn('category');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recreate category string column (nullable) if missing, then populate from category_id
        if (!Schema::hasColumn('deduction_types', 'category')) {
            Schema::table('deduction_types', function (Blueprint $table) {
                $table->string('category')->nullable()->after('code');
            });
        }

        if (Schema::hasColumn('deduction_types', 'category_id')) {
            $categories = DB::table('deduction_categories')->pluck('name', 'id');
            $types = DB::table('deduction_types')->select('id', 'category_id')->get();
            foreach ($types as $t) {
                if ($t->category_id && isset($categories[$t->category_id])) {
                    DB::table('deduction_types')->where('id', $t->id)->update(['category' => $categories[$t->category_id]]);
                }
            }

            Schema::table('deduction_types', function (Blueprint $table) {
                $table->dropConstrainedForeignId('category_id');
            });
        }

        Schema::dropIfExists('deduction_categories');
    }
};
