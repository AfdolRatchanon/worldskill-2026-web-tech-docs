# บทที่ 22 — Submissions (Judge)

## GET /api/submissions

> Judge ต้องการดูรายการ submissions ทั้งหมดใน session ปัจจุบัน — จึงต้องมี endpoint นี้

```
backend/
└── src/
    ├── controllers/
    │   └── submissionsController.js   ← แก้ในบทนี้ (เพิ่ม getAllSubmissions)
    └── routes/
        └── submissions.js             ← แก้ในบทนี้ (เพิ่ม GET /submissions)
```

**`routes/submissions.js`** — เพิ่ม judge route

```js
// routes/submissions.js — บทที่ 22 เพิ่ม judge endpoint
router.get('/my-submission',  authenticate, authorize('candidate'), ctrl.getMySubmission);
router.post('/my-submission', authenticate, authorize('candidate'), ctrl.createSubmission);
router.put('/my-submission',  authenticate, authorize('candidate'), ctrl.updateSubmission);
router.get('/submissions',    authenticate, authorize('judge'),     ctrl.getAllSubmissions); // [!code ++]
```

:::tip
เปิดไฟล์ `submissionsController.js` ที่มีอยู่แล้ว แล้ว**เพิ่มต่อท้าย** — ไม่ต้องพิมพ์ฟังก์ชันเดิมใหม่
:::

**`controllers/submissionsController.js`** — เพิ่ม `getAllSubmissions`

```js
// submissionsController.js — บทที่ 22 เพิ่ม getAllSubmissions
async function getAllSubmissions(req, res) {                                  // [!code ++]
  try {                                                                      // [!code ++]
    const session = await getViewSession();                                  // [!code ++]
    if (!session) return res.json({ success: true, data: [], meta: {} });   // [!code ++]
                                                                             // [!code ++]
    const [rows] = await pool.execute(`                                      // [!code ++]
      SELECT s.*, u.full_name, u.username                                    // [!code ++]
      FROM submissions s                                                      // [!code ++]
      JOIN users u ON s.candidate_id = u.id                                  // [!code ++]
      WHERE s.session_id = ?                                                  // [!code ++]
      ORDER BY s.submitted_at DESC                                            // [!code ++]
    `, [session.id]);                                                        // [!code ++]
    res.json({ success: true, data: rows, meta: {} });                       // [!code ++]
  } catch {                                                                  // [!code ++]
    res.status(500).json({ success: false, message: 'Server error' });       // [!code ++]
  }                                                                          // [!code ++]
}                                                                            // [!code ++]

module.exports = {                                                           // [!code ++]
  getMySubmission, createSubmission, updateSubmission, getAllSubmissions,    // [!code ++]
};                                                                           // [!code ++]
```

> submissions route มีแล้วจากบท 17 — ไม่ต้องเพิ่มใน `app.js`

**ทดสอบ Postman:**

```
GET http://localhost:8080/api/submissions
Authorization: Bearer <token ของ judge01>
```

ต้องได้ (ถ้า candidate ส่งงานแล้ว):
```json
{
  "success": true,
  "data": [
    {
      "id": 1, "candidate_id": 3, "session_id": 1,
      "frontend_url": "http://localhost:3000",
      "backend_url": "http://localhost:8080",
      "status": "pending",
      "full_name": "Alice Johnson",
      "username": "candidate01"
    }
  ],
  "meta": {}
}
```

> Pattern: Route → Controller → pool.execute() → res.json() — เหมือนทุก endpoint

## Common Errors

| Error | สาเหตุ | วิธีแก้ |
|-------|--------|---------| 
| `data: []` | ยังไม่มี submission | ให้ candidate POST /api/my-submission ก่อน |
| 403 `Access denied` | ใช้ token ของ candidate | login เป็น judge ก่อน |
