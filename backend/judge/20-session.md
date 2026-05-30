# บทที่ 20 — Session Control

## PUT /api/session/start และ PUT /api/session/close

> Judge ต้องเปิด session ก่อนที่ candidate จะส่ง URL ได้ และปิดเมื่อหมดเวลา — จึงต้องมีทั้งสอง endpoint นี้

```
backend/
└── src/
    ├── controllers/
    │   └── sessionController.js   ← สร้างในบทนี้
    ├── middlewares/
    │   ├── auth.js
    │   ├── role.js
    │   └── autoClose.js           ← สร้างในบทนี้
    ├── routes/
    │   └── session.js             ← สร้างในบทนี้
    └── app.js                     ← แก้ในบทนี้ (เพิ่ม autoClose + route)
```

## สร้าง `src/middlewares/autoClose.js`

```js
// autoClose.js — ตรวจทุก request ว่า session หมดเวลาหรือยัง
const pool = require('../config/db');

async function autoCloseIfExpired(req, res, next) {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM test_sessions WHERE status = 'open' ORDER BY id DESC LIMIT 1"
    );
    const session = rows[0];
    if (session) {
      const expiredAt = new Date(session.opened_at).getTime() + session.duration_minutes * 60 * 1000;
      if (Date.now() > expiredAt) {                                           // ถ้าเลยเวลาแล้ว
        await pool.execute(
          "UPDATE test_sessions SET status = 'closed', closed_at = NOW() WHERE id = ?",
          [session.id]
        );
      }
    }
  } catch {
    // non-blocking — ไม่ให้ error ตรงนี้ขัด request หลัก
  }
  next();                                                                      // ให้ผ่านเสมอ
}

module.exports = autoCloseIfExpired;
```

**`routes/session.js`**

```js
// routes/session.js — บทที่ 20
const router       = require('express').Router();
const authenticate = require('../middlewares/auth');
const authorize    = require('../middlewares/role');
const { startSession, closeSession } = require('../controllers/sessionController');

router.put('/session/start', authenticate, authorize('judge'), startSession);  // [!code ++]
router.put('/session/close', authenticate, authorize('judge'), closeSession);  // [!code ++]

module.exports = router;
```

**`controllers/sessionController.js`**

```js
// sessionController.js — บทที่ 20
const pool = require('../config/db');

async function startSession(req, res) {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM test_sessions ORDER BY id DESC LIMIT 1'
    );
    const session = rows[0];

    if (!session) {
      return res.status(404).json({ success: false, message: 'No session found' });
    }
    if (session.status === 'open') {
      return res.status(400).json({ success: false, message: 'Session is already open' });
    }

    if (session.status === 'closed') {           // closed → INSERT row ใหม่เพื่อเก็บประวัติ ไม่ UPDATE ของเดิม
      const [result] = await pool.execute(
        "INSERT INTO test_sessions (status, opened_at, duration_minutes) VALUES ('open', NOW(), ?)",
        [session.duration_minutes]
      );
      const [newSession] = await pool.execute('SELECT * FROM test_sessions WHERE id = ?', [result.insertId]);
      return res.json({ success: true, data: newSession[0], meta: {} });
    }

    await pool.execute(                           // waiting → open
      "UPDATE test_sessions SET status = 'open', opened_at = NOW() WHERE id = ?",
      [session.id]
    );
    const [updated] = await pool.execute('SELECT * FROM test_sessions WHERE id = ?', [session.id]);
    res.json({ success: true, data: updated[0], meta: {} });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function closeSession(req, res) {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM test_sessions ORDER BY id DESC LIMIT 1'
    );
    const session = rows[0];

    if (!session || session.status !== 'open') {
      return res.status(400).json({ success: false, message: 'Session is not open' });
    }

    await pool.execute(
      "UPDATE test_sessions SET status = 'closed', closed_at = NOW() WHERE id = ?",
      [session.id]
    );
    const [updated] = await pool.execute('SELECT * FROM test_sessions WHERE id = ?', [session.id]);
    res.json({ success: true, data: updated[0], meta: {} });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { startSession, closeSession };
```

**`app.js`** — เพิ่ม autoClose และ session route

```js
// app.js — บทที่ 20
require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const autoClose = require('./middlewares/autoClose');    // [!code ++]
const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());
app.use(autoClose);                                      // [!code ++]

app.use('/api', require('./routes/auth'));
app.use('/api', require('./routes/config'));
app.use('/api', require('./routes/tasks'));
app.use('/api', require('./routes/submissions'));
app.use('/api', require('./routes/results'));
app.use('/api', require('./routes/session'));             // [!code ++]

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
```

:::warning
`app.use(autoClose)` ต้องวางก่อน routes — ถ้าวางหลัง routes จะไม่ทำงาน
:::

**ทดสอบ Postman:**

```
PUT http://localhost:8080/api/session/start
Authorization: Bearer <token ของ judge01>
```

ต้องได้:
```json
{
  "success": true,
  "data": { "id": 1, "status": "open", "opened_at": "2026-05-13T...", ... },
  "meta": {}
}
```

หลังจาก start session แล้ว ทดสอบ candidate submit URL ได้เลย (บท 18)

> **Session State Machine** — status เปลี่ยนได้ตามลำดับนี้เท่านั้น:
>
> ```
> waiting ──PUT start──→ open ──PUT close──→ closed
>                                               │
>                                  PUT start ───┘ (INSERT row ใหม่ เพื่อเก็บประวัติ)
> ```
>
> judge ดึง session ล่าสุดด้วย `ORDER BY id DESC LIMIT 1` เสมอ ทำให้สามารถเปิดรอบใหม่ได้หลาย session โดยไม่ทับข้อมูลเก่า

> Pattern: Route → Controller → pool.execute() → res.json() — เหมือนทุก endpoint

## Common Errors

| Error | สาเหตุ | วิธีแก้ |
|-------|--------|---------| 
| 400 `Session is already open` | เปิดซ้ำ | ปิดก่อนแล้วค่อยเปิดใหม่ |
| 400 `Session is not open` | ปิดแต่ session ไม่ open | ตรวจสอบ status ด้วย GET /api/config |
| 403 `Access denied` | ใช้ token ของ candidate/manager | login เป็น judge ก่อน |
