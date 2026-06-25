# บทที่ 8 — Checkpoint

> **บทนี้เตรียมอะไร:** พิสูจน์ว่า server (บท 4–5) + ฐานข้อมูล (บท 6) + pool (บท 7) ต่อกันครบวงจร ด้วย route ทดสอบชั่วคราว — ผ่านแล้วค่อยลบทิ้งไปลุย auth

## เพิ่ม route ทดสอบชั่วคราวใน `src/app.js`

```js
const pool = require('./config/db');   // [!code ++]

app.get('/api/ping', async (req, res) => {              // [!code ++]
  const [rows] = await pool.query('SELECT COUNT(*) AS users FROM users'); // [!code ++]
  res.json({ ok: true, users: rows[0].users });          // [!code ++]
});                                                        // [!code ++]
```

## ทดสอบ

`GET http://localhost:8080/api/ping`

ต้องได้:

```json
{ "ok": true, "users": 4 }
```

| ผลลัพธ์ | แปลว่า |
|---------|--------|
| `{ "ok": true, "users": 4 }` | ✅ server + DB ต่อกันได้ มี 4 user ตาม seed |
| `users: 0` | ต่อ DB ได้แต่ยังไม่ได้ seed → รัน `npm run seed` |
| error / 500 | ต่อ DB ไม่ได้ → เช็ก `.env` (DB_NAME, รหัส) และ MariaDB รันอยู่ไหม |

::: tip ยิงด้วยอะไร
GET แบบนี้เปิดในเบราว์เซอร์ก็ได้ หรือใช้ Postman — วิธีใช้ Postman เต็มดู [บท 📮 ทดสอบด้วย Postman](/backend-real-db/postman) (หลัง Login)
:::

## ลบ route ทดสอบทิ้ง

ผ่านแล้วลบ `/api/ping` ออก — ของจริงเราจะแยก route/controller เป็นไฟล์ ไม่เขียนรวมใน `app.js`

```js
app.get('/api/ping', async (req, res) => {              // [!code --]
  const [rows] = await pool.query('SELECT COUNT(*) AS users FROM users'); // [!code --]
  res.json({ ok: true, users: rows[0].users });          // [!code --]
});                                                        // [!code --]
```

::: tip ผ่าน Checkpoint แล้ว
ตอนนี้มี server ที่ต่อฐานข้อมูลได้ พร้อมสร้างระบบ login บทถัดไป
:::
