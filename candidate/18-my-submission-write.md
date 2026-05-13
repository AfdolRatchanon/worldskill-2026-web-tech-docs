# บทที่ 18 — My Submission (POST/PUT)

## POST /api/my-submission และ PUT /api/my-submission

> Candidate ต้องการส่ง URL งานของตัวเอง (POST) และอัปเดตได้ถ้าแก้ไขแล้ว (PUT) — จึงต้องมีทั้งสอง endpoint นี้

```
backend/
└── src/
    ├── controllers/
    │   └── submissionsController.js   ← แก้ในบทนี้ (เพิ่ม POST/PUT)
    └── routes/
        └── submissions.js             ← แก้ในบทนี้ (เพิ่ม POST/PUT)
```

**`routes/submissions.js`**

```js
// routes/submissions.js — บทที่ 18 เพิ่ม POST/PUT
router.get('/my-submission',  authenticate, authorize('candidate'), ctrl.getMySubmission);
router.post('/my-submission', authenticate, authorize('candidate'), ctrl.createSubmission); // [!code ++]
router.put('/my-submission',  authenticate, authorize('candidate'), ctrl.updateSubmission); // [!code ++]
```

**`controllers/submissionsController.js`** — เพิ่ม 2 functions

```js
// submissionsController.js — บทที่ 18 เพิ่ม createSubmission และ updateSubmission
const pool = require('../config/db');

async function getActiveSession() {
  const [rows] = await pool.execute(
    'SELECT * FROM test_sessions ORDER BY id DESC LIMIT 1'
  );
  return rows[0] || null;
}

async function getMySubmission(req, res) { /* ... เหมือนบทที่ 17 ... */ }

async function createSubmission(req, res) {                                // [!code ++]
  try {                                                                    // [!code ++]
    const session = await getActiveSession();                              // [!code ++]
    if (!session || session.status !== 'open') {                          // [!code ++]
      return res.status(403).json({ success: false, message: 'Session is not open' }); // [!code ++]
    }                                                                      // [!code ++]
                                                                           // [!code ++]
    const { frontend_url, backend_url } = req.body;                       // [!code ++]
    if (!frontend_url || !backend_url) {                                   // [!code ++]
      return res.status(400).json({ success: false, message: 'Both URLs are required' }); // [!code ++]
    }                                                                      // [!code ++]
                                                                           // [!code ++]
    const [existing] = await pool.execute(                                 // [!code ++]
      'SELECT id FROM submissions WHERE candidate_id = ? AND session_id = ?', // [!code ++]
      [req.user.id, session.id]                                            // [!code ++]
    );                                                                     // [!code ++]
    if (existing.length > 0) {                                             // [!code ++]
      return res.status(409).json({ success: false, message: 'Submission already exists. Use PUT to update.' }); // [!code ++]
    }                                                                      // [!code ++]
                                                                           // [!code ++]
    const [result] = await pool.execute(                                   // [!code ++]
      'INSERT INTO submissions (candidate_id, session_id, frontend_url, backend_url) VALUES (?, ?, ?, ?)', // [!code ++]
      [req.user.id, session.id, frontend_url, backend_url]                 // [!code ++]
    );                                                                     // [!code ++]
    const [rows] = await pool.execute(                                     // [!code ++]
      'SELECT * FROM submissions WHERE id = ?', [result.insertId]          // [!code ++]
    );                                                                     // [!code ++]
    res.json({ success: true, data: rows[0], meta: {} });                  // [!code ++]
  } catch {                                                                // [!code ++]
    res.status(500).json({ success: false, message: 'Server error' });     // [!code ++]
  }                                                                        // [!code ++]
}                                                                          // [!code ++]

async function updateSubmission(req, res) {                                // [!code ++]
  try {                                                                    // [!code ++]
    const session = await getActiveSession();                              // [!code ++]
    if (!session || session.status !== 'open') {                          // [!code ++]
      return res.status(403).json({ success: false, message: 'Session is not open' }); // [!code ++]
    }                                                                      // [!code ++]
                                                                           // [!code ++]
    const { frontend_url, backend_url } = req.body;                       // [!code ++]
    if (!frontend_url || !backend_url) {                                   // [!code ++]
      return res.status(400).json({ success: false, message: 'Both URLs are required' }); // [!code ++]
    }                                                                      // [!code ++]
                                                                           // [!code ++]
    const [existing] = await pool.execute(                                 // [!code ++]
      'SELECT id FROM submissions WHERE candidate_id = ? AND session_id = ?', // [!code ++]
      [req.user.id, session.id]                                            // [!code ++]
    );                                                                     // [!code ++]
    if (existing.length === 0) {                                           // [!code ++]
      return res.status(404).json({ success: false, message: 'No submission found. Use POST to create.' }); // [!code ++]
    }                                                                      // [!code ++]
                                                                           // [!code ++]
    await pool.execute(                                                    // [!code ++]
      'UPDATE submissions SET frontend_url = ?, backend_url = ? WHERE candidate_id = ? AND session_id = ?', // [!code ++]
      [frontend_url, backend_url, req.user.id, session.id]                 // [!code ++]
    );                                                                     // [!code ++]
    const [rows] = await pool.execute(                                     // [!code ++]
      'SELECT * FROM submissions WHERE candidate_id = ? AND session_id = ?', // [!code ++]
      [req.user.id, session.id]                                            // [!code ++]
    );                                                                     // [!code ++]
    res.json({ success: true, data: rows[0], meta: {} });                  // [!code ++]
  } catch {                                                                // [!code ++]
    res.status(500).json({ success: false, message: 'Server error' });     // [!code ++]
  }                                                                        // [!code ++]
}                                                                          // [!code ++]

module.exports = { getMySubmission, createSubmission, updateSubmission };  // [!code ++]
```

**ทดสอบ Postman:**

ต้องเปิด session ก่อน (ทำในบทที่ 20) แต่ทดสอบ error case ได้ก่อน:

```
POST http://localhost:8080/api/my-submission
Authorization: Bearer <token ของ candidate01>
Body: { "frontend_url": "http://localhost:3000", "backend_url": "http://localhost:8080" }
```

ต้องได้ (ถ้า session ยังไม่ open): `{ "success": false, "message": "Session is not open" }` (status 403)

:::tip
ทดสอบ POST จริงได้หลังบท 20 เมื่อ judge เปิด session แล้ว
:::

## Common Errors

| Error | สาเหตุ | วิธีแก้ |
|-------|--------|---------| 
| 403 `Session is not open` | session ยังไม่ open | รอบท 20 ให้ judge เปิด session |
| 409 `Submission already exists` | ส่งซ้ำใน session เดิม | ใช้ PUT แทน POST |
| 404 `No submission found` | PUT แต่ยังไม่เคย POST | ต้อง POST ก่อนแล้วค่อย PUT |
