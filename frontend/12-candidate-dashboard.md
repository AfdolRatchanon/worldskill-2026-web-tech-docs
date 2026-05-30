# บทที่ 13 — Candidate Dashboard

> **Candidate** เห็นหน้านี้หลัง login — ดูสถานะ session, นาฬิกานับถอย, โจทย์, และ form ส่ง URL

## ชิ้นงาน — สร้าง Dashboard.jsx

```
src/
├── App.jsx
└── pages/
    └── candidate/
        └── Dashboard.jsx   ← สร้างในบทนี้
```

สร้างโฟลเดอร์ `src/pages/candidate/` แล้วสร้างไฟล์ `src/pages/candidate/Dashboard.jsx`:

```jsx
// pages/candidate/Dashboard.jsx — บทที่ 12
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';

export default function CandidateDashboard() {
  const { user, logout } = useAuth();
  const [session,    setSession]    = useState(null);
  const [tasks,      setTasks]      = useState([]);
  const [submission, setSubmission] = useState(null);
  const [result,     setResult]     = useState(null);
  const [tick,       setTick]       = useState(0);  // counter สำหรับ trigger refresh

  useEffect(() => {
    async function fetchAll() {
      try {
        const [cfgRes, taskRes, subRes, resRes] = await Promise.all([
          api.get('/config'),           // session ปัจจุบัน
          api.get('/tasks'),            // รายการโจทย์
          api.get('/my-submission'),    // submission ของตัวเอง
          api.get('/my-result'),        // ผลคะแนนของตัวเอง
        ]);
        setSession(cfgRes.data.data);
        setTasks(taskRes.data.data);
        setSubmission(subRes.data.data);
        setResult(resRes.data.data);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      }
    }
    fetchAll();
    const id = setInterval(fetchAll, 5_000);  // refresh ทุก 5 วินาที
    return () => clearInterval(id);
  }, [tick]);  // tick เปลี่ยน → effect รันใหม่ → fetch ใหม่ทันที

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="font-bold text-gray-900">WorldSkill 2026</h1>
            <p className="text-sm text-gray-400">Welcome, {user?.full_name}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge status={session?.status || 'waiting'} />
            <Button variant="ghost" onClick={logout}>Logout</Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <Card>
          <p className="text-center text-gray-400 text-sm">
            Countdown Timer — จะเพิ่มในบทที่ 13
          </p>
        </Card>

        {tasks.map((task) => (
          <Card key={task.id}>
            <h2 className="font-semibold text-gray-900 mb-2">{task.title}</h2>
            <p className="text-sm text-gray-600 whitespace-pre-line">{task.description}</p>
          </Card>
        ))}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <h2 className="font-semibold text-gray-900 mb-4">My Submission</h2>
            <p className="text-sm text-gray-400">Submission Form — จะเพิ่มในบทที่ 13</p>
          </Card>
          <Card>
            <h2 className="font-semibold text-gray-900 mb-4">Latest Result</h2>
            <p className="text-sm text-gray-400">Result Card — จะเพิ่มในบทที่ 13</p>
          </Card>
        </div>
      </main>
    </div>
  );
}
```

## อัปเดต App.jsx — เพิ่ม Route /candidate จริง

```jsx
// App.jsx — บทที่ 12 เพิ่ม CandidateDashboard
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './router/ProtectedRoute';
import Login from './pages/Login';
import CandidateDashboard from './pages/candidate/Dashboard';    // [!code ++]

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/candidate" element={
            <ProtectedRoute role="candidate">
              <CandidateDashboard /> {/* [!code ++] */}
            </ProtectedRoute>
          } />
          <Route path="/judge"   element={
            <ProtectedRoute role="judge"><div>Judge — Coming Soon</div></ProtectedRoute>
          } />
          <Route path="/manager" element={
            <ProtectedRoute role="manager"><div>Manager — Coming Soon</div></ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/login" replace />} />
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

1. Login เป็น `candidate01` / `cand123`
2. ต้องเห็น header แสดง "Welcome, [full_name]"
3. ต้องเห็น Badge แสดงสถานะ session (waiting/open/closed)
4. ต้องเห็นรายการโจทย์ (tasks) แสดงใน card
5. รอ 5 วินาที → DevTools Network → ต้องเห็น request `/config`, `/tasks`, `/my-submission`, `/my-result` ออกอีกครั้ง (polling)
6. กด Logout → ต้องกลับไป `/login`

## Pattern tick + fetchAll อธิบาย

```jsx
const [tick, setTick] = useState(0);

useEffect(() => {
  async function fetchAll() {
    const [cfgRes, taskRes, subRes, resRes] = await Promise.all([...]);
    //     ↑
    //  Promise.all รัน 4 request พร้อมกัน — เร็วกว่ารัน await ทีละอัน 4 เท่า
    setSession(...); setTasks(...); ...
  }
  fetchAll();                              // fetch ทันทีตอน mount
  const id = setInterval(fetchAll, 5_000); // fetch ซ้ำทุก 5s
  return () => clearInterval(id);          // หยุด poll เมื่อ logout / unmount
}, [tick]);
// tick เปลี่ยน → effect ถูกสร้างใหม่ → fetchAll รันทันที + interval ใหม่
```

เมื่อ SubmissionForm ส่งสำเร็จ → เรียก `setTick(t => t + 1)` → fetch ใหม่ทันที ไม่ต้องรอ interval 5 วินาที

## Common Errors

| Error | สาเหตุ | วิธีแก้ |
|-------|--------|---------|
| Tasks ไม่แสดง | backend ไม่รัน | รัน `cd backend && npm run dev` |
| `user` เป็น undefined | `useAuth` นอก `AuthProvider` | ตรวจ App.jsx ว่า `<AuthProvider>` ห่อครบ |
| Polling ไม่หยุดหลัง logout | ลืม cleanup | ตรวจ `return () => clearInterval(id)` |
