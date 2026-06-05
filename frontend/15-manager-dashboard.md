# บทที่ 18 — Manager Dashboard

> **Manager** เห็นหน้านี้หลัง login — ดู statistics, ranking, เลือก session ที่ต้องการดู — read-only ทั้งหมด

## ชิ้นงาน — 4 ไฟล์

```
src/
├── pages/
│   └── manager/
│       └── Dashboard.jsx           ← สร้างในบทนี้
└── components/
    └── manager/
        ├── SummaryCards.jsx        ← สร้างในบทนี้
        ├── RankingTable.jsx        ← สร้างในบทนี้
        └── SessionSelector.jsx     ← สร้างในบทนี้
```

## SummaryCards.jsx

สร้างโฟลเดอร์ `src/components/manager/` แล้วสร้างไฟล์ `src/components/manager/SummaryCards.jsx`:

```jsx
// components/manager/SummaryCards.jsx — บทที่ 15
const CARDS = [
  { label: 'Total Candidates', value: (s) => s?.total_candidates, color: 'text-blue-600'   },
  { label: 'Submitted',        value: (s) => s?.submitted,        color: 'text-yellow-600' },
  { label: 'Confirmed',        value: (s) => s?.confirmed,        color: 'text-green-600'  },
  { label: 'Average Score',    value: (s) => s?.average_score,    color: 'text-purple-600' },
];
// CARDS เป็น array คงที่ข้างนอก component — ไม่ต้องสร้างใหม่ทุก render
// value เป็นฟังก์ชัน (s) => ... รับ summary มาคืนค่าตัวเลข

export default function SummaryCards({ summary }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {CARDS.map(({ label, value, color }) => (
        <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className={`text-3xl font-bold ${color}`}>{value(summary) ?? '—'}</p>
          <p className="text-xs text-gray-400 mt-1">{label}</p>
        </div>
      ))}
    </div>
  );
}
```

:::tip SummaryCards ไม่ใช้ Card component
`SummaryCards` ใช้ `<div>` ตรงๆ ไม่ใช้ `<Card>` เพราะต้องการ layout `grid` แบบ 4 คอลัมน์ — ไม่ใช่ wrapper
:::

## RankingTable.jsx

สร้าง `src/components/manager/RankingTable.jsx`:

```jsx
// components/manager/RankingTable.jsx — บทที่ 15
import Badge from '../common/Badge';

export default function RankingTable({ ranking, passThreshold = 40 }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left">
            <th scope="col" className="py-3 px-4 text-gray-400 font-medium">Rank</th>
            <th scope="col" className="py-3 px-4 text-gray-400 font-medium">Candidate</th>
            <th scope="col" className="py-3 px-4 text-gray-400 font-medium text-right">Frontend</th>
            <th scope="col" className="py-3 px-4 text-gray-400 font-medium text-right">Backend</th>
            <th scope="col" className="py-3 px-4 text-gray-400 font-medium text-right">Total</th>
            <th scope="col" className="py-3 px-4 text-gray-400 font-medium">Result</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((r) => (
            <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-3 px-4 font-bold text-gray-500">#{r.rank}</td>
              <td className="py-3 px-4">
                <p className="font-medium text-gray-900">{r.full_name}</p>
                <p className="text-xs text-gray-400">{r.username}</p>
              </td>
              <td className="py-3 px-4 text-right">{r.frontend_score}</td>
              <td className="py-3 px-4 text-right">{r.backend_score}</td>
              <td className="py-3 px-4 text-right font-bold">{r.total_score}</td>
              <td className="py-3 px-4">
                <Badge status={r.total_score >= passThreshold ? 'pass' : 'fail'} />
              </td>
            </tr>
          ))}
          {ranking.length === 0 && (
            <tr>
              <td colSpan={6} className="py-10 text-center text-gray-300">
                No confirmed results yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
```

## SessionSelector.jsx

สร้าง `src/components/manager/SessionSelector.jsx`:

```jsx
// components/manager/SessionSelector.jsx — บทที่ 15
import Badge from '../common/Badge';

export default function SessionSelector({ sessions, selectedId, onChange }) {
  if (!sessions || sessions.length === 0) return null;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-sm text-gray-500">Session:</span>
      <div className="flex gap-2 flex-wrap">
        {sessions.map((s) => (
          <button
            key={s.id}
            onClick={() => onChange(s.id)}
            className={`
              px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors
              focus:outline-none focus:ring-2 focus:ring-blue-500
              ${selectedId === s.id
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'}
            `}
          >
            #{s.id} &nbsp;
            <Badge status={s.status} />
          </button>
        ))}
      </div>
    </div>
  );
}
```

## Dashboard.jsx

สร้างโฟลเดอร์ `src/pages/manager/` แล้วสร้างไฟล์ `src/pages/manager/Dashboard.jsx`:

```jsx
// pages/manager/Dashboard.jsx — บทที่ 15
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import SummaryCards from '../../components/manager/SummaryCards';
import RankingTable from '../../components/manager/RankingTable';
import SessionSelector from '../../components/manager/SessionSelector';

export default function ManagerDashboard() {
  const { user, logout } = useAuth();
  const [sessions,   setSessions]   = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [summary,    setSummary]    = useState(null);
  const [ranking,    setRanking]    = useState([]);
  const [status,     setStatus]     = useState(null);

  // Effect 1 — โหลด session list, รันครั้งเดียวตอน mount
  useEffect(() => {
    async function fetchSessions() {
      try {
        const res  = await api.get('/sessions');
        const list = res.data.data;
        setSessions(list);
        setSelectedId((prev) => (prev === null && list.length > 0 ? list[0].id : prev));
        // setState(prev=>) = functional updater: อ่าน state ล่าสุดแทน closure เก่า
        // prev===null ครั้งแรก → เลือก session แรก, ครั้งต่อมาคง selectedId ที่ user เลือกไว้
      } catch (err) {
        console.error('Failed to load sessions:', err);
      }
    }
    fetchSessions();
    const id = setInterval(fetchSessions, 5_000);
    return () => clearInterval(id);
  }, []);  // [] = รันครั้งเดียว — sessions ไม่ขึ้นกับ selectedId

  // Effect 2 — โหลด stats, รันใหม่เมื่อ selectedId เปลี่ยน
  useEffect(() => {
    if (!selectedId) return;
    async function fetchStats() {
      try {
        const params = `?session_id=${selectedId}`;
        const [sumRes, rankRes, statusRes] = await Promise.all([
          api.get(`/statistics/summary${params}`),
          api.get(`/statistics/ranking${params}`),
          api.get(`/statistics/status${params}`),
        ]);
        setSummary(sumRes.data.data);
        setRanking(rankRes.data.data);
        setStatus(statusRes.data.data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    }
    fetchStats();
    const id = setInterval(fetchStats, 5_000);
    return () => clearInterval(id);
  }, [selectedId]);  // selectedId เปลี่ยน → effect สร้างใหม่ → fetch session ที่เลือก

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="font-bold text-gray-900">Manager Dashboard</h1>
            <p className="text-sm text-gray-400">{user?.full_name}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge status={summary?.session?.status || 'waiting'} />
            <Button variant="ghost" onClick={logout}>Logout</Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-6">

        <Card>
          <SessionSelector
            sessions={sessions}
            selectedId={selectedId}
            onChange={setSelectedId}
          />
        </Card>

        <SummaryCards summary={summary} />

        {status && (
          <div className="grid grid-cols-2 gap-4">
            <Card className="text-center">
              <p className="text-4xl font-bold text-green-600">{status.pass_count ?? 0}</p>
              <p className="text-sm text-gray-400 mt-1">Pass (≥ {status.pass_threshold} pts)</p>
            </Card>
            <Card className="text-center">
              <p className="text-4xl font-bold text-red-500">{status.fail_count ?? 0}</p>
              <p className="text-sm text-gray-400 mt-1">Fail</p>
            </Card>
          </div>
        )}

        <Card>
          <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
            <h2 className="font-semibold text-gray-900">Ranking</h2>
            <p className="text-sm text-gray-400">Export — จะเพิ่มในบทที่ 16</p>
          </div>
          <RankingTable ranking={ranking} passThreshold={status?.pass_threshold} />
        </Card>

      </main>
    </div>
  );
}
```

## อัปเดต App.jsx — เพิ่ม Route /manager จริง

```jsx
// App.jsx — บทที่ 15 เพิ่ม ManagerDashboard
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './router/ProtectedRoute';
import Login from './pages/Login';
import CandidateDashboard from './pages/candidate/Dashboard';
import JudgeDashboard from './pages/judge/Dashboard';
import ManagerDashboard from './pages/manager/Dashboard';        // [!code ++]

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
            <ProtectedRoute role="judge"><JudgeDashboard /></ProtectedRoute>
          } />
          <Route path="/manager" element={
            <ProtectedRoute role="manager">
              <ManagerDashboard /> {/* [!code ++] */}
            </ProtectedRoute>
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

1. Login เป็น `manager01` / `manager123`
2. ต้องเห็น **SessionSelector** — ปุ่มเลือก session ที่มีอยู่
3. ต้องเห็น **SummaryCards** — 4 card แสดงตัวเลข
4. ต้องเห็น pass/fail card (ถ้ามี confirmed result)
5. ต้องเห็น **RankingTable** แสดง ranking (ถ้ามี)
6. กดเลือก session อื่น → stats อัปเดตตาม session ที่เลือก

## Common Errors

| Error | สาเหตุ | วิธีแก้ |
|-------|--------|---------|
| Sessions ว่าง | ยังไม่มี session ใน DB | Login เป็น judge → Open Session ก่อน |
| Ranking ว่าง | ยังไม่มี confirmed result | Judge ต้อง Re-check + Confirm ก่อน |
| Stats ไม่โหลด | `selectedId` เป็น null | `fetchSessions` auto-select session แรกอัตโนมัติเมื่อโหลดครั้งแรก |
