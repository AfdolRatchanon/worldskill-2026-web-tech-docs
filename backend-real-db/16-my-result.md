# บทที่ 16 — My Result

> **บทนี้เตรียมอะไร:** สร้างไฟล์ `resultsController.js` + `GET /api/my-result` — candidate ดูคะแนนตัวเอง จุดสำคัญคือ `results` ไม่มี `candidate_id` ต้อง **JOIN ผ่าน `submissions`**

## endpoint นี้ทำอะไร

คืน result ล่าสุดของ candidate ที่ login อยู่ (`{ id, submission_id, score, status }`) — ถ้ายังไม่มีคืน `null`

## 1. `src/controllers/resultsController.js`

```js
const pool = require('../config/db');

async function getMyResult(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT r.*
       FROM results r
       JOIN submissions s ON r.submission_id = s.id
       WHERE s.candidate_id = ?
       ORDER BY r.id DESC LIMIT 1`,
      [req.user.id]
    );
    res.json({ success: true, data: rows[0] || null, meta: {} });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { getMyResult };
```

::: danger ทำไมต้อง JOIN
ตาราง `results` มีแค่ `submission_id`, `score`, `status` — **ไม่มี `candidate_id`** เลยหา "ผลของ candidate คนนี้" ตรงๆ ไม่ได้ ต้องเดินผ่าน `submissions` (ซึ่งมี `candidate_id`):
`results.submission_id → submissions.id → submissions.candidate_id`
เวอร์ชันเดิมมี `candidate_id` ในตาราง `results` เลย query ตรงได้ — ของทางการต้อง JOIN เสมอ
:::

เรียงด้วย `ORDER BY r.id DESC LIMIT 1` เผื่อมีหลาย result เอาอันล่าสุด (`results` ทางการไม่มี `created_at` จึงใช้ `id`)

## 2. `src/routes/results.js`

```js
const router       = require('express').Router();
const authenticate = require('../middlewares/auth');
const authorize    = require('../middlewares/role');
const { getMyResult } = require('../controllers/resultsController');

router.get('/my-result', authenticate, authorize('candidate'), getMyResult);

module.exports = router;
```

## 3. ต่อเข้า `src/app.js`

```js
app.use('/api', require('./routes/results'));   // [!code ++]
```

## ทดสอบ

### 📮 ใน Postman

| ช่อง | ค่า |
|------|-----|
| Method | `GET` |
| URL | `http://localhost:8080/api/my-result` |
| Authorization | Bearer Token → token **candidate** |
| Body | — |

กด **Send** → **200** + ผลคะแนน (candidate1 มี · candidate2 = `data: null`)

login `candidate1`/`123456` → `GET /api/my-result`

```json
{
  "success": true,
  "data": { "id": 1, "submission_id": 1, "score": "45.50", "status": "pending" },
  "meta": {}
}
```

| candidate | ผล |
|-----------|-----|
| candidate1 (มี result ตัวอย่าง) | เห็น score 45.50 status pending |
| candidate2 (ยังไม่มี) | `data: null` |

ครบกลุ่ม Candidate แล้ว → ต่อกลุ่ม Judge ที่คุม session และตรวจคะแนน
