# บทที่ 11 — bcryptjs

> **บทนี้เตรียมอะไร:** เข้าใจการเข้ารหัส password ก่อนสร้าง `authController.js` — ใช้จริงในบทที่ 13 เมื่อ login สำเร็จครั้งแรก

## ปัญหา — เก็บ Password ตรงๆ ใน Database

```
users table:
username  | password
----------+-----------
judge01   | judge123    ← ❌ ถ้า DB หลุด ทุกคนรู้ password ทันที
```

## วิธีแก้ — เก็บ Hash ไม่ใช่ Password

```
username  | password_hash
----------+----------------------------------------------
judge01   | $2a$10$xK8Lmn...   ← ✅ ถอดกลับไม่ได้
```

Hash Function มีคุณสมบัติ: input เดิมได้ output เดิม แต่**ถอดกลับไม่ได้**

## ทำไมถึงใช้ bcryptjs ไม่ใช่ตัวอื่น

| ตัวเลือก | เหตุผลที่ไม่ใช้ |
|---------|----------------|
| MD5, SHA-256 | เร็วเกินไป — crack ได้ด้วย GPU ภายในไม่กี่วินาที |
| `bcrypt` (native) | ต้องมี build tool ในเครื่อง — มักติดตั้งไม่สำเร็จในห้องแข่ง |
| `bcryptjs` | Pure JavaScript ทำงานได้ทุกเครื่องทุก OS ไม่ต้องลง build tool |

## วิธีใช้งาน

```js
const bcrypt = require('bcryptjs');

// เข้ารหัส (ใช้ตอน seed / สมัครสมาชิก)
const hash = await bcrypt.hash(password, 10);  // 10 = cost factor

// ตรวจสอบ (ใช้ตอน login)
const isMatch = await bcrypt.compare(inputPassword, storedHash);
// true = password ถูก, false = password ผิด
```

:::warning
ห้ามเปรียบ hash ด้วย `===` — ต้องใช้ `bcrypt.compare()` เสมอ เพราะ salt ในแต่ละ hash ต่างกัน
:::

## try/catch Pattern — บังคับใช้กับทุก controller

นี่เป็น controller แรก ต้องเข้าใจ pattern นี้ก่อน:

```js
// ✅ ต้องครอบ try/catch เสมอ — ถ้า DB error โดยไม่จับ server จะ crash ทันที
async function login(req, res) {
  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
    // ...
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}
```

`async/await` ใช้คู่กับ `try/catch` เพราะ `await` สามารถ throw error ได้เสมอ

## ชิ้นงาน — สร้าง `src/controllers/authController.js`

```
backend/
└── src/
    ├── config/
    │   └── db.js
    ├── controllers/
    │   └── authController.js   ← สร้างในบทนี้
    └── app.js
```

สร้างไฟล์ `backend/src/controllers/authController.js`:

```js
// authController.js — บทที่ 11 (partial, jwt จะเพิ่มบทที่ 12)
const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken'); // จะเพิ่มบทที่ 12
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

    // TODO: jwt.sign() จะเพิ่มตรงนี้ในบทที่ 12
    res.json({ success: true, message: 'bcrypt OK — jwt coming next chapter' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { login };
```

## ทดสอบ

ยังทดสอบ Postman ไม่ได้ — ยังไม่มี route ในบทนี้

```bash
npm run dev
```

ต้องเห็น:
```
Backend running on http://localhost:8080
```

ไม่มี error ใดๆ — การทดสอบ bcrypt และ jwt จริงจะเกิดในบทที่ 13 เมื่อ login สำเร็จครั้งแรก

## Common Errors

| Error | สาเหตุ | วิธีแก้ |
|-------|--------|---------| 
| `Cannot find module 'bcryptjs'` | ยังไม่ได้ `npm install` | รัน `npm install` ใน `backend/` |
| `compare()` คืน `false` ตลอด | ส่ง hash เป็น argument แรกแทน plaintext | ส่ง password ดิบเป็น argument แรกเสมอ |
| server crash ทันที | ลืม try/catch รอบ await | ครอบทุก async function ด้วย try/catch |
