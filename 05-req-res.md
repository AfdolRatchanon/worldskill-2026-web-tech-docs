# บทที่ 5 — req & res

> **บทนี้เตรียมอะไร:** เข้าใจ req และ res ก่อนสร้าง controller จริงในบทที่ 11 เป็นต้นไป

## req — สิ่งที่ client ส่งมา

| Property | ข้อมูลที่ได้ | ตัวอย่าง |
|----------|-----------|---------|
| `req.body` | ข้อมูล JSON ใน body | `{ "username": "judge01" }` |
| `req.params` | ค่าใน URL path | `/users/:id` → `req.params.id` |
| `req.query` | ค่าใน query string | `/tasks?page=1` → `req.query.page` |
| `req.headers` | HTTP headers | `req.headers.authorization` |

## res — สิ่งที่ server ตอบกลับ

```js
res.send('text');                           // ตอบ plain text
res.json({ success: true });               // ตอบ JSON
res.status(404).json({ message: 'Not found' }); // ตอบพร้อม status code
```

## HTTP Methods — ใช้เมื่อไร

| Method | ใช้เมื่อ | ตัวอย่าง |
|--------|---------|---------|
| GET | ดึงข้อมูล (ไม่เปลี่ยนแปลง DB) | GET /api/tasks |
| POST | สร้างข้อมูลใหม่ | POST /api/my-submission |
| PUT | แก้ไขข้อมูลที่มีอยู่ | PUT /api/my-submission |

## Route Params vs Query String

```
/api/submissions/42        → req.params.id = '42'
/api/tasks?page=1          → req.query.page = '1'
```

## 404 Handler

วาง `app.use()` ไว้ท้ายสุดเสมอ จะรับทุก request ที่ไม่ตรงกับ route ไหนเลย:

```js
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Not found' });
});
```

## ชิ้นงาน — เพิ่ม test route ใน `src/app.js`

:::warning
route นี้สร้างชั่วคราวเพื่อทดสอบความเข้าใจ — จะลบออกด้วย `[!code --]` ในบทที่ 6
:::

```js
// app.js — บทที่ 5 เพิ่ม test route
const express = require('express');
const app = express();

app.use(express.json());                   // [!code ++]

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/test/:name', (req, res) => {    // [!code ++]
  res.json({ params: req.params, query: req.query }); // [!code ++]
});                                        // [!code ++]

const PORT = 8080;
app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
```

## ทดสอบ

```bash
npm run dev
```

เปิด Postman → GET `http://localhost:8080/test/worldskill?year=2026`

ต้องได้:
```json
{
  "params": { "name": "worldskill" },
  "query": { "year": "2026" }
}
```

## Common Errors

| Error | สาเหตุ | วิธีแก้ |
|-------|--------|---------| 
| `req.body` เป็น `undefined` | ลืมใส่ `app.use(express.json())` | เพิ่ม middleware ก่อน route |
| 404 ทุก request | URL พิมพ์ผิด หรือ method ไม่ตรง | ตรวจ method และ URL ใน Postman |
