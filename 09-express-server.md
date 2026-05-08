# บทที่ 9 — ทบทวนโครงสร้าง Backend

> **บทนี้ทำอะไร:** ทบทวนไฟล์ทั้งหมดที่สร้างในบทที่ 5–8 และตรวจสอบว่า backend skeleton พร้อมก่อนไปสร้าง API

## สิ่งที่สร้างมาแล้วในบทที่ 5–8

| บท | สิ่งที่ทำ | ผลลัพธ์ |
|----|---------|--------|
| 5 | สร้าง Express Hello World | `app.js` ตัวแรก (PORT hardcode) |
| 6 | เพิ่ม dotenv | `app.js` อ่าน PORT จาก `.env` |
| 7 | เพิ่ม cors + express.json() | `app.js` รับ request จาก frontend ได้ |
| 8 | สร้าง db.js + ลบ Hello World | skeleton พร้อม, `db.js` เชื่อมต่อ DB |

## โครงสร้างไฟล์ ณ ตอนนี้

```
backend/
├── .env
├── package.json
└── src/
    ├── app.js
    └── config/
        └── db.js
```

## สถานะ app.js ปัจจุบัน

```js
require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
```

## สถานะ db.js ปัจจุบัน

```js
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:             process.env.DB_HOST,
  port:             process.env.DB_PORT,
  user:             process.env.DB_USER,
  password:         process.env.DB_PASSWORD,
  database:         process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit:  10,
});

module.exports = pool;
```

## Checklist ก่อนไปบทถัดไป

ตรวจสอบให้ครบก่อนไปบทที่ 10:

- [ ] `backend/.env` มีค่าครบทุกตัว (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET, FRONTEND_URL, PORT)
- [ ] `npm run dev` รันแล้วเห็น `Backend running on http://localhost:8080`
- [ ] Postman GET `http://localhost:8080/anything` ได้ **404** (ถูกต้อง)
- [ ] DB connection test ผ่าน (mysql2: OK)

## บทถัดไป

| บท | หัวข้อ | เพิ่มอะไรใน project |
|----|-------|-------------------|
| 10 | bcryptjs | hash password ก่อน login |
| 11 | jsonwebtoken | ออก JWT token หลัง login |
| 12 | Auth API | สร้าง `/api/login` และ `/api/logout` + เพิ่ม route ใน app.js |
