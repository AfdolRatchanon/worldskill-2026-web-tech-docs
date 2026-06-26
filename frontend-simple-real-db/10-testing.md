# บทที่ 10 — ทดสอบทั้งระบบ

> **บทนี้เตรียมอะไร:** รัน backend + frontend พร้อมกัน แล้วไล่ทดสอบครบทั้ง 3 บทบาทแบบ end-to-end — ผ่านครบ = ระบบ Real DB สมบูรณ์

## เริ่มทั้ง 2 ฝั่ง

```bash
# Terminal 1 — backend
cd backend-real-db
npm run seed      # รีเซ็ตข้อมูลกลับเป็นค่าตั้งต้น
npm start         # port 8080

# Terminal 2 — frontend
cd frontend-simple-real-db
npm run dev       # port 3000
```

::: warning เช็ก baseURL ก่อน
ตั้ง `VITE_API_URL` ในไฟล์ `.env` ให้ตรง backend — รันเครื่องเดียวกันใช้ `http://localhost:8080/api` (ดูบทที่ 4) · แก้ `.env` แล้วต้องรีสตาร์ท `npm run dev`
:::

## เช็กลิสต์ทดสอบ (16 ข้อ)

### 🔒 Login
1. เปิด `http://localhost:3000` → เด้งมา `/login`
2. รหัสผิด → เห็นข้อความ error
3. `admin`/`password` → เข้า `/judge` · `manager`/`password` → `/manager` · `candidate1`/`123456` → `/candidate`

### ⚖️ Judge
4. status เริ่มเป็น `initialized`
5. กด **Open Session** → `active`
6. ตาราง Candidates เห็น candidate1, candidate2 พร้อมคอลัมน์ **Code** (C01/C02)

### 🎓 Candidate (แท็บใหม่ login `candidate2`)
7. session `active` → ฟอร์มกรอกได้ · เห็นชื่อ + `(C02)` ที่หัวมุม
8. ใส่ URL เช่น `http://10.0.0.5:3000` กด Submit → `Submitted!`
9. ใส่ค่าที่ไม่ใช่ URL เช่น `example.com` (ไม่มี `http://`) → error 400
10. แก้ URL แล้ว Update → สำเร็จ

### ⚖️ Judge (กลับมาตรวจ)
11. เห็น submission ของ candidate2 ในตาราง Submissions
12. กด **Re-check** → `score` โผล่ในตาราง Candidates
13. กด **Confirm** → ขึ้น ✓ Confirmed
14. กด **Close Session** → `closed`

### 📊 Manager (login `manager`)
15. การ์ด Summary แสดง Current session + ตัวเลข + Pass/Fail (ไม่มี dropdown เลือก session)
16. Ranking โชว์คนที่ confirm แล้ว (มีคอลัมน์ Code) · กด **Export CSV** ได้ไฟล์ `report.csv`

## ✅ ผ่านครบ = เสร็จสมบูรณ์

ระบบ Real DB ทำงานครบวงจรทั้ง backend + frontend ตาม schema ทางการแล้ว 🎉

| ทบทวน | ลิงก์ |
|-------|------|
| Backend Checklist | [บทที่ 25](/backend-real-db/25-checklist) |
| คำศัพท์ | [Glossary](/glossary) |
| เทียบเวอร์ชันเดิม | [เอกสารเดิม](/legacy/frontend-simple/01-overview) |

::: tip ต่อยอด
อยากได้ UI สวยขึ้น? ไปดู [Frontend ตัวเต็ม (เดิม)](/legacy/frontend/01-setup) ที่ใช้ Tailwind + แยก component — โครง logic เหมือนกัน เพิ่มแค่ความสวยงาม
:::
