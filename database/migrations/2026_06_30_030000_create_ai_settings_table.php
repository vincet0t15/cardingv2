<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->timestamps();
        });

        // Default settings
        DB::table('ai_settings')->insert([
            ['key' => 'api_key', 'value' => env('OPENAI_API_KEY', '')],
            ['key' => 'api_url', 'value' => env('OPENAI_URL', 'https://api.openai.com/v1')],
            ['key' => 'model', 'value' => env('OPENAI_MODEL', 'gpt-4o')],
            ['key' => 'enabled', 'value' => 'true'],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_settings');
    }
};
