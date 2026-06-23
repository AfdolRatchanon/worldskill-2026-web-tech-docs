# บทที่ 4 — api.js คุยกับ Backend

> **บทนี้เตรียมอะไร:** เขียน `src/api.js` — ตัวกลาง axios ที่ทุกหน้า import ไปยิง API พร้อม **interceptor** ที่แนบ token ให้อัตโนมัติทุก request

## `src/api.js`

```js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});

export default api;
```

## เข้าใจโค้ด

- `axios.create({ baseURL })` สร้าง instance ที่เติม URL ฐานให้ → เรียก `api.get('/config')` = ยิงไป `<baseURL>/config`
- `import.meta.env.VITE_API_URL` = อ่านค่าจากไฟล์ `.env` (บทที่ 2) — ถ้าไม่ได้ตั้งไว้จะ fallback เป็น `http://localhost:8080/api`
- **interceptor** = โค้ดที่รัน "ทุกครั้งก่อนส่ง request" — ที่นี่ใช้แนบ header `Authorization: Bearer <token>` ให้อัตโนมัติ ไม่ต้องแนบเองทั้ง ~15 จุด

::: warning baseURL อยู่ใน `.env` แล้ว
ตอนแข่งแก้ที่ไฟล์ `.env` (`VITE_API_URL=...`) ตาม IP ที่เครื่องได้รับ — ไม่ต้องแก้โค้ด `api.js`
**สำคัญ:** Vite อ่าน `.env` ตอน start เท่านั้น แก้แล้วต้องรีสตาร์ท `npm run dev` ใหม่ และชื่อ env ต้องขึ้นต้น `VITE_`
:::

::: tip ทำไมอ่าน token ใน interceptor ทุกครั้ง
ถ้าอ่าน token ครั้งเดียวตอนเปิดเว็บ (ตอนนั้นยังไม่ได้ login) จะได้ค่าว่างค้างตลอด — การอ่านใน interceptor ทำให้ได้ token ล่าสุดเสมอหลัง login
:::

## ทดสอบ

ยังไม่มีหน้าให้กดเรียก — แต่เปิด DevTools (Console) แล้วลองใน browser ที่รัน dev server:

```js
// (หลังมีหน้า Login บทที่ 6 แล้วค่อยเห็นผลจริง)
```

ไปต่อ `App.jsx` ที่ประกอบทุกหน้าเข้า routing
