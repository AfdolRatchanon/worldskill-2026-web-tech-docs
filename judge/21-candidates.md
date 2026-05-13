# บทที่ 21 — Candidates

## GET /api/candidates

> Judge ต้องการดูรายชื่อ candidates ทั้งหมดพร้อมสถานะ submission และคะแนน — จึงต้องมี endpoint นี้

```
backend/
└── src/
    ├── controllers/
    │   └── candidatesController.js   ← สร้างในบทนี้
    ├── routes/
    │   └── candidates.js             ← สร้างในบทนี้
    └── app.js                        ← แก้ในบทนี้
```

**`routes/candidates.js`**

```js
// routes/candidates.js — บทที่ 21
const router       = require('express').Router();
const authenticate = require('../middlewares/auth');
const authorize    = require('../middlewares/role');
const { getCandidates } = require('../controllers/candidatesController');

router.get('/candidates', authenticate, authorize('judge'), getCandidates);  // [!code ++]

module.exports = router;
```

**`controllers/candidatesController.js`**

```js
// candidatesController.js — บทที่ 21
const pool = require('../config/db');

async function getViewSession() {
  const [rows] = await pool.execute(
    "SELECT * FROM test_sessions WHERE status IN ('open','closed') ORDER BY id DESC LIMIT 1"
  );
  return rows[0] || null;
}

async function getCandidates(req, res) {
  try {
    const session   = await getViewSession();
    const sessionId = session?.id ?? 0;             // ถ้าไม่มี session ใช้ 0 → LEFT JOIN ไม่มีข้อมูล

    const [rows] = await pool.execute(`
      SELECT
        u.id, u.username, u.full_name,
        s.id            AS submission_id,
        s.status        AS submission_status,
        s.frontend_url,
        s.backend_url,
        s.submitted_at,
        r.frontend_score,
        r.backend_score,
        r.total_score,
        r.is_confirmed
      FROM users u
      LEFT JOIN submissions s ON u.id = s.candidate_id AND s.session_id = ?
      LEFT JOIN results     r ON u.id = r.candidate_id AND r.session_id = ?
      WHERE u.role = 'candidate'
      ORDER BY u.full_name ASC
    `, [sessionId, sessionId]);

    res.json({ success: true, data: rows, meta: {} });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { getCandidates };
```

**`app.js`**

```js
app.use('/api', require('./routes/session'));
app.use('/api', require('./routes/candidates'));    // [!code ++]
```

**ทดสอบ Postman:**

```
GET http://localhost:8080/api/candidates
Authorization: Bearer <token ของ judge01>
```

ต้องได้:
```json
{
  "success": true,
  "data": [
    {
      "id": 3, "username": "candidate01", "full_name": "Alice Johnson",
      "submission_id": null, "submission_status": null,
      "frontend_url": null, "backend_url": null,
      "frontend_score": null, "backend_score": null,
      "total_score": null, "is_confirmed": null
    },
    ...
  ],
  "meta": {}
}
```

> `LEFT JOIN` ทำให้ candidate ที่ยังไม่ส่งงานก็ยังปรากฏในรายชื่อ แต่ submission/score เป็น null

> Pattern: Route → Controller → pool.execute() → res.json() — เหมือนทุก endpoint

## Common Errors

| Error | สาเหตุ | วิธีแก้ |
|-------|--------|---------| 
| 403 `Access denied` | ใช้ token ของ candidate/manager | login เป็น judge ก่อน |
| `data: []` | ยังไม่มี candidates | รัน `npm run seed` |
