# บทที่ 27 — Sessions

## GET /api/sessions

> Manager ต้องการดูประวัติ sessions ทั้งหมด (ทุก session ที่เคยเปิด) — จึงต้องมี endpoint นี้

```
backend/
└── src/
    ├── controllers/
    │   └── sessionsController.js   ← สร้างในบทนี้
    ├── routes/
    │   └── sessions.js             ← สร้างในบทนี้
    └── app.js                      ← แก้ในบทนี้
```

:::tip
ระวังสับสน: `session.js` (บท 20) = เปิด/ปิด session ปัจจุบัน, `sessions.js` (บทนี้) = ดูประวัติทั้งหมด
:::

**`routes/sessions.js`**

```js
// routes/sessions.js — บทที่ 27
const router       = require('express').Router();
const authenticate = require('../middlewares/auth');
const authorize    = require('../middlewares/role');
const { getSessions } = require('../controllers/sessionsController');

router.get('/sessions', authenticate, authorize('manager'), getSessions);  // [!code ++]

module.exports = router;
```

**`controllers/sessionsController.js`**

```js
// sessionsController.js — บทที่ 27
const pool = require('../config/db');

async function getSessions(req, res) {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM test_sessions ORDER BY id DESC'   // ทุก session เรียงล่าสุดก่อน
    );
    res.json({ success: true, data: rows, meta: {} });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { getSessions };
```

**`app.js`**

```js
app.use('/api', require('./routes/statistics'));
app.use('/api', require('./routes/sessions'));      // [!code ++]
```

**ทดสอบ Postman:**

```
GET http://localhost:8080/api/sessions
Authorization: Bearer <token ของ manager01>
```

ต้องได้:
```json
{
  "success": true,
  "data": [
    { "id": 1, "status": "waiting", "opened_at": null, "closed_at": null, "duration_minutes": 90 }
  ],
  "meta": {}
}
```

> Pattern: Route → Controller → pool.execute() → res.json() — เหมือนทุก endpoint

## Common Errors

| Error | สาเหตุ | วิธีแก้ |
|-------|--------|---------| 
| 403 `Access denied` | ใช้ token ของ judge/candidate | login เป็น manager ก่อน |
| สับสนกับ session.js | ชื่อไฟล์คล้ายกัน | sessions**s** = history, session = control |
