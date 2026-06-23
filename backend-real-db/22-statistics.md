# บทที่ 22 — Statistics (สรุป + ผ่าน/ไม่ผ่าน)

> **บทนี้เตรียมอะไร:** สร้าง `statisticsController.js` + 2 endpoint: `GET /api/statistics/summary` (การ์ดสรุป) และ `GET /api/statistics/status` (นับผ่าน/ไม่ผ่าน) — สำหรับ manager (อ่านอย่างเดียว)

## 1. `src/controllers/statisticsController.js`

```js
const pool = require('../config/db');

const PASS_THRESHOLD = 50;

async function getLatestSession() {
  const [rows] = await pool.execute('SELECT * FROM sessions ORDER BY id DESC LIMIT 1');
  return rows[0] || null;
}

async function getSummary(req, res) {
  try {
    const session = await getLatestSession();

    const [[{ count: total_candidates }]] = await pool.execute(
      "SELECT COUNT(*) AS count FROM users WHERE role = 'candidate'"
    );
    const [[{ count: submitted }]] = await pool.execute(
      'SELECT COUNT(DISTINCT candidate_id) AS count FROM submissions'
    );
    const [[{ count: confirmed }]] = await pool.execute(
      "SELECT COUNT(*) AS count FROM results WHERE status = 'confirmed'"
    );
    const [[{ avg }]] = await pool.execute(
      "SELECT AVG(score) AS avg FROM results WHERE status = 'confirmed'"
    );

    res.json({
      success: true,
      data: {
        total_candidates,
        submitted,
        confirmed,
        average_score: parseFloat(Number(avg || 0).toFixed(2)),
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
    const [[row]] = await pool.execute(
      `SELECT
         SUM(CASE WHEN score >= ? THEN 1 ELSE 0 END) AS pass_count,
         SUM(CASE WHEN score <  ? THEN 1 ELSE 0 END) AS fail_count,
         COUNT(*) AS total
       FROM results WHERE status = 'confirmed'`,
      [PASS_THRESHOLD, PASS_THRESHOLD]
    );
    res.json({ success: true, data: { ...row, pass_threshold: PASS_THRESHOLD }, meta: {} });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { getSummary, getStatus };
```

::: warning จุดต่างจากเวอร์ชันเดิม
- ใช้ `score` ตัวเดียว (เวอร์ชันเดิมเฉลี่ย `total_score`) และนับ "ยืนยันแล้ว" ด้วย `status = 'confirmed'` (เดิมใช้ `is_confirmed = 1`)
- `PASS_THRESHOLD = 50` (จาก score เต็ม 100) เวอร์ชันเดิมใช้ 40 จาก total เต็ม 65
- ไม่กรองด้วย `session_id` เพราะ schema ทางการ `results`/`submissions` ไม่มีคอลัมน์นั้น → สถิติเป็นภาพรวมทั้งหมด
:::

## 2. `src/routes/statistics.js`

```js
const router       = require('express').Router();
const authenticate = require('../middlewares/auth');
const authorize    = require('../middlewares/role');
const ctrl         = require('../controllers/statisticsController');

router.get('/statistics/summary', authenticate, authorize('manager'), ctrl.getSummary);
router.get('/statistics/status',  authenticate, authorize('manager'), ctrl.getStatus);

module.exports = router;
```

ต่อเข้า `app.js`:

```js
app.use('/api', require('./routes/statistics'));   // [!code ++]
```

## ทดสอบ

login `manager`/`password`:

```json
// GET /api/statistics/summary
{ "data": { "total_candidates": 2, "submitted": 1, "confirmed": 1, "average_score": 45.5, "session": {...} } }

// GET /api/statistics/status
{ "data": { "pass_count": 0, "fail_count": 1, "total": 1, "pass_threshold": 50 } }
```

> ตัวเลขขึ้นกับว่า recheck/confirm ใครไปแล้วบ้าง — ลองเปลี่ยนแล้วเรียกซ้ำดู
