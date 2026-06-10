# บทที่ 2 — สร้างโปรเจกต์

> **บทนี้เตรียมอะไร:** สร้าง React project จากศูนย์ด้วย Vite ติดตั้ง axios กับ react-router-dom และล้างไฟล์ที่ไม่ใช้ออก — จบบทนี้จะได้โปรเจกต์เปล่าที่รันขึ้นจอได้

## ขั้นตอนที่ 1 — สร้าง Vite Project

```bash
npm create vite@latest frontend-simple -- --template react
cd frontend-simple
npm install axios react-router-dom
```

| Library | ใช้ทำอะไร |
|---------|----------|
| `react`, `react-dom` | ตัว React เอง (มากับ template) |
| `axios` | ยิง API ไปหา backend |
| `react-router-dom` | เปลี่ยนหน้าตาม URL (`/login`, `/candidate`, …) |

สังเกตว่า**ไม่ติดตั้ง Tailwind** — เวอร์ชันนี้ไม่ใช้ CSS เลย

## ขั้นตอนที่ 2 — ตรวจ `package.json`

```json
{
  "name": "worldskill-2026-frontend-simple",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite"
  },
  "dependencies": {
    "axios": "^1.7.2",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.23.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^5.3.1"
  }
}
```

## ขั้นตอนที่ 3 — ตั้งค่า Vite

**`vite.config.js`** (แทนที่โค้ดเดิมทั้งหมด):

```js
// ตั้งค่า Vite (เครื่องมือรันโปรเจกต์ React) — บอกแค่ว่าใช้ React และเปิดที่ port 3000
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 3000 },
});
```

## ขั้นตอนที่ 4 — `index.html`

```html
<!DOCTYPE html>
<html lang="th">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>WorldSkill 2026 — Test Submission (Simple)</title>
  </head>
  <body>
    <!-- React จะเอาหน้าเว็บทั้งหมดมาใส่ใน div นี้ (ดู src/main.jsx) -->
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

ทั้งเว็บมี HTML จริงๆ แค่ `<div id="root">` อันเดียว — ที่เหลือ React สร้างให้ทั้งหมดด้วย JavaScript

## ขั้นตอนที่ 5 — ล้างไฟล์ที่ Vite สร้างมาแต่เราไม่ใช้

Vite template สร้างไฟล์ตัวอย่างมาให้หลายไฟล์ ลบทิ้งให้หมด:

```bash
# ลบไฟล์ CSS และรูปตัวอย่าง
rm src/App.css src/index.css
rm -r src/assets public
```

::: danger อย่าลืมขั้นตอนนี้
ถ้าไม่ลบ `index.css` แล้วไปแก้ `main.jsx` ตามขั้นตอนถัดไป จะไม่มีปัญหา — แต่ถ้าลืมลบบรรทัด `import './index.css'` ใน `main.jsx` ทั้งที่ลบไฟล์ไปแล้ว จะเจอ error ทันที
:::

## ขั้นตอนที่ 6 — `src/main.jsx` จุดเริ่มต้นของแอป

(แทนที่โค้ดเดิมทั้งหมด — เหลือแค่ 4 บรรทัด)

```jsx
// จุดเริ่มต้นของแอป — เอา component <App /> ไปแสดงใน <div id="root"> ของ index.html
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
```

ลำดับการทำงานตอนเปิดเว็บ:

```
browser เปิด index.html
   → เจอ <script src="/src/main.jsx">
   → main.jsx สั่ง React วาด <App /> ลงใน <div id="root">
   → App.jsx ดู URL แล้วเลือกหน้ามาแสดง (บทที่ 5)
```

## ขั้นตอนที่ 7 — สร้าง `App.jsx` ชั่วคราวเพื่อทดสอบ

เดี๋ยวบทที่ 5 จะมาเขียนของจริง ตอนนี้ใส่แค่นี้ก่อนให้รันได้:

```jsx
export default function App() {
  return <h1>Hello WorldSkill 2026</h1>;
}
```

## ทดสอบ

```bash
npm run dev
```

เปิด http://localhost:3000 — ต้องเห็นข้อความ **Hello WorldSkill 2026**

::: tip เช็คความเข้าใจก่อนไปต่อ
- ทำไมไม่ติดตั้ง Tailwind? → เวอร์ชันนี้ตั้งใจไม่ใช้ CSS เพื่อโฟกัสที่ logic
- `<div id="root">` มีไว้ทำไม? → เป็นจุดที่ React เอาหน้าเว็บทั้งหมดไปวาดใส่
- `main.jsx` ทำหน้าที่อะไร? → เป็นสะพานเชื่อม HTML กับ React
:::
