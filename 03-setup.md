# บทที่ 3 — เตรียม Project

> **บทนี้เตรียมอะไร:** สร้างโครงสร้างโฟลเดอร์, ติดตั้ง packages, และเข้าใจ concepts สำคัญ 3 อย่างก่อนเขียนโค้ด

## CommonJS vs ESM — ทำไมใช้ `require` ไม่ใช่ `import`

```js
// ✅ ที่เราใช้ — CommonJS (Node.js default)
const express = require('express');

// ❌ ห้ามใช้ — ES Module (ใช้ใน React/browser)
import express from 'express';
```

Node.js ใช้ CommonJS เป็น default ถ้าใช้ `import` จะ error ทันที

## nodemon และ npm scripts

หลังจาก setup แล้ว เราใช้แค่ 2 คำสั่งนี้ตลอดการพัฒนา:

```json
"scripts": {
  "dev":   "nodemon src/app.js",
  "start": "node src/app.js",
  "seed":  "node database/seed.js"
}
```

| Script | ใช้เมื่อ |
|--------|---------|
| `npm run dev` | พัฒนา — restart อัตโนมัติทุกครั้งที่บันทึกไฟล์ |
| `npm start` | production — รันครั้งเดียว ไม่ restart |
| `npm run seed` | สร้างข้อมูลเริ่มต้น (ถ้าโจทย์กำหนด) |

## API Map — endpoints ทั้งหมดที่จะสร้าง

| Method | Endpoint | Role | บทที่สร้าง |
|--------|----------|------|----------|
| POST | /api/login | ทุก role | 13 |
| POST | /api/logout | ทุก role | 13 |
| GET | /api/config | ทุก role | 15 |
| GET | /api/tasks | ทุก role | 16 |
| GET | /api/my-submission | candidate | 17 |
| POST | /api/my-submission | candidate | 18 |
| PUT | /api/my-submission | candidate | 18 |
| GET | /api/my-result | candidate | 19 |
| PUT | /api/session/start | judge | 20 |
| PUT | /api/session/close | judge | 20 |
| GET | /api/candidates | judge | 21 |
| GET | /api/submissions | judge | 22 |
| POST | /api/submissions/:id/recheck | judge | 23 |
| PUT | /api/results/:candidate_id/confirm | judge | 24 |
| GET | /api/statistics/summary | manager | 25 |
| GET | /api/statistics/status | manager | 25 |
| GET | /api/statistics/ranking | manager | 26 |
| GET | /api/sessions | manager | 27 |
| GET | /api/report | manager | 28 |

## โครงสร้างโฟลเดอร์ที่จะสร้างทั้งหมด

สร้างโฟลเดอร์และไฟล์ตามโครงสร้างนี้ใน VS Code (คลิกขวาใน Explorer → **New Folder**):

```
backend/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── routes/
│   └── utils/
├── database/
├── .env
└── package.json
```

## ชิ้นงาน — ติดตั้ง Packages

เปิด Terminal ใน VS Code (`Ctrl + `` `) ให้แน่ใจว่า path อยู่ใน `backend/` แล้วรัน:

```bash
npm init -y
```

```bash
npm install express cors dotenv mysql2 bcryptjs jsonwebtoken
```

```bash
npm install -D nodemon
```

ต้องเห็น `added XX packages` และไม่มีบรรทัด `error`

:::tip
`npm warn` เป็น warning ปกติ — ไม่ใช่ error ไม่ต้องสนใจ
:::

## สร้าง: `backend/package.json`

หลังจาก `npm init -y` ให้แก้ส่วน `scripts`:

```json
{
  "name": "worldskill-2026-backend",
  "version": "1.0.0",
  "main": "src/app.js",
  "scripts": {
    "dev":   "nodemon src/app.js",
    "start": "node src/app.js",
    "seed":  "node database/seed.js"
  },
  "dependencies": {
    "bcryptjs":     "^2.4.3",
    "cors":         "^2.8.5",
    "dotenv":       "^16.4.5",
    "express":      "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "mysql2":       "^3.9.7"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  }
}
```

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

:::danger
`JWT_SECRET` ห้ามเปิดเผย ถ้าหลุดทุกคนสร้าง token ปลอมได้ และห้าม commit ไฟล์ `.env` เข้า git
:::

## ทดสอบ

ยังไม่มี `src/app.js` ในบทนี้ — ทดสอบแค่ว่า packages ติดตั้งสำเร็จ:

```bash
ls node_modules | head -5
```

ต้องเห็นโฟลเดอร์ `express`, `cors`, `dotenv` ใน `node_modules/`

> การทดสอบรัน server จริงจะเกิดขึ้นใน **บทที่ 4** เมื่อสร้าง `src/app.js` แล้ว

## Common Errors

| Error | สาเหตุ | วิธีแก้ |
|-------|--------|---------| 
| `Cannot find module 'express'` | install ยังไม่เสร็จ หรือรันนอกโฟลเดอร์ backend | ตรวจว่าอยู่ใน `backend/` แล้วรัน `npm install` |
| `npm: command not found` | Node.js ไม่ได้ติดตั้ง | กลับไปบทที่ 1 |
| `ENOENT: no such file or directory` | Terminal path ผิด | ดูว่า path ใน terminal ชี้ไปที่ `backend/` |
