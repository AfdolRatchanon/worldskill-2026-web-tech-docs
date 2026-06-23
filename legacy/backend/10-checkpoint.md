# บทที่ 10 — Checkpoint

> ตรวจสอบทุกอย่างให้ผ่านก่อนไปต่อ — บท 11-29 ต้องใช้ทุกอย่างที่ตั้งค่าไว้แล้ว

## Checklist ก่อนไปบทถัดไป

ทำทีละข้อ ต้องผ่านทุกข้อ:

**โครงสร้างโฟลเดอร์**

```
backend/
├── src/
│   ├── config/
│   │   └── db.js          ✅ มีไฟล์นี้
│   └── app.js             ✅ มีไฟล์นี้
├── database/
│   ├── schema.sql         ✅ มีไฟล์นี้
│   └── seed.js            ✅ มีไฟล์นี้
├── .env                   ✅ มีไฟล์นี้
└── package.json           ✅ มีไฟล์นี้
```

**node_modules**

```bash
ls node_modules | grep -E "express|cors|dotenv|mysql2|bcryptjs|jsonwebtoken"
```

ต้องเห็นทุกชื่อนี้ปรากฏ ถ้าไม่เห็น → `npm install`

**ไฟล์ `.env` ครบ**

เปิดไฟล์ `backend/.env` ตรวจว่ามีครบ:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=<รหัสผ่านจริง>
DB_NAME=worldskill2026
FRONTEND_URL=http://localhost:3000
PORT=8080
```

**Database มีข้อมูล**

```bash
mysql -u root -p worldskill2026
```

```sql
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM test_sessions;
EXIT;
```

ต้องเห็น: users = 7 แถว, test_sessions = 1 แถว

ถ้าไม่มี → รัน `npm run seed`

**Server รันได้ปกติ**

```bash
npm run dev
```

ต้องเห็น:
```
Backend running on http://localhost:8080
```

ไม่มี error ใดๆ

**`app.js` ถูกต้อง**

เปิดไฟล์ `backend/src/app.js` ตรวจว่า:
- บรรทัดแรก: `require('dotenv').config();`
- มี `app.use(cors(...))`
- มี `app.use(express.json())`
- **ไม่มี** `app.get('/', ...)` Hello World route แล้ว
- `app.listen` ใช้ `process.env.PORT || 8080`

## ตัวอย่าง app.js ที่ถูกต้อง ณ จุดนี้

```js
// app.js — หลังบทที่ 9 (skeleton สมบูรณ์)
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
```

## ถ้าผ่านทุกข้อ

พร้อมไปบท 11 — จะสร้าง authentication system (bcryptjs + jwt + login route)

:::warning
ถ้ายังไม่ผ่านข้อใดข้อหนึ่ง ให้แก้ก่อน ห้ามข้ามไป — บท 11-13 ต้องการ DB connection และ server ที่รันได้
:::
