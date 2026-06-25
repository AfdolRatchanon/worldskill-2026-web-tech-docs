# บทที่ 21 — Confirm Result (ยืนยันคะแนน)

> **บทนี้เตรียมอะไร:** เพิ่ม `confirmResult` ลง `resultsController.js` + `PUT /api/results/:candidate_id/confirm` — judge ยืนยันคะแนนของ candidate ทำให้ result + submission กลายเป็น `confirmed` และล็อกไม่ให้ recheck อีก

## endpoint นี้ทำอะไร

| ขั้น | การทำงาน |
|------|----------|
| 1 | หา result ล่าสุดของ candidate (JOIN ผ่าน submissions) |
| 2 | ไม่มี result → 404 · ถ้า confirm แล้ว → 400 |
| 3 | ตั้ง `results.status = 'confirmed'` **และ** `submissions.status = 'confirmed'` |

## เพิ่มใน `src/controllers/resultsController.js`

```js
async function confirmResult(req, res) {
  try {
    const { candidate_id } = req.params;

    const [rows] = await pool.execute(
      `SELECT r.*
       FROM results r
       JOIN submissions s ON r.submission_id = s.id
       WHERE s.candidate_id = ?
       ORDER BY r.id DESC LIMIT 1`,
      [candidate_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Result not found' });
    }
    if (rows[0].status === 'confirmed') {
      return res.status(400).json({ success: false, message: 'Result is already confirmed' });
    }

    await pool.execute("UPDATE results SET status = 'confirmed' WHERE id = ?", [rows[0].id]);
    await pool.execute("UPDATE submissions SET status = 'confirmed' WHERE id = ?", [rows[0].submission_id]);

    const [updated] = await pool.execute('SELECT * FROM results WHERE id = ?', [rows[0].id]);
    res.json({ success: true, data: updated[0], meta: {} });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { getMyResult, confirmResult };
```

::: warning จุดต่างจากเวอร์ชันเดิม
ของทางการ "ยืนยัน" = ตั้ง `status = 'confirmed'` (เวอร์ชันเดิมใช้คอลัมน์ `is_confirmed = 1` + `confirmed_by` + `confirmed_at` ซึ่ง schema นี้ไม่มี) เราจึงอัปเดตแค่ `status` ของทั้ง result และ submission ให้ตรงกัน
:::

## เพิ่ม route

```js
router.put('/results/:candidate_id/confirm', authenticate, authorize('judge'), confirmResult);   // [!code ++]
```

(อยู่ในไฟล์ `src/routes/results.js` เดิม)

::: danger `:candidate_id` คือ user id ของ candidate
ต้องใส่ **user id** ของ candidate (เช่น `3`, `4`) ไม่ใช่ submission id และไม่ใช่ username — และ candidate คนนั้นต้องถูก **recheck มาก่อน** (มี result) ไม่งั้นได้ 404 `Result not found`
:::

## ทดสอบ

### 📮 ใน Postman

| ช่อง | ค่า |
|------|-----|
| Method | `PUT` |
| URL | `http://localhost:8080/api/results/3/confirm` (3 = user id ของ candidate) |
| Authorization | Bearer Token → token **judge** |
| Body | — |

กด **Send** → **200** `confirmed` · confirm ซ้ำ → **400** · candidate ไม่มี result → **404** · ใช้ method GET → **404**

login judge (ต้อง recheck candidate1 มาก่อนจากบท 20):

| ลำดับ | request | ผล |
|------|---------|-----|
| 1 | `PUT /api/results/3/confirm` | 200 status `confirmed` |
| 2 | `PUT /api/results/3/confirm` ซ้ำ | 400 already confirmed |
| 3 | `POST /api/submissions/1/recheck` | 403 (confirm แล้ว recheck ไม่ได้) |
| 4 | `PUT /api/results/4/confirm` (candidate2 ไม่มี result) | 404 Result not found |
| 5 | `PUT /api/results/3/confirm` ด้วย method `GET` | 404 (route รับเฉพาะ PUT) |

ครบกลุ่ม Judge แล้ว → ต่อกลุ่ม Manager ดูสถิติภาพรวม
