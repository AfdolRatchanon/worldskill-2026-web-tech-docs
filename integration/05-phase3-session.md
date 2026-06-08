# บทที่ 5 — Phase 3: Session Lifecycle

> 🎯 **ทำตามทีละขั้น** — judge เปิด/ปิด session ได้ และ candidate เห็นสถานะเปลี่ยนเอง (cross-role)
>
> ⏱️ ~0:30 · 🏆 Session Lifecycle Rules **4**

---

# ส่วน A — Backend

## A.1 สร้าง `backend/src/middlewares/autoClose.js`

```js
const pool = require('../config/db');

async function autoCloseIfExpired(req, res, next) {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM test_sessions WHERE status = 'open' ORDER BY id DESC LIMIT 1"
    );
    const session = rows[0];
    if (session) {
      const expiredAt = new Date(session.opened_at).getTime() + session.duration_minutes * 60 * 1000;
      if (Date.now() > expiredAt) {
        await pool.execute(
          "UPDATE test_sessions SET status = 'closed', closed_at = NOW() WHERE id = ?",
          [session.id]
        );
      }
    }
  } catch {
    // non-blocking
  }
  next();
}

module.exports = autoCloseIfExpired;
```

## A.2 สร้าง `backend/src/controllers/sessionController.js`

```js
const pool = require('../config/db');

async function startSession(req, res) {
  try {
    const [rows] = await pool.execute('SELECT * FROM test_sessions ORDER BY id DESC LIMIT 1');
    const session = rows[0];

    if (!session) return res.status(404).json({ success: false, message: 'No session found' });
    if (session.status === 'open')
      return res.status(400).json({ success: false, message: 'Session is already open' });

    if (session.status === 'closed') {
      const [result] = await pool.execute(
        "INSERT INTO test_sessions (status, opened_at, duration_minutes) VALUES ('open', NOW(), ?)",
        [session.duration_minutes]
      );
      const [newSession] = await pool.execute('SELECT * FROM test_sessions WHERE id = ?', [result.insertId]);
      return res.json({ success: true, data: newSession[0], meta: {} });
    }

    await pool.execute("UPDATE test_sessions SET status = 'open', opened_at = NOW() WHERE id = ?", [session.id]);
    const [updated] = await pool.execute('SELECT * FROM test_sessions WHERE id = ?', [session.id]);
    res.json({ success: true, data: updated[0], meta: {} });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function closeSession(req, res) {
  try {
    const [rows] = await pool.execute('SELECT * FROM test_sessions ORDER BY id DESC LIMIT 1');
    const session = rows[0];

    if (!session || session.status !== 'open')
      return res.status(400).json({ success: false, message: 'Session is not open' });

    await pool.execute("UPDATE test_sessions SET status = 'closed', closed_at = NOW() WHERE id = ?", [session.id]);
    const [updated] = await pool.execute('SELECT * FROM test_sessions WHERE id = ?', [session.id]);
    res.json({ success: true, data: updated[0], meta: {} });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { startSession, closeSession };
```

## A.3 สร้าง `backend/src/routes/session.js`

```js
const router       = require('express').Router();
const authenticate = require('../middlewares/auth');
const authorize    = require('../middlewares/role');
const { startSession, closeSession } = require('../controllers/sessionController');

router.put('/session/start', authenticate, authorize('judge'), startSession);
router.put('/session/close', authenticate, authorize('judge'), closeSession);

module.exports = router;
```

## A.4 แก้ `backend/src/app.js` — ใส่ autoClose + mount session

```js
const express = require('express');
const cors    = require('cors');
const autoClose = require('./middlewares/autoClose');   // [!code ++]

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());
app.use(autoClose);                                      // [!code ++]

app.use('/api', require('./routes/auth'));
app.use('/api', require('./routes/config'));
app.use('/api', require('./routes/tasks'));
app.use('/api', require('./routes/session'));            // [!code ++]
```

## ✅ ทดสอบ Backend (Postman)

```
PUT http://localhost:8080/api/session/start    + Header: Bearer <token ของ judge01>
```
- token judge → session `open` · token candidate → `403 Access denied`
- เปิดซ้ำ → `400 already open` · `PUT /session/close` → `closed`

---

# ส่วน B — Frontend

## B.1 สร้าง `frontend/src/components/judge/SessionControl.jsx`

```jsx
import api from '../../services/api';
import Button from '../common/Button';
import Badge from '../common/Badge';

export default function SessionControl({ session, onUpdate }) {
  async function handleStart() {
    try { await api.put('/session/start'); onUpdate(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to start session'); }
  }

  async function handleClose() {
    if (!confirm('Close the session? Candidates will no longer be able to submit.')) return;
    try { await api.put('/session/close'); onUpdate(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to close session'); }
  }

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Status:</span>
        <Badge status={session?.status || 'waiting'} />
      </div>
      <div className="flex gap-2">
        <Button onClick={handleStart} disabled={session?.status === 'open'}>Open Session</Button>
        <Button variant="danger" onClick={handleClose} disabled={session?.status !== 'open'}>Close Session</Button>
      </div>
    </div>
  );
}
```

## B.2 สร้าง `frontend/src/pages/judge/Dashboard.jsx`

```jsx
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import SessionControl from '../../components/judge/SessionControl';

export default function JudgeDashboard() {
  const { user, logout } = useAuth();
  const [session, setSession] = useState(null);
  const [tick,    setTick]    = useState(0);

  useEffect(() => {
    async function fetchAll() {
      try {
        const cfgRes = await api.get('/config');
        setSession(cfgRes.data.data);
      } catch (err) { console.error('Failed to fetch data:', err); }
    }
    fetchAll();
    const id = setInterval(fetchAll, 5_000);
    return () => clearInterval(id);
  }, [tick]);

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
          <SessionControl session={session} onUpdate={() => setTick(t => t + 1)} />
        </Card>
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4">Candidates</h2>
          <p className="text-sm text-gray-400">— จะเพิ่มใน Phase 5 —</p>
        </Card>
      </main>
    </div>
  );
}
```

## B.3 แก้ `frontend/src/App.jsx` — ใส่ JudgeDashboard จริง

```jsx
import CandidateDashboard from './pages/candidate/Dashboard';
import JudgeDashboard from './pages/judge/Dashboard';   // [!code ++]
// ...
<Route path="/judge" element={
  <ProtectedRoute role="judge"><JudgeDashboard /></ProtectedRoute>   // [!code ++]
} />
```

## ✅ ทดสอบ Frontend (browser — 2 แท็บ)

1. แท็บ 1: login `judge01`/`judge123` → กด **Open Session** → Badge เป็น `open`
2. แท็บ 2: login `candidate01` → ภายใน 5 วิ Badge + นาฬิกาเปลี่ยนเป็น `open` **เอง** + นาฬิกาเริ่มนับถอย
3. judge กด **Close Session** → candidate เห็น "Session Closed"

---

## ☑️ Checkpoint ปิด Phase 3

- [ ] Postman: judge เปิด/ปิดได้ · candidate 403 · เปิดซ้ำ 400
- [ ] browser: judge เปิด → candidate เห็นเปลี่ยนเองใน 5 วิ + นาฬิกาเดิน

➡️ [Phase 4: Submission](/integration/06-phase4-submission) — candidate ส่ง URL ได้จริง
