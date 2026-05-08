# บทที่ 3 — เตรียม Project

## ไฟล์ที่จะสร้างในบทนี้

| ไฟล์ | หน้าที่ |
|------|--------|
| `backend/package.json` | dependencies และ npm scripts |
| `backend/.env` | environment variables (รหัสผ่าน, secret key) |

## โครงสร้างโฟลเดอร์ที่ต้องสร้าง

สร้างโฟลเดอร์และไฟล์ตามโครงสร้างนี้ใน VS Code:

```
backend/
├── src/
│   ├── config/
│   ├── middlewares/
│   ├── routes/
│   ├── controllers/
│   └── utils/
├── database/
├── .env
└── package.json
```

โฟลเดอร์เปล่าๆ สร้างโดยคลิกขวาใน Explorer ของ VS Code → **New Folder**

## ติดตั้ง Packages

เปิด Terminal ใน VS Code (`Ctrl + `` `) แล้วรัน:

```bash
npm init -y
```

```bash
npm install express cors dotenv mysql2 bcryptjs jsonwebtoken pdfkit
```

```bash
npm install -D nodemon
```

ต้องเห็น `added XX packages` และไม่มีบรรทัด `error`

**สิ่งสำคัญในคำสั่งนี้:**
- `express` — web framework รับ HTTP request ส่ง response
- `cors` — อนุญาตให้ frontend (port 3000) เรียก backend (port 8080) ได้
- `dotenv` — อ่านค่าจากไฟล์ `.env` เข้า `process.env`
- `mysql2` — เชื่อมต่อ MariaDB (ต้องใช้ `mysql2` ไม่ใช่ `mysql`)
- `bcryptjs` — เข้ารหัส password ก่อนเก็บใน database
- `jsonwebtoken` — สร้างและตรวจสอบ JWT token
- `pdfkit` — สร้างไฟล์ PDF

## สร้าง: `backend/package.json`

หลังจาก `npm init -y` จะได้ไฟล์ `package.json` มาแล้ว ให้แก้ส่วน `scripts` ให้เป็นแบบนี้:

```json
{
  "name": "worldskill-2026-backend",
  "version": "1.0.0",
  "main": "src/app.js",
  "scripts": {
    "start": "node src/app.js",
    "dev":   "nodemon src/app.js",
    "seed":  "node database/seed.js"
  },
  "dependencies": {
    "bcryptjs":     "^2.4.3",
    "cors":         "^2.8.5",
    "dotenv":       "^16.4.5",
    "express":      "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "mysql2":       "^3.9.7",
    "pdfkit":       "^0.15.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  }
}
```

**สิ่งสำคัญในโค้ดนี้:**
- `"dev": "nodemon src/app.js"` — รีสตาร์ท server อัตโนมัติทุกครั้งที่บันทึกไฟล์ระหว่างพัฒนา
- `"seed": "node database/seed.js"` — รันสคริปต์สร้างข้อมูลเริ่มต้น

## สร้าง: `backend/.env`

สร้างไฟล์ `.env` ที่ root ของ backend:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=รหัสผ่าน_mariadb_ของคุณ
DB_NAME=worldskill2026
JWT_SECRET=worldskill2026_secret_key_change_this
FRONTEND_URL=http://localhost:3000
PORT=8080
```

**สิ่งสำคัญในโค้ดนี้:**
- `DB_PASSWORD` — ใส่รหัสผ่าน MariaDB ที่ตั้งไว้ตอนติดตั้ง
- `JWT_SECRET` — ใช้เซ็น JWT token ต้องเก็บเป็นความลับ
- ไฟล์นี้ห้าม commit เข้า git เพราะมีรหัสผ่าน

## ทดสอบ

รันคำสั่งนี้เพื่อตรวจสอบว่าติดตั้ง packages ครบ:

```bash
node -e "require('express'); require('mysql2'); require('jsonwebtoken'); console.log('packages OK')"
```

ต้องเห็น:
```
packages OK
```

## Common Errors

| Error | สาเหตุ | วิธีแก้ |
|-------|--------|---------|
| `Cannot find module 'express'` | install ยังไม่เสร็จ หรือรันนอกโฟลเดอร์ backend | ตรวจว่าอยู่ใน `backend/` แล้วรัน `npm install` |
| `npm: command not found` | Node.js ไม่ได้ติดตั้ง | กลับไปบทที่ 1 |
| `npm warn` | warning ปกติ ไม่ใช่ error | ไม่ต้องสนใจ — ดูแค่บรรทัด `error` |
