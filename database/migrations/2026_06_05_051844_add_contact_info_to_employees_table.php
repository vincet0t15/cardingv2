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
        Schema::table('employees', function (Blueprint $table) {
            $table->string('contact_number', 20)->nullable()->after('suffix');
            $table->string('email', 255)->nullable()->after('contact_number');
            $table->text('address')->nullable()->after('email');
            $table->date('birthdate')->nullable()->after('address');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn(['contact_number', 'email', 'address', 'birthdate']);
        });
    }
};
