# บทที่ 4 — Express: Hello World

> **บทนี้เตรียมอะไร:** สร้าง `src/app.js` ตัวแรก — server ที่รันได้จริงบน port 8080 จะใช้ต่อยอดทุกบทจนถึงบทที่ 29

## ปัญหา — ไม่มี server ยังทดสอบอะไรไม่ได้

ไฟล์ที่ติดตั้งไปในบทที่ 3 ยังเป็นแค่ library นิ่งๆ ต้องสร้าง server ก่อน ถึงจะรันและทดสอบ endpoint ได้

## ชิ้นงาน — สร้าง `src/app.js`

```
backend/
├── src/
│   └── app.js   ← สร้างในบทนี้
└── package.json
```

สร้างไฟล์ `backend/src/app.js` แล้วพิมพ์โค้ดนี้:

```js
// app.js — บทที่ 4 Express Hello World
const express = require('express');       // โหลด express
const app = express();                    // สร้าง server instance

app.get('/', (req, res) => {
  res.send('Hello World!');              // ตอบกลับ text ธรรมดา
});

const PORT = 8080;
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

เปิด browser ไปที่ `http://localhost:8080` ต้องเห็น:
```
Hello World!
```

:::tip
`npm run dev` ใช้ nodemon — server จะ restart อัตโนมัติทุกครั้งที่บันทึกไฟล์
:::

## Common Errors

| Error | สาเหตุ | วิธีแก้ |
|-------|--------|---------| 
| `Cannot find module 'express'` | ยังไม่ได้ `npm install` | รัน `npm install` ใน `backend/` |
| `Error: listen EADDRINUSE :::8080` | port 8080 ถูกใช้อยู่ | ปิดโปรแกรมที่ใช้ port 8080 แล้วรันใหม่ |
| `nodemon: command not found` | ติดตั้ง nodemon ไม่สมบูรณ์ | รัน `npm install -D nodemon` |
