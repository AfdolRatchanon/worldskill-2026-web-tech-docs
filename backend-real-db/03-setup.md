# บทที่ 3 — เตรียม Project

> **บทนี้เตรียมอะไร:** สร้างโฟลเดอร์โปรเจกต์ `backend-real-db`, ติดตั้ง library ที่ต้องใช้, วางโครงโฟลเดอร์, และสร้างไฟล์ `.env` — จบบทนี้พร้อมเขียน server บทถัดไป

## สร้างโปรเจกต์ + ติดตั้ง library

```bash
mkdir backend-real-db
cd backend-real-db
npm init -y
npm install express mysql2 jsonwebtoken cors morgan dotenv
npm install -D nodemon
```

::: warning ไม่มี bcryptjs!
เวอร์ชันเดิมติดตั้ง `bcryptjs` ไว้เข้ารหัสรหัสผ่าน — แต่ schema ทางการเก็บรหัสเป็น **plain-text** เราจึง **ไม่ติดตั้ง bcryptjs** ในโปรเจกต์นี้ (ดูบทที่ 10)
:::

| library | ทำอะไร |
|---------|--------|
| `express` | สร้าง web server + routing |
| `mysql2` | เชื่อมต่อ MariaDB (แบบ Promise) |
| `jsonwebtoken` | สร้าง/ตรวจ token ตอน login |
| `cors` | ให้ frontend คนละ port เรียก API ได้ |
| `morgan` | log request ที่เข้ามาใน terminal |
| `dotenv` | อ่านค่าลับจากไฟล์ `.env` |
| `nodemon` (dev) | รีสตาร์ท server อัตโนมัติเมื่อแก้โค้ด |

## โครงโฟลเดอร์

```
backend-real-db/
├── database/
│   ├── seed_data.sql      ← schema + ข้อมูลตั้งต้น (ทางการ)
│   └── seed.js            ← สคริปต์รัน seed_data.sql ลง DB
├── src/
│   ├── app.js             ← จุดเริ่ม server
│   ├── config/db.js       ← connection pool ไป MariaDB
│   ├── middlewares/       ← auth.js, role.js
│   ├── controllers/       ← logic แต่ละ endpoint
│   └── routes/            ← จับคู่ URL กับ controller
├── .env                   ← ค่าตั้งค่า (ห้าม commit)
└── package.json
```

## ตั้ง script ใน `package.json`

```json
{
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js",
    "seed": "node database/seed.js"
  }
}
```

## สร้างไฟล์ `.env`

```bash
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=worldskill2026_real
JWT_SECRET=change-this-to-a-random-secret
PORT=8080
```

> หมายเหตุ: ถ้าทำ[บทเสริม (จับเวลา)](/backend-real-db/26-session-timer) ค่อยเพิ่ม `SESSION_DURATION_MINUTES` ทีหลัง

::: tip ใช้ DB คนละชื่อกับเวอร์ชันเดิม
`DB_NAME=worldskill2026_real` ตั้งใจแยกจาก `worldskill2026` ของเวอร์ชันเดิม — รันสองตัวบนเครื่องเดียวกันได้โดยข้อมูลไม่ชนกัน
:::

จบบทนี้ → ไปบทที่ 4 เขียน Express server ตัวแรก
