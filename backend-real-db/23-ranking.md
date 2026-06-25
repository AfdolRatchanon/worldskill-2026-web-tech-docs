# บทที่ 23 — Ranking (อันดับคะแนน)

> **บทนี้เตรียมอะไร:** เพิ่ม `getRanking` ลง `statisticsController.js` + `GET /api/statistics/ranking` — จัดอันดับ candidate ที่คะแนนถูก confirm แล้ว ด้วย window function `RANK()`

## เพิ่มใน `src/controllers/statisticsController.js`

```js
async function getRanking(req, res) {
  try {
    const [rows] = await pool.execute(`
      SELECT
        u.id, u.username, u.full_name, u.candidate_code,
        r.score, r.status,
        RANK() OVER (ORDER BY r.score DESC) AS \`rank\`
      FROM results r
      JOIN submissions s ON r.submission_id = s.id
      JOIN users u ON s.candidate_id = u.id
      WHERE r.status = 'confirmed'
      ORDER BY r.score DESC
    `);
    res.json({ success: true, data: rows, meta: {} });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}
```

อัปเดต exports:

```js
module.exports = { getSummary, getStatus, getRanking };
```

## เข้าใจ `RANK() OVER (ORDER BY r.score DESC)`

- `RANK()` = ฟังก์ชันจัดอันดับของ SQL — เรียงตาม `score` มาก→น้อย แล้วแปะเลขอันดับให้แต่ละแถว
- ต้อง JOIN 2 ชั้น: `results → submissions → users` เพื่อได้ชื่อ candidate (เพราะ results ไม่มี candidate_id)
- กรอง `WHERE r.status = 'confirmed'` → เฉพาะคะแนนที่ judge ยืนยันแล้วเท่านั้นถึงขึ้นอันดับ

::: tip backtick รอบ \`rank\`
`rank` เป็นคำสงวนของ SQL เลยต้องครอบด้วย backtick — ในโค้ด JS template string จึงเขียน `` \`rank\` ``
:::

## เพิ่ม route

```js
router.get('/statistics/ranking', authenticate, authorize('manager'), ctrl.getRanking);   // [!code ++]
```

## ทดสอบ

### 📮 ใน Postman

| ช่อง | ค่า |
|------|-----|
| Method | `GET` |
| URL | `http://localhost:8080/api/statistics/ranking` |
| Authorization | Bearer Token → token **manager** |
| Body | — |

กด **Send** → **200** + อันดับ (เฉพาะคน confirm แล้ว · ยังไม่มี → `data: []`)

login manager → `GET /api/statistics/ranking` (ต้องมีคนถูก confirm ก่อน)

```json
{
  "success": true,
  "data": [
    { "id": 3, "username": "candidate1", "full_name": "Competitor One", "score": "45.50", "status": "confirmed", "rank": 1 }
  ],
  "meta": {}
}
```

ถ้ายังไม่มีใคร confirm → `data: []`
