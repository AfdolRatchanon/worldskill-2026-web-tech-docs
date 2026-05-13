# บทที่ 6 — dotenv

> **บทนี้เตรียมอะไร:** อ่านค่า config จากไฟล์ `.env` แทน hardcode จะใช้จริงตลอดโปรเจ็คตั้งแต่บทนี้เป็นต้นไป

## ปัญหา — hardcode ค่า config ในโค้ด

บทที่ 4 ใช้ `PORT = 8080` ตรงๆ ในโค้ด — ถ้าต้องเปลี่ยนค่าหรือมีรหัสผ่าน DB จะเป็นปัญหาทันที:

```js
const PORT = 8080;               // ❌ hardcode — แก้ยาก
const password = 'mypassword';   // ❌ ถ้า push git ทุกคนเห็น
```

## วิธีแก้ — dotenv อ่านค่าจากไฟล์ `.env`

```
ไฟล์ .env              →    dotenv.config()    →    process.env
──────────────────          ───────────────          ────────────────────
PORT=8080                   อ่านทีละบรรทัด          process.env.PORT = '8080'
DB_PASSWORD=secret          ใส่เข้า env            process.env.DB_PASSWORD = 'secret'
```

## ทำไมถึงใช้ dotenv ไม่ใช่ตัวอื่น

| ทางเลือก | เหตุผลที่ไม่ใช้ |
|---------|----------------|
| Hardcode | แก้ยาก, ค่าลับหลุดเข้า git |
| OS environment variable | ต้องตั้งค่าทุกเครื่อง ไม่สะดวก |
| dotenv | Standard ใน Node.js, ใช้ 1 บรรทัด, ทำงานทุก platform |

## วิธีใช้งาน

```js
require('dotenv').config();              // โหลด .env ก่อนทุกอย่าง — ต้องเป็นบรรทัดแรกเสมอ
const PORT = process.env.PORT || 8080;  // อ่านจาก .env ถ้าไม่มีใช้ 8080
```

:::warning
`require('dotenv').config()` ต้องอยู่บรรทัดแรกเสมอ เพราะโค้ดถัดไปอาจใช้ `process.env` ทันที
:::

:::tip
ค่าทุกอย่างใน `process.env` เป็น **string** เสมอ แม้จะเขียน `PORT=8080` ค่าที่ได้คือ `'8080'` ไม่ใช่ตัวเลข
:::

## ชิ้นงาน — แก้ `src/app.js`

```
backend/
├── src/
│   └── app.js   ← แก้ในบทนี้
└── .env         ← สร้างแล้วในบทที่ 3
```

แก้ `backend/src/app.js`:

```js
// app.js — บทที่ 6 เพิ่ม dotenv
require('dotenv').config();                      // [!code ++]
const express = require('express');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/test/:name', (req, res) => {          // [!code --]
  res.json({ params: req.params, query: req.query }); // [!code --]
});                                              // [!code --]

const PORT = 8080;                               // [!code --]
const PORT = process.env.PORT || 8080;           // [!code ++]
app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
```

> ลบ test route จากบท 5 ออกพร้อมกันเลย — ไม่ต้องใช้แล้ว

## ทดสอบ

```bash
npm run dev
```

ต้องเห็น:
```
http://localhost:8080
```

ตัวเลข port ต้องตรงกับ `PORT=8080` ใน `.env` ที่ตั้งไว้

:::tip
ลองเปลี่ยน `PORT=9000` ใน `.env` บันทึก → nodemon restart อัตโนมัติ → เห็น `http://localhost:9000` แล้วเปลี่ยนกลับเป็น 8080
:::

## Common Errors

| Error | สาเหตุ | วิธีแก้ |
|-------|--------|---------| 
| PORT เป็น `undefined` | ไฟล์ `.env` อยู่ผิดโฟลเดอร์ | ตรวจว่า `.env` อยู่ใน `backend/` |
| PORT เป็น `undefined` | ลืม `require('dotenv').config()` | เพิ่มบรรทัดแรกก่อนโค้ดอื่น |
| `Cannot find module 'dotenv'` | ยังไม่ได้ `npm install` | รัน `npm install` ใน `backend/` |
