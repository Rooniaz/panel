<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // ตั้งค่า backup_limit = 2 สำหรับทุก server
        DB::table('servers')->update(['backup_limit' => 2]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reset backup_limit เป็น 0 (default)
        DB::table('servers')->update(['backup_limit' => 0]);
    }
};
