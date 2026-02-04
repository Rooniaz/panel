<?php

namespace Pterodactyl\Http\Controllers\Admin;

use Pterodactyl\Models\Schedule;
use Pterodactyl\Helpers\Utilities;
use Pterodactyl\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BackupScheduleController extends Controller
{
    /**
     * ดึงข้อมูลเวลา backup ปัจจุบัน
     * แปลงเวลาจาก UTC กลับเป็น ICT (Asia/Bangkok) เพื่อแสดงใน UI
     */
    public function getCurrentTime(): JsonResponse
    {
        try {
            // หา schedule backup อัตโนมัติด้วย pattern "Auto Backup - Daily"
            // เพราะชื่ออาจเปลี่ยนไปตามเวลาที่ตั้ง (เช่น "Auto Backup - Daily 23:20")
            $schedule = Schedule::where('name', 'like', 'Auto Backup - Daily%')
                ->whereHas('tasks', function ($query) {
                    $query->where('action', 'backup');
                })
                ->first();

            if (!$schedule) {
                // ถ้าไม่เจอ ให้ return default values (21:20 ICT = 14:20 UTC)
                return response()->json([
                    'success' => true,
                    'hour' => 21,
                    'minute' => 20,
                    'message' => 'ยังไม่พบ schedule backup อัตโนมัติ (ใช้ค่าเริ่มต้น)',
                ]);
            }

            // แปลงเวลาจาก UTC กลับเป็น ICT
            // UTC time ที่เก็บไว้ใน database
            $utcHour = (int) $schedule->cron_hour;
            $utcMinute = (int) $schedule->cron_minute;
            
            // สร้าง Carbon object จาก UTC time
            $utcTime = \Carbon\Carbon::now('UTC')
                ->setTime($utcHour, $utcMinute, 0);
            
            // แปลงเป็น ICT
            $ictTime = $utcTime->copy()->setTimezone('Asia/Bangkok');
            $ictHour = (int) $ictTime->format('H');
            $ictMinute = (int) $ictTime->format('i');

            return response()->json([
                'success' => true,
                'hour' => $ictHour,
                'minute' => $ictMinute,
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting backup schedule time: ' . $e->getMessage());
            return response()->json([
                'success' => true,
                'message' => 'เกิดข้อผิดพลาดในการดึงข้อมูล (ใช้ค่าเริ่มต้น)',
                'hour' => 21,
                'minute' => 20,
            ]);
        }
    }

    /**
     * อัพเดทเวลา backup สำหรับทุก server
     * เวลาที่รับเข้ามาเป็นเวลาไทย (ICT) จะถูกแปลงเป็น UTC ก่อนบันทึก
     */
    public function updateTime(Request $request): JsonResponse
    {
        $request->validate([
            'hour' => 'required|integer|min:0|max:23',
            'minute' => 'required|integer|min:0|max:59',
        ]);

        try {
            $hour = $request->input('hour');
            $minute = $request->input('minute');

            // แปลงเวลาจาก ICT (Asia/Bangkok) เป็น UTC
            // ICT = UTC + 7 ชั่วโมง
            // ดังนั้น UTC = ICT - 7 ชั่วโมง
            $nowBangkok = \Carbon\Carbon::now('Asia/Bangkok');
            $ictTime = $nowBangkok->copy()->setTime($hour, $minute, 0);
            
            // ถ้าเวลาที่ตั้งผ่านไปแล้ววันนี้ ให้ตั้งเป็นพรุ่งนี้
            if ($ictTime->isPast()) {
                $ictTime->addDay();
            }
            
            $utcTime = $ictTime->copy()->setTimezone('UTC');
            $utcHour = (int) $utcTime->format('H');
            $utcMinute = (int) $utcTime->format('i');
            
            // คำนวณ next_run_at จาก UTC time
            $nextRunUtc = \Carbon\Carbon::now('UTC')
                ->setTime($utcHour, $utcMinute, 0);
            
            // ถ้าเวลาผ่านไปแล้ววันนี้ ให้ตั้งเป็นพรุ่งนี้
            if ($nextRunUtc->isPast()) {
                $nextRunUtc->addDay();
            }

            // อัพเดททุก schedule backup อัตโนมัติด้วย pattern "Auto Backup - Daily"
            $schedules = Schedule::where('name', 'like', 'Auto Backup - Daily%')
                ->whereHas('tasks', function ($query) {
                    $query->where('action', 'backup');
                })
                ->get();

            if ($schedules->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'ไม่พบ schedule backup อัตโนมัติ กรุณารันคำสั่ง: php artisan p:backup:create-schedules',
                ], 404);
            }

            $updated = 0;
            DB::transaction(function () use ($schedules, $hour, $minute, $utcHour, $utcMinute, $nextRunUtc, &$updated) {
                foreach ($schedules as $schedule) {
                    $schedule->update([
                        'cron_hour' => (string) $utcHour,
                        'cron_minute' => (string) $utcMinute,
                        'name' => "Auto Backup - Daily {$hour}:{$minute}",
                        'next_run_at' => $nextRunUtc->toDateTimeString(),
                    ]);
                    $updated++;
                }
            });

            return response()->json([
                'success' => true,
                'message' => "อัพเดทเวลา backup เป็น {$hour}:{$minute} (ICT) สำเร็จ",
                'updated' => $updated,
                'hour' => $hour,
                'minute' => $minute,
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating backup schedule time: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการอัพเดท: ' . $e->getMessage(),
            ], 500);
        }
    }
}
