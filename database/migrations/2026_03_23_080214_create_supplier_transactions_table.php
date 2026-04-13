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
        Schema::create('supplier_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_id')->constrained()->cascadeOnDelete();
            $table->date('pr_date');
            $table->string('pr_no');
            $table->date('po_date')->nullable();
            $table->string('po_no')->nullable();
            $table->date('sale_invoice_date')->nullable();
            $table->string('sale_invoice_no')->nullable();
            $table->date('or_date')->nullable();
            $table->string('or_no')->nullable();
            $table->date('dr_date')->nullable();
            $table->string('dr_no')->nullable();
            $table->string('qty_period_covered')->nullable();
            $table->text('particulars')->nullable();
            $table->decimal('gross', 15, 2)->default(0);
            $table->decimal('ewt', 15, 2)->default(0)->nullable();
            $table->decimal('vat', 15, 2)->default(0)->nullable();
            $table->decimal('net_amount', 15, 2)->default(0)->nullable();
            $table->date('date_processed')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('supplier_transactions');
    }
};
