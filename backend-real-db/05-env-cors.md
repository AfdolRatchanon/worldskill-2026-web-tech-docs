# บทที่ 5 — dotenv & cors

> **บทนี้เตรียมอะไร:** เพิ่ม middleware 3 ตัวลง `src/app.js` — `dotenv` (อ่าน `.env`), `cors` (ให้ frontend คนละ port เรียกได้), `express.json` (อ่าน body) และ `morgan` (log request) — เป็นด่านที่ทุก request ต้องผ่านก่อนถึง route

## แก้ `src/app.js`

```js
require('dotenv').config();           // [!code ++]
const express = require('express');
const cors = require('cors');          // [!code ++]
const morgan = require('morgan');      // [!code ++]

const app = express();

app.use(cors());                       // [!code ++]
app.use(express.json());               // [!code ++]
app.use(morgan('short'));              // [!code ++]

app.get('/', (req, res) => {
  res.json({ message: 'API running' });
});

const PORT = process.env.PORT || 8080; // [!code ++]
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
```

## เข้าใจ middleware แต่ละตัว

| โค้ด | ทำอะไร | ถ้าไม่มี |
|------|--------|---------|
| `require('dotenv').config()` | โหลดค่าจาก `.env` เข้า `process.env` | `process.env.PORT` เป็น undefined |
| `app.use(cors())` | อนุญาตให้ frontend (port 3000) เรียก API (port 8080) ได้ | เบราว์เซอร์บล็อกด้วย CORS error |
| `app.use(express.json())` | แปลง body JSON ที่ส่งมา → `req.body` | `req.body` เป็น undefined ตอน POST/PUT |
| `app.use(morgan('short'))` | พิมพ์ log ทุก request ใน terminal (รูปแบบ `short`) | ไม่เห็นว่ามี request อะไรเข้ามา |

::: tip `app.use` = ทำกับทุก request
ต่างจาก `app.get` ที่ผูกกับ path เดียว — `app.use(...)` คือ middleware ที่รันกับ **ทุก** request ตามลำดับบนลงล่าง
:::

## ทดสอบ

1. `npm run dev` แล้วยิง `GET http://localhost:8080/` → ได้ `{"message":"API running"}`
2. ดู terminal — เห็น log แบบ `GET / 200 ...` จาก morgan = middleware ทำงาน

บทถัดไปสร้างฐานข้อมูลจาก `seed_data.sql`
