# บทที่ 17 — My Submission (GET)

## GET /api/my-submission

> Candidate ต้องการดูว่าตัวเองส่ง URL อะไรไปแล้วใน session ปัจจุบัน — จึงต้องมี endpoint นี้

```
backend/
└── src/
    ├── controllers/
    │   └── submissionsController.js   ← สร้างในบทนี้ (partial)
    ├── routes/
    │   └── submissions.js             ← สร้างในบทนี้ (partial)
    └── app.js                         ← แก้ในบทนี้
```

**`routes/submissions.js`**

```js
// routes/submissions.js — บทที่ 17 (GET เท่านั้น)
const router       = require('express').Router();
const authenticate = require('../middlewares/auth');
const authorize    = require('../middlewares/role');
const ctrl         = require('../controllers/submissionsController');

router.get('/my-submission', authenticate, authorize('candidate'), ctrl.getMySubmission);  // [!code ++]

module.exports = router;
```

**`controllers/submissionsController.js`**

```js
// submissionsController.js — บทที่ 17 (partial)
const pool = require('../config/db');

async function getViewSession() {                                         // สำหรับ GET — ดึงเฉพาะ session ที่ open/closed
  const [rows] = await pool.execute(
    "SELECT * FROM test_sessions WHERE status IN ('open','closed') ORDER BY id DESC LIMIT 1"
  );
  return rows[0] || null;
}

async function getMySubmission(req, res) {
  try {
    const session = await getViewSession();
    if (!session) return res.json({ success: true, data: null, meta: {} });

    const [rows] = await pool.execute(
      'SELECT * FROM submissions WHERE candidate_id = ? AND session_id = ?',
      [req.user.id, session.id]  // req.user.id มาจาก authenticate ที่ decode JWT token แล้ว
    );
    res.json({ success: true, data: rows[0] || null, meta: {} });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { getMySubmission };
```

> **`getViewSession` vs `getActiveSession`** — ตลอดบทที่ 17–28 จะเจอ 2 helper นี้:
>
> | Helper | SQL | ใช้กับ |
> |--------|-----|--------|
> | `getViewSession()` | `WHERE status IN ('open','closed')` | GET ทุกตัว (read) |
> | `getActiveSession()` | ไม่กรอง status — ล่าสุดเสมอ | POST / PUT (write) |
>
> เหตุผล: ถ้ามี session ใหม่ที่ยัง `waiting` อยู่ `getActiveSession()` จะได้ id ของ waiting session → query หา submission ไม่เจอ → candidate เห็น `null` ทั้งที่ส่งงานในรอบก่อนแล้ว

**`app.js`**

```js
app.use('/api', require('./routes/auth'));
app.use('/api', require('./routes/config'));
app.use('/api', require('./routes/tasks'));
app.use('/api', require('./routes/submissions'));   // [!code ++]
```

**ทดสอบ Postman:**

```
GET http://localhost:8080/api/my-submission
Authorization: Bearer <token ของ candidate01>
```

ต้องได้ (ถ้ายังไม่เคยส่ง):
```json
{ "success": true, "data": null, "meta": {} }
```

:::tip
ต้อง login เป็น candidate ก่อน — ถ้าใช้ token ของ judge จะได้ 403 ทันที
:::

> Pattern: Route → Controller → pool.execute() → res.json() — เหมือนทุก endpoint

## Common Errors

| Error | สาเหตุ | วิธีแก้ |
|-------|--------|---------| 
| 403 `Access denied` | ใช้ token ของ judge/manager | login เป็น candidate ก่อน |
| 401 | ลืมส่ง token | ใส่ `Authorization: Bearer <token>` |
