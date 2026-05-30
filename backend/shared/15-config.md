# บทที่ 15 — Config

## GET /api/config

> ทุก role ต้องการรู้สถานะ session ปัจจุบัน (open/waiting/closed) ก่อนทำอะไร — จึงต้องมี endpoint นี้

```
backend/
└── src/
    ├── controllers/
    │   └── configController.js   ← สร้างในบทนี้
    ├── routes/
    │   └── config.js             ← สร้างในบทนี้
    └── app.js                    ← แก้ในบทนี้
```

**`routes/config.js`**

```js
// routes/config.js — บทที่ 15
const router       = require('express').Router();
const authenticate = require('../middlewares/auth');
const { getConfig } = require('../controllers/configController');

router.get('/config', authenticate, getConfig);  // [!code ++]

module.exports = router;
```

**`controllers/configController.js`**

```js
// configController.js — บทที่ 15
const pool = require('../config/db');

async function getConfig(req, res) {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM test_sessions ORDER BY id DESC LIMIT 1'  // ดึงทุก status รวม waiting เพื่อแสดงสถานะจริง
    );
    res.json({ success: true, data: rows[0] || null, meta: {} });  // null ถ้ายังไม่มี session เลยในระบบ
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { getConfig };
```

**`app.js`**

```js
// app.js — บทที่ 15 เพิ่ม route config
app.use('/api', require('./routes/auth'));
app.use('/api', require('./routes/config'));    // [!code ++]
```

**ทดสอบ Postman:**

```
GET http://localhost:8080/api/config
Authorization: Bearer <token จากบท 13>
```

ต้องได้:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "waiting",
    "opened_at": null,
    "closed_at": null,
    "duration_minutes": 90
  },
  "meta": {}
}
```

> Pattern: Route → Controller → pool.execute() → res.json() — เหมือนทุก endpoint

## Common Errors

| Error | สาเหตุ | วิธีแก้ |
|-------|--------|---------| 
| `Cannot GET /api/config` | ยังไม่ได้เพิ่ม route ใน `app.js` | เพิ่ม `app.use('/api', require('./routes/config'))` |
| `data: null` | ยังไม่มี test_session ใน DB | รัน `npm run seed` |
| 401 | ลืมส่ง token | ใส่ `Authorization: Bearer <token>` |
