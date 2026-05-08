# บทที่ 11 — jsonwebtoken: Token คืออะไร

> **บทนี้เตรียมอะไร:** ในบทที่ 12 เราจะสร้าง Login ที่ออก token ให้ผู้ใช้ และ Middleware ที่ตรวจ token ทุก request บทนี้อธิบายว่า **token คืออะไร ทำงานยังไง และทำไมถึงใช้ JWT แทนวิธีอื่น**

## ปัญหา — Server ไม่รู้ว่า Request มาจากใคร

HTTP เป็น **stateless protocol** หมายความว่าทุก request เป็นอิสระจากกัน server ไม่จำอะไรระหว่าง request

```
Request 1: POST /api/login → server รู้ว่าเป็น judge01
Request 2: GET /api/candidates → server ไม่รู้แล้วว่าใครส่งมา
```

ถ้าไม่มีกลไกพิเศษ ทุกคนสามารถเรียก `/api/candidates` ได้โดยไม่ต้อง login

## วิธีแก้แบบเก่า — Session

วิธีดั้งเดิมคือ Session: server เก็บข้อมูลผู้ใช้ไว้ใน memory แล้วออก ID ให้ browser เก็บ

```
1. Login → server เก็บ { sessionId: "abc", userId: 1, role: "judge" }
2. Browser เก็บ session ID ไว้ใน Cookie
3. ทุก request ส่ง Cookie มา → server lookup จาก memory
```

ปัญหาของ Session:
- ถ้า server restart → ข้อมูลใน memory หาย ทุกคน logout
- ถ้ามี server หลายตัว (load balancer) → request ตัวที่สองอาจไปตัวอื่น ไม่มี session นั้น
- ต้องมีที่เก็บ session กลาง (เช่น Redis) เพิ่มความซับซ้อน

## วิธีแก้แบบใหม่ — JWT (Stateless)

JWT เปลี่ยนแนวคิด: **แทนที่จะเก็บข้อมูลไว้ที่ server ให้เก็บใน token ที่ client ถือไปเอง**

```
1. Login → server สร้าง token ที่บรรจุ { userId: 1, role: "judge" } แล้วส่งให้
2. Client เก็บ token ไว้ใน localStorage
3. ทุก request ส่ง token มา → server ตรวจสอบ token และอ่านข้อมูลจากในนั้น
```

Server ไม่ต้องเก็บอะไร — ข้อมูลอยู่ใน token เองครบ

## JWT คืออะไร

JWT (JSON Web Token) คือ string ที่มี 3 ส่วนคั่นด้วยจุด แต่ละส่วนเป็น Base64Url encoded:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJqdWRnZTAxIiwicm9sZSI6Imp1ZGdlIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
         Header                                               Payload                                              Signature
```

### ส่วนที่ 1 — Header

เก็บว่าใช้ algorithm อะไร เมื่อ decode แล้วจะได้:
```json
{ "alg": "HS256", "typ": "JWT" }
```

`HS256` = HMAC with SHA-256 คือ algorithm ที่ใช้สร้าง Signature

### ส่วนที่ 2 — Payload

เก็บข้อมูลที่ต้องการฝังใน token เมื่อ decode แล้วจะได้:
```json
{
  "id": 1,
  "username": "judge01",
  "role": "judge",
  "full_name": "Judge One",
  "iat": 1716000000,
  "exp": 1716604800
}
```

`iat` = issued at (เวลาที่ออก token)
`exp` = expiration (เวลาที่ token หมดอายุ)

::: warning ข้อควรระวัง
Payload ไม่ได้เข้ารหัส ใครก็ decode ดูได้ด้วย Base64 ดังนั้นห้ามเก็บข้อมูลลับ เช่น password ใน payload
:::

### ส่วนที่ 3 — Signature

คือลายเซ็นดิจิทัลที่สร้างจาก:
```
Signature = HMAC-SHA256(Base64(Header) + "." + Base64(Payload), JWT_SECRET)
```

Signature คือหัวใจของความปลอดภัย — ถ้าใครแก้ไข Payload แม้แค่ตัวอักษรเดียว Signature จะไม่ตรงและ `jwt.verify()` จะปฏิเสธทันที

## ทำไม Signature ถึงป้องกันการแก้ไขได้

สมมุติผู้โจมตีต้องการเปลี่ยน role จาก `candidate` เป็น `judge` ในโค้ด:

```
1. Decode Payload: { role: "candidate" }
2. แก้เป็น:        { role: "judge" }
3. Encode ใหม่ → Header.NewPayload.???
```

ปัญหา: ถ้าจะแก้ Payload ต้องสร้าง Signature ใหม่ แต่ต้องรู้ `JWT_SECRET` ซึ่งอยู่แค่ใน `.env` ที่ server เท่านั้น ไม่มีทางรู้ได้

ดังนั้น: ถ้าใครแก้ Payload แล้วส่งมา → Signature ในตัว token ไม่ตรงกับ Payload ใหม่ → `jwt.verify()` บอกว่า invalid

## วิธีใช้งาน jsonwebtoken

### jwt.sign() — สร้าง token (ใช้ตอน login สำเร็จ)

```js
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { id: user.id, username: user.username, role: user.role, full_name: user.full_name },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);
```

**อธิบาย argument แต่ละตัว:**

argument ที่ 1 — **payload** (object):
ข้อมูลที่จะฝังใน token ในโปรเจกต์นี้เก็บ `id`, `username`, `role`, `full_name` เพราะ controller ต่างๆ ต้องการค่าเหล่านี้ในการตรวจสอบสิทธิ์ และแสดงข้อมูล

argument ที่ 2 — **secret** (string):
`process.env.JWT_SECRET` จาก `.env` ใช้สร้าง Signature ต้องเป็น string ลับที่ไม่มีใครรู้

argument ที่ 3 — **options** (object):
`expiresIn: '7d'` = token หมดอายุใน 7 วัน รูปแบบอื่น: `'1h'` (1 ชั่วโมง), `'30m'` (30 นาที), `'365d'` (1 ปี)

### jwt.verify() — ตรวจสอบ token (ใช้ในทุก request ที่ต้อง login)

```js
try {
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  // payload = { id: 1, username: 'judge01', role: 'judge', full_name: 'Judge One', iat: ..., exp: ... }

  console.log(payload.id);        // 1
  console.log(payload.role);      // 'judge'
  console.log(payload.full_name); // 'Judge One'
} catch (err) {
  // token ผิด หรือถูกแก้ไข หรือหมดอายุ
  console.error(err.message); // 'invalid signature' หรือ 'jwt expired'
}
```

`jwt.verify()` จะ **throw error** ถ้า:
- Signature ไม่ตรง (token ถูกแก้ไข หรือใช้ secret ผิด)
- Token หมดอายุ (`exp` เลยเวลาปัจจุบัน)
- Token format ผิด (ไม่ใช่ JWT)

ดังนั้นต้องครอบด้วย try/catch เสมอ

## Flow การทำงานทั้งหมด

```mermaid
sequenceDiagram
  participant C as Client
  participant A as authenticate middleware
  participant CT as Controller

  C->>C: POST /api/login → ได้รับ token
  Note over C: เก็บ token ใน localStorage

  C->>A: GET /api/config<br/>Header: Authorization: Bearer eyJ...
  A->>A: แยก token จาก header
  A->>A: jwt.verify(token, JWT_SECRET)
  A->>A: req.user = payload
  A->>CT: next() — ส่งต่อ
  CT-->>C: ส่งข้อมูล config

  C->>A: GET /api/config<br/>Authorization: Bearer หมดอายุ
  A->>A: jwt.verify() → throw 'jwt expired'
  A-->>C: 401 Invalid or expired token
```

## Client ส่ง Token มาอย่างไร

ทุก request ที่ต้องการ authentication จะส่ง token ใน HTTP Header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

รูปแบบ: `Bearer ` (มี space) ตามด้วย token ทั้งหมด — นี่คือมาตรฐาน RFC 6750 "Bearer Token"

ใน Postman: ไปที่ Headers tab → เพิ่ม `Authorization` → ค่าคือ `Bearer <token>`

## JWT_SECRET สำคัญแค่ไหน

```
JWT_SECRET=worldskill2026_secret_key_change_this
```

| สถานการณ์ | ผลที่เกิด |
|---------|---------|
| Secret หลุดสู่สาธารณะ | ทุกคนสามารถสร้าง token ปลอมได้ — ปลอมตัวเป็นใครก็ได้ |
| เปลี่ยน Secret ใหม่ | Token ทุกใบที่ออกก่อนหน้านี้จะ invalid ทันที ทุกคน logout |
| ใช้ Secret อ่อน (เช่น `abc`) | Brute force ได้ง่าย ควรใช้ string ยาวๆ สุ่มๆ |

## ทดสอบ

```bash
node -e "const jwt = require('jsonwebtoken'); const t = jwt.sign({ id:1, role:'judge' }, 'test-secret', { expiresIn: '1h' }); console.log('Token:', t); const p = jwt.verify(t, 'test-secret'); console.log('Payload:', JSON.stringify(p));"
```

ต้องเห็น:
```
Token: eyJhbGci...
Payload: {"id":1,"role":"judge","iat":...,"exp":...}
```

## สร้าง: `backend/src/middlewares/auth.js`

สร้างโฟลเดอร์ `src/middlewares/` แล้วสร้างไฟล์ `auth.js`:

```js
const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  // ตรวจว่ามี Authorization header และขึ้นต้นด้วย "Bearer "
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  const token = header.split(' ')[1]; // ตัด "Bearer " ออก เอาแค่ตัว token
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET); // ตรวจ + decode → { id, username, role }
    next(); // token ผ่าน → ส่งต่อไป controller
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

module.exports = authenticate;
```

> Pattern: ทุก route ที่ต้องการ login จะเพิ่ม `authenticate` เป็น argument ที่สอง เช่น `router.get('/path', authenticate, controller)`

## อัปเดต authController.js — เพิ่ม jwt.sign()

บทที่ 10 เราหยุดที่ TODO ตอนนี้แทนด้วย `jwt.sign()` จริง:

```js
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken'); // เพิ่มในบทที่ 11
const pool   = require('../config/db');

async function login(req, res) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
  const user = rows[0];

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  // สร้าง token — ฝัง id, username, role, full_name ไว้ใน payload
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, full_name: user.full_name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' } // หมดอายุใน 7 วัน
  );

  res.json({ success: true, data: { token, role: user.role, full_name: user.full_name }, meta: {} });
}

module.exports = { login }; // logout จะเพิ่มในบทที่ 12
```

**สิ่งที่เพิ่มจากบทที่ 10:** เพิ่ม `const jwt = require('jsonwebtoken')` และแทน TODO ด้วย `jwt.sign(...)` จริง

## Common Errors

| Error | สาเหตุ | วิธีแก้ |
|-------|--------|---------|
| `invalid signature` | JWT_SECRET เปลี่ยน หรือ token ถูกแก้ | login ใหม่เพื่อรับ token ที่ signed ด้วย secret ปัจจุบัน |
| `jwt expired` | token หมดอายุ (เกิน 7 วัน) | login ใหม่ |
| `jwt malformed` | token format ผิด ขาดกลาง หรือ encode ผิด | ตรวจว่า copy token ครบ ไม่มีช่องว่างแทรก |
| `Cannot find module 'jsonwebtoken'` | ยังไม่ได้ npm install | รัน `npm install` ใน `backend/` |
