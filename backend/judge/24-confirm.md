# บทที่ 24 — Confirm Result

## PUT /api/results/:candidate_id/confirm

> Judge ต้องการยืนยันคะแนนของ candidate (ล็อคคะแนน ไม่ให้ recheck ใหม่ได้) — จึงต้องมี endpoint นี้

```
backend/
└── src/
    ├── controllers/
    │   └── resultsController.js   ← แก้ในบทนี้ (เพิ่ม confirmResult)
    └── routes/
        └── results.js             ← แก้ในบทนี้ (เพิ่ม confirm route)
```

:::tip
เปิดไฟล์ `resultsController.js` ที่มีอยู่แล้ว แล้ว**เพิ่มต่อท้าย** — ไม่ต้องพิมพ์ `getMyResult` ใหม่
:::

**`routes/results.js`** — เพิ่ม confirm route

```js
// routes/results.js — บทที่ 24 เพิ่ม confirm
const { getMyResult, confirmResult } = require('../controllers/resultsController'); // [!code ++]

router.get('/my-result',                       authenticate, authorize('candidate'), getMyResult);
router.put('/results/:candidate_id/confirm',   authenticate, authorize('judge'),     confirmResult); // [!code ++]
```

**`controllers/resultsController.js`** — เพิ่ม `confirmResult`

```js
// resultsController.js — บทที่ 24 เพิ่ม confirmResult
async function confirmResult(req, res) {                                      // [!code ++]
  try {                                                                       // [!code ++]
    const { candidate_id } = req.params;                                     // [!code ++]
                                                                              // [!code ++]
    const session = await getViewSession();                                   // [!code ++]
    if (!session) {                                                           // [!code ++]
      return res.status(404).json({ success: false, message: 'No active session' }); // [!code ++]
    }                                                                         // [!code ++]
                                                                              // [!code ++]
    const [rows] = await pool.execute(                                        // [!code ++]
      'SELECT * FROM results WHERE candidate_id = ? AND session_id = ? ORDER BY created_at DESC LIMIT 1', // [!code ++]
      [candidate_id, session.id]                                              // [!code ++]
    );                                                                        // [!code ++]
    if (rows.length === 0) {                                                  // [!code ++]
      return res.status(404).json({ success: false, message: 'Result not found' }); // [!code ++]
    }                                                                         // [!code ++]
    if (rows[0].is_confirmed) {                                               // [!code ++]
      return res.status(400).json({ success: false, message: 'Result is already confirmed' }); // [!code ++]
    }                                                                         // [!code ++]
                                                                              // [!code ++]
    await pool.execute(                                                       // [!code ++]
      'UPDATE results SET is_confirmed = 1, confirmed_by = ?, confirmed_at = NOW() WHERE id = ?', // [!code ++]
      [req.user.id, rows[0].id]                                               // [!code ++]
    );                                                                        // [!code ++]
    const [updated] = await pool.execute(                                     // [!code ++]
      'SELECT * FROM results WHERE id = ?', [rows[0].id]                     // [!code ++]
    );                                                                        // [!code ++]
    res.json({ success: true, data: updated[0], meta: {} });                  // [!code ++]
  } catch {                                                                   // [!code ++]
    res.status(500).json({ success: false, message: 'Server error' });        // [!code ++]
  }                                                                           // [!code ++]
}                                                                             // [!code ++]

module.exports = { getMyResult, confirmResult };                              // [!code ++]
```

> results route มีแล้วจากบท 19 — ไม่ต้องเพิ่มใน `app.js`

**ทดสอบ Postman:**

```
PUT http://localhost:8080/api/results/3/confirm
Authorization: Bearer <token ของ judge01>
```

(3 = id ของ candidate01 จาก `SELECT id FROM users WHERE username = 'candidate01'`)

ต้องได้:
```json
{
  "success": true,
  "data": {
    "id": 1, "candidate_id": 3, "session_id": 1,
    "frontend_score": "12.50", "backend_score": "23.75",
    "total_score": "36.25", "is_confirmed": 1,
    "confirmed_by": 1, "confirmed_at": "2026-05-13T..."
  },
  "meta": {}
}
```

หลัง confirm แล้ว: candidate ดู GET /api/my-result จะเห็นคะแนนและ `is_confirmed: 1`

> Pattern: Route → Controller → pool.execute() → res.json() — เหมือนทุก endpoint

## Common Errors

| Error | สาเหตุ | วิธีแก้ |
|-------|--------|---------| 
| 404 `Result not found` | ยังไม่มี result — recheck ยังไม่สำเร็จ | รอ recheck เสร็จ (2 วินาที) แล้วลองใหม่ |
| 400 `Result is already confirmed` | confirm ซ้ำ | คะแนนล็อคแล้ว ไม่ต้อง confirm อีก |
| 403 `Access denied` | ใช้ token ของ candidate | login เป็น judge ก่อน |
