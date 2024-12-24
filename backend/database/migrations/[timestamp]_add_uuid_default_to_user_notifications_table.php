<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        // Drop the existing primary key
        Schema::table('user_notifications', function (Blueprint $table) {
            $table->dropPrimary();
        });

        // Modify the id column to have UUID() as default
        DB::statement('ALTER TABLE user_notifications MODIFY id CHAR(36) NOT NULL DEFAULT (UUID())');

        // Add back the primary key
        Schema::table('user_notifications', function (Blueprint $table) {
            $table->primary('id');
        });
    }

    public function down()
    {
        // Drop the primary key
        Schema::table('user_notifications', function (Blueprint $table) {
            $table->dropPrimary();
        });

        // Remove the default value
        DB::statement('ALTER TABLE user_notifications MODIFY id CHAR(36) NOT NULL');

        // Add back the primary key
        Schema::table('user_notifications', function (Blueprint $table) {
            $table->primary('id');
        });
    }
}; 