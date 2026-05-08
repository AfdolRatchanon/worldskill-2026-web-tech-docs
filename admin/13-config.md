# บทที่ 13 — Config (การตั้งค่าการแข่งขัน)

> **บทนี้เตรียมอะไร:** สร้าง API สำหรับดึงข้อมูลการตั้งค่าเบื้องต้นของการแข่งขัน (เช่น ชื่อการแข่งขัน, เวลาปัจจุบันของเซิร์ฟเวอร์) และอัปเดต `app.js`

## ไฟล์ที่ต้องสร้างในบทนี้

| ไฟล์ | หน้าที่ |
|------|--------|
| `backend/src/routes/config.js` | ลงทะเบียน URL ของ API Config |
| `backend/src/controllers/configController.js` | เขียน Logic สำหรับดึงข้อมูล Config จากฐานข้อมูล |

**อัปเดต:**

| ไฟล์ | สิ่งที่เพิ่ม |
|------|------------|
| `backend/src/app.js` | เพิ่ม route สำหรับ config (`/api/config`) |

## METHOD GET /api/config

API นี้ทำหน้าที่ส่งข้อมูลการตั้งค่าพื้นฐานกลับไปให้ Frontend

**สร้าง: `backend/src/controllers/configController.js`**

สร้างไฟล์ `configController.js` ในโฟลเดอร์ `src/controllers/`:

```js
const pool = require('../config/db'); // นำเข้า Connection Pool จากบทที่ 8 เพื่อต่อ Database

async function getConfig(req, res) {
  try {
    // ดึงค่า config ทั้งหมดมาจากตาราง config_options (ตารางนี้มาจากไฟล์ Database)
    const [rows] = await pool.execute('SELECT option_key, option_value FROM config_options');
    
    // แปลงข้อมูลจาก Array (แบบตาราง) ให้เป็น Object แบบ key-value ให้ Frontend ใช้ง่าย
    const configData = {};
    rows.forEach(row => {
      configData[row.option_key] = row.option_value;
    });

    // ส่ง Response กลับไปให้ Client
    res.json({
      success: true,
      data: {
        server_time: new Date().toISOString(), // แนบเวลาปัจจุบันของ Server ไปด้วย
        ...configData // กระจายข้อมูล config ทั้งหมดเข้าไปใน data object
      },
      meta: {}
    });
  } catch (error) {
    // จัดการกรณีเกิด Error ขณะ Query
    console.error('Error in getConfig:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Export function ออกไปใช้ที่ Router
module.exports = {
  getConfig
};
```

> Pattern: `Route.js` → `Controller.js` → `pool.execute()` → `res.json()`

**สร้าง: `backend/src/routes/config.js`**

สร้างไฟล์ `config.js` ในโฟลเดอร์ `src/routes/`:

```js
const router = require('express').Router();
const authenticate = require('../middlewares/auth'); // ใช้ Middleware ตรวจสอบ Token
const { getConfig } = require('../controllers/configController'); // นำเข้า Function จาก Controller

// เมื่อมี GET Request มาที่ '/' (ซึ่งเดี๋ยวจะถูกเติม prefix เป็น /api/config)
// ให้รัน authenticate ก่อน ถ้าผ่านถึงจะรัน getConfig
router.get('/', authenticate, getConfig);

module.exports = router;
```

## อัปเดต app.js — เพิ่ม Config Route

เปิดไฟล์ `backend/src/app.js` และเพิ่มบรรทัดดังต่อไปนี้

```js
// app.js (บทที่ 13)
require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

app.use('/api', require('./routes/auth')); // ของเดิม (บทที่ 12)
app.use('/api/config', require('./routes/config')); // [!code ++]

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
```

**สิ่งที่เพิ่มจากบทที่ 12:** เพิ่ม `app.use('/api/config', require('./routes/config'));` ซึ่งเป็นการบอก Express ว่าเมื่อมี Request ขึ้นต้นด้วย `/api/config` ให้ส่งไปให้ `routes/config.js` จัดการ

## ทดสอบ

เปิด Postman แล้วทำตามขั้นตอนนี้:

1. รัน Server (`npm run dev`)
2. ต้องนำ Token จากการ Login ในบทที่ 12 มาใช้ (ถ้าหมดอายุ หรือเพิ่งเปิด Server ใหม่ ให้ยิง Login ก่อนเพื่อรับ Token ใหม่)

**ทดสอบ GET /api/config (ใส่ Token ถูกต้อง)**

```
GET http://localhost:8080/api/config
Authorization: Bearer <วาง Token ตรงนี้>
```

ต้องได้ **200 OK** พร้อมข้อมูล Config:
```json
{
  "success": true,
  "data": {
    "server_time": "2024-05-20T10:00:00.000Z",
    "competition_name": "WorldSkills 2026",
    "status": "active"
  },
  "meta": {}
}
```
*(ค่า Config จริงจะขึ้นอยู่กับข้อมูลใน Database)*

**ทดสอบ GET /api/config (ไม่ใส่ Token)**

```
GET http://localhost:8080/api/config
(ไม่ใส่ Header Authorization)
```

ต้องได้ **401 Unauthorized**:
```json
{
  "success": false,
  "message": "No token provided"
}
```

## Common Errors

| Error | สาเหตุ | วิธีแก้ |
|-------|--------|---------|
| `Table 'worldskills_db.config_options' doesn't exist` | ยังไม่ได้สร้างตาราง หรือไม่ได้รันสคริปต์ Database | รันสคริปต์ SQL สร้าง Database ให้เรียบร้อยตามบทที่ 4 |
| `Cannot find module '../config/db'` | Controller หาไฟล์ db ไม่เจอ หรือ import ผิด Path | ตรวจสอบว่าไฟล์อยู่ใน `src/config/db.js` และใช้ `../config/db` ถูกต้อง |
| ได้ 401 ตลอดทั้งที่เพิ่งก๊อป Token | Token หมดอายุ หรือ Restart Server โดยไม่ได้ตั้งค่า `JWT_SECRET` ให้เหมือนเดิม (เปลี่ยน Secret ใน `.env`) | ให้ลอง Login ใหม่ และเอา Token อันล่าสุดมาใส่ |
