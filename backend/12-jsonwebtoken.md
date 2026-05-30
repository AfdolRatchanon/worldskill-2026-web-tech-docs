# บทที่ 12 — jsonwebtoken

> **บทนี้เตรียมอะไร:** สร้าง `middlewares/auth.js` + เติม `jwt.sign()` ใน authController — ใช้จริงตั้งแต่บท 13 ทุก route ที่ต้อง login

## ปัญหา — Server ไม่รู้ว่า Request มาจากใคร

HTTP เป็น stateless — ทุก request เป็นอิสระ server ไม่จำว่าใคร login แล้ว:

```
Request 1: POST /api/login → server รู้ว่าเป็น judge01
Request 2: GET /api/candidates → server ไม่รู้แล้วว่าใครส่งมา ❌
```

## วิธีแก้ — JWT Token

Server สร้าง token หลัง login สำเร็จ — client เก็บแล้วแนบทุก request:

```
1. Login → server ออก token: eyJhbGci...
2. Client เก็บ token
3. ทุก request: Authorization: Bearer eyJhbGci...
4. Server ตรวจ token → รู้ว่าใคร + role อะไร
```

## JWT มี 3 ส่วน

```
eyJhbGciOiJIUzI1NiJ9   .   eyJpZCI6MSwiccm9sZSI6Imp1ZGdlIn0   .   SflKxwRJSMeKKF2QT4fwpM
      Header                          Payload                              Signature
```

| ส่วน | เก็บอะไร | อ่านได้ไหม |
|-----|---------|-----------|
| Header | algorithm ที่ใช้ | ได้ (Base64) |
| Payload | id, role, username | ได้ (Base64) — **ห้ามใส่ข้อมูลลับ** |
| Signature | ลายเซ็นจาก JWT_SECRET | ถ้าแก้ Payload → Signature ไม่ตรง → `jwt.verify()` ปฏิเสธ |

:::danger
JWT_SECRET ห้ามเปิดเผย ถ้าหลุดทุกคนสร้าง token ปลอมได้
:::

## ทำไมถึงใช้ JWT ไม่ใช่ Session

| วิธี | ปัญหา |
|-----|-------|
| Session (memory) | ถ้า server restart → logout ทุกคน |
| JWT | Server ไม่ต้องเก็บอะไร — ข้อมูลอยู่ใน token เอง |

## วิธีใช้งาน

```js
const jwt = require('jsonwebtoken');

// สร้าง token (ตอน login สำเร็จ)
const token = jwt.sign(
  { id: user.id, username: user.username, role: user.role, full_name: user.full_name },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }     // หมดอายุ 7 วัน
);

// ตรวจ token (ใน middleware)
const payload = jwt.verify(token, process.env.JWT_SECRET);
// payload = { id, username, role, full_name, iat, exp }
```

## ชิ้นงาน 1 — เพิ่มค่าลับใน `.env`

เปิดไฟล์ `backend/.env` แล้วเพิ่ม `JWT_SECRET` (ตั้งค่าเป็นอะไรก็ได้ แต่ห้ามบอกใคร):

```
PORT=8080
FRONTEND_URL=http://localhost:3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=รหัสผ่าน_mariadb_ของคุณ
DB_NAME=worldskill2026
JWT_SECRET=worldskill2026_secret_key_change_this  # [!code ++]
```

:::danger
`JWT_SECRET` ห้ามเปิดเผย ถ้าหลุดทุกคนสร้าง token ปลอมได้ และห้าม commit ไฟล์ `.env` เข้า git
:::

## ชิ้นงาน 2 — สร้าง `src/middlewares/auth.js`

```
backend/
└── src/
    ├── controllers/
    │   └── authController.js   ← แก้ในบทนี้ (เพิ่ม jwt)
    ├── middlewares/
    │   └── auth.js             ← สร้างในบทนี้
    └── app.js
```

สร้างไฟล์ `backend/src/middlewares/auth.js`:

```js
// auth.js — middleware ตรวจ token ทุก request
const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {     // ต้องมี "Bearer <token>"
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  const token = header.split(' ')[1];                 // ตัด "Bearer " ออก
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET); // decode → { id, role, ... }
    next();                                           // ผ่าน → ส่งต่อ controller
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

module.exports = authenticate;
```

## แก้ `src/controllers/authController.js` — เพิ่ม jwt.sign()

```js
// authController.js — บทที่ 12 เพิ่ม jwt
const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken'); // จะเพิ่มบทที่ 12 // [!code --]
const jwt    = require('jsonwebtoken');                       // [!code ++]
const pool   = require('../config/db');

async function login(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE username = ?', [username]
    );
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // TODO: jwt.sign() จะเพิ่มตรงนี้ในบทที่ 12                // [!code --]
    res.json({ success: true, message: 'bcrypt OK — jwt coming next chapter' }); // [!code --]
    const token = jwt.sign(                                       // [!code ++]
      { id: user.id, username: user.username, role: user.role, full_name: user.full_name }, // [!code ++]
      process.env.JWT_SECRET,                                     // [!code ++]
      { expiresIn: '7d' }                                         // [!code ++]
    );                                                            // [!code ++]
    res.json({ success: true, data: { token, role: user.role, full_name: user.full_name }, meta: {} }); // [!code ++]
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function logout(req, res) {                               // [!code ++]
  try {                                                         // [!code ++]
    res.json({ success: true, data: null, meta: {} });          // [!code ++]
  } catch {                                                     // [!code ++]
    res.status(500).json({ success: false, message: 'Server error' }); // [!code ++]
  }                                                             // [!code ++]
}                                                               // [!code ++]

module.exports = { login };   // [!code --]
module.exports = { login, logout }; // [!code ++]
```

## ทดสอบ

ยังทดสอบ Postman ไม่ได้ — ยังไม่มี route เชื่อมต่อ

```bash
npm run dev
```

ต้องเห็น:
```
Backend running on http://localhost:8080
```

ไม่มี error — การทดสอบ login จริงด้วย Postman จะเกิดในบทที่ 13

## Common Errors

| Error | สาเหตุ | วิธีแก้ |
|-------|--------|---------| 
| `invalid signature` | JWT_SECRET ใน `.env` เปลี่ยน | login ใหม่ |
| `jwt expired` | token หมดอายุ (เกิน 7d) | login ใหม่ |
| `jwt malformed` | copy token ไม่ครบ | ตรวจว่า copy token ครบ ไม่มีช่องว่างแทรก |
| 401 ทั้งที่ส่ง token แล้ว | ลืมใส่ `Bearer ` นำหน้า (มี space) | ตรวจใน Postman: `Bearer <token>` |
