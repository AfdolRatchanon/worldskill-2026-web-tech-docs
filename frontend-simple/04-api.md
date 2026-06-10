# บทที่ 4 — api.js คุยกับ Backend

> **บทนี้เตรียมอะไร:** สร้าง `src/api.js` — ตัวกลางที่ทุกหน้าใช้ยิง API พร้อมเข้าใจว่าทำไมต้องมี **interceptor** และทำไม axios ธรรมดาถึงมีกับดักซ่อนอยู่

## ปัญหา — ทุก request ต้องแนบ token

Backend ป้องกันทุก endpoint ไว้ — จะเรียก `/tasks`, `/my-submission` หรืออะไรก็ตาม ต้องแนบ token ไปใน header แบบนี้:

```
Authorization: Bearer eyJhbGciOiJIUzI1...
```

ถ้าไม่แนบ → ได้ **401 Unauthorized** กลับมาทันที

โปรเจกต์นี้เรียก API ประมาณ **15 จุด** — คำถามคือจะแนบ token ยังไงไม่ให้ต้องเขียนซ้ำ 15 รอบ?

## เปรียบเทียบ 3 วิธี

### วิธีที่ 1 — แนบเองทุกครั้ง (ทำได้ แต่เหนื่อย)

```js
const token = localStorage.getItem('token');
axios.get('http://localhost:8080/api/tasks', {
  headers: { Authorization: `Bearer ${token}` }
});
```

ทำงานได้ 100% แต่ต้องพิมพ์ซ้ำทุกจุด — **ลืมแค่จุดเดียว**ก็ได้ 401 แล้วหาสาเหตุยาก

### วิธีที่ 2 — ตั้ง header ตอนสร้างทีเดียว (กับดัก!)

```js
// ❌ ดูเหมือนฉลาด แต่พัง
const api = axios.create({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});
```

บรรทัดนี้รันแค่**ครั้งเดียวตอนเปิดเว็บ** — ตอนนั้นยังไม่ได้ login ดังนั้น token เป็น `null` พอ login เสร็จ header ก็ยังค้างเป็นค่าเก่า ต้อง refresh ทั้งหน้าถึงจะหาย — เป็น bug คลาสสิกที่เจอกันบ่อยมาก

### วิธีที่ 3 — interceptor ✅

**interceptor** = โค้ดที่ axios สัญญาว่าจะรันให้ "**ทุกครั้งก่อนส่ง request ออกไป**" — ไม่ใช่ครั้งเดียว

```js
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');  // อ่านใหม่ทุกครั้ง → ได้ค่าล่าสุดเสมอ
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});
```

เขียนครั้งเดียว 4 บรรทัด → ทุก request ที่ยิงผ่าน `api` ได้ token แนบไปอัตโนมัติ และได้ token **สดเสมอ** ไม่ว่าจะเพิ่ง login หรือเพิ่ง logout มา

## เขียน `src/api.js`

```js
// ตัวกลางสำหรับคุยกับ backend — ทุกหน้า import ตัวนี้ไปใช้ยิง API
// เทียบกับตัวเต็ม: services/api.js
import axios from 'axios';

// ที่อยู่ของ backend (ตัวเต็มอ่านค่านี้จากไฟล์ .env แต่เวอร์ชันนี้เขียนตรงๆ ให้เห็นชัด)
const api = axios.create({
  baseURL: 'http://localhost:8080/api',
});

// interceptor = โค้ดที่ axios จะรันให้ "ทุกครั้งก่อนส่ง request ออกไป"
// หน้าที่: แนบ token ไปใน header อัตโนมัติ → ไม่ต้องแนบเองทุกจุดที่เรียก API (มี ~15 จุด)
// สำคัญ: ต้องอ่าน token ใหม่ทุกครั้งแบบนี้ เพราะถ้าอ่านครั้งเดียวตอนเปิดเว็บ
// ตอนนั้นยังไม่ได้ login → token จะเป็นค่าว่างค้างไปตลอด
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});

export default api;
```

## วิธีใช้ในหน้าอื่นๆ

```js
import api from '../api';

const res = await api.get('/tasks');          // GET  http://localhost:8080/api/tasks
await api.post('/login', { username, password });  // POST + ส่ง body เป็น JSON
await api.put('/my-submission', body);        // PUT  แก้ไขข้อมูล
```

สังเกตว่าเขียนแค่ `/tasks` ไม่ต้องพิมพ์ URL เต็ม — เพราะตั้ง `baseURL` ไว้แล้ว

## เทียบกับตัวเต็ม

ตัวเต็มมี interceptor **2 ตัว** — ตัวที่สองคือ response interceptor ที่ดักจับ 401 (token หมดอายุ) แล้วเด้งกลับหน้า login อัตโนมัติ เวอร์ชันนี้ตัดออกเพราะ token อายุ 7 วัน โอกาสหมดอายุกลางการใช้งานต่ำมาก และ logic ของมันมีรายละเอียดซ่อนอยู่ (ต้องยกเว้น 401 ที่มาจากการใส่รหัสผิดตอน login) ซึ่งชวนงงสำหรับมือใหม่

::: tip สรุปบทนี้ 1 ประโยค
interceptor คือ "พนักงานต้อนรับ" ที่แปะบัตรผ่านให้ทุก request ก่อนออกจากประตู — เขียนครั้งเดียว ใช้ทั้งระบบ
:::
