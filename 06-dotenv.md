# บทที่ 6 — dotenv: จัดการ Config

> **บทนี้เตรียมอะไร:** สอน dotenv และอัปเดต `app.js` ต่อยอดจากบทที่ 5 — ย้าย PORT ออกจาก hardcode มาเป็น `process.env.PORT`

## ปัญหา — ค่า Config อยู่ที่ไหน

ตอนที่ server ต้องการเชื่อมต่อ database จะต้องรู้ค่าพวกนี้:

```js
host:     "localhost"
port:     3306
user:     "root"
password: "mypassword123"
database: "worldskill2026"
```

ถ้าเขียนค่าพวกนี้ตรงๆ ในโค้ด เรียกว่า **Hardcode**:

```js
const pool = mysql.createPool({
  host:     'localhost',
  password: 'mypassword123',   // ❌ ค่าลับอยู่ในโค้ด
  database: 'worldskill2026',
});
```

การ Hardcode สร้างปัญหา 3 อย่าง:

| ปัญหา | ผลที่เกิด |
|-------|---------|
| Push ขึ้น GitHub | ทุกคนเห็น password ทันที |
| ต้องการเปลี่ยน password | ต้องเข้าไปแก้โค้ดทีละจุดแล้ว restart server |
| ย้ายขึ้น server จริง | password ใน production ต่างกับ dev แต่อยู่ไฟล์เดียวกัน |

## วิธีแก้ — แยกค่า Config ออกจากโค้ด

แนวคิดคือ: **โค้ดไม่รู้ค่าจริง — อ่านจากภายนอกตอน runtime**

```
โค้ด (db.js)              ไฟล์ .env
─────────────────         ──────────────────────
process.env.DB_HOST  ←──  DB_HOST=localhost
process.env.DB_PASS  ←──  DB_PASSWORD=mypassword123
```

ไฟล์ `.env` เก็บค่าจริง แต่จะ**ไม่ถูก commit เข้า git** เพราะเพิ่มชื่อไว้ใน `.gitignore`

## dotenv คืออะไร

dotenv คือ library ที่ทำหน้าที่เดียว: **อ่านไฟล์ `.env` แล้วนำค่าแต่ละบรรทัดใส่เข้าไปใน `process.env`**

```
ไฟล์ .env              →    dotenv.config()    →    process.env object
─────────────────           ───────────────          ───────────────────
DB_HOST=localhost            อ่านทีละบรรทัด          process.env.DB_HOST = "localhost"
DB_PORT=3306                 parse ค่า              process.env.DB_PORT = "3306"
JWT_SECRET=abc123            ใส่เข้า env            process.env.JWT_SECRET = "abc123"
```

ทำไมถึงเลือกใช้ dotenv:
- Standard ที่ใช้กันทั่วโลกใน Node.js
- ติดตั้งง่าย ใช้งาน 1 บรรทัด
- ไม่ต้องตั้งค่า OS environment variable ด้วยมือ
- ทำงานเหมือนกันทุก platform (Windows/Mac/Linux)

## process.env คืออะไร

`process` คือ object ที่ Node.js สร้างให้ทุก program มีโดยอัตโนมัติ ใช้เข้าถึงข้อมูลเกี่ยวกับ process ที่กำลังรัน

`process.env` คือ object ย่อยที่เก็บ environment variable ทั้งหมดของระบบ OS

```js
// ก่อน dotenv.config()
console.log(process.env.DB_HOST);  // undefined — ยังไม่รู้

require('dotenv').config();

// หลัง dotenv.config()
console.log(process.env.DB_HOST);  // "localhost" — อ่านจาก .env แล้ว
```

**สำคัญ:** ค่าทุกอย่างใน `process.env` เป็น **string** เสมอ แม้จะเขียน `PORT=8080` ค่าที่ได้คือ `"8080"` (string) ไม่ใช่ `8080` (number)

```js
typeof process.env.PORT  // "string"

// ถ้าต้องใช้เป็นตัวเลข
const PORT = Number(process.env.PORT) || 8080;
```

## รูปแบบไฟล์ .env

```bash
# บรรทัดที่ขึ้นต้นด้วย # คือ comment ไม่ถูกอ่าน
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=รหัสผ่านของคุณ
DB_NAME=worldskill2026
JWT_SECRET=worldskill2026_secret_key_change_this
FRONTEND_URL=http://localhost:3000
PORT=8080
```

กฎการเขียน:
- ชื่อตัวแปร `=` ค่า โดย**ไม่มี space** รอบ `=`
- ไม่ต้องใส่ `"` ครอบค่า (dotenv จัดการให้)
- ชื่อตัวแปรนิยมเขียน UPPERCASE
- บรรทัดว่างข้ามได้

## ค่าใน .env ของโปรเจกต์นี้

| ชื่อ | ค่า | ใช้ที่ไหน |
|------|-----|---------|
| `DB_HOST` | localhost | db.js — ที่อยู่ของ MariaDB |
| `DB_PORT` | 3306 | db.js — port เริ่มต้นของ MariaDB |
| `DB_USER` | root | db.js — username สำหรับเข้า database |
| `DB_PASSWORD` | รหัสผ่านของคุณ | db.js — รหัสผ่านที่ตั้งตอนติดตั้ง MariaDB |
| `DB_NAME` | worldskill2026 | db.js — ชื่อ database ที่ seed ไว้ในบทที่ 4 |
| `JWT_SECRET` | string ลับ | authController.js — ใช้เซ็น JWT token |
| `FRONTEND_URL` | http://localhost:3000 | app.js — อนุญาตให้ React เรียก API ได้ |
| `PORT` | 8080 | app.js — port ที่ backend จะ listen |

## วิธีใช้ใน Project

### ขั้นตอนที่ 1 — สร้างไฟล์ .env

สร้างไฟล์ `backend/.env` (ไม่มีชื่อไฟล์ มีแค่นามสกุล) แล้วพิมพ์:

```bash
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=ใส่รหัสผ่าน_MariaDB_ของคุณ
DB_NAME=worldskill2026
JWT_SECRET=worldskill2026_secret_key_change_this
FRONTEND_URL=http://localhost:3000
PORT=8080
```

### ขั้นตอนที่ 2 — เรียก dotenv ที่บรรทัดแรกสุดของทุกไฟล์ที่ต้องใช้

```js
require('dotenv').config();   // ← ต้องเป็นบรรทัดแรกเสมอ
const express = require('express');
// โค้ดถัดไปเริ่มใช้ process.env ได้แล้ว
```

เหตุที่ต้องเป็นบรรทัดแรก: โค้ดถัดไปอาจใช้ `process.env` ทันทีที่ require ถ้า dotenv ยังไม่โหลด ค่าจะเป็น `undefined`

### ขั้นตอนที่ 3 — อ่านค่าในโค้ด

```js
const pool = mysql.createPool({
  host:     process.env.DB_HOST,      // "localhost"
  port:     process.env.DB_PORT,      // "3306"
  user:     process.env.DB_USER,      // "root"
  password: process.env.DB_PASSWORD,  // รหัสผ่านจาก .env
  database: process.env.DB_NAME,      // "worldskill2026"
});
```

## ทดสอบ

ตรวจว่า dotenv อ่านไฟล์ `.env` ได้ถูกต้อง (ต้องอยู่ใน `backend/`):

```bash
node -e "require('dotenv').config(); console.log('PORT:', process.env.PORT); console.log('DB_HOST:', process.env.DB_HOST);"
```

ต้องเห็น:
```
PORT: 8080
DB_HOST: localhost
```

## อัปเดต app.js — ใช้ PORT จาก .env

บทที่ 5 เราหยุดที่ PORT เป็น hardcode `8080` ตอนนี้ย้ายมาใช้ `.env` แทน

แก้ `backend/src/app.js` เป็น:

```js
// app.js หลังเพิ่ม dotenv (บทที่ 6)
require('dotenv').config();
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello from Express!');
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
```

**สิ่งที่เปลี่ยนจากบทที่ 5:**

`require('dotenv').config()` — เพิ่มบรรทัดแรกสุด โหลดค่าจาก `.env` ก่อนทุกอย่าง

`process.env.PORT || 8080` — `PORT = 8080` เปลี่ยนเป็นตัวนี้ อ่าน PORT จาก `.env` ถ้าไม่มีให้ใช้ 8080 เป็น fallback

## Common Errors

| Error | สาเหตุ | วิธีแก้ |
|-------|--------|---------|
| ค่าเป็น `undefined` | ไฟล์ `.env` อยู่ผิดโฟลเดอร์ | ตรวจว่า `.env` อยู่ใน `backend/` ไม่ใช่ที่รูทของโปรเจกต์ |
| ค่าเป็น `undefined` | ลืมเรียก `require('dotenv').config()` | เพิ่มบรรทัดนั้นก่อนโค้ดอื่น |
| ค่าเป็น `undefined` | ชื่อ key ใน `.env` ไม่ตรงกับในโค้ด | ตรวจตัวพิมพ์ใหญ่เล็กให้ตรงกัน |
| `Cannot find module 'dotenv'` | ยังไม่ได้ npm install | รัน `npm install` ใน `backend/` |
