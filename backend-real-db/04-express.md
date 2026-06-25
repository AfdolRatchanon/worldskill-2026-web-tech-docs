# บทที่ 4 — Express: Hello World

> **บทนี้เตรียมอะไร:** เขียน `src/app.js` ตัวแรกให้ server รันได้ และยิงทดสอบด้วย Postman — เห็นว่า "server ที่รันได้" หน้าตาเป็นยังไงก่อนใส่ของจริง

## เขียน `src/app.js`

```js
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'Hello WorldSkill 2026' });
});

const PORT = 8080;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
```

## รัน server

```bash
npm run dev
```

เห็นข้อความ `Backend running on http://localhost:8080` = สำเร็จ

## ทดสอบ

| ขั้นตอน | ต้องเห็น |
|--------|---------|
| เปิดเบราว์เซอร์ไป `http://localhost:8080/` | `{"message":"Hello WorldSkill 2026"}` |
| Postman: `GET http://localhost:8080/` | status **200** + JSON เดียวกัน |

::: tip ยังไม่เคยใช้ Postman?
GET แบบนี้เปิดในเบราว์เซอร์ก็ได้ (ไม่ต้อง login) — วิธีใช้ Postman ครบๆ (token, body, อ่าน status) อยู่ที่ [บท 📮 ทดสอบด้วย Postman](/backend-real-db/postman) หลังทำ Login เสร็จ
:::

## เข้าใจโค้ด

- `express()` สร้างแอป
- `app.get(path, handler)` = ถ้ามี request **GET** มาที่ `path` ให้รัน handler
- `res.json(...)` ส่ง JSON กลับ + ตั้ง header `Content-Type: application/json` ให้อัตโนมัติ
- `app.listen(PORT, ...)` เปิดรับ request ที่ port นั้น

::: tip nodemon
รันด้วย `npm run dev` (nodemon) แล้วทุกครั้งที่กด Save ไฟล์ server จะรีสตาร์ทเอง ไม่ต้องปิด-เปิดเอง
:::

บทถัดไปเพิ่ม dotenv + cors + middleware ให้พร้อมต่อ frontend
