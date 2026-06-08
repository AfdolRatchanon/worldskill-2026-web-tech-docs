# บทที่ 6 — Phase 4: Candidate Submission

> 🎯 **ทำตามทีละขั้น** — candidate ส่ง/แก้ URL งานได้ภายใต้กฎ (session เปิด, ห้ามซ้ำ, URL ถูก format)
>
> ⏱️ ~0:45 · 🏆 Candidate APIs **8** + Submission & Access Rules **9**

---

# ส่วน A — Backend

## A.1 สร้าง `backend/src/controllers/submissionsController.js`

```js
const pool = require('../config/db');

async function getViewSession() {
  const [rows] = await pool.execute(
    "SELECT * FROM test_sessions WHERE status IN ('open','closed') ORDER BY id DESC LIMIT 1"
  );
  return rows[0] || null;
}

async function getActiveSession() {
  const [rows] = await pool.execute('SELECT * FROM test_sessions ORDER BY id DESC LIMIT 1');
  return rows[0] || null;
}

function validateUrls({ frontend_url, backend_url }) {
  const isHttp = (s) => { try { const u = new URL(s); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; } };
  if (!frontend_url || !backend_url) return 'Both URLs are required';
  if (!isHttp(frontend_url) || !isHttp(backend_url)) return 'URLs must start with http:// or https://';
  return null;
}

async function getMySubmission(req, res) {
  try {
    const session = await getViewSession();
    if (!session) return res.json({ success: true, data: null, meta: {} });

    const [rows] = await pool.execute(
      'SELECT * FROM submissions WHERE candidate_id = ? AND session_id = ?',
      [req.user.id, session.id]
    );
    res.json({ success: true, data: rows[0] || null, meta: {} });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function createSubmission(req, res) {
  try {
    const session = await getActiveSession();
    if (!session || session.status !== 'open')
      return res.status(403).json({ success: false, message: 'Session is not open' });

    const { frontend_url, backend_url } = req.body;
    const urlError = validateUrls(req.body);
    if (urlError) return res.status(400).json({ success: false, message: urlError });

    const [existing] = await pool.execute(
      'SELECT id FROM submissions WHERE candidate_id = ? AND session_id = ?',
      [req.user.id, session.id]
    );
    if (existing.length > 0)
      return res.status(409).json({ success: false, message: 'Submission already exists. Use PUT to update.' });

    const [result] = await pool.execute(
      'INSERT INTO submissions (candidate_id, session_id, frontend_url, backend_url) VALUES (?, ?, ?, ?)',
      [req.user.id, session.id, frontend_url, backend_url]
    );
    const [rows] = await pool.execute('SELECT * FROM submissions WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], meta: {} });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function updateSubmission(req, res) {
  try {
    const session = await getActiveSession();
    if (!session || session.status !== 'open')
      return res.status(403).json({ success: false, message: 'Session is not open' });

    const { frontend_url, backend_url } = req.body;
    const urlError = validateUrls(req.body);
    if (urlError) return res.status(400).json({ success: false, message: urlError });

    const [existing] = await pool.execute(
      'SELECT id FROM submissions WHERE candidate_id = ? AND session_id = ?',
      [req.user.id, session.id]
    );
    if (existing.length === 0)
      return res.status(404).json({ success: false, message: 'No submission found. Use POST to create.' });

    await pool.execute(
      'UPDATE submissions SET frontend_url = ?, backend_url = ? WHERE candidate_id = ? AND session_id = ?',
      [frontend_url, backend_url, req.user.id, session.id]
    );
    const [rows] = await pool.execute(
      'SELECT * FROM submissions WHERE candidate_id = ? AND session_id = ?',
      [req.user.id, session.id]
    );
    res.json({ success: true, data: rows[0], meta: {} });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { getMySubmission, createSubmission, updateSubmission };
```

## A.2 สร้าง `backend/src/routes/submissions.js`

```js
const router       = require('express').Router();
const authenticate = require('../middlewares/auth');
const authorize    = require('../middlewares/role');
const ctrl         = require('../controllers/submissionsController');

router.get('/my-submission',  authenticate, authorize('candidate'), ctrl.getMySubmission);
router.post('/my-submission', authenticate, authorize('candidate'), ctrl.createSubmission);
router.put('/my-submission',  authenticate, authorize('candidate'), ctrl.updateSubmission);

module.exports = router;
```

## A.3 แก้ `backend/src/app.js` — mount submissions

```js
app.use('/api', require('./routes/session'));
app.use('/api', require('./routes/submissions'));   // [!code ++]
```

## ✅ ทดสอบ Backend (Postman)

> ต้องเปิด session ก่อน (Phase 3: `PUT /session/start` ด้วย judge)

```
POST http://localhost:8080/api/my-submission   + Bearer <token candidate01>
Body: { "frontend_url": "http://localhost:3000", "backend_url": "http://localhost:8080" }
```
- ส่งครั้งแรก → `201` · POST ซ้ำ → `409` · ส่ง URL `abc` → `400` · ปิด session แล้ว POST → `403`

---

# ส่วน B — Frontend

## B.1 สร้าง `frontend/src/components/candidate/SubmissionForm.jsx`

```jsx
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
    setFrontendUrl(submission?.frontend_url || '');
    setBackendUrl(submission?.backend_url   || '');
  }, [submission]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { frontend_url: frontendUrl, backend_url: backendUrl };
      if (submission) await api.put('/my-submission', payload);
      else            await api.post('/my-submission', payload);
      onUpdate();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input id="frontend_url" label="Frontend URL" type="url" placeholder="http://192.168.x.x:3000"
        value={frontendUrl} onChange={(e) => setFrontendUrl(e.target.value)} required disabled={!sessionOpen} />
      <Input id="backend_url" label="Backend API URL" type="url" placeholder="http://192.168.x.x:8080"
        value={backendUrl} onChange={(e) => setBackendUrl(e.target.value)} required disabled={!sessionOpen} />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={!sessionOpen || loading}>
        {loading ? 'Submitting...' : submission ? 'Update Submission' : 'Submit'}
      </Button>

      {!sessionOpen && (
        <p className="text-xs text-gray-400 text-center">Submission is disabled while session is not open</p>
      )}
    </form>
  );
}
```

## B.2 แก้ `frontend/src/pages/candidate/Dashboard.jsx` — เพิ่ม submission

```jsx
import CountdownTimer from '../../components/candidate/CountdownTimer';
import SubmissionForm from '../../components/candidate/SubmissionForm';   // [!code ++]

  const [session,    setSession]    = useState(null);
  const [tasks,      setTasks]      = useState([]);
  const [submission, setSubmission] = useState(null);   // [!code ++]
  const [tick,       setTick]       = useState(0);
```

```jsx
// ใน fetchAll — เพิ่ม /my-submission เข้า Promise.all
const [cfgRes, taskRes, subRes] = await Promise.all([   // [!code ++]
  api.get('/config'),
  api.get('/tasks'),
  api.get('/my-submission'),                            // [!code ++]
]);
setSession(cfgRes.data.data);
setTasks(taskRes.data.data);
setSubmission(subRes.data.data);                        // [!code ++]
```

```jsx
// แทนที่ placeholder "My Submission"
<Card>
  <h2 className="font-semibold text-gray-900 mb-4">My Submission</h2>
  <p className="text-sm text-gray-400">— จะเพิ่มใน Phase 4 —</p>   {/* [!code --] */}
  <SubmissionForm                                                   {/* [!code ++] */}
    submission={submission}                                         {/* [!code ++] */}
    sessionOpen={session?.status === 'open'}                        {/* [!code ++] */}
    onUpdate={() => setTick(t => t + 1)}                            {/* [!code ++] */}
  />                                                                {/* [!code ++] */}
</Card>
```

## ✅ ทดสอบ Frontend (browser)

1. judge เปิด session → candidate: ฟอร์มใช้งานได้ (ไม่ disabled)
2. กรอก URL → **Submit** → ขึ้นในช่อง + ปุ่มเปลี่ยนเป็น **Update Submission** (ไม่ต้องรอ 5 วิ)
3. กรอก URL ผิด format (เช่น `abc`) → เห็น error สีแดงจาก backend
4. judge ปิด session → ฟอร์ม disabled

---

## ☑️ Checkpoint ปิด Phase 4

- [ ] Postman: 201 / 409 / 400 / 403 ครบ
- [ ] browser: ส่งสำเร็จเห็นทันที · error ขึ้นจอ · ปิด session แล้ว disabled
- [ ] login candidate อื่น → เห็นเฉพาะ submission ของตัวเอง

➡️ [Phase 5: Judge + Results](/integration/07-phase5-judge-results) — ตรวจ → ยืนยัน → candidate เห็นผล
