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
        Schema::create('withholding_tax_tables', function (Blueprint $table) {
            $table->id();
            $table->decimal('salary_from', 12, 2);
            $table->decimal('salary_to', 12, 2)->nullable();
            $table->decimal('base_tax', 10, 2)->default(0);
            $table->decimal('percentage_over', 5, 4)->default(0);
            $table->decimal('excess_threshold', 12, 2)->default(0);
            $table->string('tax_bracket', 50);
            $table->integer('year');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['year', 'is_active']);
            $table->index(['salary_from', 'salary_to']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('withholding_tax_tables');
    }
};