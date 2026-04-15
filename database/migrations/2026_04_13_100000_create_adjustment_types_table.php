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
        Schema::create('adjustment_types', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->text('description')->nullable();
            $table->enum('effect', ['positive', 'negative'])->default('positive');
            // Flags for additional business metadata
            $table->boolean('taxable')->default(false);
            $table->boolean('include_in_payroll')->default(false);
            $table->boolean('requires_approval')->default(true);
            $table->string('restricted_roles')->nullable(); // comma-separated list of roles allowed to create/approve
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('adjustment_types');
    }
};
