# บทที่ 2 — Phase 0: รากฐาน (Bootstrap จากศูนย์)

> 🎯 **ทำตามทีละขั้น** — สร้างโปรเจ็ค Backend + Frontend จากศูนย์ จนทั้งสอง server รันได้ ก่อนเริ่มฟีเจอร์แรก
>
> ⏱️ ~0:30 · บทนี้ไม่อธิบายทฤษฎี เน้นพิมพ์ตาม (ทฤษฎีอยู่ใน [Backend บท 1–9](/backend/01-installation) และ [Frontend บท 1](/frontend/01-setup))

:::warning 🗄️ Database — ผู้จัดเตรียมให้ (ไม่ต้องสร้างเอง)
ในสนามสอบจริง **schema + seed data ถูกเตรียมโดยฝ่ายผู้จัด** — คุณ **ไม่ต้องเขียน** `schema.sql` / `seed.js` เอง แค่ทำให้ MariaDB ของคุณมีฐานข้อมูลตามที่ผู้จัดให้ แล้วตั้งค่าใน `backend/.env` ให้ตรง

> ขั้นตอน "โหลด DB ที่ผู้จัดให้" จะระบุละเอียดหลังสรุปรูปแบบที่ผู้จัดใช้ (ค่อยคุยกันภายหลัง) · กฎสำคัญ (TP §10): **ห้ามแก้ seed data เดิม แต่ต่อ schema เพิ่มได้**
:::

---

# ส่วน A — Backend

## A.1 สร้างโฟลเดอร์ + ติดตั้ง

```bash
mkdir backend && cd backend
npm init -y
npm install express cors mysql2 bcryptjs jsonwebtoken dotenv
npm install -D nodemon
```

## A.2 แก้ `backend/package.json` — เพิ่ม scripts

```json
{
  "name": "worldskill-2026-backend",
  "version": "1.0.0",
  "main": "src/app.js",
  "scripts": {
    "start": "node src/app.js",
    "dev":   "nodemon src/app.js"
  }
}
```

## A.3 สร้าง `backend/.env`

> ใช้ค่า host / port / user / password / ชื่อฐานข้อมูล **ตามที่ผู้จัดกำหนด**

```bash
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=ใส่รหัส MariaDB ตามที่ผู้จัดกำหนด
DB_NAME=ชื่อฐานข้อมูลที่ผู้จัดเตรียมให้
JWT_SECRET=change-this-to-any-long-random-string
FRONTEND_URL=http://localhost:3000
PORT=8080
```

## A.4 สร้าง `backend/src/config/db.js`

```js
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:             process.env.DB_HOST,
  port:             process.env.DB_PORT,
  user:             process.env.DB_USER,
  password:         process.env.DB_PASSWORD,
  database:         process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit:  10,
});

module.exports = pool;
```

## A.5 สร้าง `backend/src/app.js`

```js
require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

// 👇 route ของแต่ละ phase จะมาเพิ่มตรงนี้ทีละบรรทัด
// app.use('/api', require('./routes/auth'));   ← Phase 1

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
```

## ✅ ทดสอบ Backend

```bash
npm run dev      # ต้องเห็น "Backend running on http://localhost:8080"
```

> Phase 0 ยังไม่มี route ที่ query DB — แค่ server start ได้ก็พอ · ต้องโหลด DB ที่ผู้จัดให้เข้า MariaDB ก่อนถึง **Phase 1** (login จะ query ตาราง users)

---

# ส่วน B — Frontend

## B.1 สร้างโปรเจ็ค + ติดตั้ง

```bash
# กลับมาที่โฟลเดอร์โปรเจ็คหลัก (นอก backend/)
npm create vite@latest frontend -- --template react
cd frontend
npm install axios react-router-dom
npm install -D @tailwindcss/vite tailwindcss
```

## B.2 แก้ `frontend/vite.config.js`

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server:  { port: 3000 },
  preview: { port: 3000 },
});
```

## B.3 แทนที่ `frontend/src/index.css` (บรรทัดเดียว)

```css
@import "tailwindcss";
```

## B.4 แทนที่ `frontend/src/main.jsx`

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

## B.5 แทนที่ `frontend/src/App.jsx` (ชั่วคราว)

```jsx
export default function App() {
  return <div className="p-6 text-2xl">Hello WorldSkill 2026</div>;
}
```

## B.6 สร้าง `frontend/.env`

```bash
VITE_API_URL=http://localhost:8080/api
```

## B.7 สร้าง `frontend/src/services/api.js`

```js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config?.url?.includes('/login')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
```

## ✅ ทดสอบ Frontend

```bash
npm run dev      # ต้องเห็น Local: http://localhost:3000
```

เปิด `http://localhost:3000` → เห็น "Hello WorldSkill 2026" + DevTools Console ไม่มี error สีแดง

---

## ☑️ Checkpoint ปิด Phase 0

- [ ] backend รัน 8080 · frontend รัน 3000 ไม่มี error
- [ ] โครงไฟล์ครบ: `backend/src/{config,app.js}` · `frontend/src/services/api.js` + `.env`
- [ ] เข้าใจว่า **DB ผู้จัดเตรียมให้** — ต้องโหลดเข้า MariaDB ก่อน Phase 1

➡️ รากฐานพร้อม — [Phase 1: Auth](/integration/03-phase1-auth) เขียน login ทะลุ BE→FE
