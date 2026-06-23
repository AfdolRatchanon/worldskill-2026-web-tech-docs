# บทที่ 25 — Competition Checklist

> **บทนี้เตรียมอะไร:** สรุปทุกอย่างไว้หน้าเดียวสำหรับทบทวนก่อนแข่ง — ขั้นตอนรัน, บัญชี, endpoint ครบ 18 ตัว, business rules, และ schema ที่ต้องจำขึ้นใจ

## 🚀 ขั้นตอนเริ่มระบบ

```bash
cd backend-real-db
npm install
npm run seed      # สร้าง worldskill2026_real จาก seed_data.sql
npm start         # หรือ npm run dev — รันที่ port 8080
```

## 👤 บัญชีทดสอบ (plain-text)

| role | username | password | candidate_code |
|------|----------|----------|----------------|
| judge | `admin` | `password` | — |
| manager | `manager` | `password` | — |
| candidate | `candidate1`, `candidate2` | `123456` | `C01`, `C02` |

## 🗄️ Schema ต้องจำ (5 ตาราง)

| ตาราง | คอลัมน์ | จุดที่พลาดบ่อย |
|-------|--------|----------------|
| `users` | id, username, **password**, role, full_name, **candidate_code** | plain-text ไม่มี hash · candidate_code = C01.. |
| `sessions` | id, **status** (`initialized`/`active`/`closed`), updated_at | ปิดด้วย judge · timer = [บทเสริม](/backend-real-db/26-session-timer) |
| `tasks` | id, title, description | |
| `submissions` | id, candidate_id, **task_id**, frontend_url, backend_url, status (`submitted`/`recheck`/`confirmed`), created_at | ผูก task ไม่ใช่ session |
| `results` | id, submission_id, **score**, status (`pending`/`confirmed`) | ไม่มี candidate_id → ต้อง JOIN |

## 🔌 Endpoint ทั้งหมด (18)

| Method | Path | role | บท |
|--------|------|------|----|
| POST | `/api/login` | ทุกคน | 10 |
| POST | `/api/logout` | login | 10 |
| GET | `/api/config` | login | 12 |
| GET | `/api/tasks` | login | 13 |
| GET | `/api/my-submission` | candidate | 14 |
| POST | `/api/my-submission` | candidate | 15 |
| PUT | `/api/my-submission` | candidate | 15 |
| GET | `/api/my-result` | candidate | 16 |
| PUT | `/api/session/start` | judge | 17 |
| PUT | `/api/session/close` | judge | 17 |
| GET | `/api/candidates` | judge | 18 |
| GET | `/api/submissions` | judge | 19 |
| POST | `/api/submissions/:id/recheck` | judge | 20 |
| PUT | `/api/results/:candidate_id/confirm` | judge | 21 |
| GET | `/api/statistics/summary` | manager | 22 |
| GET | `/api/statistics/status` | manager | 22 |
| GET | `/api/statistics/ranking` | manager | 23 |
| GET | `/api/report` | manager | 24 |

## 📏 Business Rules

| กฎ | HTTP |
|----|------|
| ส่ง/แก้ submission ได้เฉพาะ session `active` | 403 |
| 1 candidate = 1 submission ต่อ task | 409 |
| URL ต้องเป็น http(s) **และเป็น LAN/localhost** (ไม่ใช่โดเมน/public IP) | 400 |
| recheck ไม่ได้ถ้า result `confirmed` แล้ว | 403 |
| confirm ซ้ำไม่ได้ | 400 |
| confirm candidate ที่ยังไม่มี result | 404 |

## 📋 รูปแบบ Response

```js
// สำเร็จ
{ success: true, data: ..., meta: {} }
// ผิดพลาด
{ success: false, message: "..." }
```

## ✅ Flow ทดสอบทั้งระบบ (end-to-end)

1. `npm run seed` → `npm start`
2. judge `admin` login → `PUT /session/start` (active)
3. candidate `candidate2` login → `POST /my-submission` (201)
4. judge → `POST /submissions/:id/recheck` → ได้ score
5. judge → `PUT /results/:candidate_id/confirm` → confirmed
6. manager `manager` login → ดู `/statistics/summary`, `/statistics/ranking`, `/report?format=csv`

ผ่านครบ = backend พร้อมแข่ง ➜ ไปต่อ [ฝั่ง Frontend](/frontend-simple-real-db/01-overview)
