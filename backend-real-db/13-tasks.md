# บทที่ 13 — Tasks (โจทย์)

> **บทนี้เตรียมอะไร:** สร้าง `GET /api/tasks` คืนรายการโจทย์ — สั้นและตรงไปตรงมา ใช้ฝึก pattern controller + route ให้คล่องก่อนเจอ endpoint ที่ซับซ้อนขึ้น

## endpoint นี้ทำอะไร

คืนทุกแถวในตาราง `tasks` (`{ id, title, description }`) เรียงตาม id — ทุก role ที่ login แล้วเรียกได้

## 1. `src/controllers/tasksController.js`

```js
const pool = require('../config/db');

async function getTasks(req, res) {
  try {
    const [rows] = await pool.execute('SELECT * FROM tasks ORDER BY id ASC');
    res.json({ success: true, data: rows, meta: {} });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { getTasks };
```

::: tip data เป็น array
ต่างจาก `/config` ที่คืน object เดียว — `/tasks` คืน **array** (`data: rows`) เพราะมีได้หลายโจทย์ frontend จะเอาไป `.map()` แสดงทีละอัน
:::

## 2. `src/routes/tasks.js`

```js
const router       = require('express').Router();
const authenticate = require('../middlewares/auth');
const { getTasks } = require('../controllers/tasksController');

router.get('/tasks', authenticate, getTasks);

module.exports = router;
```

## 3. ต่อเข้า `src/app.js`

```js
app.use('/api', require('./routes/tasks'));   // [!code ++]
```

## ทดสอบ

`GET /api/tasks` →

```json
{
  "success": true,
  "data": [
    { "id": 1, "title": "Web Technologies 2026", "description": "Build a Test Submission..." }
  ],
  "meta": {}
}
```

ครบ 2 endpoint shared แล้ว → ไปกลุ่ม Candidate ที่ candidate ใช้ส่งงานจริง
