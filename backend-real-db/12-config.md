# บทที่ 12 — Config (สถานะ Session)

> **บทนี้เตรียมอะไร:** สร้าง `GET /api/config` คืนสถานะ session ปัจจุบัน — endpoint แรกที่ทุก role เรียกได้ และเป็นตัวบอกว่า candidate ส่งงานได้หรือยัง

## endpoint นี้ทำอะไร

| สิ่งที่ทำ | รายละเอียด |
|----------|-----------|
| คืน session ล่าสุด | แถวล่าสุดในตาราง `sessions` (`{ id, status, updated_at }`) |
| ใครเรียกได้ | ทุก role (แค่ต้อง login) |

## 1. `src/controllers/configController.js`

```js
const pool = require('../config/db');

async function getConfig(req, res) {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM sessions ORDER BY id DESC LIMIT 1'
    );
    res.json({ success: true, data: rows[0] || null, meta: {} });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { getConfig };
```

::: warning ตาราง `sessions` ไม่ใช่ `test_sessions`
schema ทางการใช้ชื่อ `sessions` มีคอลัมน์หลัก `id`, `status`, `updated_at` — ไม่มี `opened_at`, `closed_at`, `duration_minutes` เหมือนเวอร์ชันเดิม
:::

## 2. `src/routes/config.js`

```js
const router       = require('express').Router();
const authenticate = require('../middlewares/auth');
const { getConfig } = require('../controllers/configController');

router.get('/config', authenticate, getConfig);

module.exports = router;
```

## 3. ต่อเข้า `src/app.js`

```js
app.use('/api', require('./routes/config'));   // [!code ++]
```

## ทดสอบ

`GET /api/config` (แนบ `Authorization: Bearer <token>`)

```json
{
  "success": true,
  "data": { "id": 1, "status": "initialized", "updated_at": "..." },
  "meta": {}
}
```

| กรณี | ผล |
|------|-----|
| มี token | 200 + ข้อมูล session |
| ไม่มี token | 401 `No token provided` |

ตอนนี้ status เป็น `initialized` (ยังไม่เปิดสอบ) — เดี๋ยว judge จะเปลี่ยนเป็น `active` ในบทที่ 17

::: tip อยากให้นับเวลาถอยหลัง + ปิด session เองเมื่อหมดเวลา?
นั่นเป็นออปชัน (คะแนนน้อย) — ดู [บทเสริม: จับเวลาสอบ + ปิด session อัตโนมัติ](/backend-real-db/26-session-timer) ที่จะให้ `/config` คืน `remaining_seconds` เพิ่ม
:::
