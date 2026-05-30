# บทที่ 26 — Ranking

## GET /api/statistics/ranking

> Manager ต้องการดู ranking ของ candidates เรียงตามคะแนนรวม — จึงต้องมี endpoint นี้

```
backend/
└── src/
    ├── controllers/
    │   └── statisticsController.js   ← แก้ในบทนี้ (เพิ่ม getRanking)
    └── routes/
        └── statistics.js             ← แก้ในบทนี้ (เพิ่ม ranking route)
```

**`routes/statistics.js`** — เพิ่ม ranking route

```js
// routes/statistics.js — บทที่ 26 เพิ่ม ranking
router.get('/statistics/summary', authenticate, authorize('manager'), ctrl.getSummary);
router.get('/statistics/status',  authenticate, authorize('manager'), ctrl.getStatus);
router.get('/statistics/ranking', authenticate, authorize('manager'), ctrl.getRanking); // [!code ++]
```

:::tip
เปิดไฟล์ `statisticsController.js` ที่มีอยู่แล้ว แล้ว**เพิ่มต่อท้าย** — ไม่ต้องพิมพ์ `getSummary` และ `getStatus` ใหม่
:::

> **RANK() OVER — SQL Window Function** คืออะไร:
>
> `ORDER BY total_score DESC` ธรรมดา — แค่เรียงลำดับ ไม่มีเลข rank
>
> `RANK() OVER (ORDER BY total_score DESC)` — คำนวณเลข rank ให้แต่ละ row อัตโนมัติ ถ้าคะแนนเท่ากันได้ rank เดียวกัน (เช่น 1, 1, 3 ไม่ใช่ 1, 2, 3)

**`controllers/statisticsController.js`** — เพิ่ม `getRanking`

```js
// statisticsController.js — บทที่ 26 เพิ่ม getRanking
async function getRanking(req, res) {                                         // [!code ++]
  try {                                                                       // [!code ++]
    const session = await getViewSession(req.query.session_id);               // [!code ++]
    if (!session) return res.json({ success: true, data: [], meta: {} });    // [!code ++]
                                                                              // [!code ++]
    const [rows] = await pool.execute(`                                       // [!code ++]
      SELECT                                                                  // [!code ++]
        u.id, u.username, u.full_name,                                        // [!code ++]
        r.frontend_score, r.backend_score, r.total_score, r.is_confirmed,    // [!code ++]
        RANK() OVER (ORDER BY r.total_score DESC) AS \`rank\`                // [!code ++]
      FROM results r                                                          // [!code ++]
      JOIN users u ON r.candidate_id = u.id                                  // [!code ++]
      WHERE r.is_confirmed = 1 AND r.session_id = ?                          // [!code ++]
      ORDER BY r.total_score DESC                                             // [!code ++]
    `, [session.id]);                                                        // [!code ++]
    res.json({ success: true, data: rows, meta: {} });                        // [!code ++]
  } catch {                                                                   // [!code ++]
    res.status(500).json({ success: false, message: 'Server error' });        // [!code ++]
  }                                                                           // [!code ++]
}                                                                             // [!code ++]

module.exports = { getSummary, getStatus, getRanking };                       // [!code ++]
```

> statistics route มีแล้วจากบท 25 — ไม่ต้องเพิ่มใน `app.js`

**ทดสอบ Postman:**

```
GET http://localhost:8080/api/statistics/ranking
Authorization: Bearer <token ของ manager01>
```

ต้องได้ (หลัง judge confirm ผล):
```json
{
  "success": true,
  "data": [
    { "id": 3, "username": "candidate01", "full_name": "Alice Johnson",
      "frontend_score": "15.25", "backend_score": "30.00", "total_score": "45.25",
      "is_confirmed": 1, "rank": 1 },
    ...
  ],
  "meta": {}
}
```

> `RANK() OVER (ORDER BY total_score DESC)` — จัด rank ใน SQL โดยตรง ไม่ต้องคำนวณเพิ่มใน Node.js

> Pattern: Route → Controller → pool.execute() → res.json() — เหมือนทุก endpoint

## Common Errors

| Error | สาเหตุ | วิธีแก้ |
|-------|--------|---------| 
| `data: []` | ยังไม่มี result ที่ confirmed | รอ judge recheck และ confirm ก่อน |
| 403 `Access denied` | ใช้ token ของ judge/candidate | login เป็น manager ก่อน |
