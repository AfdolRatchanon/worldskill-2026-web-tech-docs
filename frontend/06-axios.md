# บทที่ 6 — Axios + api.js

> **บทนี้เตรียมอะไร:** สร้าง `src/services/api.js` — axios instance กลางที่ใส่ Bearer token ให้อัตโนมัติและจัดการ 401 ให้ทุก component ไม่ต้องทำซ้ำ

## Async/Await คืออะไร

API call ใช้เวลา — JavaScript ไม่รอโดย default ต้องบอกให้รอด้วย `async/await`:

```js
// ❌ ไม่รอ — res เป็น Promise ไม่ใช่ข้อมูลจริง
const res = api.get('/tasks')
console.log(res.data)  // undefined!

// ✅ รอ — res เป็นข้อมูลจริง
async function loadTasks() {
  const res = await api.get('/tasks')  // await = หยุดรอให้เสร็จก่อน
  console.log(res.data)               // ได้ข้อมูลจริง
}
```

กฎ: `await` ใช้ได้แค่ใน `async function` เท่านั้น — ฟังก์ชันที่ใช้ `await` ต้องขึ้นต้นด้วย `async`

:::tip เทียบกับ Backend
Backend ใช้ `async function controller(req, res)` + `await pool.execute()` — pattern เดียวกันทุกอย่าง
:::

## ปัญหา — ทุก request ต้องใส่ token เอง

ถ้าเรียก axios ตรงๆ ทุกที่:

```jsx
// ❌ ทุก component ต้องเขียนซ้ำทุกครั้ง
const token = localStorage.getItem('token');
const res = await axios.get('/api/tasks', {
  headers: { Authorization: `Bearer ${token}` }
});
```

ถ้ามี 20 endpoint → ซ้ำ 20 ครั้ง และถ้า token หมดอายุทุก component ต้องจัดการเอง

## ทำไมถึงใช้ Axios Instance ไม่ใช่ตัวอื่น

| ตัวเลือก | เหตุผลที่ไม่ใช้ |
|---------|-------------|
| `fetch()` ตรงๆ | ต้องเพิ่ม `headers` เองทุก request, ไม่มี interceptor built-in |
| `axios` ตรงๆ (import แล้วเรียกได้เลย) | ต้องใส่ `Authorization` header ซ้ำทุก endpoint |
| `XMLHttpRequest` | เขียนยาก, ไม่มี promise, syntax เก่า |
| **axios instance + interceptors** ✅ | ใส่ token และจัดการ 401 ในที่เดียว — ทุก component ใช้ได้เลย |

## วิธีแก้ — Axios Instance + Interceptors

สร้าง `api.js` เป็น instance เดียว แล้วใช้ **interceptor** ดักทุก request/response:

```
Component เรียก api.get('/tasks')
    ↓
Request Interceptor → ใส่ Bearer token อัตโนมัติ
    ↓
Backend
    ↓
Response Interceptor → ถ้า 401 → redirect /login อัตโนมัติ
    ↓
Component ได้รับ response
```

## ชิ้นงาน — สร้าง api.js

```
src/
├── App.jsx
└── services/
    └── api.js    ← สร้างในบทนี้
```

สร้างโฟลเดอร์ `src/services/` แล้วสร้างไฟล์ `src/services/api.js`:

```js
// services/api.js — บทที่ 6
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',  // อ่านจาก .env
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;  // ใส่ token ทุก request
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';    // force redirect เมื่อ token หมดอายุ
    }
    return Promise.reject(err);
  }
);

export default api;
```

> **ทำไมต้อง `.data.data` ?** — response ซ้อน 2 ชั้น:
>
> ```
> axios response    →  { data: <backend_response>, status, headers, ... }
> backend response  →  { success: true, data: [...], meta: {} }
>
> res               →  axios wrapper
> res.data          →  { success: true, data: [...], meta: {} }
> res.data.data     →  [...]  ← payload จริงที่ต้องการ
> ```
>
> ทุก API call ในโปรเจ็คนี้ใช้ `.data.data` เสมอ (ยกเว้น format พิเศษเช่น CSV/PDF)

:::tip import.meta.env ไม่ใช่ process.env
Vite ใช้ `import.meta.env.VITE_API_URL` — ตัวแปรต้องขึ้นต้นด้วย `VITE_`
`process.env` ใช้ได้ใน Node.js (backend) เท่านั้น
:::

## อัปเดต App.jsx — ลบ timer + ทดสอบ api.js

:::warning โค้ดชั่วคราว
fetch ใน App.jsx นี้มีไว้ทดสอบ api.js เท่านั้น — จะลบออกในบทที่ 7 ด้วย `[!code --]`
:::

แก้ `src/App.jsx`:

```jsx
// App.jsx — บทที่ 6 ลบ timer + ทดสอบ api.js
import { useState, useEffect, useCallback } from 'react'; // [!code --]
import { useState, useEffect } from 'react';              // [!code ++]
import api from './services/api';                          // [!code ++]

export default function App() {
  const [time,  setTime]  = useState(''); // ลบในบทที่ 6  // [!code --]
  const [tasks, setTasks] = useState([]); // ลบในบทที่ 7  // [!code ++]

  const tick = useCallback(() => {                         // [!code --]
    setTime(new Date().toLocaleTimeString());              // [!code --]
  }, []);                                                  // [!code --]

  useEffect(() => {                                        // [!code --]
    tick();                                                // [!code --]
    const id = setInterval(tick, 1000);                   // [!code --]
    return () => clearInterval(id);                       // [!code --]
  }, [tick]);                                              // [!code --]

  useEffect(() => {                                        // [!code ++]
    api.get('/tasks')                                      // [!code ++]
      .then(res => setTasks(res.data.data))               // [!code ++]  ← ทำไม .data.data ?
      .catch(err => console.error(err));                   // [!code ++]
  }, []);                                                  // [!code ++]

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-gray-900">WorldSkill 2026</h1>
        <p className="text-gray-400 text-sm mt-2">Test Submission Management System</p>
        <p className="mt-4 text-center text-gray-500 font-mono">{time}</p> {/* [!code --] */}
        <ul className="mt-4 text-sm text-gray-600 space-y-1"> {/* [!code ++] */}
          {tasks.map(t => <li key={t.id}>{t.title}</li>)} {/* [!code ++] */}
        </ul> {/* [!code ++] */}
      </div>
    </div>
  );
}
```

## ทดสอบ

ต้องรัน backend ก่อน (`cd backend && npm run dev`)

```bash
npm run dev
```

**URL:** `http://localhost:3000`

ต้องเห็น:
- รายชื่อ task ปรากฏในหน้า (ไม่มีนาฬิกาอีกต่อไป)

**DevTools → Network:**
1. ต้องเห็น request `GET /api/tasks` → status 200
2. ดู Request Headers → ต้องมี `Authorization: Bearer ...` (ถ้า localStorage มี token)

:::tip ทดสอบ 401 redirect
1. เปิด DevTools → Application → Local Storage → เพิ่ม key `token` ค่า garbage เช่น `abc123`
2. Refresh → api.js ส่ง request พร้อม token ผิด → backend ตอบ 401
3. Response interceptor redirect ไป `/login` อัตโนมัติ
:::

## CORS Error คืออะไร

ถ้า frontend (port 3000) ยิง request ไป backend (port 8080) แล้วเห็น error นี้ใน Console:

```
Access to XMLHttpRequest at 'http://localhost:8080/api/tasks'
from origin 'http://localhost:3000' has been blocked by CORS policy
```

**สาเหตุ:** Browser ป้องกัน request ข้าม origin โดย default — ต้อง backend บอก browser ว่าอนุญาต

**วิธีแก้:** Backend ของเราตั้งค่า CORS ไว้แล้วใน `app.js` ด้วย `cors()` middleware — ถ้าเจอ CORS error แสดงว่า backend ยังไม่รัน

```bash
# รัน backend ก่อน แล้วลองใหม่
cd backend && npm run dev
```

## Common Errors

| Error | สาเหตุ | วิธีแก้ |
|-------|--------|---------|
| `Network Error` | backend ยังไม่รัน | รัน `cd backend && npm run dev` |
| CORS error ใน Console | backend ยังไม่รัน | รัน backend ก่อนเสมอ |
| `import.meta.env.VITE_API_URL` เป็น undefined | ไม่มีไฟล์ `.env` | สร้าง `.env` ที่ root ของ `frontend/` |
| Axios ไม่รู้จัก | ยังไม่ได้ install | รัน `npm install axios` |
