<?php

namespace Pterodactyl\Console\Commands;

use Pterodactyl\Models\Server;
use Pterodactyl\Models\Schedule;
use Pterodactyl\Models\Task;
use Pterodactyl\Helpers\Utilities;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CreateAutoBackupSchedules extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'p:backup:create-schedules';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'สร้าง schedule backup อัตโนมัติทุกวันเวลา 21:20 สำหรับทุก server';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔄 กำลังสร้าง schedule backup อัตโนมัติ...');

        // ดึงทุก server ที่มี backup_limit > 0
        $servers = Server::where('backup_limit', '>', 0)->get();

        if ($servers->isEmpty()) {
            $this->warn('⚠️  ไม่พบ server ที่มี backup_limit > 0');
            return 0;
        }

        $created = 0;
        $skipped = 0;

        foreach ($servers as $server) {
            // ตรวจสอบว่ามี schedule backup อัตโนมัติอยู่แล้วหรือไม่
            $existingSchedule = Schedule::where('server_id', $server->id)
                ->where('name', 'Auto Backup - Daily 21:20')
                ->first();

            if ($existingSchedule) {
                $this->line("⏭️  Server {$server->name} (ID: {$server->id}) มี schedule อยู่แล้ว - ข้าม");
                $skipped++;
                continue;
            }

            try {
                DB::transaction(function () use ($server, &$created) {
                    // สร้าง schedule
                    $schedule = Schedule::create([
                        'server_id' => $server->id,
                        'name' => 'Auto Backup - Daily 21:20',
                        'cron_minute' => '20',
                        'cron_hour' => '21',
                        'cron_day_of_month' => '*',
                        'cron_month' => '*',
                        'cron_day_of_week' => '*',
                        'is_active' => true,
                        'is_processing' => false,
                        'only_when_online' => true,
                        'next_run_at' => Utilities::getScheduleNextRunDate('20', '21', '*', '*', '*'),
                    ]);

                    // สร้าง task สำหรับ backup
                    Task::create([
                        'schedule_id' => $schedule->id,
                        'sequence_id' => 1,
                        'action' => Task::ACTION_BACKUP,
                        'payload' => '', // ไม่มี ignored files
                        'time_offset' => 0,
                        'is_queued' => false,
                        'continue_on_failure' => false,
                    ]);

                    $created++;
                    $this->info("✅ สร้าง schedule สำเร็จสำหรับ server: {$server->name} (ID: {$server->id})");
                });
            } catch (\Exception $e) {
                $this->error("❌ เกิดข้อผิดพลาดสำหรับ server {$server->name} (ID: {$server->id}): {$e->getMessage()}");
            }
        }

        $this->newLine();
        $this->info("📊 สรุป:");
        $this->info("   ✅ สร้างใหม่: {$created} schedule(s)");
        $this->info("   ⏭️  ข้าม: {$skipped} schedule(s)");
        $this->info("   📦 ทั้งหมด: {$servers->count()} server(s)");

        return 0;
    }
}
