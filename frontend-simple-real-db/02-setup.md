# บทที่ 2 — สร้างโปรเจกต์

> **บทนี้เตรียมอะไร:** สร้างโปรเจกต์ Vite + React, ติดตั้ง library, วางไฟล์ entry (`index.html`, `main.jsx`) และตั้ง config — จบบทนี้รัน `npm run dev` ขึ้นหน้าเปล่าได้

## สร้างโปรเจกต์ + ติดตั้ง

```bash
npm create vite@latest frontend-simple-real-db -- --template react
cd frontend-simple-real-db
npm install
npm install axios react-router
```

| library | ทำอะไร |
|---------|--------|
| `react` / `react-dom` | ตัว React |
| `axios` | ยิง HTTP ไป backend |
| `react-router` | สลับหน้า (routing) — v7 |
| `vite` (dev) | dev server + build |

## `package.json` — ตั้ง script

```json
{
  "name": "worldskill-2026-frontend-simple-real-db",
  "scripts": {
    "dev": "vite --host --port 3000"
  }
}
```

`--host` = ให้เครื่องอื่นใน LAN เปิดได้ · `--port 3000` = ใช้ port 3000

## `index.html`

```html
<!DOCTYPE html>
<html lang="th">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>WorldSkill 2026 — Test Submission (Real DB)</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

## `src/main.jsx` — จุดเริ่มของแอป

```jsx
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
```

เอา `<App />` ไปแสดงใน `<div id="root">` ของ `index.html`

## `vite.config.js`

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react(), {
    name: 'vite-logger-middleware',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // log request ใน terminal คล้าย morgan (Method + URL)
        console.log(`[Vite Dev] ${req.method} ${req.url}`);
        next();
      });
    },
  }],
});
```

## `.env` — ที่อยู่ backend

baseURL ของ API อ่านจาก `.env` (ค่า env ของ Vite ต้องขึ้นต้น `VITE_`):

```bash
# .env  — แก้ตาม IP ที่เครื่องได้รับตอนแข่ง
VITE_API_URL=http://localhost:8080/api
```

> ทำ `.env.example` ไว้เป็นตัวอย่างด้วย (ค่าเดียวกัน) — `.env` จริงไม่ควร commit

## โครงไฟล์ที่จะสร้าง

```
frontend-simple-real-db/
├── .env                 ← VITE_API_URL
├── index.html
└── src/
    ├── main.jsx          ← entry
    ├── App.jsx           ← routing (บทที่ 5)
    ├── auth.js           ← token (บทที่ 3)
    ├── api.js            ← axios (บทที่ 4)
    └── pages/
        ├── Login.jsx     ← บทที่ 6
        ├── CandidatePage.jsx  ← บทที่ 7
        ├── JudgePage.jsx ← บทที่ 8
        └── ManagerPage.jsx    ← บทที่ 9
```

## ทดสอบ

`npm run dev` → เปิด `http://localhost:3000` เห็นหน้าเริ่มต้นของ Vite (เดี๋ยวบทถัดไปแทนที่ด้วยของเรา)
