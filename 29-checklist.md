# บทที่ 29 — Competition Checklist

ขั้นตอนที่ต้องทำ **ตอนเริ่มแข่งจริง** — ทำตามลำดับ ห้ามข้าม

## โครงสร้าง Backend ที่สมบูรณ์

```
backend/
├── src/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── configController.js
│   │   ├── tasksController.js
│   │   ├── submissionsController.js
│   │   ├── resultsController.js
│   │   ├── sessionController.js
│   │   ├── candidatesController.js
│   │   ├── statisticsController.js
│   │   ├── sessionsController.js
│   │   └── reportController.js
│   ├── middlewares/
│   │   ├── auth.js
│   │   ├── role.js
│   │   └── autoClose.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── config.js
│   │   ├── tasks.js
│   │   ├── submissions.js
│   │   ├── results.js
│   │   ├── session.js
│   │   ├── candidates.js
│   │   ├── statistics.js
│   │   ├── sessions.js
│   │   └── report.js
│   └── app.js
├── database/
│   ├── schema.sql
│   └── seed.js
├── .env
└── package.json
```

## ขั้นตอนแข่งขันจริง

**1. รับไฟล์ .sql จากกรรมการ**

```bash
mysql -u root -p worldskill2026 < schema.sql
```

ตรวจว่า import สำเร็จ:

```bash
mysql -u root -p worldskill2026
```

```sql
SHOW TABLES;
SELECT COUNT(*) FROM users;
EXIT;
```

**2. สร้างไฟล์ `backend/.env`**

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=<รหัสผ่านตามโจทย์>
DB_NAME=worldskill2026
JWT_SECRET=<string ลับตามโจทย์>
FRONTEND_URL=http://localhost:3000
PORT=8080
```

**3. ติดตั้ง packages**

```bash
cd backend
npm install
```

**4. รัน Seed (ถ้าโจทย์กำหนด)**

```bash
npm run seed
```

**5. รัน Server**

```bash
npm run dev
```

ต้องเห็น:
```
Backend running on http://localhost:8080
```

**6. ทดสอบ Login ด้วย Postman**

```
POST http://localhost:8080/api/login
Body: { "username": "judge01", "password": "judge123" }
```

ต้องได้ `token` กลับมา

**7. ทดสอบ Endpoints ตาม Marking Scheme**

ทดสอบทีละ endpoint ตามลำดับในเอกสารโจทย์ — ใช้ token จากขั้นตอน 6

## Endpoints Checklist

| Method | Endpoint | Role | ✅ |
|--------|----------|------|----|
| POST | /api/login | ทุก role | ☐ |
| POST | /api/logout | ทุก role | ☐ |
| GET | /api/config | ทุก role | ☐ |
| GET | /api/tasks | ทุก role | ☐ |
| GET | /api/my-submission | candidate | ☐ |
| POST | /api/my-submission | candidate | ☐ |
| PUT | /api/my-submission | candidate | ☐ |
| GET | /api/my-result | candidate | ☐ |
| PUT | /api/session/start | judge | ☐ |
| PUT | /api/session/close | judge | ☐ |
| GET | /api/candidates | judge | ☐ |
| GET | /api/submissions | judge | ☐ |
| POST | /api/submissions/:id/recheck | judge | ☐ |
| PUT | /api/results/:candidate_id/confirm | judge | ☐ |
| GET | /api/statistics/summary | manager | ☐ |
| GET | /api/statistics/status | manager | ☐ |
| GET | /api/statistics/ranking | manager | ☐ |
| GET | /api/sessions | manager | ☐ |
| GET | /api/report | manager | ☐ |
| GET | /api/report?format=csv | manager | ☐ |

## Common Errors ตอนแข่ง

| ปัญหา | สาเหตุที่พบบ่อย | วิธีแก้ |
|-------|----------------|---------|
| Server ไม่ start | `.env` ขาดค่า หรือ DB ไม่ได้เปิด | ตรวจ `.env` ครบ + เปิด MariaDB |
| Login ไม่ผ่าน | ยังไม่ได้ seed | รัน `npm run seed` |
| 401 ทุก request | ลืมใส่ `Bearer ` นำหน้า token | ตรวจ Postman Header |
| 403 Access denied | ใช้ token ผิด role | ตรวจ role ของ token ที่ใช้ |
| `Cannot find module` | ลืม `npm install` | รัน `npm install` ใน `backend/` |

:::danger
ถ้า server crash ใน production mode — ตรวจ console error ก่อนเสมอ อย่าเดาสาเหตุ
:::
