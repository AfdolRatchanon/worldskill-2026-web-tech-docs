# บทที่ 9 — Login Page

> **Candidate, Judge, Manager** เห็นหน้านี้ก่อน — กรอก username/password → POST /api/login → navigate ไปหน้า dashboard ตาม role

## ชิ้นงาน — สร้าง Login.jsx

```
src/
├── App.jsx
└── pages/
    └── Login.jsx    ← สร้างในบทนี้
```

สร้างโฟลเดอร์ `src/pages/` แล้วสร้างไฟล์ `src/pages/Login.jsx`:

```jsx
// pages/Login.jsx — บทที่ 9
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const HOME = { candidate: '/candidate', judge: '/judge', manager: '/manager' };

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const { login }  = useAuth();
  const navigate   = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();               // ป้องกัน browser reload
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/login', { username, password });
      login(data.data.token);         // บันทึก token ใน AuthContext + localStorage
      navigate(HOME[data.data.role] || '/login');  // redirect ตาม role
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">WorldSkill 2026</h1>
          <p className="text-gray-400 text-sm mt-1">Test Submission Management System</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Sign In</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="username" className="text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                id="username"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && (
              <div role="alert" className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
```

:::tip ทำไม navigate ใช้ data.data.role ไม่ใช่ user.role
ตอน `handleSubmit` รัน ยังไม่ได้เรียก `login()` เลย — `user` ใน context ยังเป็น null
จึงใช้ `data.data.role` จาก response โดยตรงสำหรับ redirect
:::

## อัปเดต App.jsx — เพิ่ม Route /login จริง

```jsx
// App.jsx — บทที่ 9 เพิ่ม Login component จริง
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';                               // [!code ++]

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"     element={<Login />} />        // [!code ++]
          <Route path="/login"     element={<div>Login Page — Coming Soon</div>} />  // [!code --]
          <Route path="/candidate" element={<div>Candidate Dashboard — Coming Soon</div>} />
          <Route path="/judge"     element={<div>Judge Dashboard — Coming Soon</div>} />
          <Route path="/manager"   element={<div>Manager Dashboard — Coming Soon</div>} />
          <Route path="*"          element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

## ทดสอบ

ต้องรัน backend ก่อน:

```bash
npm run dev
```

เปิด `http://localhost:3000`:
1. ต้องเห็นหน้า Sign In — card กลางหน้าจอ
2. กรอก username: `candidate01`, password: `cand123` → กด Sign In
3. ต้องเห็น loading "Signing in…" ชั่วครู่
4. ต้อง redirect ไป `/candidate` (แสดง "Candidate Dashboard — Coming Soon")
5. ทดสอบ username ผิด → ต้องเห็น error message สีแดง
6. เปิด DevTools → Application → Local Storage → ต้องเห็น key `token`

## Common Errors

| Error | สาเหตุ | วิธีแก้ |
|-------|--------|---------|
| หน้าขาวหลัง submit | backend ไม่รัน | รัน `cd backend && npm run dev` |
| Error: "Login failed" | username/password ผิด | ลอง `judge01` / `judge123` |
| Redirect ไม่ทำงาน | `HOME` map ไม่มี role นั้น | ตรวจ role ที่ได้จาก `data.data.role` ใน DevTools Network |
