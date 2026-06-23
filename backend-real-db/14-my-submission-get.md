# บทที่ 14 — My Submission (GET)

> **บทนี้เตรียมอะไร:** เริ่มไฟล์ `submissionsController.js` ด้วยฟังก์ชันช่วยและ `GET /api/my-submission` — candidate ดูงานที่ตัวเองส่งไว้ของ task ปัจจุบัน

## endpoint นี้ทำอะไร

คืน submission ของ candidate ที่ login อยู่ สำหรับ **task ปัจจุบัน** (`candidate_id` + `task_id`) — ถ้ายังไม่เคยส่งคืน `null`

## 1. เริ่ม `src/controllers/submissionsController.js`

```js
const pool = require('../config/db');

// task ปัจจุบัน = แถวแรกในตาราง tasks
async function getCurrentTaskId() {
  const [rows] = await pool.execute('SELECT id FROM tasks ORDER BY id ASC LIMIT 1');
  return rows[0] ? rows[0].id : null;
}

async function getMySubmission(req, res) {
  try {
    const taskId = await getCurrentTaskId();
    if (!taskId) return res.json({ success: true, data: null, meta: {} });

    const [rows] = await pool.execute(
      'SELECT * FROM submissions WHERE candidate_id = ? AND task_id = ?',
      [req.user.id, taskId]
    );
    res.json({ success: true, data: rows[0] || null, meta: {} });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { getMySubmission };
```

::: warning ผูกกับ `task_id` ไม่ใช่ `session_id`
schema ทางการ `submissions` มีคอลัมน์ `task_id` (ไม่มี `session_id`) → การหา "งานของฉัน" ใช้คู่ `candidate_id` + `task_id` เวอร์ชันเดิมใช้ `candidate_id` + `session_id`
:::

`req.user.id` มาจากไหน? มาจาก `authenticate` (บทที่ 10) ที่ถอด token แล้วแปะ payload ไว้ที่ `req.user`

## 2. เริ่ม `src/routes/submissions.js`

```js
const router       = require('express').Router();
const authenticate = require('../middlewares/auth');
const authorize    = require('../middlewares/role');
const ctrl         = require('../controllers/submissionsController');

router.get('/my-submission', authenticate, authorize('candidate'), ctrl.getMySubmission);

module.exports = router;
```

`authorize('candidate')` = เฉพาะ candidate เท่านั้น (judge/manager เรียกจะได้ 403)

## 3. ต่อเข้า `src/app.js`

```js
app.use('/api', require('./routes/submissions'));   // [!code ++]
```

## ทดสอบ

1. login `candidate1`/`123456` → เอา token มาแนบ
2. `GET /api/my-submission` → เห็น submission ตัวอย่าง (id=1, task_id=1) ที่ seed ไว้
3. login `candidate2`/`123456` แล้วเรียก → ได้ `data: null` (ยังไม่เคยส่ง)
4. ใช้ token ของ judge เรียก → **403** Access denied

บทถัดไปให้ candidate ส่ง/แก้งานได้จริง
