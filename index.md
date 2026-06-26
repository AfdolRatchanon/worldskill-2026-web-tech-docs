---
layout: home

hero:
  name: "WorldSkill 2026"
  text: "Web Technologies — Real DB"
  tagline: "คู่มือสร้าง Backend + Frontend ตาม Schema ทางการ (seed_data.sql) ทีละขั้นตอน สำหรับนักเรียนที่เตรียมแข่งขัน WorldSkill Web Technologies"
  actions:
    - theme: brand
      text: ⚙️ เริ่ม Backend →
      link: /backend-real-db/01-overview
    - theme: brand
      text: 🌐 เริ่ม Frontend →
      link: /frontend-simple-real-db/01-overview
    - theme: alt
      text: 🏆 Checklist แข่งขัน
      link: /backend-real-db/25-checklist
    - theme: alt
      text: 📦 เอกสารเดิม (อ้างอิง)
      link: /legacy/backend/01-installation

features:
  - title: 🗄️ ตรงกับ Schema ทางการ
    details: ทุกบทอิงตาราง users / sessions / tasks / submissions / results จากไฟล์ seed_data.sql โดยตรง — รหัสผ่าน plain-text, candidate_code, คะแนน score ตัวเดียว, สถานะ active/closed
  - title: 📦 โค้ดทีละ endpoint / ทีละหน้า
    details: backend แยกบทต่อ endpoint, frontend แยกบทต่อหน้า — พิมพ์ตามได้จริง เห็นภาพว่าแต่ละไฟล์ทำอะไร
  - title: ✅ ทดสอบได้ทุกขั้นตอน
    details: ทุกบทมีขั้นตอนทดสอบ (Postman / เบราว์เซอร์) บอกชัดว่าต้องเห็นอะไร ผ่านแล้วค่อยไปบทถัดไป

---

## 🎯 ระบบที่จะสร้าง

**Test Submission Management System** — ระบบจัดการการส่งผลสอบสำหรับการแข่งขัน WorldSkill Web Technologies

| บทบาท | สิทธิ์ |
|-------|--------|
| 🎓 **Candidate** | เข้าสู่ระบบ ดูโจทย์ ส่ง URL แก้ไข ดูคะแนนตัวเอง |
| ⚖️ **Judge** | เปิด/ปิดการสอบ ดูรายชื่อ ตรวจซ้ำ ยืนยันคะแนน |
| 📊 **Manager** | ดูสถิติ ดู ranking export report |

## 🛠️ Tech Stack

| ส่วน | Technology | Port |
|------|-----------|------|
| 🌐 Frontend | React + Vite | 3000 |
| ⚙️ Backend | Node.js + Express | 8080 |
| 🗄️ Database | MariaDB (`worldskill2026_real`) | 3306 |

## 🗄️ Schema ทางการ (`seed_data.sql`)

ทุกบทในคู่มือนี้อิง 5 ตารางนี้ — **ห้ามจำสลับกับเวอร์ชันเดิม**

| ตาราง | คอลัมน์สำคัญ | หมายเหตุ |
|-------|------------|---------|
| `users` | id, username, **password** (plain-text), role, full_name, **candidate_code** | ไม่มี bcrypt · candidate_code = รหัสผู้เข้าแข่ง (C01..) |
| `sessions` | id, **status** (`initialized`/`active`/`closed`), updated_at | ปิดด้วย judge · จับเวลา/auto-close = บทเสริม |
| `tasks` | id, title, description | |
| `submissions` | id, candidate_id, **task_id**, frontend_url, backend_url, status (`submitted`/`recheck`/`confirmed`), created_at | ผูกกับ task ไม่ใช่ session |
| `results` | id, submission_id, **score** (ตัวเดียว), status (`pending`/`confirmed`) | ไม่มี frontend/backend score แยก |

## 📚 สารบัญ

### ⚙️ Backend (Real DB) — 25 บท + 2 บทเสริม

| กลุ่ม | บท | เป้าหมาย |
|------|-----|---------|
| 🔧 เริ่มต้น | 1–3 | ภาพรวม · ติดตั้งเครื่องมือ · เตรียม Project |
| ⚡ สร้าง Server | 4–8 | Express · dotenv & cors · Database & Schema · mysql2 · Checkpoint |
| 🔐 Authentication | 9–11 | JWT · Login (plain-text) · Architecture & app.js |
| 🌐 Shared | 12–13 | GET /api/config · GET /api/tasks |
| 🎓 Candidate | 14–16 | GET/POST/PUT /api/my-submission · GET /api/my-result |
| ⚖️ Judge | 17–21 | Session · Candidates · Submissions · Recheck · Confirm |
| 📊 Manager | 22–24 | Statistics · Ranking · Report |
| 🏁 สรุป | 25 | Competition Checklist |
| 🧩 บทเสริม (ออปชัน) | 26–27 | จับเวลาสอบ + ปิด session อัตโนมัติ · ตรวจรูปแบบ URL (http/https) |

> 🧪 มีบท **[ทดสอบด้วย Postman](/backend-real-db/postman)** (หลังบท 11) + ทุก endpoint มีกล่อง **📮 ใน Postman** บอก Method/URL/token/Body ให้นักเรียนยิงทดสอบตามได้

### 🌐 Frontend (Real DB) — 10 บท + 3 บทเสริม

ใช้ **`frontend-simple-real-db`** (เรียบง่าย เน้น logic) เป็นหลัก · ตัว **พร้อมแข่ง** (`frontend-real-db`: design system + responsive + a11y + countdown timer) อยู่ในบทเสริม

| กลุ่ม | บท | เป้าหมาย |
|------|-----|---------|
| 🌐 เริ่มต้น | 1–2 | ภาพรวม · สร้างโปรเจกต์ |
| 🧰 ไฟล์กลาง | 3–5 | auth.js (Token) · api.js (Axios + Interceptor) · App.jsx (Router + ProtectedRoute) |
| 📄 สร้างทีละหน้า | 6–9 | Login · Candidate · Judge · Manager |
| 🏁 สรุป | 10 | ทดสอบทั้งระบบ |
| 🏆 บทเสริม (พร้อมแข่ง) | 11–13 | ภาพรวม · Countdown Timer · Design System + a11y |

### 📦 เอกสารเดิม (อ้างอิง — ไม่ใช่ schema ทางการ)

เก็บไว้สำหรับเทียบ/อ้างอิง — เวอร์ชันเดิมใช้ `test_sessions`, bcrypt, คะแนนแยก FE/BE และมี timer

- [⚙️ Backend (เดิม) 29 บท](/legacy/backend/01-installation)
- [🌱 Frontend Simple (เดิม) 10 บท](/legacy/frontend-simple/01-overview)
- [🖥️ Frontend (เดิม) 20 บท](/legacy/frontend/01-setup)
- [🔗 บูรณาการ (เดิม) 9 บท](/legacy/integration/01-overview)

## 📖 วิธีใช้คู่มือนี้

เรียนตามลำดับบท **อย่าข้ามบท** เพราะโค้ดแต่ละบทต่อยอดจากบทก่อนหน้า

1. สร้างไฟล์และพิมพ์โค้ดตามที่แสดงในแต่ละบท
2. ผ่านขั้นตอน **ทดสอบ** ก่อนไปบทถัดไปเสมอ
3. เมื่อเรียนครบ จะได้ backend + frontend ที่รันได้จริงครบทุก endpoint ตาม schema ทางการ
