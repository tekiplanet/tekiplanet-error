<?php

namespace Database\Migrations;

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        // First, modify any existing 'platform' values to 'email' to prevent data loss
        DB::table('professionals')
            ->where('preferred_contact_method', 'platform')
            ->update(['preferred_contact_method' => 'email']);

        // Drop the existing enum and recreate it with the new value
        DB::statement("ALTER TABLE professionals MODIFY COLUMN preferred_contact_method ENUM('email', 'phone', 'whatsapp', 'platform') DEFAULT 'email'");
    }

    public function down()
    {
        // First, modify any existing 'platform' values to 'email' to prevent data loss
        DB::table('professionals')
            ->where('preferred_contact_method', 'platform')
            ->update(['preferred_contact_method' => 'email']);

        // Revert the enum to its original values
        DB::statement("ALTER TABLE professionals MODIFY COLUMN preferred_contact_method ENUM('email', 'phone', 'whatsapp') DEFAULT 'email'");
    }
}; 