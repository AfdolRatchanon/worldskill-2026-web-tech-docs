# บทที่ 16 — Candidate Forms

> **Candidate** เห็นนาฬิกานับถอย, ส่ง URL, และดูคะแนนตัวเองได้ — บทนี้สร้าง `CountdownTimer`, `SubmissionForm`, `ResultCard`

## ชิ้นงาน — 3 ไฟล์ใหม่ + อัปเดต Dashboard

```
src/
└── components/
    └── candidate/
        ├── CountdownTimer.jsx      ← สร้างในบทนี้
        ├── SubmissionForm.jsx      ← สร้างในบทนี้
        └── ResultCard.jsx          ← สร้างในบทนี้
```

## CountdownTimer.jsx

สร้างโฟลเดอร์ `src/components/candidate/` แล้วสร้างไฟล์ `src/components/candidate/CountdownTimer.jsx`:

```jsx
// components/candidate/CountdownTimer.jsx — บทที่ 13
import { useState, useEffect } from 'react';

export default function CountdownTimer({ session }) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!session?.opened_at || !session?.duration_minutes) { setTimeLeft(null); return; }

    const endTime = new Date(session.opened_at).getTime() + session.duration_minutes * 60 * 1000;

    const tick = () => setTimeLeft(Math.max(0, endTime - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [session?.opened_at, session?.duration_minutes]);  // รัน effect ใหม่เมื่อ session เปลี่ยน

  const formatTime = (ms) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (!session || session.status === 'waiting') {
    return <p className="text-center text-gray-400 text-sm">Session has not started yet</p>;
  }

  if (session.status === 'closed') {
    return <p className="text-center text-red-500 font-semibold">Session Closed</p>;
  }

  return (
    <div className="text-center">
      <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Time Remaining</p>
      <p className={`text-5xl font-mono font-bold ${timeLeft === 0 ? 'text-red-500' : 'text-blue-600'}`}>
        {timeLeft !== null ? formatTime(timeLeft) : '--:--:--'}
      </p>
    </div>
  );
}
```

## SubmissionForm.jsx

สร้าง `src/components/candidate/SubmissionForm.jsx`:

```jsx
// components/candidate/SubmissionForm.jsx — บทที่ 13
import { useState, useEffect } from 'react';
import api from '../../services/api';
import Input from '../common/Input';
import Button from '../common/Button';

export default function SubmissionForm({ submission, sessionOpen, onUpdate }) {
  const [frontendUrl, setFrontendUrl] = useState('');
  const [backendUrl,  setBackendUrl]  = useState('');
  const [error,       setError]       = useState('');
  const [loading,     setLoading]     = useState(false);

  useEffect(() => {
    setFrontendUrl(submission?.frontend_url || '');  // โหลดค่าเดิมเมื่อมี submission แล้ว
    setBackendUrl(submission?.backend_url   || '');
  }, [submission]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { frontend_url: frontendUrl, backend_url: backendUrl };
      if (submission) {
        await api.put('/my-submission', payload);   // มี submission อยู่แล้ว → update
      } else {
        await api.post('/my-submission', payload);  // ยังไม่มี → create
      }
      onUpdate();                                    // บอก parent ให้ fetch ใหม่
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        id="frontend_url"
        label="Frontend URL"
        type="url"
        placeholder="http://192.168.x.x:3000"
        value={frontendUrl}
        onChange={(e) => setFrontendUrl(e.target.value)}
        required
        disabled={!sessionOpen}
      />
      <Input
        id="backend_url"
        label="Backend API URL"
        type="url"
        placeholder="http://192.168.x.x:8080"
        value={backendUrl}
        onChange={(e) => setBackendUrl(e.target.value)}
        required
        disabled={!sessionOpen}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={!sessionOpen || loading}>
        {loading ? 'Submitting...' : submission ? 'Update Submission' : 'Submit'}
      </Button>

      {!sessionOpen && (
        <p className="text-xs text-gray-400 text-center">
          Submission is disabled while session is not open
        </p>
      )}
    </form>
  );
}
```

## ResultCard.jsx

สร้าง `src/components/candidate/ResultCard.jsx`:

```jsx
// components/candidate/ResultCard.jsx — บทที่ 13
export default function ResultCard({ result }) {
  if (!result) {
    return <p className="text-gray-400 text-sm">No result yet</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-xs text-gray-400">Frontend</p>
          <p className="text-2xl font-bold text-blue-600">{result.frontend_score}</p>
          <p className="text-xs text-gray-300">/ 25</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Backend</p>
          <p className="text-2xl font-bold text-blue-600">{result.backend_score}</p>
          <p className="text-xs text-gray-300">/ 40</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Total</p>
          <p className="text-2xl font-bold text-gray-900">{result.total_score}</p>
          <p className="text-xs text-gray-300">/ 65</p>
        </div>
      </div>

      <p className={`text-center text-xs font-medium ${result.is_confirmed ? 'text-green-600' : 'text-yellow-600'}`}>
        {result.is_confirmed ? '✓ Confirmed by judge' : '⏳ Pending confirmation'}
      </p>
    </div>
  );
}
```

## อัปเดต Candidate Dashboard — ใช้ components จริง

แก้ `src/pages/candidate/Dashboard.jsx` เต็มไฟล์:

```jsx
// pages/candidate/Dashboard.jsx — บทที่ 13 เพิ่ม components จริง
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import CountdownTimer from '../../components/candidate/CountdownTimer';  // [!code ++]
import SubmissionForm from '../../components/candidate/SubmissionForm';  // [!code ++]
import ResultCard from '../../components/candidate/ResultCard';          // [!code ++]

export default function CandidateDashboard() {
  const { user, logout } = useAuth();
  const [session,    setSession]    = useState(null);
  const [tasks,      setTasks]      = useState([]);
  const [submission, setSubmission] = useState(null);
  const [result,     setResult]     = useState(null);
  const [tick,       setTick]       = useState(0);              // [!code ++]

  useEffect(() => {
    async function fetchAll() {
      try {
        const [cfgRes, taskRes, subRes, resRes] = await Promise.all([
          api.get('/config'),
          api.get('/tasks'),
          api.get('/my-submission'),
          api.get('/my-result'),
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
    const id = setInterval(fetchAll, 5_000);
    return () => clearInterval(id);
  }, [tick]);                                                   // [!code ++]

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
          <CountdownTimer session={session} /> {/* [!code ++] */}
          <p className="text-center text-gray-400 text-sm"> {/* [!code --] */}
            Countdown Timer — จะเพิ่มในบทที่ 13
          </p> {/* [!code --] */}
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
            <SubmissionForm {/* [!code ++] */}
              submission={submission}                                 // [!code ++]
              sessionOpen={session?.status === 'open'}               // [!code ++]
              onUpdate={() => setTick(t => t + 1)}                   // [!code ++]
            /> {/* [!code ++] */}
            <p className="text-sm text-gray-400">Submission Form — จะเพิ่มในบทที่ 13</p> {/* [!code --] */}
          </Card>
          <Card>
            <h2 className="font-semibold text-gray-900 mb-4">Latest Result</h2>
            <ResultCard result={result} /> {/* [!code ++] */}
            <p className="text-sm text-gray-400">Result Card — จะเพิ่มในบทที่ 13</p> {/* [!code --] */}
          </Card>
        </div>
      </main>
    </div>
  );
}
```

## ทดสอบ

ต้องรัน backend ก่อน:

```bash
npm run dev
```

**URL:** `http://localhost:3000/candidate`
**Login:** `candidate01` / `cand123`

ต้องเห็น:
- **CountdownTimer:** ถ้า session `waiting` → "Session has not started yet"
- **SubmissionForm:** form มี Frontend URL และ Backend URL — ปิดอยู่ถ้า session ไม่ใช่ `open`
- **ResultCard:** "No result yet" (ถ้ายังไม่มีคะแนน)

**ทดสอบ flow ครบ:**
1. Login เป็น judge → Open Session → กลับมา candidate → นาฬิกาต้องนับถอย
2. กรอก URL แล้วกด Submit → ปุ่มเปลี่ยนเป็น "Update Submission" หลัง submit สำเร็จ
3. Judge กด Re-check + Confirm → ResultCard ต้องแสดงคะแนน (อัปเดตอัตโนมัติทุก 5s)

**DevTools → Network:** ต้องเห็น request `/config`, `/tasks`, `/my-submission`, `/my-result` ออกซ้ำทุก 5 วินาที

## Common Errors

| Error | สาเหตุ | วิธีแก้ |
|-------|--------|---------|
| นาฬิกาไม่นับ | `session.opened_at` เป็น null | ต้อง Open Session ก่อน |
| Submit ไม่ได้ | `sessionOpen` เป็น false | session ต้อง `open` ถึงส่งได้ |
| "Failed to submit" | URL format ผิด | ต้องขึ้นต้นด้วย `http://` หรือ `https://` |
| คะแนนไม่อัปเดต | polling ไม่ทำงาน | ตรวจ `setInterval` และ `clearInterval` ใน Dashboard |
