<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('bank_accounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->onDelete('cascade');
            $table->string('bank_name');
            $table->string('bank_code');
            $table->string('account_number');
            $table->string('account_name');
            $table->string('recipient_code')->nullable(); // Paystack recipient code
            $table->boolean('is_verified')->default(false);
            $table->boolean('is_default')->default(false);
            $table->timestamps();
            
            // Ensure a user can't add more than 2 bank accounts
            $table->unique(['user_id', 'account_number']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('bank_accounts');
    }
};
