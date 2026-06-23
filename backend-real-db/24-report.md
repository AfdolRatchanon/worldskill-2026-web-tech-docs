# บทที่ 24 — Report (export JSON / CSV)

> **บทนี้เตรียมอะไร:** สร้าง `reportController.js` + `GET /api/report` ที่ export ผลคะแนนได้ทั้ง **JSON** และ **CSV** (ดาวน์โหลดเป็นไฟล์) — endpoint สุดท้ายของฝั่ง backend

## endpoint นี้ทำอะไร

รวมผลคะแนนทุกคน (JOIN results → submissions → users) แล้วส่งกลับตาม `?format=` — `json` (ค่าเริ่มต้น) หรือ `csv`

## `src/controllers/reportController.js`

```js
const pool = require('../config/db');

async function getReport(req, res) {
  try {
    const { format = 'json' } = req.query;

    const [rows] = await pool.execute(`
      SELECT
        u.candidate_code, u.username, u.full_name,
        r.score, r.status,
        s.frontend_url, s.backend_url
      FROM results r
      JOIN submissions s ON r.submission_id = s.id
      JOIN users       u ON s.candidate_id  = u.id
      ORDER BY r.score DESC
    `);

    if (format === 'csv') {
      const header = 'Candidate Code,Username,Full Name,Score,Status\n';
      const body   = rows.map((r) =>
        `${r.candidate_code || ''},${r.username},${r.full_name},${r.score},${r.status}`
      ).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="report.csv"');
      return res.send(header + body);
    }

    res.json({ success: true, data: rows, meta: {} });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { getReport };
```

::: warning จุดต่างจากเวอร์ชันเดิม
คอลัมน์ CSV = `Candidate Code, Username, Full Name, Score, Status` (เวอร์ชันเดิมมี Frontend/Backend/Total Score + Confirmed) เพราะ schema ทางการมี `score` ตัวเดียว + `status` และเพิ่ม `candidate_code` (รหัสผู้เข้าแข่ง)
:::

## เข้าใจการส่งไฟล์ CSV

- `res.setHeader('Content-Type', 'text/csv')` บอกว่านี่คือไฟล์ CSV
- `Content-Disposition: attachment; filename="report.csv"` สั่งให้เบราว์เซอร์ **ดาวน์โหลด** แทนที่จะแสดงในหน้า
- ประกอบ header + แต่ละแถวต่อด้วย `\n` เป็นข้อความ CSV ตรงๆ

## `src/routes/report.js`

```js
const router       = require('express').Router();
const authenticate = require('../middlewares/auth');
const authorize    = require('../middlewares/role');
const { getReport } = require('../controllers/reportController');

router.get('/report', authenticate, authorize('manager'), getReport);

module.exports = router;
```

ต่อเข้า `app.js`:

```js
app.use('/api', require('./routes/report'));   // [!code ++]
```

## ทดสอบ

login manager:

| request | ผล |
|---------|-----|
| `GET /api/report` | JSON array ของผลคะแนน |
| `GET /api/report?format=csv` | ได้ไฟล์ข้อความ CSV (ขึ้นต้น `Candidate Code,Username,Full Name,Score,Status`) |

🎉 ครบทุก endpoint ฝั่ง backend แล้ว! → บทสุดท้ายคือ Checklist ก่อนแข่ง
