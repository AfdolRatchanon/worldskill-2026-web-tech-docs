# บทที่ 7 — เชื่อม mysql2

> **บทนี้เตรียมอะไร:** สร้าง `src/config/db.js` ที่เปิด **connection pool** ไป MariaDB — ไฟล์เดียวที่ทุก controller จะ `require` ไปใช้ยิง query

## เขียน `src/config/db.js`

```js
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
```

## เข้าใจโค้ด

- `mysql2/promise` = เวอร์ชันที่ใช้ `async/await` ได้ (ไม่ใช่ callback)
- **Pool** = บ่อ connection ที่เตรียมไว้ล่วงหน้า (สูงสุด 10 เส้น) — แต่ละ request หยิบไปใช้แล้วคืน ไม่ต้องเปิด-ปิดใหม่ทุกครั้ง เร็วและทนโหลดกว่า
- `database: process.env.DB_NAME` → ต่อเข้า `worldskill2026_real` ที่ seed ไว้บทที่ 6
- `module.exports = pool` → ไฟล์อื่น `const pool = require('../config/db')` แล้วใช้ `pool.execute(...)` ได้เลย

::: tip `execute` vs `query`
ในบทต่อๆ ไปจะใช้ `pool.execute(sql, [params])` เป็นหลัก เพราะมันใช้ **prepared statement** ที่กัน SQL Injection จากค่า `?` ให้อัตโนมัติ
:::

วิธีใช้ (ดูตัวอย่างจริงบทถัดไป):

```js
const pool = require('../config/db');
const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
```

> `pool.execute` คืน array — ตัวแรก (`rows`) คือผลลัพธ์ เลยเขียน `const [rows] = ...`

บทถัดไป (Checkpoint) ทดสอบว่า server + DB ต่อกันได้จริง
