# บทที่ 14 — Tasks (รายการโมดูลการแข่งขัน)

> **บทนี้เตรียมอะไร:** สร้าง API สำหรับแสดงรายการ Module/Task พร้อมกับสร้าง Utility สำหรับทำ Pagination (แบ่งหน้า) เป็นครั้งแรก และอัปเดต `app.js`

## ไฟล์ที่ต้องสร้างในบทนี้

| ไฟล์ | หน้าที่ |
|------|--------|
| `backend/src/utils/paginate.js` | ฟังก์ชันอำนวยความสะดวกสำหรับคำนวณ Pagination แบบใช้ซ้ำได้ (Reusable) |
| `backend/src/routes/tasks.js` | ลงทะเบียน URL สำหรับ Tasks API |
| `backend/src/controllers/tasksController.js` | Logic สำหรับจัดการข้อมูล Task และ Pagination |

**อัปเดต:**

| ไฟล์ | สิ่งที่เพิ่ม |
|------|------------|
| `backend/src/app.js` | เพิ่ม route สำหรับ tasks (`/api/tasks`) |

## ปัญหา — คืนข้อมูลทีเดียวทั้งหมด

สมมติว่าตาราง `tasks` มีข้อมูล 1,000 รายการ ถ้าเราใช้คำสั่ง `SELECT * FROM tasks` และส่งให้ Frontend ทีเดียวทั้งหมด:
1. การ Query จะช้า (Database ทำงานหนัก)
2. Response จะใหญ่มาก เปลือง Bandwidth
3. Frontend จะ Render ช้า หรือค้าง

**วิธีแก้:** เราต้องทำ **Pagination** โดยคืนข้อมูลทีละชุด (เช่น ทีละ 10 รายการ) โดยให้ Client ส่ง Parameter มาบอกว่าต้องการ "หน้าไหน (page)" และ "กี่รายการ (limit)"

## สร้าง: `backend/src/utils/paginate.js`

เพื่อให้ Endpoint อื่นๆ นำ Pagination ไปใช้ได้ง่ายขึ้น เราจะสร้างไฟล์ Utility เก็บไว้ตรงกลาง

สร้างไฟล์ `paginate.js` ในโฟลเดอร์ `src/utils/`:

```js
// ฟังก์ชันนี้จะคำนวณค่า OFFSET สำหรับ SQL และจัดรูปแบบ Meta Object ให้ Client
function getPaginationData(pageStr, limitStr, totalRecords) {
  // แปลง Query String เป็น Number ถ้าไม่ใส่หรือใส่ผิดให้ใช้ค่า Default (หน้า 1, limit 10)
  const page  = parseInt(pageStr, 10) || 1;
  const limit = parseInt(limitStr, 10) || 10;
  
  // คำนวณจำนวนหน้าทั้งหมดปัดเศษขึ้น
  const total_pages = Math.ceil(totalRecords / limit);
  
  // คำนวณจุดเริ่มต้นของการข้ามข้อมูล (OFFSET) ใน SQL
  const offset = (page - 1) * limit;

  // คืนค่ารูปแบบ Object แบบ Destructuring เพื่อให้ Controller เอาไปใช้ต่อง่าย
  return {
    meta: {
      current_page: page,
      per_page: limit,
      total_pages,
      total_records: totalRecords
    },
    limit,
    offset
  };
}

module.exports = {
  getPaginationData
};
```

## METHOD GET /api/tasks

API สำหรับแสดงรายการ Task โดยรองรับ Query Parameter `?page=x&limit=y`

**สร้าง: `backend/src/controllers/tasksController.js`**

สร้างไฟล์ `tasksController.js` ในโฟลเดอร์ `src/controllers/`:

```js
const pool = require('../config/db'); // นำเข้า Connection Pool
const { getPaginationData } = require('../utils/paginate'); // นำเข้า Utility แบ่งหน้า

async function getTasks(req, res) {
  try {
    // 1. นับจำนวน Task ทั้งหมดก่อน เพื่อนำไปคำนวณหน้า
    const [countResult] = await pool.execute('SELECT COUNT(*) as total FROM tasks');
    const totalRecords = countResult[0].total;

    // 2. เรียกใช้ Utility โดยส่ง req.query ไป
    const { meta, limit, offset } = getPaginationData(req.query.page, req.query.limit, totalRecords);

    // 3. Query ข้อมูลจริง โดยใช้ LIMIT และ OFFSET
    // - ORDER BY order_seq ให้เรียงตามลำดับที่ถูกต้อง
    // - ต้องแปลงค่า limit, offset ให้เป็น String หรือระบุชนิดค่าใน Parameter หรือใช้วิธีฝังค่าโดยตรง (ใน MariaDB Pool ทำผ่าน Array Parameter อาจมีปัญหากับ LIMIT เราจึงต่อสตริงที่ไว้ใจได้ เพราะได้แปลงเป็น Int ใน Utils แล้ว)
    const sql = `
      SELECT id, title, description, time_limit_minutes, max_score
      FROM tasks 
      ORDER BY order_seq ASC 
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    const [rows] = await pool.execute(sql);

    // 4. ส่ง Response กลับไปพร้อมข้อมูล Meta
    res.json({
      success: true,
      data: rows,
      meta // ยัด Object meta ที่คำนวณมาจาก getPaginationData ใส่ตรงนี้ได้เลย
    });

  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = {
  getTasks
};
```

**สร้าง: `backend/src/routes/tasks.js`**

สร้างไฟล์ `tasks.js` ในโฟลเดอร์ `src/routes/`:

```js
const router = require('express').Router();
const authenticate = require('../middlewares/auth'); // ต้อง Login
const { getTasks } = require('../controllers/tasksController');

router.get('/', authenticate, getTasks);

module.exports = router;
```

## อัปเดต app.js — เพิ่ม Tasks Route

เปิดไฟล์ `backend/src/app.js` และเพิ่ม route บรรทัดที่เน้นไว้

```js
// ... ส่วนของ Express Setup
app.use('/api', require('./routes/auth'));
app.use('/api/config', require('./routes/config'));
app.use('/api/tasks', require('./routes/tasks')); // [!code ++]

const PORT = process.env.PORT || 8080;
// ...
```

**สิ่งที่เพิ่มจากบทที่ 13:** เพิ่ม `app.use('/api/tasks', require('./routes/tasks'));`

## ทดสอบ

เปิด Postman แล้วทำการทดสอบ

**ทดสอบ GET /api/tasks (แบบไม่มี Parameter)**

```
GET http://localhost:8080/api/tasks
Authorization: Bearer <Token>
```

ต้องได้ 10 รายการ (Default) พร้อม `meta` object:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Module A: Layout",
      "description": "...",
      "time_limit_minutes": 180,
      "max_score": 25
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 10,
    "total_pages": 1,
    "total_records": 3
  }
}
```

**ทดสอบ GET /api/tasks?page=2&limit=2 (แบบเจาะจงหน้า)**

```
GET http://localhost:8080/api/tasks?page=2&limit=2
Authorization: Bearer <Token>
```

จะได้ข้อมูลหน้าที่ 2 (หากข้อมูลมีมากพอ) สังเกตว่า `current_page` จะเป็น 2 และ `per_page` จะเป็น 2

## Common Errors

| Error | สาเหตุ | วิธีแก้ |
|-------|--------|---------|
| Query ผิดพลาดแถวๆ คำว่า `LIMIT` หรือ `OFFSET` | MariaDB Driver บางเวอร์ชันมีปัญหากับการโยน Parameter เข้าไปตรงๆ ที่คำสั่ง LIMIT | ใช้การต่อ String ธรรมดา `${limit}` เพราะค่าได้ถูก `parseInt` กรองมาแล้วในไฟล์ `paginate.js` ว่าไม่ใช่ Code ฉีดเข้ามา (SQL Injection) แน่นอน |
| ข้อมูลไม่เรียงตามลำดับ | ลืมใส่ `ORDER BY` ใน SQL Query | ข้อมูลใน Relational DB ไม่มีลำดับตายตัวหากไม่สั่ง เรียงด้วย `ORDER BY order_seq ASC` เสมอ |
