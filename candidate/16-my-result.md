# บทที่ 16 — My Result (ดูผลคะแนนของตัวเอง)

> **บทนี้เตรียมอะไร:** สร้าง API ให้ Candidate สามารถดูผลคะแนนเฉพาะของตัวเองเท่านั้น และนำ Utility `paginate.js` ที่สร้างไว้มาใช้อีกครั้งเพื่อแบ่งหน้า

## ไฟล์ที่ต้องสร้างในบทนี้

| ไฟล์ | หน้าที่ |
|------|--------|
| `backend/src/routes/results.js` | ลงทะเบียน URL สำหรับดูผลคะแนน |
| `backend/src/controllers/resultsController.js` | Logic ควบคุมการดึงข้อมูลคะแนนของตัวเองจาก Database พร้อมทำ Pagination |

**อัปเดต:**

| ไฟล์ | สิ่งที่เพิ่ม |
|------|------------|
| `backend/src/app.js` | เพิ่ม route สำหรับ results (`/api/results`) |

## METHOD GET /api/results/my

API สำหรับแสดงรายการผลคะแนน (Results) โดยดึงให้เฉพาะข้อมูลที่ตรงกับ ID ของคนที่เข้าสู่ระบบ และรองรับ `?page=x&limit=y`

**สร้าง: `backend/src/controllers/resultsController.js`**

สร้างไฟล์ `resultsController.js` ในโฟลเดอร์ `src/controllers/`:

```js
const pool = require('../config/db');
const { getPaginationData } = require('../utils/paginate'); // นำเข้า Utility แบ่งหน้าอีกรอบ

async function getMyResults(req, res) {
  try {
    // 1. ดึง ID ผู้เข้าแข่งขันจาก Token
    const candidate_id = req.user.id;

    // 2. นับจำนวนผลคะแนนทั้งหมดเฉพาะของคนนี้ เพื่อเอาไปคำนวณหน้า
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM task_results WHERE candidate_id = ?',
      [candidate_id]
    );
    const totalRecords = countResult[0].total;

    // 3. เรียก Utility คำนวณขอบเขต Pagination
    const { meta, limit, offset } = getPaginationData(req.query.page, req.query.limit, totalRecords);

    // 4. Query ดึงข้อมูลคะแนน พร้อม JOIN เอาชื่อ Task ออกมาด้วยให้ดูง่ายๆ
    // ใช้ LIMIT และ OFFSET ที่คำนวณมา โดยต่อเป็น String
    const sql = `
      SELECT tr.id, tr.score, tr.comments, tr.created_at, t.title AS task_title
      FROM task_results tr
      JOIN tasks t ON tr.task_id = t.id
      WHERE tr.candidate_id = ?
      ORDER BY tr.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    // โยน candidate_id ไปแทน ?
    const [rows] = await pool.execute(sql, [candidate_id]);

    // 5. ส่ง Response
    res.json({
      success: true,
      data: rows,
      meta
    });

  } catch (error) {
    console.error('Error in getMyResults:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = {
  getMyResults
};
```

> **Pattern ย้ำเตือน:** เราใช้ `paginate.js` ตัวเดิมจากบทที่ 14 เลย เห็นไหมว่าถ้าเรามีไฟล์ Utility ตรงกลาง จะช่วยให้ Code แต่ละ Controller สะอาดขึ้นเยอะ

**สร้าง: `backend/src/routes/results.js`**

สร้างไฟล์ `results.js` ในโฟลเดอร์ `src/routes/`:

```js
const router = require('express').Router();
const authenticate = require('../middlewares/auth');
const authorize = require('../middlewares/role'); // นำเข้า Middleware ดักสิทธิ์ 
const { getMyResults } = require('../controllers/resultsController');

// เมื่อทำ GET มาที่ /my ตรวจ Login (auth) -> ตรวจสิทธิ์ว่าต้องเป็น candidate -> เรียก getMyResults
router.get('/my', authenticate, authorize('candidate'), getMyResults);

module.exports = router;
```

## อัปเดต app.js — เพิ่ม Results Route

เปิดไฟล์ `backend/src/app.js` และเพิ่มบรรทัดดังต่อไปนี้

```js
// ... ส่วนของ Express Setup
app.use('/api', require('./routes/auth'));
app.use('/api/config', require('./routes/config'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/submissions', require('./routes/submissions'));
app.use('/api/results', require('./routes/results')); // [!code ++]

const PORT = process.env.PORT || 8080;
// ...
```

**สิ่งที่เพิ่มจากบทที่ 15:** เพิ่ม `app.use('/api/results', require('./routes/results'));`

## ทดสอบ

เปิด Postman แล้วทำการทดสอบด้วยบัญชี Candidate

**ทดสอบ GET /api/results/my (ล็อกอินบัญชี Candidate)**

```
GET http://localhost:8080/api/results/my
Authorization: Bearer <Candidate Token>
```

ต้องได้ **200 OK** พร้อมข้อมูลที่แบ่งหน้า:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "score": "20.50",
      "comments": "Good layout",
      "created_at": "2024-05-20T14:30:00.000Z",
      "task_title": "Module A: Layout"
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 10,
    "total_pages": 1,
    "total_records": 1
  }
}
```

**ทดสอบ GET /api/results/my (ล็อกอินบัญชี Judge)**

```
GET http://localhost:8080/api/results/my
Authorization: Bearer <Judge Token>
```

ต้องได้ **403 Forbidden** เพราะ Endpoint นี้จำกัดให้ Candidate เท่านั้น

## Common Errors

| Error | สาเหตุ | วิธีแก้ |
|-------|--------|---------|
| ข้อมูลเป็น Array ว่าง `[]` ทั้งที่มั่นใจว่ามีคะแนนแล้ว | ใส่ Role ใน Token ผิดคน หรือใน Database ผู้แข่งขันคนนั้นยังไม่มีการบันทึกคะแนนจริงๆ | ลองเอา Candidate ID ไปเปิดดูในฐานข้อมูลว่าตาราง `task_results` มีรายการของคนนี้ไหม |
| Error ตรง `JOIN` | พิมพ์ SQL ผิด เช่นลืมบอกชื่อตาราง (`tr.candidate_id`) ตอนเทียบ | ตรวจสอบการประกาศ `AS tr` และอ้างอิงให้ถูกตาราง |
