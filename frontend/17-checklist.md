# บทที่ 17 — Frontend Competition Checklist

> **บทนี้เตรียมอะไร:** ขั้นตอนเริ่มแข่งขันจริงสำหรับ Frontend — เปิดโปรเจ็ค, รัน dev server, ตรวจสอบทุกหน้าทำงานได้ครบ

## ก่อนเริ่มแข่ง — เตรียม Environment

```bash
# 1. เข้าโฟลเดอร์ frontend
cd frontend

# 2. ติดตั้ง dependencies (ถ้ายังไม่ได้ install)
npm install

# 3. ตรวจสอบ .env มีค่าถูกต้อง
# ต้องมีไฟล์ .env ที่ root ของ frontend/
```

**ตรวจสอบ `.env`:**

```
VITE_API_URL=http://localhost:8080/api
```

:::warning ตรวจ IP ก่อนแข่งทุกครั้ง
ในห้องแข่งขัน IP ของ backend อาจเปลี่ยน — ถามกรรมการว่า backend รันอยู่ที่ IP อะไร แล้วแก้ `.env` ให้ถูกต้อง
:::

## รัน Dev Server

```bash
npm run dev
```

ต้องเห็นใน terminal:

```
  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.x.x:3000/
```

:::tip Port ต้องเป็น 3000
ถ้าเห็น port อื่น ตรวจ `vite.config.js` ว่ามี `server: { port: 3000 }` หรือเปล่า
:::

## Checklist — ตรวจสอบทีละหน้า

### Login Page (`/login`)

- [ ] เปิด `http://localhost:3000` → redirect ไป `/login` อัตโนมัติ
- [ ] หน้า Sign In แสดง card กลางหน้าจอ มี Username/Password field
- [ ] กรอก `candidate01` / `cand123` → redirect ไป `/candidate`
- [ ] กรอก `judge01` / `judge123` → redirect ไป `/judge`
- [ ] กรอก `manager01` / `manager123` → redirect ไป `/manager`
- [ ] กรอก username/password ผิด → เห็น error message สีแดง
- [ ] DevTools → Application → Local Storage → มี key `token` หลัง login

### Candidate Dashboard (`/candidate`)

- [ ] Login เป็น `candidate01` / `cand123`
- [ ] Header แสดงชื่อ "Welcome, [full_name]" และ Badge สถานะ session
- [ ] Badge `waiting` (เทา) ถ้า session ยังไม่เปิด
- [ ] CountdownTimer แสดง "Session has not started yet" ถ้า waiting
- [ ] รายการโจทย์ (tasks) แสดงใน card
- [ ] SubmissionForm: field disabled ถ้า session ไม่ใช่ `open`
- [ ] ResultCard: "No result yet" ถ้ายังไม่มีคะแนน
- [ ] กด Logout → กลับไป `/login`
- [ ] DevTools → Network → เห็น request `/config`, `/tasks`, `/my-submission`, `/my-result` ทุก 5 วินาที

**ทดสอบ session open:**
- [ ] Judge เปิด session → Candidate badge เปลี่ยนเป็น `open` (เขียว) อัตโนมัติ
- [ ] CountdownTimer นับถอยเวลา
- [ ] SubmissionForm เปิดให้กรอก URL ได้
- [ ] กรอก `http://localhost:3000` ทั้งสอง field → กด Submit → ปุ่มเปลี่ยนเป็น "Update Submission"

### Judge Dashboard (`/judge`)

- [ ] Login เป็น `judge01` / `judge123`
- [ ] Header แสดงชื่อ judge
- [ ] Session Control แสดง Badge สถานะ + ปุ่ม Open/Close
- [ ] ปุ่ม Open Session active (ปุ่ม Close disabled) ถ้า session ไม่ใช่ `open`
- [ ] กด **Open Session** → Badge เปลี่ยนเป็น `open`, ปุ่มสลับกัน
- [ ] Candidate table แสดงรายชื่อ 5 candidates
- [ ] หลัง candidate ส่ง URL → เห็น Badge `pending` ในแถวนั้น
- [ ] กด **Re-check** → Badge เปลี่ยนเป็น `checking` → รอ ~2.5 วินาที → `checked` + คะแนนปรากฏ
- [ ] กด **Confirm** → เห็น "✓ Confirmed" แทนปุ่ม
- [ ] กด **Close Session** → ยืนยัน → Badge เปลี่ยนเป็น `closed`

### Manager Dashboard (`/manager`)

- [ ] Login เป็น `manager01` / `manager123`
- [ ] SessionSelector แสดงปุ่มเลือก session ที่มีอยู่
- [ ] SummaryCards แสดง 4 card (Total Candidates, Submitted, Confirmed, Average Score)
- [ ] Pass/Fail card แสดงจำนวน (ถ้ามี confirmed result)
- [ ] RankingTable แสดง ranking พร้อม Pass/Fail badge
- [ ] กดเลือก session อื่น → stats อัปเดตตาม session ที่เลือก
- [ ] ปุ่ม Export JSON / CSV / PDF แสดงใน Ranking card

### Export (Manager)

- [ ] กด **Export JSON** → browser ดาวน์โหลดไฟล์ `.json`
- [ ] เปิดไฟล์ → ต้องเห็น JSON มีข้อมูล ranking
- [ ] กด **Export CSV** → ดาวน์โหลด `.csv` → เปิดใน Notepad เห็น comma-separated
- [ ] กด **Export PDF** → ดาวน์โหลด `.pdf` → เปิดใน browser เห็น PDF มีข้อมูล
- [ ] DevTools → Network → request `/report` ต้องมี `Authorization: Bearer ...` header

### ProtectedRoute — ทดสอบ Guard

- [ ] ลบ token จาก Local Storage → ไปที่ `/candidate` → redirect `/login` ทันที
- [ ] Login เป็น `candidate01` → พิมพ์ URL ไปที่ `/judge` → redirect กลับ `/candidate`
- [ ] Login เป็น `judge01` → พิมพ์ URL ไปที่ `/manager` → redirect กลับ `/judge`

## ตรวจสอบ Network Requests

เปิด DevTools → Network tab แล้วตรวจสอบ:

| Request | Expected status | มี Authorization header? |
|---------|----------------|------------------------|
| `POST /api/login` | 200 | ไม่ต้องมี |
| `GET /api/config` | 200 | ✅ ต้องมี |
| `GET /api/tasks` | 200 | ✅ ต้องมี |
| `GET /api/my-submission` | 200 หรือ 404 | ✅ ต้องมี |
| `GET /api/candidates` | 200 | ✅ ต้องมี |
| `GET /api/sessions` | 200 | ✅ ต้องมี |
| `GET /api/report` | 200 | ✅ ต้องมี |

## โครงสร้างไฟล์สุดท้าย

```
frontend/
├── package.json
├── vite.config.js
├── index.html
├── .env
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── contexts/
    │   └── AuthContext.jsx
    ├── services/
    │   └── api.js
    ├── router/
    │   └── ProtectedRoute.jsx
    ├── hooks/
    │   └── useCountdown.js
    ├── components/
    │   ├── common/
    │   │   ├── Button.jsx
    │   │   ├── Input.jsx
    │   │   ├── Card.jsx
    │   │   └── Badge.jsx
    │   ├── candidate/
    │   │   ├── CountdownTimer.jsx
    │   │   ├── SubmissionForm.jsx
    │   │   └── ResultCard.jsx
    │   ├── judge/
    │   │   ├── SessionControl.jsx
    │   │   └── CandidateTable.jsx
    │   └── manager/
    │       ├── SummaryCards.jsx
    │       ├── RankingTable.jsx
    │       ├── SessionSelector.jsx
    │       └── ExportButtons.jsx
    └── pages/
        ├── Login.jsx
        ├── candidate/
        │   └── Dashboard.jsx
        ├── judge/
        │   └── Dashboard.jsx
        └── manager/
            └── Dashboard.jsx
```

## Common Problems ในห้องแข่งขัน

| อาการ | สาเหตุที่พบบ่อย | วิธีแก้ |
|------|----------------|---------|
| หน้าขาวทั้งหมด | Error ใน component | เปิด DevTools → Console → อ่าน error |
| Login แล้วไม่ redirect | `HOME` map ไม่มี role นั้น | ตรวจ `data.data.role` ใน Network response |
| Tasks ไม่แสดง | Backend ไม่รัน หรือ CORS | ตรวจ `.env` + รัน backend ก่อน |
| Export failed | `pdfkit` ไม่ได้ install | `cd backend && npm install` |
| Tailwind ไม่มีผล | `index.css` ไม่มี `@import "tailwindcss"` | เพิ่มบรรทัดนี้เป็นบรรทัดแรก |
| token หาย หลัง refresh | `useState` ไม่ใช้ lazy initializer | ตรวจ `AuthContext.jsx` — `useState(() => localStorage.getItem(...))` |
