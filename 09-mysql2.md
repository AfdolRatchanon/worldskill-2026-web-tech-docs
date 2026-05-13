# บทที่ 9 — mysql2

> **บทนี้เตรียมอะไร:** สร้าง `config/db.js` เชื่อมต่อ MariaDB + ลบ Hello World route ออกจาก `app.js` — skeleton สมบูรณ์พร้อมรับ route จริงตั้งแต่บท 13

## ปัญหา — Node.js คุยกับ MariaDB ไม่ได้โดยตรง

Node.js ไม่รู้วิธีส่ง MySQL Protocol ไปยัง MariaDB ต้องมี library เป็น "ล่าม":

```
pool.execute('SELECT ...')  →  mysql2  →  MariaDB  →  [{ id:1, ... }]
```

## ทำไมถึงใช้ mysql2 ไม่ใช่ตัวอื่น

| ตัวเลือก | เหตุผลที่ไม่ใช้ |
|---------|----------------|
| `mysql` (v1) | ไม่รองรับ async/await — ต้องใช้ callback ที่เขียนยากกว่า |
| `sequelize`, `prisma` | ORM ซับซ้อน ไม่เหมาะกับการแข่งที่ต้องเขียน raw SQL |
| `mysql2` | รองรับ async/await, เร็ว, เสถียร — standard สำหรับ Node.js + MariaDB |

## วิธีใช้งาน

```js
const mysql = require('mysql2/promise');  // ต้องมี /promise สำหรับ async/await

const pool = mysql.createPool({ ... });   // สร้าง connection pool ครั้งเดียว

const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
// rows — array ของ object แต่ละ row
// ? — placeholder ป้องกัน SQL Injection
```

:::tip
`require('mysql2/promise')` ไม่ใช่ `require('mysql2')` — ถ้าลืม `/promise` จะใช้ async/await ไม่ได้
:::

## Connection Pool คืออะไร

Pool เตรียม connection กับ MariaDB ไว้ล่วงหน้า 10 ตัว ทุก request ยืมมาใช้แล้วคืนกลับ — ไม่ต้องสร้างใหม่ทุกครั้ง

```
Request 1  ─→  Connection #1  ─→  MariaDB
Request 2  ─→  Connection #2  ─→  MariaDB
Request 3  ─→  Connection #3  ─→  MariaDB
(เสร็จแล้วคืน pool ไม่ปิด)
```

## ชิ้นงาน — สร้าง `src/config/db.js`

```
backend/
└── src/
    ├── config/
    │   └── db.js   ← สร้างในบทนี้
    └── app.js
```

สร้างไฟล์ `backend/src/config/db.js`:

```js
// db.js — เชื่อมต่อ MariaDB ด้วย Connection Pool
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:             process.env.DB_HOST,
  port:             process.env.DB_PORT,
  user:             process.env.DB_USER,
  password:         process.env.DB_PASSWORD,
  database:         process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit:  10,             // connection สำรองสูงสุด 10 ตัว
});

module.exports = pool;              // export ให้ทุก controller ใช้ร่วมกัน
```

> Pattern: ทุก controller จะเริ่มด้วย `const pool = require('../config/db');` เสมอ

## แก้ `src/app.js` — ลบ Hello World

```
backend/
└── src/
    └── app.js   ← แก้ในบทนี้
```

```js
// app.js — บทที่ 9 skeleton สมบูรณ์
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

app.get('/', (req, res) => {                  // [!code --]
  res.send('Hello World!');                   // [!code --]
});                                           // [!code --]

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
```

> นี่คือ skeleton จริง — รอ route จากบท 13 เป็นต้นไป

## ทดสอบ

```bash
npm run dev
```

ต้องเห็น:
```
Backend running on http://localhost:8080
```

Postman: `GET http://localhost:8080/anything` → ต้องได้ **404** (สัญญาณดี — server รับ request ได้ แต่ยังไม่มี route)

## Common Errors

| Error | สาเหตุ | วิธีแก้ |
|-------|--------|---------| 
| `Access denied for user 'root'` | `DB_PASSWORD` ใน `.env` ผิด | ตรวจรหัสผ่าน MariaDB |
| `ECONNREFUSED 127.0.0.1:3306` | MariaDB ไม่ได้เปิด | เปิด MariaDB service ก่อน |
| `Unknown database 'worldskill2026'` | ยังไม่ได้ import schema | กลับบท 8 — รัน `npm run seed` |
| `TypeError: pool.execute is not a function` | ลืม `/promise` | ใช้ `require('mysql2/promise')` |
