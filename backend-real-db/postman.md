# 📮 ทดสอบ API ด้วย Postman

> **บทนี้เตรียมอะไร:** ตอนนี้มี login แล้ว (บท 10–11) — บทนี้สอนใช้ **Postman** ยิงทดสอบ API ให้เป็น ตั้งแต่ขอ token จนแปะใช้กับ endpoint อื่น **ทุกบทตั้งแต่ 12 เป็นต้นไปจะมีกล่อง "📮 ใน Postman" ให้ทำตาม** — บทนี้คือพื้นฐานที่ต้องเข้าใจก่อน

## Postman คืออะไร

โปรแกรมสำหรับ "ยิง request ไปหา API" โดยไม่ต้องเขียน frontend — เลือก method, ใส่ URL, แนบข้อมูล แล้วกดส่ง ดูผลลัพธ์ที่ backend ตอบกลับ ใช้เช็คว่า endpoint ทำงานถูกไหมก่อนต่อ frontend

## ส่วนประกอบของหน้าจอ (1 request)

```
┌────────────────────────────────────────────────────────────┐
│ [GET ▼]  http://localhost:8080/api/config        [ Send ]   │  ← method + URL + ปุ่มส่ง
├────────────────────────────────────────────────────────────┤
│ Params | Authorization | Headers | Body                     │  ← แท็บตั้งค่า
│ ───────────────────────────────────────────────────────────│
│ (เนื้อหาของแท็บที่เลือก)                                      │
├────────────────────────────────────────────────────────────┤
│ Response   Status: 200 OK   Time: 12 ms                     │  ← ผลลัพธ์ + status code
│ { "success": true, "data": { ... } }                        │
└────────────────────────────────────────────────────────────┘
```

| ส่วน | ทำอะไร |
|------|--------|
| **Method** (dropdown) | GET / POST / PUT — เลือกให้ตรงกับ endpoint |
| **URL** | ที่อยู่ เช่น `http://localhost:8080/api/login` |
| **Authorization** (แท็บ) | แนบ token (บัตรผ่าน) — ใช้กับ endpoint ที่ต้อง login |
| **Body** (แท็บ) | ข้อมูลที่ส่งไปกับ POST/PUT (เช่น username/password, URL ผลงาน) |
| **Send** | กดเพื่อส่ง |
| **Response** | สิ่งที่ backend ตอบ + **Status code** (สำคัญมาก — บอกว่าผ่านหรือพลาด) |

## ขั้นที่ 1 — Login เพื่อขอ `token`

`POST /api/login` ส่ง username/password ใน **Body** แล้วได้ token กลับมา

1. Method = **POST** · URL = `http://localhost:8080/api/login`
2. แท็บ **Body** → เลือก **raw** → เปลี่ยน dropdown ขวาเป็น **JSON**
3. พิมพ์:
   ```json
   { "username": "admin", "password": "password" }
   ```
4. กด **Send** → ได้ status **200** + response:
   ```json
   { "success": true, "data": { "token": "eyJhbGci...", "role": "judge", ... } }
   ```
5. **คัดลอกค่า `token`** (ข้อความยาวๆ ใน `data.token`) เก็บไว้ใช้ขั้นต่อไป

::: tip token คือบัตรผ่าน
endpoint ส่วนใหญ่ (config, submission, …) ต้องแนบ token ไม่งั้นได้ **401** — token หมดอายุใน 7 วัน ถ้าหมดให้ login ใหม่
:::

## ขั้นที่ 2 — แปะ token เข้า request อื่น

เปิด request ที่ต้องการยิง (เช่น `GET /api/config`):

1. แท็บ **Authorization** → ช่อง **Type** เลือก **Bearer Token**
2. ช่อง **Token** วาง token ที่ copy มาจากขั้นที่ 1
3. กด Send

> เบื้องหลัง Postman จะแนบ header ให้เอง: `Authorization: Bearer eyJhbGci...` (จะใส่เองในแท็บ Headers ก็ได้ ผลเหมือนกัน)

## ขั้นที่ 3 — อ่านผล: Status code

ดูเลข status ที่มุมขวาของ Response — บอกผลทันที:

| Status | แปลว่า |
|--------|--------|
| **200 OK** | สำเร็จ (GET/PUT) |
| **201 Created** | สร้างใหม่สำเร็จ (POST) |
| **400 Bad Request** | ข้อมูลที่ส่งไม่ถูก (เช่น กรอกไม่ครบ) |
| **401 Unauthorized** | ไม่มี token / token ผิด |
| **403 Forbidden** | role ไม่มีสิทธิ์ / session ไม่เปิด |
| **404 Not Found** | ไม่เจอข้อมูล / URL ผิด / ใช้ method ผิด |
| **409 Conflict** | ซ้ำ (เช่น ส่ง submission ซ้ำ) |

::: warning ใช้ method ให้ตรง
ยิง `PUT /results/:id/confirm` ด้วย **GET** จะได้ **404** เพราะ route นั้นมีเฉพาะ PUT — เช็ค dropdown method ทุกครั้ง
:::

## (ทิป) ใช้ Environment variable — ไม่ต้องพิมพ์ซ้ำ

พิมพ์ `http://localhost:8080/api` กับวาง token ทุก request น่าเบื่อ — ตั้ง variable ครั้งเดียวใช้ได้ทุกที่:

1. สร้าง **Environment** ใส่ตัวแปร `baseUrl` = `http://localhost:8080/api` และ `token` = (วางหลัง login)
2. ใช้ในทุก request ด้วย `{{baseUrl}}/config` และ Authorization → `{{token}}`

(ออปชัน) ให้ login เซฟ token อัตโนมัติ — ที่ request login แท็บ **Scripts/Tests** ใส่:
```js
pm.environment.set("token", pm.response.json().data.token);
```
ต่อไป login ทีเดียว ทุก request ใช้ `{{token}}` ได้เลย

## พร้อมแล้ว

ต่อจากนี้ทุกบท endpoint จะมีกล่อง **📮 ใน Postman** บอก Method / URL / token / Body ให้ทำตามได้เลย → เริ่มที่ [บท 12 Config](/backend-real-db/12-config)
