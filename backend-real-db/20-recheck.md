# บทที่ 20 — Recheck (ตรวจคะแนน)

> **บทนี้เตรียมอะไร:** เพิ่ม `recheckSubmission` ลง `submissionsController.js` + `POST /api/submissions/:id/recheck` — judge สั่งตรวจงาน ระบบสุ่มคะแนน **ตัวเดียว 0–100** แล้วบันทึกลง `results`

## endpoint นี้ทำอะไร

| ขั้น | การทำงาน |
|------|----------|
| 1 | เช็กว่า submission มีอยู่ (ไม่มี → 404) |
| 2 | เช็กว่ายังไม่ confirm (ถ้า confirm แล้ว → 403) |
| 3 | สุ่ม `score` 0–100 แล้ว upsert ลง `results` (status `pending`) |

## เพิ่มใน `src/controllers/submissionsController.js`

```js
async function recheckSubmission(req, res) {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute('SELECT * FROM submissions WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    const [confirmed] = await pool.execute(
      "SELECT id FROM results WHERE submission_id = ? AND status = 'confirmed'", [id]
    );
    if (confirmed.length > 0) {
      return res.status(403).json({ success: false, message: 'Cannot re-check a confirmed result' });
    }

    await pool.execute("UPDATE submissions SET status = 'recheck' WHERE id = ?", [id]);

    const score = parseFloat((Math.random() * 100).toFixed(2));   // สุ่มคะแนนเดียว 0–100

    await pool.execute("UPDATE submissions SET status = 'submitted' WHERE id = ?", [id]);

    const [existing] = await pool.execute('SELECT id FROM results WHERE submission_id = ?', [id]);
    if (existing.length > 0) {
      await pool.execute(
        "UPDATE results SET score = ?, status = 'pending' WHERE submission_id = ?",
        [score, id]
      );
    } else {
      await pool.execute(
        "INSERT INTO results (submission_id, score, status) VALUES (?, ?, 'pending')",
        [id, score]
      );
    }

    res.json({ success: true, data: { message: 'Re-check started' }, meta: {} });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}
```

อัปเดต exports:

```js
module.exports = { getMySubmission, createSubmission, updateSubmission, getAllSubmissions, recheckSubmission };
```

::: warning จุดต่างจากเวอร์ชันเดิม — คะแนนเดียว + ทำงานทันที
- เวอร์ชันเดิมสุ่ม **2 คะแนน** (frontend 0–25 + backend 0–40) แล้วบวกเป็น total — ของทางการมี `score` ช่องเดียว เลยสุ่มตัวเดียว 0–100
- เวอร์ชันนี้คำนวณ **ทันทีในคำขอเดียว** (ไม่มี `setTimeout` หน่วงเวลา) → ยิง recheck เสร็จ ผลพร้อมเลย
:::

::: tip upsert = update ถ้ามี / insert ถ้าไม่มี
เช็ก `results` ของ submission นั้นก่อน — มีแล้วก็ UPDATE score ใหม่, ยังไม่มีก็ INSERT — กด recheck ซ้ำได้เรื่อยๆ จนกว่าจะ confirm
:::

## เพิ่ม route

```js
router.post('/submissions/:id/recheck', authenticate, authorize('judge'), ctrl.recheckSubmission);   // [!code ++]
```

`:id` คือ **submission id** (ไม่ใช่ candidate id) — ดูได้จาก `GET /submissions` บทที่ 19

## ทดสอบ

### 📮 ใน Postman

| ช่อง | ค่า |
|------|-----|
| Method | `POST` |
| URL | `http://localhost:8080/api/submissions/1/recheck` (1 = **submission id**) |
| Authorization | Bearer Token → token **judge** |
| Body | — |

กด **Send** → **200** `Re-check started` → ดู `/candidates` เห็น `score` ใหม่ · id ไม่มี → **404**

login judge:

| ลำดับ | request | ผล |
|------|---------|-----|
| 1 | `POST /api/submissions/1/recheck` | 200 `Re-check started` |
| 2 | `GET /api/candidates` | candidate1 มี `score` ใหม่ (เปลี่ยนทุกครั้งที่ recheck) status `pending` |
| 3 | recheck id ที่ไม่มี เช่น `/submissions/999/recheck` | 404 |

> ยังกด confirm ไม่ได้ตอนนี้ — สร้าง endpoint confirm บทถัดไป
