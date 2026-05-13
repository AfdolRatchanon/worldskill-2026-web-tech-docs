# บทที่ 7 — cors

> **บทนี้เตรียมอะไร:** อนุญาตให้ frontend เรียก backend ได้ จะใช้ในทุก endpoint ตลอดโปรเจ็ค

## ปัญหา — Frontend กับ Backend คนละ Port

```
React (frontend)  → รันที่  http://localhost:3000
Express (backend) → รันที่  http://localhost:8080
```

Port ต่างกัน → ถือว่าคนละ Origin → Browser ปฏิเสธ request ทันที:

```
CORS policy: No 'Access-Control-Allow-Origin' header is present
```

## วิธีแก้ — ให้ server ส่ง CORS header กลับมา

Browser จะยอมรับ response ถ้า server ส่ง header นี้กลับมา:

```
Access-Control-Allow-Origin: http://localhost:3000
```

`cors` package เพิ่ม header นี้ให้อัตโนมัติทุก response

## ทำไมถึงใช้ cors package ไม่ใช่ตัวอื่น

| ทางเลือก | เหตุผลที่ไม่ใช้ |
|---------|----------------|
| เขียน header เอง | ต้องเขียนซ้ำทุก route — ยุ่งยาก |
| `app.use(cors())` เปิดทั้งหมด | ทุกเว็บไซต์เรียก API ได้ — อันตราย |
| `cors({ origin: FRONTEND_URL })` | เปิดเฉพาะ frontend ของเรา — ถูกต้อง |

:::tip
Postman ไม่ได้รับผลกระทบจาก CORS เพราะ CORS เป็นนโยบายของ browser เท่านั้น ทดสอบผ่าน Postman ได้ปกติเสมอ
:::

## วิธีใช้งาน

```js
const cors = require('cors');
app.use(cors({ origin: process.env.FRONTEND_URL })); // อ่าน URL จาก .env
```

**ลำดับ middleware สำคัญมาก** — cors ต้องวางก่อน route ทุกตัวเสมอ

## ชิ้นงาน — แก้ `src/app.js`

```
backend/
└── src/
    └── app.js   ← แก้ในบทนี้
```

```js
// app.js — บทที่ 7 เพิ่ม cors
require('dotenv').config();
const express = require('express');
const cors    = require('cors');               // [!code ++]
const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL })); // [!code ++]
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
```

## ทดสอบ

```bash
npm run dev
```

ต้องเห็น:
```
http://localhost:8080
```

server รันได้ปกติ ไม่มี error — cors เพิ่ม header ให้อัตโนมัติทุกครั้งที่มี request เข้ามา

## Common Errors

| Error | สาเหตุ | วิธีแก้ |
|-------|--------|---------| 
| `CORS policy` error ใน browser | ลืม `app.use(cors(...))` | เพิ่มก่อน route ทุกตัว |
| cors ไม่ทำงาน ทั้งที่ใส่แล้ว | cors วางหลัง route | cors ต้องวางบนสุดก่อน `app.use('/api', ...)` |
| `Cannot find module 'cors'` | ยังไม่ได้ `npm install` | รัน `npm install` ใน `backend/` |
