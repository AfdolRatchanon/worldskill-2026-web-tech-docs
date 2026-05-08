# บทที่ 15 — Submissions (ส่งผลงาน)

> **บทนี้เตรียมอะไร:** สร้าง API สำหรับการอัปโหลดหรือส่งผลงาน (Submission) และสร้าง Middleware `role.js` ครั้งแรกเพื่อป้องกันไม่ให้ Candidate ทำสิทธิ์ของ Judge/Admin ได้

## ไฟล์ที่ต้องสร้างในบทนี้

| ไฟล์ | หน้าที่ |
|------|--------|
| `backend/src/middlewares/role.js` | ฟังก์ชันดักจับ (Middleware) สำหรับจำกัดสิทธิ์ของ Route ให้เรียกได้เฉพาะ Role ที่กำหนด |
| `backend/src/routes/submissions.js` | ลงทะเบียน URL สำหรับการส่งงาน |
| `backend/src/controllers/submissionsController.js` | Logic ควบคุมการบันทึกข้อมูลผลงานของ Candidate |

**อัปเดต:**

| ไฟล์ | สิ่งที่เพิ่ม |
|------|------------|
| `backend/src/app.js` | เพิ่ม route สำหรับ submissions (`/api/submissions`) |

## ปัญหา — ผู้เข้าแข่งขันเผลอแอบดูคะแนน

สมมติมี Route `GET /api/results` (คะแนนสอบ)
ถ้าเราป้องกันด้วย `authenticate` ผู้เข้าแข่งขัน (Candidate) ที่ล็อกอินแล้ว ก็มี Token ที่ถูกต้อง ทำให้สามารถเรียก API ดูคะแนนตัวเองได้ก่อนเวลาประกาศผล

**วิธีแก้:** เราต้องมีตัวช่วยคัดกรองรอบที่ 2 ต่อจาก `authenticate` นั่นคือ **Role Authorization** ระบบจะดูว่า Token มี `role` เป็นอะไร ถ้าเป็น `candidate` จะเข้าได้แค่บาง Route เท่านั้น

## สร้าง: `backend/src/middlewares/role.js`

สร้างไฟล์ `role.js` ในโฟลเดอร์ `src/middlewares/`:

```js
// ฟังก์ชัน authorize รับค่า role หรืออาร์เรย์ของ role ที่อนุญาตให้เข้าถึง
function authorize(allowedRoles) {
  // หากเป็น string ตัวเดียว แปลงให้เป็น Array เพื่อให้ตรวจสอบง่าย
  if (typeof allowedRoles === 'string') {
    allowedRoles = [allowedRoles];
  }

  // ส่งคืนฟังก์ชันที่เป็น Middleware จริงๆ ให้ Express ไปใช้งานต่อ
  return (req, res, next) => {
    // req.user ได้มาจาก authenticate middleware ที่ทำงานไปก่อนหน้านี้
    // หากไม่มีสิทธิ์ ให้ดีดกลับเป็น 403 Forbidden
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: Insufficient privileges' });
    }
    
    next(); // สิทธิ์ถูกต้อง ส่งไปให้ Controller จัดการ
  };
}

module.exports = authorize;
```

> **401 vs 403:** 
> - **401 Unauthorized** = "คุณเป็นใคร? ไปล็อกอินมาก่อน" (ผิดที่ `authenticate`)
> - **403 Forbidden** = "รู้แล้วว่าคุณคือใคร แต่คุณไม่มีสิทธิ์เข้าห้องนี้" (ผิดที่ `authorize`)

## METHOD POST /api/submissions

API สำหรับ Candidate แจ้งอัปโหลดหรือส่งลิงก์ผลงาน

**สร้าง: `backend/src/controllers/submissionsController.js`**

สร้างไฟล์ `submissionsController.js` ในโฟลเดอร์ `src/controllers/`:

```js
const pool = require('../config/db');

async function submitTask(req, res) {
  try {
    const { task_id, repo_url, hosting_url } = req.body;
    
    // ดึง ID ผู้ใช้มาจาก Token (ซึ่ง authenticate ใส่ไว้ให้แล้ว)
    const candidate_id = req.user.id;

    // ตรวจสอบว่าส่งข้อมูลครบไหม
    if (!task_id || !repo_url) {
      return res.status(400).json({ success: false, message: 'task_id and repo_url are required' });
    }

    // ตรวจสอบว่า Candidate เคยส่ง Task นี้ไปหรือยัง
    const [existing] = await pool.execute(
      'SELECT id FROM submissions WHERE candidate_id = ? AND task_id = ?', 
      [candidate_id, task_id]
    );

    if (existing.length > 0) {
      // เคยส่งแล้ว ให้ใช้วิธีอัปเดต (UPDATE) ผลงานเดิม
      await pool.execute(
        'UPDATE submissions SET repo_url = ?, hosting_url = ?, submitted_at = NOW() WHERE candidate_id = ? AND task_id = ?',
        [repo_url, hosting_url || null, candidate_id, task_id]
      );
      
      return res.json({ success: true, message: 'Submission updated successfully', meta: {} });
    }

    // ยังไม่เคยส่ง ให้บันทึกข้อมูลใหม่ (INSERT)
    await pool.execute(
      'INSERT INTO submissions (candidate_id, task_id, repo_url, hosting_url) VALUES (?, ?, ?, ?)',
      [candidate_id, task_id, repo_url, hosting_url || null]
    );

    res.json({ success: true, message: 'Submission created successfully', meta: {} });

  } catch (error) {
    console.error('Error in submitTask:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = {
  submitTask
};
```

**สร้าง: `backend/src/routes/submissions.js`**

สร้างไฟล์ `submissions.js` ในโฟลเดอร์ `src/routes/`:

```js
const router = require('express').Router();
const authenticate = require('../middlewares/auth');
const authorize = require('../middlewares/role'); // นำเข้า Role Middleware
const { submitTask } = require('../controllers/submissionsController');

// เมื่อ POST มา ให้ตรวจ Login (auth) ก่อน จากนั้นตรวจสิทธิ์ว่าต้องเป็น candidate เท่านั้น (role)
router.post('/', authenticate, authorize('candidate'), submitTask);

module.exports = router;
```

## อัปเดต app.js — เพิ่ม Submissions Route

เปิดไฟล์ `backend/src/app.js` และเพิ่มบรรทัดดังต่อไปนี้

```js
// ... ส่วนของ Express Setup
app.use('/api', require('./routes/auth'));
app.use('/api/config', require('./routes/config'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/submissions', require('./routes/submissions')); // [!code ++]

const PORT = process.env.PORT || 8080;
// ...
```

**สิ่งที่เพิ่มจากบทที่ 14:** เพิ่ม `app.use('/api/submissions', require('./routes/submissions'));`

## ทดสอบ

ใช้ Postman ทดสอบการทำงานของ Role Middleware และการส่งงาน:

**ทดสอบ POST /api/submissions (ล็อกอินบัญชี Judge)**

ล็อกอินด้วย `judge01` แล้วเอา Token มาทดสอบ:

```
POST http://localhost:8080/api/submissions
Authorization: Bearer <Judge Token>
Content-Type: application/json

{
  "task_id": 1,
  "repo_url": "https://github.com/..."
}
```

ต้องได้ **403 Forbidden**:
```json
{
  "success": false,
  "message": "Forbidden: Insufficient privileges"
}
```

**ทดสอบ POST /api/submissions (ล็อกอินบัญชี Candidate)**

ล็อกอินด้วย `candidate01` (ต้องไปดูพาสเวิร์ดใน Database ที่เตรียมไว้ หรือถ้ายังไม่มีให้ใช้ SQL สร้างขึ้นมา) แล้วเอา Token มาทดสอบ:

```
POST http://localhost:8080/api/submissions
Authorization: Bearer <Candidate Token>
Content-Type: application/json

{
  "task_id": 1,
  "repo_url": "https://github.com/my-repo",
  "hosting_url": "https://my-site.com"
}
```

ต้องได้ **200 OK**:
```json
{
  "success": true,
  "message": "Submission created successfully",
  "meta": {}
}
```

## Common Errors

| Error | สาเหตุ | วิธีแก้ |
|-------|--------|---------|
| ข้อมูลซ้ำ หรือ Database Error ตอนยิงซ้ำ | Database บังคับ Unique Key แต่โค้ดจัดการผิดพลาด | โค้ดตัวอย่างเรามีการ `SELECT` หาค่าที่เคยส่งแล้วก่อน หากเจอจะทำอัปเดต ถ้ามันเกิด Error ให้เช็ค Logic บรรทัด IF |
| หลงลืมใส่ Token | ได้ค่า `401 Unauthorized` | ล็อกอินก่อนแล้วเอา Token มาใส่ `Authorization` Header |
| ติด `403 Forbidden` อยู่ตลอด | ใส่ชื่อ Role ผิดตอนประกาศ Router หรือ Data ในตาราง Users ช่อง Role เป็นค่าอื่นที่ไม่ตรง | เช็คตาราง `users` ของฐานข้อมูลว่าผู้ใช้คนนั้นมีค่า `role` ตรงกับ `'candidate'` ตัวพิมพ์เล็กทั้งหมดหรือไม่ |
