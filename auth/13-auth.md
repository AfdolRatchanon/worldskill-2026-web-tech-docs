# บทที่ 13 — Auth Routes & Login

> **บทนี้เตรียมอะไร:** เชื่อม route กับ controller จนทดสอบ Postman ได้จริง — นี่คือครั้งแรกที่ระบบ login ทำงานได้จริง

## ชิ้นงาน — สร้าง `src/routes/auth.js`

```
backend/
└── src/
    ├── controllers/
    │   └── authController.js
    ├── middlewares/
    │   └── auth.js
    ├── routes/
    │   └── auth.js   ← สร้างในบทนี้
    └── app.js        ← แก้ในบทนี้ (เพิ่ม route)
```

สร้างไฟล์ `backend/src/routes/auth.js`:

```js
// routes/auth.js — บทที่ 13
const router       = require('express').Router();
const authenticate = require('../middlewares/auth');
const { login, logout } = require('../controllers/authController');

router.post('/login',  login);
router.post('/logout', authenticate, logout);  // ต้อง login ก่อนจึง logout ได้

module.exports = router;
```

## แก้ `src/app.js` — เพิ่ม auth route

```js
// app.js — บทที่ 13 เพิ่ม auth route
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

app.use('/api', require('./routes/auth'));              // [!code ++]

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
```

## รัน Seed ก่อนทดสอบ

:::warning
ต้อง seed ก่อนทดสอบ login — ถ้า database ไม่มี user จะ login ไม่ได้เสมอ
:::

```bash
npm run seed
```

## ทดสอบ Postman

**POST /api/login** — login สำเร็จ

```
POST http://localhost:8080/api/login
Body (raw JSON):
{
  "username": "judge01",
  "password": "judge123"
}
```

ต้องได้:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "role": "judge",
    "full_name": "Judge One"
  },
  "meta": {}
}
```

> คัดลอก `token` ไว้ใช้ในทุก request ที่ต้องการ authorization ตั้งแต่บทที่ 15 เป็นต้นไป

**POST /api/login** — password ผิด

```json
{ "username": "judge01", "password": "wrongpassword" }
```

ต้องได้: `{ "success": false, "message": "Invalid credentials" }` (status 401)

**POST /api/logout**

```
POST http://localhost:8080/api/logout
Headers:
  Authorization: Bearer <token จาก login>
```

ต้องได้: `{ "success": true, "data": null, "meta": {} }`

:::warning
ลืมใส่ `Bearer ` (มี space) นำหน้า token จะได้ 401 ทันที
:::

## Common Errors

| Error | สาเหตุ | วิธีแก้ |
|-------|--------|---------| 
| `Cannot POST /api/login` | ยังไม่ได้เพิ่ม route ใน `app.js` | เพิ่ม `app.use('/api', require('./routes/auth'))` |
| `Invalid credentials` | password ผิด หรือยังไม่ได้ seed | รัน `npm run seed` แล้วลองใหม่ |
| 401 ตอน logout | ลืมใส่ header Authorization | ใส่ `Authorization: Bearer <token>` |
| `Server error` | DB connection ล้มเหลว | ตรวจ `.env` และ MariaDB ว่าเปิดอยู่ |
