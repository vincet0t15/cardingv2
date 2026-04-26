<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Create delete_requests table if not exists
        if (!Schema::hasTable('delete_requests')) {
            Schema::create('delete_requests', function (Blueprint $table) {
                $table->id();
                $table->string('requestable_type');
                $table->unsignedBigInteger('requestable_id');
                $table->unsignedBigInteger('requested_by');
                $table->string('status')->default('pending');
                $table->unsignedBigInteger('approved_by')->nullable();
                $table->timestamp('approved_at')->nullable();
                $table->text('reason')->nullable();
                $table->timestamps();

                $table->foreign('requested_by')->references('id')->on('users')->onDelete('cascade');
                $table->foreign('approved_by')->references('id')->on('users')->onDelete('set null');
            });
        }

        // Create notifications table if not exists
        if (!Schema::hasTable('notifications')) {
            Schema::create('notifications', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id');
                $table->string('type');
                $table->string('title');
                $table->text('message')->nullable();
                $table->string('link')->nullable();
                $table->unsignedBigInteger('notifiable_id')->nullable();
                $table->string('notifiable_type')->nullable();
                $table->boolean('is_read')->default(false);
                $table->timestamps();

                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('delete_requests');
    }
};