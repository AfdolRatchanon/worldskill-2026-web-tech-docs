# บทที่ 14 — Architecture

> **บทนี้เตรียมอะไร:** เข้าใจโครงสร้างระบบก่อน API จริงจะเริ่ม — บทนี้ไม่มี endpoint ใหม่

## ส่วนที่ 1 — สร้าง `src/middlewares/role.js`

```
backend/
└── src/
    └── middlewares/
        ├── auth.js
        └── role.js   ← สร้างในบทนี้
```

สร้างไฟล์ `backend/src/middlewares/role.js`:

```js
// role.js — ตรวจสิทธิ์ตาม role หลังจาก authenticate แล้ว
function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    next();
  };
}

module.exports = authorize;
```

ใช้งาน: `router.get('/path', authenticate, authorize('judge'), ctrl.fn)`

## ส่วนที่ 2 — Request Flow Diagram

ทุก request ไหลผ่านชั้นเดิมเสมอ:

```mermaid
sequenceDiagram
  participant C as Client
  participant CO as cors
  participant AU as authenticate
  participant AZ as authorize(role)
  participant CT as Controller
  participant DB as MariaDB

  C->>CO: request
  CO->>AU: ผ่าน CORS header
  AU->>AU: jwt.verify(token)
  AU->>AZ: req.user = payload
  AZ->>AZ: ตรวจ role
  AZ->>CT: next()
  CT->>DB: pool.execute(SQL)
  DB-->>CT: rows
  CT-->>C: res.json({ success, data, meta })
```

## ส่วนที่ 3 — Middleware Order ใน app.js

ลำดับ middleware มีความสำคัญมาก — ผิดลำดับทำงานผิด:

```js
app.use(cors(...));           // 1. cors ก่อนเสมอ — browser preflight ต้องผ่านก่อน
app.use(express.json());      // 2. parse body — route ถึงจะอ่าน req.body ได้
app.use(autoClose);           // 3. autoClose — จะเพิ่มในบทที่ 20
app.use('/api', authRoute);   // 4. routes
```

## ส่วนที่ 4 — HTTP Status Codes ที่ใช้ในโปรเจ็คนี้

| Code | ใช้เมื่อ |
|------|---------|
| 200 | สำเร็จ (default) |
| 400 | ข้อมูลที่ส่งมาไม่ครบหรือผิดรูปแบบ |
| 401 | ไม่มี token หรือ token ผิด |
| 403 | มี token แต่ role ไม่มีสิทธิ์ |
| 404 | ไม่พบข้อมูลที่ขอ |
| 409 | ข้อมูลซ้ำ (เช่น submission ซ้ำใน session เดิม) |
| 500 | server error (catch จาก try/catch) |

## ส่วนที่ 5 — Response Format มาตรฐาน

ทุก endpoint ต้องส่งใน format นี้ตามโจทย์ TP2026:

```js
// สำเร็จ — single object
res.json({ success: true, data: { ... }, meta: {} });

// สำเร็จ — list
res.json({ success: true, data: [ ... ], meta: {} });

// error
res.status(400).json({ success: false, message: 'reason' });
```

:::warning
ห้ามส่ง response format อื่น — กรรมการตรวจจาก `success`, `data`, `meta` โดยตรง
:::

## Pattern ที่ใช้ซ้ำทุก Endpoint

ตั้งแต่บทที่ 15 ทุก endpoint ใช้ pattern นี้:

```
User Story → Folder Tree → Route [!code ++] → Controller → Postman Test
```

```js
// routes/xxx.js
router.METHOD('/path', authenticate, authorize('role'), ctrl.fn); // [!code ++]

// controllers/xxxController.js
async function fn(req, res) {
  try {
    const [rows] = await pool.execute('SELECT ...', [...]);
    res.json({ success: true, data: rows, meta: {} });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}
```

| Middleware | สร้างในบทที่ |
|------------|------------|
| `auth.js` | 12 — jsonwebtoken |
| `role.js` | 14 — บทนี้ |
| `autoClose.js` | 20 — Session |
