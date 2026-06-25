# บทที่ 17 — Session Control

> **บทนี้เตรียมอะไร:** สร้าง `PUT /api/session/start` และ `PUT /api/session/close` ให้ judge เปิด/ปิดการสอบ — สถานะ `initialized` → `active` → `closed` (single-session: มี session เดียวทั้งงาน)

## endpoint นี้ทำอะไร

| endpoint | ทำอะไร |
|----------|--------|
| `PUT /session/start` | เปลี่ยน session เป็น `active` (candidate ส่งงานได้) |
| `PUT /session/close` | เปลี่ยน session เป็น `closed` (ส่งงานไม่ได้แล้ว) |

## 1. `src/controllers/sessionController.js`

```js
const pool = require('../config/db');

async function startSession(req, res) {
  try {
    const [rows] = await pool.execute('SELECT * FROM sessions ORDER BY id DESC LIMIT 1');
    const session = rows[0];

    if (!session) {
      return res.status(404).json({ success: false, message: 'No session found' });
    }
    if (session.status === 'active') {
      return res.status(400).json({ success: false, message: 'Session is already active' });
    }

    // Single-session: เปิด = ปรับแถวล่าสุดเป็น active
    // ไม่สร้างแถวใหม่ และไม่ล้าง submission/score (ล้างข้อมูลทำผ่าน re-seed เท่านั้น)
    await pool.execute(
      "UPDATE sessions SET status = 'active' WHERE id = ?",
      [session.id]
    );
    const [updated] = await pool.execute('SELECT * FROM sessions WHERE id = ?', [session.id]);
    res.json({ success: true, data: updated[0], meta: {} });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function closeSession(req, res) {
  try {
    const [rows] = await pool.execute('SELECT * FROM sessions ORDER BY id DESC LIMIT 1');
    const session = rows[0];

    if (!session || session.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Session is not active' });
    }

    await pool.execute("UPDATE sessions SET status = 'closed' WHERE id = ?", [session.id]);
    const [updated] = await pool.execute('SELECT * FROM sessions WHERE id = ?', [session.id]);
    res.json({ success: true, data: updated[0], meta: {} });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { startSession, closeSession };
```

::: danger จุดต่างจากเวอร์ชันเดิม — Single-session
- มี session เดียวทั้งงาน (ตาม TP2026 "the testing session") — เปิด = ปรับแถวเดิมเป็น `active` **ไม่สร้างแถวใหม่** และไม่ล้าง submission/score (กันคะแนนหายถ้าเผลอปิดแล้วเปิดต่อ)
- ปิด session ได้ทางเดียวคือ judge กด `/session/close` · ไม่มีหน้า "ประวัติ session" เพราะเป็น session เดียว
- สถานะคือ `initialized`/`active`/`closed` (เวอร์ชันเดิมคือ `waiting`/`open`/`closed`)
:::

::: tip อยากให้ปิดเองเมื่อหมดเวลา (ออปชัน)
core ปิด session ด้วย judge เท่านั้น — ถ้าต้องการ "หมดเวลา → ปิดอัตโนมัติ + countdown" ให้บันทึก `started_at` ตอนเปิด ตาม [บทเสริม](/backend-real-db/26-session-timer)
:::

## 2. `src/routes/session.js`

```js
const router       = require('express').Router();
const authenticate = require('../middlewares/auth');
const authorize    = require('../middlewares/role');
const { startSession, closeSession } = require('../controllers/sessionController');

router.put('/session/start', authenticate, authorize('judge'), startSession);
router.put('/session/close', authenticate, authorize('judge'), closeSession);

module.exports = router;
```

## 3. ต่อเข้า `src/app.js`

```js
app.use('/api', require('./routes/session'));   // [!code ++]
```

## ทดสอบ

### 📮 ใน Postman

| ช่อง | ค่า |
|------|-----|
| Method | `PUT` |
| URL | `http://localhost:8080/api/session/start` (และ `/session/close`) |
| Authorization | Bearer Token → token **judge** |
| Body | — |

start → **200** `active` · start ซ้ำ → **400** · close → **200** `closed`

login `admin`/`password` (judge) แล้ว:

| ลำดับ | request | ผล |
|------|---------|-----|
| 1 | `PUT /session/start` | 200 status `active` |
| 2 | `GET /config` | status `active` |
| 3 | (กลับไป) candidate `POST /my-submission` | ตอนนี้ได้ **201** แล้ว! |
| 4 | `PUT /session/start` ซ้ำ | 400 already active |
| 5 | `PUT /session/close` | 200 status `closed` |
