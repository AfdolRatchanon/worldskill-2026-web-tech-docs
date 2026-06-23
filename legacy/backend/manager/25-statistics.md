# บทที่ 25 — Statistics

## GET /api/statistics/summary และ GET /api/statistics/status

> Manager ต้องการดูภาพรวมผลการแข่งขัน — จึงต้องมีทั้งสอง endpoint นี้

```
backend/
└── src/
    ├── controllers/
    │   └── statisticsController.js   ← สร้างในบทนี้ (partial)
    ├── routes/
    │   └── statistics.js             ← สร้างในบทนี้ (partial)
    └── app.js                        ← แก้ในบทนี้
```

**`routes/statistics.js`**

```js
// routes/statistics.js — บทที่ 25
const router       = require('express').Router();
const authenticate = require('../middlewares/auth');
const authorize    = require('../middlewares/role');
const ctrl         = require('../controllers/statisticsController');

router.get('/statistics/summary', authenticate, authorize('manager'), ctrl.getSummary);  // [!code ++]
router.get('/statistics/status',  authenticate, authorize('manager'), ctrl.getStatus);   // [!code ++]

module.exports = router;
```

**`controllers/statisticsController.js`**

```js
// statisticsController.js — บทที่ 25
const pool = require('../config/db');

const PASS_THRESHOLD = 40;                           // คะแนนขั้นต่ำผ่าน

async function getViewSession(sessionId) {         // sessionId optional — manager เลือก session ได้
  if (sessionId) {
    const [rows] = await pool.execute('SELECT * FROM test_sessions WHERE id = ?', [sessionId]);
    return rows[0] || null;
  }
  const [rows] = await pool.execute(
    "SELECT * FROM test_sessions WHERE status IN ('open','closed') ORDER BY id DESC LIMIT 1"
  );
  return rows[0] || null;
}

async function getSummary(req, res) {
  try {
    const session   = await getViewSession(req.query.session_id);  // ?session_id=N จาก SessionSelector
    const sessionId = session?.id ?? 0;

    const [[{ count: total_candidates }]] = await pool.execute(  // [[{...}]] = pool คืน [rows,fields] → rows[0] → {count:N}
      "SELECT COUNT(*) AS count FROM users WHERE role = 'candidate'"
    );
    const [[{ count: submitted }]] = await pool.execute(         // destructure ซ้อนเพื่อดึงค่าตรงๆ ในบรรทัดเดียว
      'SELECT COUNT(DISTINCT candidate_id) AS count FROM submissions WHERE session_id = ?',
      [sessionId]
    );
    const [[{ count: confirmed }]] = await pool.execute(
      'SELECT COUNT(*) AS count FROM results WHERE is_confirmed = 1 AND session_id = ?',
      [sessionId]
    );
    const [[{ avg }]] = await pool.execute(
      'SELECT AVG(total_score) AS avg FROM results WHERE is_confirmed = 1 AND session_id = ?',
      [sessionId]
    );

    res.json({
      success: true,
      data: {
        total_candidates,
        submitted,
        confirmed,
        average_score: parseFloat(Number(avg || 0).toFixed(2)),  // AVG() คืน string → Number แปลง → toFixed ทศนิยม 2 ตำแหน่ง → parseFloat แปลงกลับเป็น number
        session: session || null,
      },
      meta: {},
    });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function getStatus(req, res) {
  try {
    const session   = await getViewSession(req.query.session_id);
    const sessionId = session?.id ?? 0;

    const [[row]] = await pool.execute(
      `SELECT
         SUM(CASE WHEN total_score >= ? THEN 1 ELSE 0 END) AS pass_count,
         SUM(CASE WHEN total_score <  ? THEN 1 ELSE 0 END) AS fail_count,
         COUNT(*) AS total
       FROM results WHERE is_confirmed = 1 AND session_id = ?`,
      [PASS_THRESHOLD, PASS_THRESHOLD, sessionId]
    );
    res.json({ success: true, data: { ...row, pass_threshold: PASS_THRESHOLD }, meta: {} });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { getSummary, getStatus };
```

**`app.js`**

```js
app.use('/api', require('./routes/candidates'));
app.use('/api', require('./routes/statistics'));    // [!code ++]
```

:::warning
**AVG() จาก mysql2 คืน string ไม่ใช่ number** — ถ้าไม่แปลง frontend จะได้ `"24.5"` ไม่ใช่ `24.5`

```js
// ❌ ผิด — avg เป็น string
const avg = rows[0].avg_score;

// ✅ ถูก — parseFloat ครอบนอกสุดเพื่อให้ได้ number ไม่ใช่ string
average_score: parseFloat(Number(avg || 0).toFixed(2))
```
:::

**ทดสอบ Postman:**

```
GET http://localhost:8080/api/statistics/summary
Authorization: Bearer <token ของ manager01>
```

ต้องได้:
```json
{
  "success": true,
  "data": {
    "total_candidates": 5, "submitted": 0, "confirmed": 0,
    "average_score": 0, "session": { "id": 1, "status": "open", ... }
  },
  "meta": {}
}
```

> Pattern: Route → Controller → pool.execute() → res.json() — เหมือนทุก endpoint

## Common Errors

| Error | สาเหตุ | วิธีแก้ |
|-------|--------|---------| 
| 403 `Access denied` | ใช้ token ของ judge/candidate | login เป็น manager ก่อน |
| `average_score` เป็น string | ลืม `parseFloat()` ครอบนอกสุด | ดู warning ด้านบน |
