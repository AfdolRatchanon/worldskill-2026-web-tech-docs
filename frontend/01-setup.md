# บทที่ 1 — Setup + Vite

> **บทนี้เตรียมอะไร:** สร้าง React project จากศูนย์ด้วย Vite ติดตั้ง Tailwind CSS v4 และ Axios ให้พร้อมใช้งาน — โครงสร้างไฟล์ที่ได้จะใช้ต่อยอดทุกบทจนถึงบทที่ 17

## ปัญหา — ยังไม่มี project เลย

ก่อนเขียนโค้ด React ต้องมีโครงสร้างโปรเจ็คก่อน — ต้องการ build tool ที่แปลง JSX ให้ browser เข้าใจ, bundle ไฟล์ให้, และรัน dev server พร้อม hot reload

## ทำไมถึงใช้ Vite ไม่ใช่ตัวอื่น

| ตัวเลือก | เหตุผลที่ไม่ใช้ |
|---------|--------------|
| Create React App (CRA) | deprecated แล้ว — ทีม React ไม่แนะนำให้ใช้อีกต่อไป |
| Webpack | config ซับซ้อนมาก, ต้องตั้งค่า 100+ บรรทัดก่อนเริ่มได้ |
| Parcel | config น้อย แต่ community และ ecosystem เล็กกว่า Vite มาก |
| **Vite** ✅ | เร็วมาก, config น้อย, รองรับ React + Tailwind v4 ได้ทันที |

## โครงสร้างไฟล์ที่จะได้ในบทนี้

```
frontend/
├── package.json
├── vite.config.js
├── index.html
└── src/
    ├── main.jsx
    ├── App.jsx
    └── index.css
```

## ขั้นตอนที่ 1 — สร้าง Vite Project

เปิด Terminal แล้วรันคำสั่งนี้ในโฟลเดอร์ที่ต้องการ:

```bash
npm create vite@latest frontend -- --template react
cd frontend
```

## ขั้นตอนที่ 2 — ติดตั้ง Dependencies

```bash
npm install axios react-router-dom
npm install -D @tailwindcss/vite tailwindcss
```

ตรวจสอบ `package.json` ว่ามีครบ:

```json
{
  "name": "worldskill-2026-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev":     "vite",
    "build":   "vite build",
    "preview": "vite preview --host --port 3000"
  },
  "dependencies": {
    "axios":            "^1.7.2",
    "react":            "^18.3.1",
    "react-dom":        "^18.3.1",
    "react-router-dom": "^6.23.1"
  },
  "devDependencies": {
    "@tailwindcss/vite":    "^4.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "tailwindcss":          "^4.0.0",
    "vite":                 "^5.3.1"
  }
}
```

## ขั้นตอนที่ 3 — ตั้งค่า Vite + Tailwind

**`vite.config.js`** (แทนที่โค้ดเดิมทั้งหมด):

```js
// vite.config.js — บทที่ 1
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],   // tailwindcss() ใช้ Vite plugin ไม่ใช่ PostCSS
  server:  { port: 3000 },
  preview: { port: 3000 },
});
```

:::danger Tailwind v4 ต่างจาก v3
Tailwind CSS v4 ใช้ **Vite plugin** แทน PostCSS — ไม่ต้องมี `tailwind.config.js` และไม่ต้องมี `postcss.config.js`
:::

## ขั้นตอนที่ 4 — ตั้งค่า CSS

**`src/index.css`** (แทนที่โค้ดเดิมทั้งหมด — บรรทัดเดียวเท่านั้น):

```css
@import "tailwindcss";
```

:::danger อย่าใช้ syntax เก่า
```css
/* ❌ ผิด — v3 syntax ใช้ไม่ได้ใน v4 */
@tailwind base;
@tailwind components;
@tailwind utilities;
```
:::

## ขั้นตอนที่ 5 — ตั้งค่า index.html

**`index.html`** (แทนที่โค้ดเดิมทั้งหมด):

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>WorldSkill 2026 — Test Submission</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

## ขั้นตอนที่ 6 — ตั้งค่า main.jsx

**`src/main.jsx`** (แทนที่โค้ดเดิมทั้งหมด):

```jsx
// main.jsx — บทที่ 1
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

## ขั้นตอนที่ 7 — สร้าง App.jsx เริ่มต้น

**`src/App.jsx`** (แทนที่โค้ดเดิมทั้งหมด):

```jsx
// App.jsx — บทที่ 1
export default function App() {
  return (
    <div>Hello World</div>
  );
}
```

## ขั้นตอนที่ 8 — สร้างไฟล์ .env

สร้างไฟล์ `.env` ที่ root ของ `frontend/`:

```
VITE_API_URL=http://localhost:8080/api
```

:::tip
Vite อ่าน environment variable ผ่าน `import.meta.env.VITE_API_URL` ไม่ใช่ `process.env`
ตัวแปรต้องขึ้นต้นด้วย `VITE_` ถึงจะเข้าถึงได้จาก browser
:::

## ทดสอบ

```bash
npm run dev
```

**URL:** `http://localhost:3000`

ต้องเห็น:
- ข้อความ "Hello World" บนหน้าจอ

**DevTools → Console:**
- ต้องไม่มี error ใดๆ

:::tip Hot Module Replacement
`npm run dev` รัน Vite dev server — บันทึกไฟล์แล้ว browser อัปเดตทันทีโดยไม่ต้อง refresh
:::

## JSX ต่างจาก HTML ยังไง

JSX คือ HTML ที่เขียนใน JavaScript — มีกฎต่างจาก HTML นิดหน่อย:

| HTML | JSX | เหตุผล |
|------|-----|--------|
| `class="..."` | `className="..."` | `class` เป็น keyword ใน JavaScript |
| `for="..."` | `htmlFor="..."` | `for` เป็น keyword ใน JavaScript |
| `<img>` | `<img />` | ทุก tag ต้องปิดเสมอ |
| `<input>` | `<input />` | เหมือนกัน |
| หลาย element | ห่อด้วย `<div>` หรือ `<>...</>` | return ได้แค่ element เดียว |

```jsx
// ✅ JSX ถูก
return (
  <>
    <h1 className="text-blue-600">WorldSkill 2026</h1>
    <p>Welcome</p>
  </>
)

// ❌ JSX ผิด — return หลาย element โดยไม่ห่อ
return (
  <h1>WorldSkill 2026</h1>
  <p>Welcome</p>
)
```

**Expression ใน JSX ใช้ `{}`:**

```jsx
const name = 'Alice'
return <p>Hello {name}</p>          // ✅ ใส่ตัวแปรได้
return <p>Hello {2 + 3}</p>         // ✅ คำนวณได้
return <p>Hello {isOpen ? 'Open' : 'Closed'}</p>  // ✅ ternary ได้
return <p>Hello {/* comment */}</p> // ✅ comment ใช้ {/* */}
```

## import / export ต่างจาก Backend

Backend ใช้ CommonJS (`require` / `module.exports`) — Frontend ใช้ ES Modules (`import` / `export`):

```js
// Backend (CommonJS)
const express = require('express')
module.exports = router

// Frontend (ES Modules)
import { useState } from 'react'
export default function App() { ... }
export const HOME = { ... }   // named export
```

ทั้งสองทำสิ่งเดียวกัน แต่ syntax ต่างกัน — อย่าปนกัน

## React.StrictMode รัน Effect สองครั้ง

`main.jsx` ห่อ App ด้วย `<React.StrictMode>` — ใน development mode React จะรัน `useEffect` **2 ครั้ง** เพื่อช่วย detect bug

```jsx
// main.jsx
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>   // ← ทำให้ effect รัน 2 ครั้งใน dev
    <App />
  </React.StrictMode>
)
```

:::tip ถ้าเห็น API call ออก 2 ครั้งใน Network tab
ไม่ใช่ bug — เป็น StrictMode ที่ทำงานปกติ ใน production build จะรัน 1 ครั้งตามปกติ
:::

## Common Errors

| Error | สาเหตุ | วิธีแก้ |
|-------|--------|---------|
| `Cannot find module '@tailwindcss/vite'` | ยังไม่ได้ install | รัน `npm install -D @tailwindcss/vite tailwindcss` |
| `Error: listen EADDRINUSE :::3000` | port 3000 ถูกใช้อยู่ | ปิดโปรแกรมอื่นที่ใช้ port 3000 |
| Tailwind class ไม่มีผล | `index.css` ยังใช้ syntax เก่า | แทนที่ด้วย `@import "tailwindcss";` บรรทัดเดียว |
| `VITE_API_URL` เป็น undefined | ไม่มีไฟล์ `.env` | สร้างไฟล์ `.env` ที่ root ของ `frontend/` |
| หลาย element return พร้อมกัน | ลืมห่อด้วย `<>...</>` | ใช้ Fragment `<>` ห่อ elements ทั้งหมด |
