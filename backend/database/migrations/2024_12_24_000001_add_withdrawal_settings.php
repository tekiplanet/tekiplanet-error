<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('settings', function (Blueprint $table) {
            // Withdrawal Settings
            $table->decimal('min_withdrawal_amount', 10, 2)->default(1000.00);
            $table->decimal('max_withdrawal_amount', 10, 2)->default(100000.00);
            $table->decimal('daily_withdrawal_limit', 10, 2)->default(200000.00);
        });
    }

    public function down()
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->dropColumn([
                'min_withdrawal_amount',
                'max_withdrawal_amount',
                'daily_withdrawal_limit'
            ]);
        });
    }
};
