# วิธีเข้า Wings Container และแก้ Config

## วิธีที่ 1: เข้า Wings Container (แนะนำ)

### จาก Windows PowerShell:
```powershell
wsl docker exec -it teyseed-wings-1 /bin/sh
```

### หรือใช้สคริปต์:
```powershell
.\access-wings.bat
```

## วิธีที่ 2: แก้ Config โดยตรง (ไม่ต้องเข้า Container)

### ดู Config ปัจจุบัน:
```powershell
wsl docker exec teyseed-wings-1 cat /etc/pterodactyl/config.yml
```

### แก้ Config (ใช้ Windows Editor):
```powershell
# 1. Copy config ออกมา
wsl docker exec teyseed-wings-1 cat /etc/pterodactyl/config.yml > wings-config.yml

# 2. แก้ไข wings-config.yml ด้วย Notepad หรือ VS Code
notepad wings-config.yml

# 3. Copy กลับเข้าไป
wsl docker exec -i teyseed-wings-1 sh -c "cat > /etc/pterodactyl/config.yml" < wings-config.yml

# 4. Restart Wings
wsl docker restart teyseed-wings-1
```

## สิ่งที่ต้องแก้ใน Config

จากข้อมูล `ipconfig`:
- **Windows Host IP สำหรับ WSL:** `172.23.208.1`
- **Wings อยู่ใน WSL:** ต้องให้ Wings ชี้กลับมาหา Panel ที่ Windows

### แก้ `remote` ใน `/etc/pterodactyl/config.yml`:

```yaml
remote: "http://172.23.208.1:8000"
```

หรือถ้าใช้ Docker Desktop:
```yaml
remote: "http://host.docker.internal:8000"
```

## ขั้นตอนการแก้ Config

### 1. เข้า Wings Container:
```powershell
wsl docker exec -it teyseed-wings-1 /bin/sh
```

### 2. ดู Config ปัจจุบัน:
```bash
cat /etc/pterodactyl/config.yml
```

### 3. แก้ Config (ใช้ nano หรือ vi):
```bash
nano /etc/pterodactyl/config.yml
```

หรือถ้าไม่มี nano:
```bash
vi /etc/pterodactyl/config.yml
```

**คำสั่ง vi:**
- กด `i` เพื่อเข้าสู่ insert mode
- แก้ไข `remote:` ให้เป็น `http://172.23.208.1:8000`
- กด `Esc` เพื่อออกจาก insert mode
- พิมพ์ `:wq` แล้วกด Enter เพื่อบันทึกและออก

### 4. ออกจาก Container:
```bash
exit
```

### 5. Restart Wings:
```powershell
wsl docker restart teyseed-wings-1
```

### 6. ตรวจสอบ Logs:
```powershell
wsl docker logs -f teyseed-wings-1
```

## ตรวจสอบว่า Config ถูกต้อง

### ดู Config ที่แก้แล้ว:
```powershell
wsl docker exec teyseed-wings-1 cat /etc/pterodactyl/config.yml | findstr remote
```

ควรเห็น:
```yaml
remote: "http://172.23.208.1:8000"
```

## ตรวจสอบการเชื่อมต่อ

### ทดสอบจาก Wings ไป Panel:
```powershell
wsl docker exec teyseed-wings-1 wget -O- http://172.23.208.1:8000/api/remote/servers 2>&1
```

หรือ:
```powershell
wsl docker exec teyseed-wings-1 curl -v http://172.23.208.1:8000/api/remote/servers
```

## Troubleshooting

### ถ้า Wings ไม่สามารถเชื่อมต่อกลับมาหา Panel:

1. **ตรวจสอบว่า Panel กำลังรัน:**
   ```powershell
   # ตรวจสอบว่า php artisan serve กำลังรันอยู่
   # ต้องรันด้วย: php artisan serve --host=0.0.0.0 --port=8000
   ```

2. **ตรวจสอบ Firewall:**
   - เปิด Windows Firewall สำหรับ port 8000
   - หรือปิด Firewall ชั่วคราวเพื่อทดสอบ

3. **ลองใช้ IP อื่น:**
   - `192.168.100.76` (Main Network Adapter)
   - `172.23.208.1` (WSL Adapter) - **แนะนำ**

4. **ตรวจสอบว่า Panel รับ connection จาก WSL:**
   ```powershell
   # ใน Panel directory
   php artisan serve --host=0.0.0.0 --port=8000
   ```

## สรุป

**ขั้นตอนเร็ว:**
1. `wsl docker exec -it teyseed-wings-1 /bin/sh`
2. `nano /etc/pterodactyl/config.yml`
3. แก้ `remote: "http://172.23.208.1:8000"`
4. `exit`
5. `wsl docker restart teyseed-wings-1`

