# บทที่ 15 — My Submission (POST / PUT)

> **บทนี้เตรียมอะไร:** เพิ่ม `createSubmission` (POST) และ `updateSubmission` (PUT) ลง `submissionsController.js` — พร้อม business rule 2 ข้อ: ส่งได้เฉพาะตอน session `active`, 1 คน 1 งานต่อ task

## เพิ่มฟังก์ชันช่วยใน `submissionsController.js`

ฟังก์ชันดึง session ล่าสุด (ใช้เช็คว่าเปิดสอบอยู่ไหม):

```js
async function getLatestSession() {
  const [rows] = await pool.execute('SELECT * FROM sessions ORDER BY id DESC LIMIT 1');
  return rows[0] || null;
}
```

> core ไม่ตรวจรูปแบบ URL (เก็บง่ายไว้ก่อน) — การ validate URL เป็นออปชัน อยู่ใน [บทเสริม 27](/backend-real-db/27-lan-url-validation)

## `createSubmission` (POST)

```js
async function createSubmission(req, res) {
  try {
    const session = await getLatestSession();
    if (!session || session.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Session is not active' });
    }

    const taskId = await getCurrentTaskId();
    if (!taskId) return res.status(404).json({ success: false, message: 'No task available' });

    const { frontend_url, backend_url } = req.body;

    const [existing] = await pool.execute(
      'SELECT id FROM submissions WHERE candidate_id = ? AND task_id = ?',
      [req.user.id, taskId]
    );
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Submission already exists. Use PUT to update.' });
    }

    const [result] = await pool.execute(
      'INSERT INTO submissions (candidate_id, task_id, frontend_url, backend_url) VALUES (?, ?, ?, ?)',
      [req.user.id, taskId, frontend_url, backend_url]
    );
    const [rows] = await pool.execute('SELECT * FROM submissions WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], meta: {} });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}
```

## `updateSubmission` (PUT)

```js
async function updateSubmission(req, res) {
  try {
    const session = await getLatestSession();
    if (!session || session.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Session is not active' });
    }

    const taskId = await getCurrentTaskId();
    if (!taskId) return res.status(404).json({ success: false, message: 'No task available' });

    const { frontend_url, backend_url } = req.body;

    const [existing] = await pool.execute(
      'SELECT id FROM submissions WHERE candidate_id = ? AND task_id = ?',
      [req.user.id, taskId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'No submission found. Use POST to create.' });
    }

    await pool.execute(
      'UPDATE submissions SET frontend_url = ?, backend_url = ? WHERE candidate_id = ? AND task_id = ?',
      [frontend_url, backend_url, req.user.id, taskId]
    );
    const [rows] = await pool.execute(
      'SELECT * FROM submissions WHERE candidate_id = ? AND task_id = ?',
      [req.user.id, taskId]
    );
    res.json({ success: true, data: rows[0], meta: {} });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}
```

## อัปเดต `module.exports`

```js
module.exports = { getMySubmission, createSubmission, updateSubmission };
```

## เพิ่ม route (POST + PUT)

```js
router.post('/my-submission', authenticate, authorize('candidate'), ctrl.createSubmission); // [!code ++]
router.put('/my-submission', authenticate, authorize('candidate'), ctrl.updateSubmission);  // [!code ++]
```

## Business Rules (สรุป)

| กฎ | HTTP | เช็กยังไง |
|----|------|----------|
| ส่งได้เฉพาะ session `active` | **403** | `getLatestSession()` → `status !== 'active'` |
| 1 candidate = 1 submission ต่อ task | **409** | POST แล้วเจอของเดิม |
| PUT ต้องมีของเดิมก่อน | **404** | ไม่เจอ submission |

::: tip จุดต่างจากเวอร์ชันเดิม
สถานะที่อนุญาตให้ส่งคือ `active` (ไม่ใช่ `open`) และนับ 1 งานต่อ **task** (ไม่ใช่ต่อ session)
:::

::: tip ออปชันที่แยกไว้บทเสริม (คะแนนน้อย/จำยาก — ข้ามก่อนได้)
- **ตรวจสอบรูปแบบ URL** (http(s) + จำกัดเป็น LAN เท่านั้น) → [บทเสริม 27](/backend-real-db/27-lan-url-validation)
- **กันส่งงานหลังหมดเวลาสอบ** (เปลี่ยน `getLatestSession()` → `resolveSession()`) → [บทเสริม 26](/backend-real-db/26-session-timer)
:::

## ทดสอบ

1. ตอนนี้ session ยังเป็น `initialized` → `POST /api/my-submission` ได้ **403** (ถูกต้อง! ต้องรอ judge เปิด)
2. ข้ามไปเปิด session ก่อน (บทที่ 17) แล้วกลับมา POST (`http://10.0.0.5:3000`) → **201**
3. POST ซ้ำ → **409** · PUT แก้ URL → **200**

> core ยังไม่ตรวจรูปแบบ URL — ใส่ URL อะไรก็ผ่าน (จะเพิ่มการตรวจในบทเสริม 27)
