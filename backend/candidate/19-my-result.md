# บทที่ 19 — My Result

## GET /api/my-result

> Candidate ต้องการดูคะแนนที่ judge ให้ — จึงต้องมี endpoint นี้

```
backend/
└── src/
    ├── controllers/
    │   └── resultsController.js   ← สร้างในบทนี้ (partial)
    ├── routes/
    │   └── results.js             ← สร้างในบทนี้
    └── app.js                     ← แก้ในบทนี้
```

**`routes/results.js`**

```js
// routes/results.js — บทที่ 19 (partial)
const router       = require('express').Router();
const authenticate = require('../middlewares/auth');
const authorize    = require('../middlewares/role');
const { getMyResult } = require('../controllers/resultsController');

router.get('/my-result', authenticate, authorize('candidate'), getMyResult);  // [!code ++]

module.exports = router;
```

**`controllers/resultsController.js`**

```js
// resultsController.js — บทที่ 19 (partial)
const pool = require('../config/db');

async function getViewSession() {
  const [rows] = await pool.execute(
    "SELECT * FROM test_sessions WHERE status IN ('open','closed') ORDER BY id DESC LIMIT 1"
  );
  return rows[0] || null;
}

async function getMyResult(req, res) {
  try {
    const session = await getViewSession();
    if (!session) return res.json({ success: true, data: null, meta: {} });

    const [rows] = await pool.execute(
      'SELECT * FROM results WHERE candidate_id = ? AND session_id = ? ORDER BY created_at DESC LIMIT 1',
      [req.user.id, session.id]
    );
    res.json({ success: true, data: rows[0] || null, meta: {} });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { getMyResult };
```

**`app.js`**

```js
app.use('/api', require('./routes/auth'));
app.use('/api', require('./routes/config'));
app.use('/api', require('./routes/tasks'));
app.use('/api', require('./routes/submissions'));
app.use('/api', require('./routes/results'));       // [!code ++]
```

**ทดสอบ Postman:**

```
GET http://localhost:8080/api/my-result
Authorization: Bearer <token ของ candidate01>
```

ต้องได้ (ก่อนมีการ recheck):
```json
{ "success": true, "data": null, "meta": {} }
```

:::tip
ผลที่มีคะแนนจะปรากฏหลังจาก judge recheck (บท 23) และ confirm (บท 24) แล้ว
:::

> Pattern: Route → Controller → pool.execute() → res.json() — เหมือนทุก endpoint

## Common Errors

| Error | สาเหตุ | วิธีแก้ |
|-------|--------|---------| 
| 403 `Access denied` | ใช้ token ของ judge/manager | login เป็น candidate ก่อน |
| `data: null` | ยังไม่มี result — ปกติก่อนมีการ recheck | รอ judge recheck และ confirm |
