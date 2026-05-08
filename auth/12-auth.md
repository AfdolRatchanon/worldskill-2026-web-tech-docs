# บทที่ 12 — Login และ Logout

> **บทนี้ทำอะไร:** ประกอบทุกอย่างจากบท 10–11 เข้าด้วยกัน — สร้าง routes/auth.js, เพิ่ม logout, และอัปเดต app.js ให้รับ auth route จริง

## สิ่งที่มีแล้วจากบท 10–11

| บท | ไฟล์ที่สร้างแล้ว |
|----|----------------|
| 10 | `src/controllers/authController.js` (login + bcrypt) |
| 11 | `src/middlewares/auth.js` (authenticate) + อัปเดต authController (เพิ่ม jwt.sign) |

## ไฟล์ที่สร้างในบทนี้

| ไฟล์ | หน้าที่ |
|------|--------|
| `backend/src/routes/auth.js` | ลงทะเบียน URL ของ login/logout |

**อัปเดต:**

| ไฟล์ | สิ่งที่เพิ่ม |
|------|------------|
| `backend/src/controllers/authController.js` | เพิ่ม `logout` function |
| `backend/src/app.js` | เพิ่ม auth route |

## สร้าง: `backend/src/routes/auth.js`

สร้างโฟลเดอร์ `src/routes/` แล้วสร้างไฟล์ `auth.js`:

```js
const router       = require('express').Router();
const authenticate = require('../middlewares/auth');         // จากบทที่ 11
const { login, logout } = require('../controllers/authController');

router.post('/login',  login);                              // ไม่ต้อง token — ยังไม่มี
router.post('/logout', authenticate, logout);               // ต้องผ่าน authenticate ก่อน

module.exports = router;
```

## เพิ่ม logout ใน authController.js

เปิดไฟล์ `src/controllers/authController.js` แล้วเพิ่มต่อจาก `function login`:

```js
async function logout(req, res) {
  // JWT stateless — server ไม่ได้เก็บ token ไว้ที่ไหน
  // การ logout จริงๆ คือ client ลบ token ออกจาก localStorage เอง
  res.json({ success: true, data: null, meta: {} });
}

module.exports = { login, logout }; // อัปเดต exports ให้รวม logout
```

## อัปเดต app.js — เพิ่ม auth route

```js
// app.js — เพิ่ม auth route (บทที่ 12)
require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

app.use('/api', require('./routes/auth')); // [!code ++]

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
```

**สิ่งที่เพิ่มจากบทที่ 8:** บรรทัด `app.use('/api', require('./routes/auth'))` — ลงทะเบียน auth routes ทั้งหมด prefix `/api` นำหน้า ทำให้ `/login` กลายเป็น `/api/login`

## ทดสอบใน Postman

รัน server ก่อน: `npm run dev`

### POST /api/login — สำเร็จ

```
POST http://localhost:8080/api/login
Content-Type: application/json

{
  "username": "judge01",
  "password": "judge123"
}
```

ต้องได้ **200**:
```json
{
  "success": true,
  "data": { "token": "eyJhbGci...", "role": "judge", "full_name": "Judge One" },
  "meta": {}
}
```

คัดลอก `token` ไว้ใช้ทดสอบต่อไป

### POST /api/login — password ผิด

```
POST http://localhost:8080/api/login
{ "username": "judge01", "password": "wrong" }
```

ต้องได้ **401**: `{ "success": false, "message": "Invalid credentials" }`

### POST /api/logout — สำเร็จ

```
POST http://localhost:8080/api/logout
Authorization: Bearer <token จาก login>
```

ต้องได้ **200**: `{ "success": true, "data": null, "meta": {} }`

### POST /api/logout — ไม่มี token

```
POST http://localhost:8080/api/logout
(ไม่ใส่ Authorization header)
```

ต้องได้ **401**: `{ "success": false, "message": "No token provided" }`

## Common Errors

| Error | สาเหตุ | วิธีแก้ |
|-------|--------|---------|
| `Invalid credentials` | username หรือ password ผิด | ตรวจ seed: `judge01 / judge123` หรือรัน `npm run seed` ใหม่ |
| `No token provided` | ลืมใส่ Authorization header | เพิ่ม Header: `Authorization` → `Bearer <token>` |
| `Invalid or expired token` | token ผิดหรือหมดอายุ | login ใหม่เพื่อรับ token ใหม่ |
| `Cannot find module '../middlewares/auth'` | สร้างไฟล์ผิดตำแหน่ง | ตรวจว่า `auth.js` อยู่ใน `src/middlewares/` |
| `req.body` เป็น `undefined` | ลืม `app.use(express.json())` ใน app.js | ตรวจ app.js บทที่ 7 |
| `401` ทุก request แม้ token ถูก | `JWT_SECRET` ใน .env ถูกเปลี่ยน | login ใหม่เพื่อรับ token ที่ signed ด้วย secret ปัจจุบัน |
