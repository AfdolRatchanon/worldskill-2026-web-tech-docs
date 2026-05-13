# บทที่ 16 — Tasks

## GET /api/tasks

> ทุก role ต้องดูโจทย์ (task) เพื่อรู้ว่าต้องส่ง URL อะไร — จึงต้องมี endpoint นี้

```
backend/
└── src/
    ├── controllers/
    │   └── tasksController.js   ← สร้างในบทนี้
    ├── routes/
    │   └── tasks.js             ← สร้างในบทนี้
    └── app.js                   ← แก้ในบทนี้
```

**`routes/tasks.js`**

```js
// routes/tasks.js — บทที่ 16
const router       = require('express').Router();
const authenticate = require('../middlewares/auth');
const { getTasks } = require('../controllers/tasksController');

router.get('/tasks', authenticate, getTasks);  // [!code ++]

module.exports = router;
```

**`controllers/tasksController.js`**

```js
// tasksController.js — บทที่ 16
const pool = require('../config/db');

async function getTasks(req, res) {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM tasks ORDER BY id ASC'   // คืนทุก task
    );
    res.json({ success: true, data: rows, meta: {} });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { getTasks };
```

**`app.js`**

```js
// app.js — บทที่ 16 เพิ่ม route tasks
app.use('/api', require('./routes/auth'));
app.use('/api', require('./routes/config'));
app.use('/api', require('./routes/tasks'));     // [!code ++]
```

**ทดสอบ Postman:**

```
GET http://localhost:8080/api/tasks
Authorization: Bearer <token จากบท 13>
```

ต้องได้:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Web Technologies Competition Task",
      "description": "Build a full-stack Test Submission Management System..."
    }
  ],
  "meta": {}
}
```

> Pattern: Route → Controller → pool.execute() → res.json() — เหมือนทุก endpoint

## Common Errors

| Error | สาเหตุ | วิธีแก้ |
|-------|--------|---------| 
| `Cannot GET /api/tasks` | ยังไม่ได้เพิ่ม route ใน `app.js` | เพิ่ม `app.use('/api', require('./routes/tasks'))` |
| `data: []` | ยังไม่มี task ใน DB | รัน `npm run seed` |
| 401 | ลืมส่ง token | ใส่ `Authorization: Bearer <token>` |
