# บทที่ 7 — cors: แก้ปัญหา Port ต่างกัน

> **บทนี้เตรียมอะไร:** สอน cors และอัปเดต `app.js` ต่อยอดจากบทที่ 6 — เพิ่ม cors middleware และ `express.json()` เพื่อให้ frontend เรียก API ได้

## ปัญหา — Frontend กับ Backend คนละ Port

ในโปรเจกต์นี้มีสองส่วนทำงานพร้อมกัน:

```
React Frontend   → รันที่  http://localhost:3000
Express Backend  → รันที่  http://localhost:8080
```

เมื่อ React พยายามเรียก API:

```js
fetch('http://localhost:8080/api/login', {
  method: 'POST',
  body: JSON.stringify({ username: 'judge01', password: 'judge123' })
})
```

Browser จะ**ปฏิเสธ request นั้นทันที** และแสดง error ใน console:

```
Access to fetch at 'http://localhost:8080/api/login' from origin
'http://localhost:3000' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## ทำไม Browser ถึงทำแบบนี้ — Same-Origin Policy

Browser มีนโยบายที่เรียกว่า **Same-Origin Policy** ซึ่งมีมาตั้งแต่ต้น เพื่อป้องกันการโจมตีแบบหนึ่งที่เรียกว่า Cross-Site Request Forgery (CSRF)

กฎคือ: **JavaScript บนหน้าเว็บหนึ่งจะดึงข้อมูลจาก server อื่น "Origin" ไม่ได้ เว้นแต่ server นั้นจะอนุญาตก่อน**

**Origin** คือการรวมกันของ 3 ส่วน:

| ส่วน | frontend | backend |
|------|---------|--------|
| Protocol | http | http |
| Hostname | localhost | localhost |
| **Port** | **3000** | **8080** |
| ผลลัพธ์ | `http://localhost:3000` | `http://localhost:8080` |

port ต่างกัน → **คนละ origin** → Browser block

แม้ทั้งสองจะรันบนเครื่องเดียวกัน browser ก็ยังถือว่าคนละ origin

## CORS คืออะไร — กลไกการอนุญาต

CORS (Cross-Origin Resource Sharing) คือ **กลไกที่ browser กับ server ใช้ตกลงกันว่า "ใครเรียกได้บ้าง"**

กลไกทำงานผ่าน HTTP Header:

```
Server → ส่ง response พร้อม header:
Access-Control-Allow-Origin: http://localhost:3000
```

เมื่อ browser เห็น header นี้ จะ**ยอมให้** JavaScript อ่านผลลัพธ์ได้

ถ้าไม่มี header นี้ → browser block แม้ server จะส่งข้อมูลกลับมาแล้ว (browser ซ่อนข้อมูลนั้นไม่ให้ JavaScript อ่าน)

## cors package คืออะไร

`cors` คือ Express middleware ที่ทำหน้าที่**เพิ่ม CORS header ให้อัตโนมัติทุก response** โดยไม่ต้องเขียน header เองทุกครั้ง

ถ้าไม่ใช้ package ต้องเขียนเองแบบนี้ทุก route:

```js
// ❌ ต้องเขียนซ้ำทุก route — ยุ่งยากมาก
app.get('/api/login', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  // ... logic
});
```

เมื่อใช้ cors package:

```js
// ✅ เพิ่มบรรทัดเดียว ทุก route ได้ header อัตโนมัติ
app.use(cors({ origin: process.env.FRONTEND_URL }));
```

## ทำไมระบุ origin แทนที่จะเปิดทั้งหมด

```js
// ⚠️ เปิดหมดทุก origin — อันตราย
app.use(cors());

// ✅ เปิดเฉพาะ frontend ของเรา — ปลอดภัยกว่า
app.use(cors({ origin: process.env.FRONTEND_URL }));
```

ถ้าเปิดทั้งหมด เว็บไซต์อื่นๆ สามารถเรียก API ของเราผ่าน browser ผู้ใช้ได้ ซึ่งเป็นความเสี่ยง การระบุ origin เฉพาะทำให้มั่นใจได้ว่าเฉพาะ frontend ของเราเท่านั้นที่เรียกจาก browser ได้

## Header ที่ cors เพิ่มให้

เมื่อ `app.use(cors({ origin: 'http://localhost:3000' }))` ทำงาน ทุก response จะมี header:

```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE
```

สำหรับ request ที่มี header `Authorization` (ซึ่งเราจะส่งทุก request ที่ต้อง login) browser จะ **preflight** ก่อน โดยส่ง OPTIONS request และ cors จัดการตอบโดยอัตโนมัติ

## Postman ไม่ได้รับผลกระทบจาก CORS

สิ่งสำคัญที่ต้องเข้าใจ: **CORS เป็นนโยบายของ browser เท่านั้น**

| เครื่องมือ | ติด CORS หรือเปล่า |
|-----------|-----------------|
| Postman | ❌ ไม่ติด — ส่ง request ได้เสมอ |
| curl | ❌ ไม่ติด |
| Browser / React | ✅ ติด — ต้องมี CORS header จาก server |

นั่นหมายความว่าระหว่างพัฒนา backend ทดสอบผ่าน Postman ได้ปกติ แต่เมื่อ React frontend เรียกจะติดถ้าไม่มี cors ใน server

## ทดสอบ

ตรวจว่า cors ติดตั้งแล้ว:

```bash
node -e "require('cors'); console.log('cors: OK')"
```

ต้องเห็น:
```
cors: OK
```

## อัปเดต app.js — เพิ่ม cors และ express.json()

บทที่ 6 เราหยุดที่ app.js มี dotenv แล้ว ตอนนี้เพิ่ม cors เข้ามา

แก้ `backend/src/app.js` เป็น:

```js
// app.js หลังเพิ่ม cors (บทที่ 7)
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello from Express!');
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
```

**สิ่งที่เปลี่ยนจากบทที่ 6:**

`const cors = require('cors')` — นำ cors middleware เข้ามา

`app.use(cors({ origin: process.env.FRONTEND_URL }))` — เพิ่ม cors ให้ทุก response มี CORS header อัตโนมัติ `FRONTEND_URL` อ่านจาก `.env` ที่สร้างในบทที่ 6

`app.use(express.json())` — parse HTTP body จาก JSON string เป็น JavaScript object ถ้าไม่มีบรรทัดนี้ `req.body` จะเป็น `undefined` เสมอ

**ทำไม cors ต้องวางก่อน express.json():** ลำดับ middleware ใน Express มีความสำคัญ cors ต้องอยู่ก่อนสุดเพราะ browser ส่ง preflight request (OPTIONS) มาก่อน ซึ่งต้องได้ CORS header ก่อนผ่าน middleware อื่น

## Common Errors

| Error | สาเหตุ | วิธีแก้ |
|-------|--------|---------|
| `CORS policy` error ใน browser | ลืมใส่ `app.use(cors(...))` | เพิ่มก่อน route ทุกตัวใน app.js |
| `CORS policy` error ทั้งที่มี cors แล้ว | cors วางหลัง route | cors ต้องอยู่บน route เสมอ |
| Frontend เรียกได้แต่ response หาย | `FRONTEND_URL` ใน .env ผิด port | ตรวจว่า `http://localhost:3000` ตรงกับ port ที่ React รัน |
| `Cannot find module 'cors'` | ยังไม่ได้ npm install | รัน `npm install` ใน `backend/` |
