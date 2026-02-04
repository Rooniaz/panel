<?php

namespace Pterodactyl\Console\Commands;

use Pterodactyl\Models\Server;
use Pterodactyl\Services\Backups\InitiateBackupService;
use Pterodactyl\Repositories\Eloquent\BackupRepository;
use Illuminate\Console\Command;

class RunBackupTest extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'p:backup:test {--server= : Server name หรือ ID (ถ้าไม่ระบุจะ backup ทุก server)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'รัน backup ทดสอบสำหรับ server (หรือทุก server)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $serverNameOrId = $this->option('server');

        if ($serverNameOrId) {
            // Backup server เฉพาะ
            $server = is_numeric($serverNameOrId)
                ? Server::find($serverNameOrId)
                : Server::where('name', $serverNameOrId)->first();

            if (!$server) {
                $this->error("❌ ไม่พบ server: {$serverNameOrId}");
                return 1;
            }

            if ($server->backup_limit <= 0) {
                $this->warn("⚠️  Server {$server->name} มี backup_limit = 0 (ไม่สามารถสร้าง backup ได้)");
                return 1;
            }

            $this->runBackupForServer($server);
        } else {
            // Backup ทุก server
            $this->info('🔄 กำลังสร้าง backup สำหรับทุก server...');
            $this->newLine();

            $servers = Server::where('backup_limit', '>', 0)->get();

            if ($servers->isEmpty()) {
                $this->warn('⚠️  ไม่พบ server ที่มี backup_limit > 0');
                return 0;
            }

            $success = 0;
            $failed = 0;

            foreach ($servers as $server) {
                try {
                    $this->runBackupForServer($server);
                    $success++;
                } catch (\Exception $e) {
                    $this->error("❌ Server {$server->name}: {$e->getMessage()}");
                    $failed++;
                }
            }

            $this->newLine();
            $this->info('📊 สรุป:');
            $this->info("   ✅ สำเร็จ: {$success} server(s)");
            $this->info("   ❌ ล้มเหลว: {$failed} server(s)");
            $this->info("   📦 ทั้งหมด: {$servers->count()} server(s)");
        }

        return 0;
    }

    /**
     * รัน backup สำหรับ server หนึ่ง
     */
    private function runBackupForServer(Server $server)
    {
        $this->line("🔄 Server: {$server->name} (ID: {$server->id})");

        // ตรวจสอบ backup ปัจจุบัน
        $repository = app(BackupRepository::class);
        $successful = $repository->getNonFailedBackups($server);
        $count = $successful->count();

        $this->line("   Current Backups: {$count}/{$server->backup_limit}");

        if ($count > 0) {
            $unlocked = $successful->where('is_locked', false)->count();
            $locked = $successful->where('is_locked', true)->count();
            $this->line("   Unlocked: {$unlocked}, Locked: {$locked}");

            if ($count >= $server->backup_limit) {
                $oldest = $successful->where('is_locked', false)->orderBy('created_at')->first();
                if ($oldest) {
                    $this->line("   ⚠️  จะลบ backup เก่าสุด: {$oldest->name}");
                }
            }
        }

        // สร้าง backup
        try {
            $backupService = app(InitiateBackupService::class);
            $backup = $backupService->handle($server, null, true, true); // override = true, bypassThrottle = true

            $this->info("   ✅ สร้าง backup สำเร็จ: {$backup->name}");

            // ตรวจสอบ backup ใหม่
            $newCount = $repository->getNonFailedBackups($server)->count();
            $this->line("   New Backup Count: {$newCount}/{$server->backup_limit}");
        } catch (\Exception $e) {
            $this->error("   ❌ เกิดข้อผิดพลาด: {$e->getMessage()}");
            throw $e;
        }

        $this->newLine();
    }
}

