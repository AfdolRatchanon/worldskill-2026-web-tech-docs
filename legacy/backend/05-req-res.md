# บทที่ 5 — req & res และ HTTP Status

> **บทนี้เตรียมอะไร:** เข้าใจ req, res, HTTP Methods และ Status Codes ก่อนสร้าง controller จริงในบทที่ 11 เป็นต้นไป

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

การสื่อสารแบบ RESTful API จะใช้ HTTP Methods เป็นตัวบอกจุดประสงค์ของการกระทำ:

| Method | การใช้งาน | ตัวอย่างในโปรเจ็คนี้ |
|--------|---------|---------|
| **GET** | ดึงข้อมูล (ห้ามเปลี่ยนแปลง Database) | `GET /api/tasks` (ดูโจทย์) |
| **POST** | สร้างข้อมูลใหม่ หรือส่งคำสั่งพิเศษ | `POST /api/login` (สร้าง session ใหม่), `POST /api/my-submission` |
| **PUT** | แก้ไข/เขียนทับข้อมูล**ทั้งหมด** (ถ้าไม่มีจะสร้างใหม่) | `PUT /api/my-submission` (อัปเดต URL ใหม่) |
| **PATCH** | แก้ไขข้อมูล**บางส่วน** (โปรเจ็คนี้มักใช้ PUT แทน) | `PATCH /users/1` (แก้แค่รหัสผ่าน ไม่แก้ข้อมูลอื่น) |
| **DELETE** | ลบข้อมูล | `DELETE /api/submissions/1` (ลบผลงาน) |

## Route Params vs Query String

สองตัวนี้มักจะสร้างความสับสน ควรเลือกใช้ให้ถูกสถานการณ์:

### 1. Route Params (`req.params`)
ใช้ระบุ **"ตัวตน"** ของทรัพยากร (Resource Identifier) เช่น ID ของของชิ้นเดียว
- **รูปแบบ:** อยู่ใน Path ของ URL เลย
- **นิยมใช้กับ:** ดึง 1 รายการ (GET), อัปเดต (PUT/PATCH), ลบ (DELETE)
```
/api/submissions/42        → req.params.id = '42'
/api/users/candidate01     → req.params.username = 'candidate01'
```

### 2. Query String (`req.query`)
ใช้เป็น **"ตัวเลือกเสริม"** ในการจัดการผลลัพธ์ (Modifier) เช่น กรอง เรียง หรือแบ่งหน้า
- **รูปแบบ:** อยู่หลังเครื่องหมาย `?` ต่อท้าย URL คั่นด้วย `&`
- **นิยมใช้กับ:** ดึงหลายรายการ (GET), ค้นหา, Pagination
```
/api/tasks?page=1&limit=10  → req.query.page = '1', req.query.limit = '10'
/api/report?format=csv      → req.query.format = 'csv'
```

## HTTP Status Codes (ตระกูล 400)

Status Codes เป็นตัวบอกว่า Request สำเร็จหรือมีปัญหาอะไร รหัสตระกูล 400 (Client Error) หมายถึง **"ปัญหาเกิดจากฝั่งผู้ส่ง (Client)"** เช่น ส่งข้อมูลมาผิด:

| Code | ชื่อ | ความหมายและวิธีใช้ |
|------|------|------------------|
| **400** | Bad Request | ข้อมูลผิดรูปแบบหรือไม่ครบ เช่น ลืมส่ง `frontend_url` มาใน `req.body` |
| **401** | Unauthorized | ไม่มีสิทธิ์ใช้งาน เพราะ **ยังไม่ได้ Login** หรือ Token หมดอายุ/ไม่ถูกต้อง |
| **403** | Forbidden | Login แล้ว แต่ **Role ไม่มีสิทธิ์** เช่น Candidate พยายามเปิด/ปิด Session |
| **404** | Not Found | หาไม่เจอ อาจจะเป็น URL ผิด หรือ ID ที่ค้นหาไม่มีอยู่ใน Database |
| **409** | Conflict | ข้อมูลขัดแย้งกัน เช่น ส่ง Submission ซ้ำใน Session เดิมที่เคยส่งไปแล้ว |

### 404 Handler — ตัวดักจับ URL ที่ไม่มีอยู่จริง

หาก Client พิมพ์ URL ผิดไปจากที่เราตั้งไว้ใน `app.get()` หรือ `app.post()` Express จะค้นหา Route ตั้งแต่บนลงล่าง ถ้าไม่เจอเลยมันจะตกไปที่ Middleware ตัวสุดท้าย

ดังนั้นถ้าเราต้องการให้คืนค่า 404 สวยๆ เป็น JSON (ไม่ใช่ HTML 404 ของ Express) เรามักจะวาง **404 Handler** ไว้ล่างสุดของไฟล์ `app.js` (ใต้ routes ทั้งหมด):

```js
// วางไว้ใต้ routes ทั้งหมด
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
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
