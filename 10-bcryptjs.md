# บทที่ 10 — bcryptjs: เก็บ Password อย่างปลอดภัย

> **บทนี้เตรียมอะไร:** ในบทที่ 12 เราจะสร้าง `authController.js` ซึ่งต้องเปรียบเทียบ password ที่ผู้ใช้พิมพ์กับ password ที่เก็บไว้ใน database บทนี้อธิบายว่าทำไม**ถึงเก็บ password เป็น hash ไม่ใช่ plain text** และ bcryptjs ทำงานยังไง

## ปัญหา — เก็บ Password ตรงๆ ใน Database

สมมุติว่า database เก็บข้อมูลแบบนี้:

```
users table:
id | username    | password
---+-------------+----------
1  | judge01     | judge123
2  | manager01   | manager123
3  | candidate01 | cand123
```

ถ้า database ถูกแฮก หรือมีคนเข้าถึง backup ไฟล์ได้โดยไม่ได้รับอนุญาต — ผู้ร้ายจะรู้ password ของทุกคนทันที และนำไปลองกับ email หรือบัญชีธนาคารที่ใช้ password เดิมได้

ปัญหาในโลกจริง: ผู้ใช้ส่วนใหญ่ใช้ password เดิมในหลายๆ เว็บ ถ้า password หลุดจากที่หนึ่ง บัญชีทุกที่พังหมด

## วิธีแก้ — เก็บ Hash ไม่ใช่ Password

แนวคิด: **แทนที่จะเก็บ password ดิบ ให้แปลงก่อนแล้วค่อยเก็บ** โดยใช้ฟังก์ชันพิเศษที่เรียกว่า Hash Function

Hash Function มีคุณสมบัติสำคัญ:
- Input เดิมได้ output เดิมเสมอ
- **ถอดกลับไม่ได้** (One-way) — ใครก็ไม่สามารถรู้ว่า hash มาจาก password อะไร
- เปลี่ยน input นิดเดียว output เปลี่ยนหมดเลย

ผลคือ database เก็บแบบนี้:

```
users table:
id | username | password_hash
---+----------+--------------------------------------------------
1  | judge01  | $2a$10$xK8LmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUV
```

ถ้า database หลุด ผู้ร้ายก็ไม่รู้ว่า password จริงๆ คืออะไร

## ทำไมถึงใช้ bcrypt ไม่ใช่ hash แบบอื่น

มี hash algorithm หลายตัว ทำไมถึงไม่ใช้ตัวอื่น:

| Algorithm | เหมาะกับ password ไหม | ปัญหา |
|-----------|---------------------|-------|
| MD5 | ❌ | เร็วเกินไป — crack ได้ด้วย GPU ภายในไม่กี่วินาที |
| SHA-256 | ❌ | เร็วเกินไป — ออกแบบมาสำหรับ checksum ไม่ใช่ password |
| bcrypt | ✅ | ออกแบบมาเฉพาะสำหรับ password โดยตรง ตั้งใจให้ช้าเพื่อป้องกัน brute force |

bcrypt ถูกออกแบบให้ **ช้าโดยตั้งใจ** ผ่านสิ่งที่เรียกว่า cost factor ถ้า crack password ต้องลองหลายพันครั้ง ความช้านี้ทำให้ยากมากขึ้น

## ทำไมใช้ bcryptjs ไม่ใช่ bcrypt

| Package | วิธีทำงาน | ปัญหา |
|---------|----------|-------|
| `bcrypt` | ใช้ native C++ addon | ต้องมี build tool (Python, Visual C++ บน Windows) ติดตั้งไว้ในเครื่อง มักจะ error |
| `bcryptjs` | Pure JavaScript ล้วน | ทำงานได้ทุกเครื่อง ทุก OS โดยไม่มีปัญหา |

ในห้องแข่งขันที่ไม่แน่ใจว่าเครื่องมี build tool หรือเปล่า การใช้ `bcryptjs` ปลอดภัยกว่ามาก

## Salt คืออะไร — ทำไม Hash เดิมได้ผลต่างกัน

ถ้า hash ได้ผลเหมือนกันเสมอ ผู้โจมตีสามารถสร้าง "Rainbow Table" ได้ — ตารางที่เก็บผลของ hash password ที่นิยมใช้ไว้ทุกอัน แล้ว lookup ย้อนกลับได้

```
Rainbow Table:
hash("password123") = "ef92b778..."  → จำไว้
hash("123456")      = "8d969eef..."  → จำไว้
```

bcrypt แก้ปัญหานี้ด้วย **Salt** — random string ที่สุ่มใหม่ทุกครั้ง และเอาไปรวมกับ password ก่อน hash

```
Salt สุ่ม: "abc123xyz"
Hash("judge123" + "abc123xyz") = "$2a$10$abc123..."

Salt สุ่มใหม่: "def456uvw"
Hash("judge123" + "def456uvw") = "$2a$10$def456..."
```

ผลลัพธ์ต่างกันแม้ password เดิม ทำให้ Rainbow Table ใช้ไม่ได้

Salt ถูกเก็บไว้ใน hash string เองด้วย ดังนั้น `bcrypt.compare()` จึงรู้ว่าต้องใช้ salt อะไรในการตรวจ

## โครงสร้างของ Hash String

```
$2a$10$xK8LmnopqrstuvwxyzABCD.EFGHIJKLMNOPQRSTUVWXYZabcdef
 ↑  ↑  ↑──────────────────── ↑─────────────────────────────
 |  |       22 chars: Salt       31 chars: Hash ของ password
 |  └── cost factor (10)
 └── bcrypt version
```

## วิธีใช้งาน bcryptjs

### bcrypt.hash() — แปลง password เป็น hash (ใช้ตอน seed / สมัครสมาชิก)

```js
const bcrypt = require('bcryptjs');

const password = 'judge123';
const hash = await bcrypt.hash(password, 10);
// hash = "$2a$10$xK8Lmn..."
```

argument ที่ 2 คือ **cost factor** (หรือ salt rounds):
- ค่า `10` หมายถึง bcrypt จะ hash ซ้ำ 2^10 = 1,024 รอบ
- ใช้เวลาประมาณ 100ms — เร็วพอสำหรับ login แต่ช้าพอที่ทำให้ brute force ยาก
- ห้ามใช้น้อยกว่า `10`

### bcrypt.compare() — ตรวจสอบ password ตอน login

```js
const inputPassword = 'judge123';       // ที่ผู้ใช้พิมพ์
const storedHash    = '$2a$10$xK8...'; // ที่อยู่ใน database

const isMatch = await bcrypt.compare(inputPassword, storedHash);
// isMatch = true  ถ้า password ถูกต้อง
// isMatch = false ถ้า password ผิด
```

`compare()` ไม่ได้ถอด hash — แต่ดึง salt ออกจาก storedHash แล้ว hash inputPassword ด้วย salt เดิม แล้วเปรียบเทียบผลลัพธ์

### สิ่งที่ห้ามทำ

```js
// ❌ ผิด — hash สองครั้งจากข้อมูลเดียวกันได้ผลต่างกัน
const h1 = await bcrypt.hash('judge123', 10);
const h2 = await bcrypt.hash('judge123', 10);
console.log(h1 === h2); // false เสมอ เพราะ salt ต่างกัน

// ❌ ผิด — ต้องใช้ bcrypt.compare() ไม่ใช่ ===
console.log(h1 === storedHash); // ผิดเสมอแม้ password ถูก
```

## ทดสอบ

```bash
node -e "const b = require('bcryptjs'); b.hash('test123', 10).then(h => { console.log('Hash:', h); return b.compare('test123', h); }).then(ok => console.log('Match:', ok));"
```

ต้องเห็น:
```
Hash: $2a$10$...
Match: true
```

## สร้าง: `backend/src/controllers/authController.js`

สร้างโฟลเดอร์ `src/controllers/` แล้วสร้างไฟล์ `authController.js`:

```js
const bcrypt = require('bcryptjs');
// jwt จะเพิ่มในบทที่ 11
const pool   = require('../config/db'); // pool จากบทที่ 8

async function login(req, res) {
  const { username, password } = req.body; // รับ input จาก client
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  // query หา user จาก database (ใช้ ? ป้องกัน SQL Injection)
  const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
  const user = rows[0]; // undefined ถ้าไม่มี username นี้ใน database

  // เปรียบ password กับ hash โดยไม่ต้องถอด hash
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  // TODO: jwt.sign() จะเพิ่มตรงนี้ในบทที่ 11
  res.json({ success: true, message: 'bcrypt OK' });
}

module.exports = { login };
```

> บทที่ 11 จะแทน TODO ด้วย `jwt.sign()` บทที่ 12 จะสร้าง route ถึงจะทดสอบ Postman ได้

## Common Errors

| Error | สาเหตุ | วิธีแก้ |
|-------|--------|---------|
| `Cannot find module 'bcryptjs'` | ยังไม่ได้ npm install | รัน `npm install` ใน `backend/` |
| `compare()` คืน `false` ตลอด | ส่ง hash ซ้อน hash เข้า compare แทน plaintext | ตรวจว่าส่ง password ดิบเป็น argument แรก ไม่ใช่ hash |
| hash ออกมาต่างกันทุกครั้ง | ปกติ — salt สุ่มใหม่เสมอ | ใช้ `compare()` เท่านั้น อย่าใช้ `===` |
