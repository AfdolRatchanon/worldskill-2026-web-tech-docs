# 📑 API Reference — สรุปทุก Endpoint (สำหรับท่อง)

> **หน้านี้คืออะไร:** สรุป **request/response + status code ของทุก endpoint** ไว้หน้าเดียวสำหรับทบทวน/ท่องก่อนแข่ง — ตรงกับที่สอนทีละบทใน [บท 10–24](/backend-real-db/10-auth) · อยากดูวิธีสร้างทีละ endpoint ให้กดเข้าบทนั้นๆ

Base URL: `http://localhost:8080/api` — ทุก endpoint ขึ้นต้นด้วย `/api`

## รูปแบบ Response มาตรฐาน
ทุก endpoint ตอบกลับเป็น JSON ใน 2 รูปแบบนี้เสมอ:

```json
// สำเร็จ
{
  "success": true,
  "data": <ค่า>,
  "meta": {}
}
```

```json
// ผิดพลาด
{
  "success": false,
  "message": "<ข้อความ>"
}
```

## Auth / Role ที่ใช้ร่วมกัน
การตรวจสิทธิ์ทำผ่าน **middleware** 2 ตัว ที่คั่นก่อนเข้า controller:

- `authenticate` (middleware) — ตรวจ token จาก header `Authorization: Bearer <token>`
  - ไม่มี token / token ผิด → **401** `No token provided` หรือ `Invalid or expired token`
  - ผ่านแล้วจะแนบข้อมูล user ไว้ที่ `req.user`
- `authorize(...roles)` (middleware) — ตรวจว่า `req.user.role` ตรงกับ role ที่กำหนด
  - role ไม่ตรง → **403** `Access denied`
- error ในเซิร์ฟเวอร์ → **500** `Server error`

> ลำดับการทำงาน: `authenticate` → `authorize` → controller

| สิทธิ์ที่ต้องมี | middleware ที่คั่น | ความหมาย |
|---|---|---|
| 🔓 public | (ไม่มี) | ไม่ต้อง login |
| 🔑 auth | `authenticate` | login แล้ว (role ใดก็ได้) |
| 👤 candidate / ⚖️ judge / 📊 manager | `authenticate` + `authorize('<role>')` | ต้องเป็น role นั้น |

---

## 1) Auth

### `POST /login` 🔓
ขอ token เข้าระบบ
- Body: `{ "username": "...", "password": "..." }`
- **400** ถ้าไม่กรอก username/password
- **401** `Invalid credentials` ถ้า user/รหัสผ่านผิด
- **200**:
```json
{
  "success": true,
  "data": {
    "token": "eyJ...",
    "role": "candidate",
    "full_name": "Competitor One",
    "candidate_code": "C01"
  },
  "meta": {}
}
```

### `POST /logout` 🔑
- **200**:
```json
{
  "success": true,
  "data": null,
  "meta": {}
}
```

---

## 2) Config & Tasks

### `GET /config` 🔑
สถานะ session ปัจจุบัน (แถวล่าสุด)
- **200**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "active",
    "updated_at": "2026-06-25T03:00:00.000Z"
  },
  "meta": {}
}
```
- ถ้ายังไม่มี session → `data: null`

### `GET /tasks` 🔑
รายการโจทย์ทั้งหมด
- **200**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Web Technologies 2026",
      "description": "Build a Test Submission Management System"
    }
  ],
  "meta": {}
}
```

---

## 3) Submissions (ผลงาน)

### `GET /my-submission` 👤 candidate
ดู submission ของตัวเองในโจทย์ปัจจุบัน
- **200**: `data` = object หรือ `null` ถ้ายังไม่ส่ง
```json
{
  "success": true,
  "data": {
    "id": 1,
    "candidate_id": 3,
    "task_id": 1,
    "frontend_url": "http://10.0.0.1:3000",
    "backend_url": "http://10.0.0.1:8000/api",
    "status": "submitted",
    "created_at": "2026-06-25T02:00:00.000Z"
  },
  "meta": {}
}
```

### `POST /my-submission` 👤 candidate
ส่งผลงานครั้งแรก (มีได้ 1 รายการ/คน)
- Body: `{ "frontend_url": "http://...", "backend_url": "http://..." }`
- **403** `Session is not active` (session ยังไม่เปิด)
- **404** `No task available`
- **400** ถ้า URL ว่าง หรือไม่ขึ้นต้นด้วย `http://` / `https://`
- **409** `Submission already exists. Use PUT to update.`
- **201**: `data` = submission ที่เพิ่งสร้าง (โครงสร้างเหมือน GET ด้านบน)

### `PUT /my-submission` 👤 candidate
แก้ไขผลงานเดิม
- Body: เหมือน POST
- **403** session ไม่ active / **404** ไม่มี task / **400** URL ผิด
- **404** `No submission found. Use POST to create.`
- **200**: `data` = submission ที่อัปเดตแล้ว

### `GET /submissions` ⚖️ judge
ดู submission ทั้งหมด (รวมข้อมูลผู้เข้าแข่ง)
- **200**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "candidate_id": 3,
      "task_id": 1,
      "frontend_url": "http://10.0.0.1:3000",
      "backend_url": "http://10.0.0.1:8000/api",
      "status": "submitted",
      "created_at": "...",
      "full_name": "Competitor One",
      "username": "candidate1",
      "candidate_code": "C01"
    }
  ],
  "meta": {}
}
```

### `POST /submissions/:id/recheck` ⚖️ judge
สั่งตรวจซ้ำ (เดโม่: สุ่มคะแนน, สร้าง/อัปเดต result เป็น `pending`)
- **404** `Submission not found`
- **403** `Cannot re-check a confirmed result`
- **200**:
```json
{
  "success": true,
  "data": { "message": "Re-check started" },
  "meta": {}
}
```

---

## 4) Candidates (เฉพาะ judge)

### `GET /candidates` ⚖️ judge
รายชื่อผู้เข้าแข่งทั้งหมด พร้อมสถานะ submission และคะแนนในโจทย์ปัจจุบัน
(ใช้ LEFT JOIN — ถ้าใครยังไม่ส่ง ฟิลด์ของ submission/result จะเป็น `null`)
- **200**:
```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "username": "candidate1",
      "full_name": "Competitor One",
      "candidate_code": "C01",
      "submission_id": 1,
      "submission_status": "submitted",
      "frontend_url": "http://10.0.0.1:3000",
      "backend_url": "http://10.0.0.1:8000/api",
      "created_at": "2026-06-25T02:00:00.000Z",
      "score": "45.50",
      "result_status": "pending"
    }
  ],
  "meta": {}
}
```

---

## 5) Results (ผลคะแนน)

### `GET /my-result` 👤 candidate
ผลคะแนนล่าสุดของตัวเอง
- **200**: `data` = object หรือ `null`
```json
{
  "success": true,
  "data": {
    "id": 1,
    "submission_id": 1,
    "score": "45.50",
    "status": "pending"
  },
  "meta": {}
}
```

### `PUT /results/:candidate_id/confirm` ⚖️ judge
ยืนยันผลคะแนนของผู้เข้าแข่ง (result + submission → `confirmed`)
- **404** `Result not found`
- **400** `Result is already confirmed`
- **200**: `data` = result ที่ status เป็น `confirmed`

---

## 6) Session (เฉพาะ judge)

### `PUT /session/start` ⚖️ judge
เปิดสอบ → `status: active`
- **404** `No session found`
- **400** `Session is already active`
- **200**: `data` = session ที่อัปเดต

### `PUT /session/close` ⚖️ judge
ปิดสอบ → `status: closed`
- **400** `Session is not active`
- **200**: `data` = session ที่อัปเดต

---

## 7) Statistics (เฉพาะ manager)

### `GET /statistics/summary` 📊
- **200**:
```json
{
  "success": true,
  "data": {
    "total_candidates": 2,
    "submitted": 1,
    "confirmed": 0,
    "average_score": 0,
    "session": {
      "id": 1,
      "status": "active",
      "updated_at": "..."
    }
  },
  "meta": {}
}
```

### `GET /statistics/ranking` 📊
จัดอันดับเฉพาะผลที่ `confirmed` (เรียงคะแนนมาก→น้อย)
- **200**:
```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "username": "candidate1",
      "full_name": "Competitor One",
      "candidate_code": "C01",
      "score": "88.00",
      "status": "confirmed",
      "rank": 1
    }
  ],
  "meta": {}
}
```

### `GET /statistics/status` 📊
นับผ่าน/ไม่ผ่าน (เกณฑ์ผ่าน = 50)
- **200**:
```json
{
  "success": true,
  "data": {
    "pass_count": 1,
    "fail_count": 0,
    "total": 1,
    "pass_threshold": 50
  },
  "meta": {}
}
```

---

## 8) Report (เฉพาะ manager)

### `GET /report?format=json|csv` 📊
รายงานผลทั้งหมด (เรียงคะแนนมาก→น้อย)
- `format=json` (ค่าเริ่มต้น) → **200**:
```json
{
  "success": true,
  "data": [
    {
      "candidate_code": "C01",
      "username": "candidate1",
      "full_name": "Competitor One",
      "score": "45.50",
      "status": "pending",
      "frontend_url": "http://10.0.0.1:3000",
      "backend_url": "http://10.0.0.1:8000/api"
    }
  ],
  "meta": {}
}
```
- `format=csv` → **200** ไฟล์ CSV (header: `Content-Type: text/csv`, ดาวน์โหลด `report.csv`)
  คอลัมน์: `Candidate Code,Username,Full Name,Score,Status`

---

## สรุป Status Code ที่เจอบ่อย
| Code | ความหมาย |
|---|---|
| 200 | สำเร็จ (GET / PUT / logout) |
| 201 | สร้างใหม่สำเร็จ (POST submission) |
| 400 | ข้อมูลไม่ถูกต้อง / สถานะไม่อนุญาต |
| 401 | ไม่ได้ login / token ผิด |
| 403 | role ไม่มีสิทธิ์ / session ไม่ active / ผล confirmed แล้ว |
| 404 | ไม่พบข้อมูล |
| 409 | ข้อมูลซ้ำ (ส่ง submission ซ้ำ) |
| 500 | เซิร์ฟเวอร์ผิดพลาด |
