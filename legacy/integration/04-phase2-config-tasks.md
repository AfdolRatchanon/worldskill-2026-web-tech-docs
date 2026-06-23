# บทที่ 4 — Phase 2: Config + Tasks (อ่านอย่างเดียว)

> 🎯 **ทำตามทีละขั้น** — candidate login แล้วเห็นสถานะ session + นาฬิกานับถอย + โจทย์
>
> ⏱️ ~0:30 · 🏆 ส่วนของ Candidate Dashboard

---

# ส่วน A — Backend

## A.1 สร้าง `backend/src/controllers/configController.js`

```js
const pool = require('../config/db');

async function getConfig(req, res) {
  try {
    const [rows] = await pool.execute('SELECT * FROM test_sessions ORDER BY id DESC LIMIT 1');
    res.json({ success: true, data: rows[0] || null, meta: {} });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { getConfig };
```

## A.2 สร้าง `backend/src/routes/config.js`

```js
const router       = require('express').Router();
const authenticate = require('../middlewares/auth');
const { getConfig } = require('../controllers/configController');

router.get('/config', authenticate, getConfig);

module.exports = router;
```

## A.3 สร้าง `backend/src/controllers/tasksController.js`

```js
const pool = require('../config/db');

async function getTasks(req, res) {
  try {
    const [rows] = await pool.execute('SELECT * FROM tasks ORDER BY id ASC');
    res.json({ success: true, data: rows, meta: {} });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { getTasks };
```

## A.4 สร้าง `backend/src/routes/tasks.js`

```js
const router       = require('express').Router();
const authenticate = require('../middlewares/auth');
const { getTasks } = require('../controllers/tasksController');

router.get('/tasks', authenticate, getTasks);

module.exports = router;
```

## A.5 แก้ `backend/src/app.js` — mount config + tasks

```js
app.use('/api', require('./routes/auth'));
app.use('/api', require('./routes/config'));   // [!code ++]
app.use('/api', require('./routes/tasks'));    // [!code ++]
```

## ✅ ทดสอบ Backend (Postman)

```
GET http://localhost:8080/api/config     + Header: Authorization: Bearer <token>
GET http://localhost:8080/api/tasks       + Header: Authorization: Bearer <token>
```
`/config` ต้องได้ session (`status: "waiting"`) · `/tasks` ต้องได้ array โจทย์ · ไม่ใส่ token → 401

---

# ส่วน B — Frontend

## B.1 สร้าง `frontend/src/components/common/Card.jsx`

```jsx
export default function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
      {children}
    </div>
  );
}
```

## B.2 สร้าง `frontend/src/components/common/Badge.jsx`

```jsx
const styles = {
  waiting:  'bg-gray-100   text-gray-600',
  open:     'bg-green-100  text-green-700',
  closed:   'bg-red-100    text-red-700',
  pending:  'bg-yellow-100 text-yellow-700',
  checking: 'bg-blue-100   text-blue-700',
  checked:  'bg-green-100  text-green-700',
  pass:     'bg-green-100  text-green-700',
  fail:     'bg-red-100    text-red-700',
};

export default function Badge({ status }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}
```

## B.3 สร้าง `frontend/src/components/candidate/CountdownTimer.jsx`

```jsx
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
  }, [session?.opened_at, session?.duration_minutes]);

  const formatTime = (ms) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };

  if (!session || session.status === 'waiting')
    return <p className="text-center text-gray-400 text-sm">Session has not started yet</p>;
  if (session.status === 'closed')
    return <p className="text-center text-red-500 font-semibold">Session Closed</p>;

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

## B.4 สร้าง `frontend/src/pages/candidate/Dashboard.jsx`

```jsx
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import CountdownTimer from '../../components/candidate/CountdownTimer';

export default function CandidateDashboard() {
  const { user, logout } = useAuth();
  const [session, setSession] = useState(null);
  const [tasks,   setTasks]   = useState([]);
  const [tick,    setTick]    = useState(0);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [cfgRes, taskRes] = await Promise.all([
          api.get('/config'),
          api.get('/tasks'),
        ]);
        setSession(cfgRes.data.data);
        setTasks(taskRes.data.data);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      }
    }
    fetchAll();
    const id = setInterval(fetchAll, 5_000);
    return () => clearInterval(id);
  }, [tick]);

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
        <Card><CountdownTimer session={session} /></Card>

        {tasks.map((task) => (
          <Card key={task.id}>
            <h2 className="font-semibold text-gray-900 mb-2">{task.title}</h2>
            <p className="text-sm text-gray-600 whitespace-pre-line">{task.description}</p>
          </Card>
        ))}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <h2 className="font-semibold text-gray-900 mb-4">My Submission</h2>
            <p className="text-sm text-gray-400">— จะเพิ่มใน Phase 4 —</p>
          </Card>
          <Card>
            <h2 className="font-semibold text-gray-900 mb-4">Latest Result</h2>
            <p className="text-sm text-gray-400">— จะเพิ่มใน Phase 5 —</p>
          </Card>
        </div>
      </main>
    </div>
  );
}
```

## B.5 แก้ `frontend/src/App.jsx` — ใส่ CandidateDashboard จริง

```jsx
import Login from './pages/Login';
import CandidateDashboard from './pages/candidate/Dashboard';   // [!code ++]
// ...
<Route path="/candidate" element={
  <ProtectedRoute role="candidate"><div className="p-6">Candidate — Coming Soon</div></ProtectedRoute>  // [!code --]
  <ProtectedRoute role="candidate"><CandidateDashboard /></ProtectedRoute>                              // [!code ++]
} />
```

## ✅ ทดสอบ Frontend (browser)

1. login `candidate01` / `cand123` → เห็น header "Welcome, Alice Johnson" + Badge `waiting`
2. เห็นโจทย์ในการ์ด
3. นาฬิกาขึ้น "Session has not started yet" (ยังไม่เปิด — เปิดใน Phase 3)
4. DevTools → Network: เห็น `/config`, `/tasks` ยิงซ้ำทุก 5 วิ

---

## ☑️ Checkpoint ปิด Phase 2

- [ ] Postman: `/config` + `/tasks` คืนข้อมูลด้วย token
- [ ] browser: candidate เห็นโจทย์ + Badge + โครง Dashboard
- [ ] polling ยิงซ้ำทุก 5 วิ + หยุดเมื่อ logout

➡️ [Phase 3: Session](/legacy/integration/05-phase3-session) — judge เปิด session แล้วนาฬิกานี้จะเดิน
