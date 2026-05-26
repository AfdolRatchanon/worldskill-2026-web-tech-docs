# บทที่ 14 — Judge Dashboard

> **Judge** เห็นหน้านี้หลัง login — เปิด/ปิด session, ดูรายชื่อ candidate, re-check submission, และ confirm คะแนน

## ชิ้นงาน — 3 ไฟล์

```
src/
├── pages/
│   └── judge/
│       └── Dashboard.jsx         ← สร้างในบทนี้
└── components/
    └── judge/
        ├── SessionControl.jsx    ← สร้างในบทนี้
        └── CandidateTable.jsx    ← สร้างในบทนี้
```

## SessionControl.jsx

สร้างโฟลเดอร์ `src/components/judge/` แล้วสร้างไฟล์ `src/components/judge/SessionControl.jsx`:

```jsx
// components/judge/SessionControl.jsx — บทที่ 14
import api from '../../services/api';
import Button from '../common/Button';
import Badge from '../common/Badge';

export default function SessionControl({ session, onUpdate }) {
  async function handleStart() {
    try {
      await api.put('/session/start');
      onUpdate();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start session');
    }
  }

  async function handleClose() {
    if (!confirm('Close the session? Candidates will no longer be able to submit.')) return;
    try {
      await api.put('/session/close');
      onUpdate();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to close session');
    }
  }

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Status:</span>
        <Badge status={session?.status || 'waiting'} />
      </div>
      <div className="flex gap-2">
        <Button
          onClick={handleStart}
          disabled={session?.status === 'open'}    // ปุ่มเปิด disable เมื่อ open อยู่แล้ว
        >
          Open Session
        </Button>
        <Button
          variant="danger"
          onClick={handleClose}
          disabled={session?.status !== 'open'}   // ปุ่มปิด disable เมื่อไม่ได้ open
        >
          Close Session
        </Button>
      </div>
    </div>
  );
}
```

## CandidateTable.jsx

สร้าง `src/components/judge/CandidateTable.jsx`:

```jsx
// components/judge/CandidateTable.jsx — บทที่ 14
import api from '../../services/api';
import Button from '../common/Button';
import Badge from '../common/Badge';

export default function CandidateTable({ candidates, onUpdate }) {
  async function handleRecheck(submissionId) {
    try {
      await api.post(`/submissions/${submissionId}/recheck`);
      setTimeout(onUpdate, 2500);   // รอ 2.5s ให้ backend simulate เสร็จก่อน refresh
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to recheck');
    }
  }

  async function handleConfirm(candidateId) {
    try {
      await api.put(`/results/${candidateId}/confirm`);
      onUpdate();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to confirm');
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left">
            <th className="py-3 px-4 text-gray-400 font-medium">Candidate</th>
            <th className="py-3 px-4 text-gray-400 font-medium">Status</th>
            <th className="py-3 px-4 text-gray-400 font-medium text-right">Score</th>
            <th className="py-3 px-4 text-gray-400 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((c) => (
            <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-3 px-4">
                <p className="font-medium text-gray-900">{c.full_name}</p>
                <p className="text-xs text-gray-400">{c.username}</p>
              </td>
              <td className="py-3 px-4">
                {c.submission_id
                  ? <Badge status={c.submission_status} />
                  : <span className="text-xs text-gray-300">No submission</span>
                }
              </td>
              <td className="py-3 px-4 text-right font-semibold">
                {c.total_score != null ? c.total_score : <span className="text-gray-300">—</span>}
              </td>
              <td className="py-3 px-4">
                <div className="flex gap-2 items-center">
                  {c.submission_id && !c.is_confirmed && (
                    <Button
                      variant="ghost"
                      className="text-xs px-2 py-1"
                      onClick={() => handleRecheck(c.submission_id)}
                      disabled={c.submission_status === 'checking'}
                    >
                      {c.submission_status === 'checking' ? 'Checking…' : 'Re-check'}
                    </Button>
                  )}
                  {c.submission_status === 'checked' && !c.is_confirmed && (
                    <Button
                      variant="success"
                      className="text-xs px-2 py-1"
                      onClick={() => handleConfirm(c.id)}
                    >
                      Confirm
                    </Button>
                  )}
                  {!!c.is_confirmed && (
                    <span className="text-xs text-green-600 font-medium">✓ Confirmed</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {candidates.length === 0 && (
            <tr>
              <td colSpan={4} className="py-10 text-center text-gray-300">
                No candidates found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
```

:::tip setTimeout 2.5 วินาทีหลัง Re-check
Backend simulate การ re-check ใช้เวลา 2 วินาที — ถ้า `onUpdate()` ทันทีจะยังเห็นสถานะ `checking`
`setTimeout(onUpdate, 2500)` รอ 2.5 วินาทีแล้วค่อย refresh — ให้ backend complete ก่อน
:::

## Dashboard.jsx

สร้างโฟลเดอร์ `src/pages/judge/` แล้วสร้างไฟล์ `src/pages/judge/Dashboard.jsx`:

```jsx
// pages/judge/Dashboard.jsx — บทที่ 14
import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import SessionControl from '../../components/judge/SessionControl';
import CandidateTable from '../../components/judge/CandidateTable';

export default function JudgeDashboard() {
  const { user, logout }  = useAuth();
  const [session,    setSession]    = useState(null);
  const [candidates, setCandidates] = useState([]);

  const fetchAll = useCallback(async () => {
    try {
      const [cfgRes, candRes] = await Promise.all([
        api.get('/config'),       // session ปัจจุบัน
        api.get('/candidates'),   // รายชื่อ candidate ทั้งหมด
      ]);
      setSession(cfgRes.data.data);
      setCandidates(candRes.data.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 5_000);
    return () => clearInterval(id);
  }, [fetchAll]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="font-bold text-gray-900">Judge Dashboard</h1>
            <p className="text-sm text-gray-400">{user?.full_name}</p>
          </div>
          <Button variant="ghost" onClick={logout}>Logout</Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-6">
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4">Session Control</h2>
          <SessionControl session={session} onUpdate={fetchAll} />
        </Card>

        <Card>
          <h2 className="font-semibold text-gray-900 mb-4">
            Candidates
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({candidates.length})
            </span>
          </h2>
          <CandidateTable candidates={candidates} onUpdate={fetchAll} />
        </Card>
      </main>
    </div>
  );
}
```

## อัปเดต App.jsx — เพิ่ม Route /judge จริง

```jsx
// App.jsx — บทที่ 14 เพิ่ม JudgeDashboard
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './router/ProtectedRoute';
import Login from './pages/Login';
import CandidateDashboard from './pages/candidate/Dashboard';
import JudgeDashboard from './pages/judge/Dashboard';            // [!code ++]

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/candidate" element={
            <ProtectedRoute role="candidate"><CandidateDashboard /></ProtectedRoute>
          } />
          <Route path="/judge" element={
            <ProtectedRoute role="judge">
              <JudgeDashboard />                                  // [!code ++]
            </ProtectedRoute>
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

```bash
npm run dev
```

1. Login เป็น `judge01` / `judge123`
2. ต้องเห็น **Session Control** — Badge แสดงสถานะ
3. กด **Open Session** → Badge เปลี่ยนเป็น "open" (สีเขียว) → ปุ่ม Open disable, ปุ่ม Close เปิด
4. เปิด browser tab ใหม่ → login เป็น `candidate01` → ส่ง URL
5. กลับมา Judge → ต้องเห็น candidate มี submission — Badge "pending"
6. กด **Re-check** → Badge เปลี่ยนเป็น "checking" → รอ ~2.5 วินาที → เปลี่ยนเป็น "checked" + มีคะแนน
7. กด **Confirm** → เห็น "✓ Confirmed" แทนปุ่ม
8. กด **Close Session** → ยืนยัน → Badge เปลี่ยนเป็น "closed"

## Common Errors

| Error | สาเหตุ | วิธีแก้ |
|-------|--------|---------|
| Candidates list ว่าง | ไม่มี candidate ใน DB | รัน `npm run seed` ใน `backend/` |
| Re-check ไม่ได้ | result ถูก confirm แล้ว | Re-check ทำไม่ได้หลัง confirm — ตาม business rule |
| Confirm ซ้ำได้ | backend ตอบ 400 | frontend แสดง alert จาก `err.response.data.message` |
