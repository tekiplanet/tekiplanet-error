<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        // Add the currency column
        Schema::table('business_invoices', function (Blueprint $table) {
            $table->string('currency', 3)->default('USD')->after('amount');
        });
    }

    public function down()
    {
        Schema::table('business_invoices', function (Blueprint $table) {
            $table->dropColumn('currency');
        });
    }
}; 