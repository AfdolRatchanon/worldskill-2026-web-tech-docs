# บทที่ 28 — Report

## GET /api/report

> Manager ต้องการ export ข้อมูลคะแนนทั้งหมด ใน format JSON หรือ CSV — จึงต้องมี endpoint นี้

```
backend/
└── src/
    ├── controllers/
    │   └── reportController.js   ← สร้างในบทนี้
    ├── routes/
    │   └── report.js             ← สร้างในบทนี้
    └── app.js                    ← แก้ในบทนี้
```

**`routes/report.js`**

```js
// routes/report.js — บทที่ 28
const router       = require('express').Router();
const authenticate = require('../middlewares/auth');
const authorize    = require('../middlewares/role');
const { getReport } = require('../controllers/reportController');

router.get('/report', authenticate, authorize('manager'), getReport);  // [!code ++]

module.exports = router;
```

**`controllers/reportController.js`**

```js
// reportController.js — บทที่ 28 (JSON + CSV เท่านั้น)
const pool = require('../config/db');

async function getReport(req, res) {
  try {
    const { format = 'json', session_id } = req.query;

    const condition = session_id ? 'AND r.session_id = ?' : '';
    const params    = session_id ? [session_id] : [];

    const [rows] = await pool.execute(`
      SELECT
        u.username, u.full_name,
        r.frontend_score, r.backend_score, r.total_score, r.is_confirmed,
        s.frontend_url, s.backend_url
      FROM results r
      JOIN users       u ON r.candidate_id  = u.id
      JOIN submissions s ON r.submission_id = s.id
      WHERE 1=1 ${condition}
      ORDER BY r.total_score DESC
    `, params);

    if (format === 'csv') {
      const header = 'Username,Full Name,Frontend Score,Backend Score,Total Score,Confirmed\n';
      const body   = rows.map((r) =>
        `${r.username},${r.full_name},${r.frontend_score},${r.backend_score},${r.total_score},${r.is_confirmed ? 'Yes' : 'No'}`
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

**`app.js`** — app.js สมบูรณ์ครบทุก route

```js
// app.js — บทที่ 28 (สมบูรณ์)
require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const autoClose = require('./middlewares/autoClose');
const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());
app.use(autoClose);

app.use('/api', require('./routes/auth'));
app.use('/api', require('./routes/config'));
app.use('/api', require('./routes/tasks'));
app.use('/api', require('./routes/submissions'));
app.use('/api', require('./routes/results'));
app.use('/api', require('./routes/session'));
app.use('/api', require('./routes/candidates'));
app.use('/api', require('./routes/statistics'));
app.use('/api', require('./routes/sessions'));
app.use('/api', require('./routes/report'));        // [!code ++]

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
```

**ทดสอบ Postman — JSON:**

```
GET http://localhost:8080/api/report
Authorization: Bearer <token ของ manager01>
```

ต้องได้:
```json
{ "success": true, "data": [...], "meta": {} }
```

**ทดสอบ Postman — CSV:**

```
GET http://localhost:8080/api/report?format=csv
Authorization: Bearer <token ของ manager01>
```

ต้องได้ไฟล์ CSV ที่มี header: `Username,Full Name,Frontend Score,Backend Score,Total Score,Confirmed`

> Pattern: Route → Controller → pool.execute() → res.json() — เหมือนทุก endpoint

## Common Errors

| Error | สาเหตุ | วิธีแก้ |
|-------|--------|---------| 
| `data: []` | ยังไม่มี confirmed result | รอ judge recheck และ confirm ก่อน |
| CSV ไม่มีข้อมูล | เหมือนกัน | รอ judge confirm ผลก่อน |
| 403 `Access denied` | ใช้ token ของ judge/candidate | login เป็น manager ก่อน |
