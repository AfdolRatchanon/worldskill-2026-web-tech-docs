# บทที่ 7 — React Router

> **บทนี้เตรียมอะไร:** ติดตั้ง routing จริงใน `App.jsx` ด้วย React Router DOM v6 — แต่ละ URL จะ render component ที่แตกต่างกัน และลบโค้ดชั่วคราวทั้งหมดออกจาก App.jsx

## ปัญหา — ทุก URL แสดงหน้าเดิม

ถ้าไม่มี router, ไม่ว่าจะเปิด `/login`, `/candidate`, หรือ `/judge` → React จะ render `App.jsx` เดิมทุกครั้ง ไม่รู้ว่า URL เปลี่ยน

## ทำไมถึงใช้ React Router ไม่ใช่ตัวอื่น

| ตัวเลือก | เหตุผลที่ไม่ใช้ |
|---------|-------------|
| `<a href="/login">` | reload ทั้งหน้าทุกครั้ง — ข้อมูล state และ context หาย |
| `window.location.href = '/login'` | reload ทั้งหน้า — ไม่ใช่ SPA |
| `history.pushState()` | ต้องเขียน routing logic เองทั้งหมด |
| **React Router DOM** ✅ | navigate โดยไม่ reload, component-based routes, built-in `useNavigate` |

## React Router DOM คืออะไร

React Router DOM คือ library ที่ทำให้ React **รู้จัก URL** และ render component ที่ถูกต้องตาม path

```
URL: /login    → render Login.jsx
URL: /candidate → render CandidateDashboard.jsx
URL: /judge    → render JudgeDashboard.jsx
URL: /manager  → render ManagerDashboard.jsx
URL: *         → Navigate ไป /login (fallback)
```

| Component | หน้าที่ |
|-----------|---------|
| `BrowserRouter` | ห่อ app ทั้งหมด — enable routing |
| `Routes` | container ของ Route ทั้งหมด |
| `Route` | จับคู่ `path` กับ `element` |
| `Navigate` | redirect ไป path อื่น |
| `useNavigate` | redirect ด้วย JavaScript (เช่น หลัง form submit) |

## ชิ้นงาน — เขียน App.jsx routing จริง

App.jsx จะเปลี่ยนจากหน้าทดสอบ api เป็น routing จริง — สร้างโฟลเดอร์ `pages/` ไว้รอก่อน:

```
src/
├── App.jsx          ← แก้ในบทนี้
└── pages/           ← สร้างโฟลเดอร์ (ว่างๆ ก่อน)
```

แก้ `src/App.jsx` ทั้งไฟล์:

```jsx
// App.jsx — บทที่ 7 ลบโค้ดชั่วคราว + เพิ่ม Router
import { useState, useEffect } from 'react'; // [!code --]
import api from './services/api';            // [!code --]
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'; // [!code ++]

export default function App() {
  const [tasks, setTasks] = useState([]);    // [!code --]

  useEffect(() => {                          // [!code --]
    api.get('/tasks')                        // [!code --]
      .then(res => setTasks(res.data.data)) // [!code --]
      .catch(err => console.error(err));     // [!code --]
  }, []);                                    // [!code --]

  return ( // [!code --]
    <div className="min-h-screen bg-gray-50 flex items-center justify-center"> {/* [!code --] */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8"> {/* [!code --] */}
        <h1 className="text-2xl font-bold text-gray-900">WorldSkill 2026</h1> {/* [!code --] */}
        <p className="text-gray-400 text-sm mt-2">Test Submission Management System</p> {/* [!code --] */}
        <ul className="mt-4 text-sm text-gray-600 space-y-1"> {/* [!code --] */}
          {tasks.map(t => <li key={t.id}>{t.title}</li>)} {/* [!code --] */}
        </ul> {/* [!code --] */}
      </div> {/* [!code --] */}
    </div> {/* [!code --] */}
  ); // [!code --]
  return ( // [!code ++]
    <BrowserRouter> {/* [!code ++] */}
      <Routes> {/* [!code ++] */}
        <Route path="/login"     element={<div>Login Page — Coming Soon</div>} /> {/* [!code ++] */}
        <Route path="/candidate" element={<div>Candidate Dashboard — Coming Soon</div>} /> {/* [!code ++] */}
        <Route path="/judge"     element={<div>Judge Dashboard — Coming Soon</div>} /> {/* [!code ++] */}
        <Route path="/manager"   element={<div>Manager Dashboard — Coming Soon</div>} /> {/* [!code ++] */}
        <Route path="*"          element={<Navigate to="/login" replace />} /> {/* [!code ++] */}
      </Routes> {/* [!code ++] */}
    </BrowserRouter> {/* [!code ++] */}
  ); // [!code ++]
}
```

## App.jsx สุดท้ายในบทนี้

หลังแก้เสร็จ App.jsx ควรมีแค่นี้:

```jsx
// App.jsx — บทที่ 7
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"     element={<div>Login Page — Coming Soon</div>} />
        <Route path="/candidate" element={<div>Candidate Dashboard — Coming Soon</div>} />
        <Route path="/judge"     element={<div>Judge Dashboard — Coming Soon</div>} />
        <Route path="/manager"   element={<div>Manager Dashboard — Coming Soon</div>} />
        <Route path="*"          element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

## useNavigate — redirect ด้วยโค้ด

```jsx
import { useNavigate } from 'react-router-dom';

function Login() {
  const navigate = useNavigate();

  async function handleSubmit() {
    await api.post('/login', ...);
    navigate('/candidate');   // redirect หลัง login สำเร็จ
  }
}
```

## ทดสอบ

```bash
npm run dev
```

ทดสอบแต่ละ URL:

1. `http://localhost:3000/login` → ต้องเห็น "Login Page — Coming Soon"
2. `http://localhost:3000/candidate` → ต้องเห็น "Candidate Dashboard — Coming Soon"
3. `http://localhost:3000/judge` → ต้องเห็น "Judge Dashboard — Coming Soon"
4. `http://localhost:3000/manager` → ต้องเห็น "Manager Dashboard — Coming Soon"
5. `http://localhost:3000/anything` → ต้อง redirect ไป `/login` อัตโนมัติ (route `*`)

**DevTools → Console:** ต้องไม่มี error ใดๆ

## Common Errors

| Error | สาเหตุ | วิธีแก้ |
|-------|--------|---------|
| `useNavigate` ไม่ทำงาน | เรียกนอก `BrowserRouter` | ย้าย component ไว้ใน `<BrowserRouter>` |
| กด Back แล้วหน้าไม่เปลี่ยน | ใช้ `Navigate` แทน `useNavigate` ผิดที่ | ใช้ `useNavigate()` เมื่อต้องการ redirect ด้วยโค้ด |
| `react-router-dom` not found | ยังไม่ได้ install | รัน `npm install react-router-dom` |
