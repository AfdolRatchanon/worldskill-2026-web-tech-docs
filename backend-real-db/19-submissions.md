# บทที่ 19 — Submissions (รายการงานที่ส่ง)

> **บทนี้เตรียมอะไร:** เพิ่ม `getAllSubmissions` ลง `submissionsController.js` + `GET /api/submissions` ให้ judge เห็นรายการงานที่ส่งมาทั้งหมดของ task ปัจจุบัน (พร้อมชื่อผู้ส่ง)

## endpoint นี้ทำอะไร

คืน submission ทุกแถวของ task ปัจจุบัน JOIN กับ `users` เพื่อได้ชื่อผู้ส่ง เรียงใหม่สุดก่อน

## เพิ่มใน `src/controllers/submissionsController.js`

```js
async function getAllSubmissions(req, res) {
  try {
    const taskId = await getCurrentTaskId();
    if (!taskId) return res.json({ success: true, data: [], meta: {} });

    const [rows] = await pool.execute(`
      SELECT s.*, u.full_name, u.username, u.candidate_code
      FROM submissions s
      JOIN users u ON s.candidate_id = u.id
      WHERE s.task_id = ?
      ORDER BY s.created_at DESC
    `, [taskId]);
    res.json({ success: true, data: rows, meta: {} });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}
```

อัปเดต exports:

```js
module.exports = { getMySubmission, createSubmission, updateSubmission, getAllSubmissions };
```

::: tip JOIN ธรรมดา (ไม่ใช่ LEFT)
ที่นี่ใช้ `JOIN` (inner) เพราะเราอยากได้ "งานที่ส่งแล้ว" เท่านั้น — ต่างจากบท 18 ที่ต้องโชว์ candidate ทุกคนแม้ยังไม่ส่ง (จึงใช้ LEFT JOIN)
:::

## เพิ่ม route

```js
router.get('/submissions', authenticate, authorize('judge'), ctrl.getAllSubmissions);   // [!code ++]
```

(อยู่ในไฟล์ `src/routes/submissions.js` เดิม — judge เท่านั้น)

## ทดสอบ

### 📮 ใน Postman

| ช่อง | ค่า |
|------|-----|
| Method | `GET` |
| URL | `http://localhost:8080/api/submissions` |
| Authorization | Bearer Token → token **judge** |
| Body | — |

กด **Send** → **200** + รายการงานที่ส่ง (token candidate → **403**)

login judge → `GET /api/submissions`

```json
{
  "success": true,
  "data": [
    { "id": 1, "candidate_id": 3, "task_id": 1, "status": "submitted",
      "frontend_url": "http://...", "full_name": "Competitor One", "username": "candidate1" }
  ],
  "meta": {}
}
```

| token | ผล |
|-------|-----|
| judge | 200 + รายการ |
| candidate | 403 Access denied |

บทถัดไป judge สั่งตรวจคะแนน (recheck)
