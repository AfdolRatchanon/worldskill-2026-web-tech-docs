# บทที่ 7 — Phase 5: Judge + Results

> 🎯 **ทำตามทีละขั้น** — judge เห็นรายชื่อ + งาน → re-check (ตรวจอัตโนมัติ) → confirm คะแนน → candidate เห็นผล
>
> ⏱️ ~1:15 · 🏆 Judge APIs + Judge Dashboard **8** + Result Flow **7**

---

# ส่วน A — Backend

## A.1 สร้าง `backend/src/controllers/candidatesController.js`

```js
const pool = require('../config/db');

async function getViewSession() {
  const [rows] = await pool.execute(
    "SELECT * FROM test_sessions WHERE status IN ('open','closed') ORDER BY id DESC LIMIT 1"
  );
  return rows[0] || null;
}

async function getCandidates(req, res) {
  try {
    const session   = await getViewSession();
    const sessionId = session?.id ?? 0;

    const [rows] = await pool.execute(`
      SELECT
        u.id, u.username, u.full_name,
        s.id AS submission_id, s.status AS submission_status,
        s.frontend_url, s.backend_url, s.submitted_at,
        r.frontend_score, r.backend_score, r.total_score, r.is_confirmed
      FROM users u
      LEFT JOIN submissions s ON u.id = s.candidate_id AND s.session_id = ?
      LEFT JOIN results     r ON u.id = r.candidate_id AND r.session_id = ?
      WHERE u.role = 'candidate'
      ORDER BY u.full_name ASC
    `, [sessionId, sessionId]);

    res.json({ success: true, data: rows, meta: {} });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { getCandidates };
```

## A.2 สร้าง `backend/src/routes/candidates.js`

```js
const router       = require('express').Router();
const authenticate = require('../middlewares/auth');
const authorize    = require('../middlewares/role');
const { getCandidates } = require('../controllers/candidatesController');

router.get('/candidates', authenticate, authorize('judge'), getCandidates);

module.exports = router;
```

## A.3 แก้ `backend/src/controllers/submissionsController.js` — เพิ่ม 2 ฟังก์ชัน (ก่อน `module.exports`)

```js
async function getAllSubmissions(req, res) {                              // [!code ++]
  try {                                                                   // [!code ++]
    const session = await getViewSession();                              // [!code ++]
    if (!session) return res.json({ success: true, data: [], meta: {} });// [!code ++]
    const [rows] = await pool.execute(`                                  // [!code ++]
      SELECT s.*, u.full_name, u.username                                // [!code ++]
      FROM submissions s JOIN users u ON s.candidate_id = u.id           // [!code ++]
      WHERE s.session_id = ? ORDER BY s.submitted_at DESC                // [!code ++]
    `, [session.id]);                                                    // [!code ++]
    res.json({ success: true, data: rows, meta: {} });                   // [!code ++]
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }  // [!code ++]
}                                                                         // [!code ++]
                                                                          // [!code ++]
async function recheckSubmission(req, res) {                             // [!code ++]
  try {                                                                   // [!code ++]
    const { id } = req.params;                                           // [!code ++]
    const [rows] = await pool.execute('SELECT * FROM submissions WHERE id = ?', [id]);  // [!code ++]
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Submission not found' });  // [!code ++]
    const [confirmed] = await pool.execute('SELECT id FROM results WHERE submission_id = ? AND is_confirmed = 1', [id]);  // [!code ++]
    if (confirmed.length > 0) return res.status(403).json({ success: false, message: 'Cannot re-check a confirmed result' });  // [!code ++]
    await pool.execute("UPDATE submissions SET status = 'checking' WHERE id = ?", [id]);  // [!code ++]
    setTimeout(async () => {                                             // [!code ++]
      const frontendScore = parseFloat((Math.random() * 25).toFixed(2)); // [!code ++]
      const backendScore  = parseFloat((Math.random() * 40).toFixed(2)); // [!code ++]
      const totalScore    = parseFloat((frontendScore + backendScore).toFixed(2));  // [!code ++]
      const sub = rows[0];                                               // [!code ++]
      await pool.execute("UPDATE submissions SET status = 'checked' WHERE id = ?", [id]);  // [!code ++]
      const [existing] = await pool.execute('SELECT id FROM results WHERE submission_id = ?', [id]);  // [!code ++]
      if (existing.length > 0) {                                         // [!code ++]
        await pool.execute(`UPDATE results SET frontend_score=?, backend_score=?, total_score=?, is_confirmed=0, confirmed_by=NULL, confirmed_at=NULL WHERE submission_id=?`, [frontendScore, backendScore, totalScore, id]);  // [!code ++]
      } else {                                                           // [!code ++]
        await pool.execute(`INSERT INTO results (submission_id, candidate_id, session_id, frontend_score, backend_score, total_score) VALUES (?, ?, ?, ?, ?, ?)`, [id, sub.candidate_id, sub.session_id, frontendScore, backendScore, totalScore]);  // [!code ++]
      }                                                                  // [!code ++]
    }, 2000);                                                            // [!code ++]
    res.json({ success: true, data: { message: 'Re-check started' }, meta: {} });  // [!code ++]
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }  // [!code ++]
}                                                                         // [!code ++]

module.exports = { getMySubmission, createSubmission, updateSubmission };                          // [!code --]
module.exports = { getMySubmission, createSubmission, updateSubmission, getAllSubmissions, recheckSubmission };   // [!code ++]
```

## A.4 แก้ `backend/src/routes/submissions.js` — เพิ่ม route judge

```js
router.put('/my-submission',  authenticate, authorize('candidate'), ctrl.updateSubmission);
router.get('/submissions',              authenticate, authorize('judge'), ctrl.getAllSubmissions);   // [!code ++]
router.post('/submissions/:id/recheck', authenticate, authorize('judge'), ctrl.recheckSubmission);   // [!code ++]
```

## A.5 สร้าง `backend/src/controllers/resultsController.js`

```js
const pool = require('../config/db');

async function getViewSession() {
  const [rows] = await pool.execute(
    "SELECT * FROM test_sessions WHERE status IN ('open','closed') ORDER BY id DESC LIMIT 1"
  );
  return rows[0] || null;
}

async function getMyResult(req, res) {
  try {
    const session = await getViewSession();
    if (!session) return res.json({ success: true, data: null, meta: {} });
    const [rows] = await pool.execute(
      'SELECT * FROM results WHERE candidate_id = ? AND session_id = ? ORDER BY created_at DESC LIMIT 1',
      [req.user.id, session.id]
    );
    res.json({ success: true, data: rows[0] || null, meta: {} });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function confirmResult(req, res) {
  const { candidate_id } = req.params;
  const session = await getViewSession();
  if (!session) return res.status(404).json({ success: false, message: 'No active session' });

  const [rows] = await pool.execute(
    'SELECT * FROM results WHERE candidate_id = ? AND session_id = ? ORDER BY created_at DESC LIMIT 1',
    [candidate_id, session.id]
  );
  if (rows.length === 0) return res.status(404).json({ success: false, message: 'Result not found' });
  if (rows[0].is_confirmed) return res.status(400).json({ success: false, message: 'Result is already confirmed' });

  await pool.execute(
    'UPDATE results SET is_confirmed = 1, confirmed_by = ?, confirmed_at = NOW() WHERE id = ?',
    [req.user.id, rows[0].id]
  );
  const [updated] = await pool.execute('SELECT * FROM results WHERE id = ?', [rows[0].id]);
  res.json({ success: true, data: updated[0], meta: {} });
}

module.exports = { getMyResult, confirmResult };
```

## A.6 สร้าง `backend/src/routes/results.js`

```js
const router       = require('express').Router();
const authenticate = require('../middlewares/auth');
const authorize    = require('../middlewares/role');
const { getMyResult, confirmResult } = require('../controllers/resultsController');

router.get('/my-result',                     authenticate, authorize('candidate'), getMyResult);
router.put('/results/:candidate_id/confirm', authenticate, authorize('judge'),     confirmResult);

module.exports = router;
```

## A.7 แก้ `backend/src/app.js` — mount candidates + results

```js
app.use('/api', require('./routes/submissions'));
app.use('/api', require('./routes/candidates'));   // [!code ++]
app.use('/api', require('./routes/results'));      // [!code ++]
```

## ✅ ทดสอบ Backend (Postman, token judge)

- `GET /api/candidates` → รายชื่อ (คนยังไม่ส่ง score = null)
- `POST /api/submissions/<id>/recheck` → รอ 2 วิ แล้ว `/candidates` มี score
- `PUT /api/results/<candidate_id>/confirm` → `is_confirmed=1` · confirm ซ้ำ → `400`

---

# ส่วน B — Frontend

## B.1 สร้าง `frontend/src/components/judge/CandidateTable.jsx`

```jsx
import api from '../../services/api';
import Button from '../common/Button';
import Badge from '../common/Badge';

export default function CandidateTable({ candidates, onUpdate }) {
  async function handleRecheck(submissionId) {
    try { await api.post(`/submissions/${submissionId}/recheck`); setTimeout(onUpdate, 2500); }
    catch (err) { alert(err.response?.data?.message || 'Failed to recheck'); }
  }
  async function handleConfirm(candidateId) {
    try { await api.put(`/results/${candidateId}/confirm`); onUpdate(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to confirm'); }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left">
            <th scope="col" className="py-3 px-4 text-gray-400 font-medium">Candidate</th>
            <th scope="col" className="py-3 px-4 text-gray-400 font-medium">Status</th>
            <th className="py-3 px-4 text-gray-400 font-medium text-right">Score</th>
            <th scope="col" className="py-3 px-4 text-gray-400 font-medium">Actions</th>
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
                {c.submission_id ? <Badge status={c.submission_status} />
                  : <span className="text-xs text-gray-300">No submission</span>}
              </td>
              <td className="py-3 px-4 text-right font-semibold">
                {c.total_score != null ? c.total_score : <span className="text-gray-300">—</span>}
              </td>
              <td className="py-3 px-4">
                <div className="flex gap-2 items-center">
                  {c.submission_id && !c.is_confirmed && (
                    <Button variant="ghost" className="text-xs px-2 py-1"
                      onClick={() => handleRecheck(c.submission_id)}
                      disabled={c.submission_status === 'checking'}>
                      {c.submission_status === 'checking' ? 'Checking…' : 'Re-check'}
                    </Button>
                  )}
                  {c.submission_status === 'checked' && !c.is_confirmed && (
                    <Button variant="success" className="text-xs px-2 py-1"
                      onClick={() => handleConfirm(c.id)}>Confirm</Button>
                  )}
                  {!!c.is_confirmed && <span className="text-xs text-green-600 font-medium">✓ Confirmed</span>}
                </div>
              </td>
            </tr>
          ))}
          {candidates.length === 0 && (
            <tr><td colSpan={4} className="py-10 text-center text-gray-300">No candidates found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
```

## B.2 สร้าง `frontend/src/components/judge/SubmissionsTable.jsx`

```jsx
import Badge from '../common/Badge';

export default function SubmissionsTable({ submissions }) {
  if (!submissions || submissions.length === 0)
    return <p className="text-center text-gray-300 py-8 text-sm">No submissions yet</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left">
            <th scope="col" className="py-3 px-4 text-gray-400 font-medium">Candidate</th>
            <th scope="col" className="py-3 px-4 text-gray-400 font-medium">Frontend URL</th>
            <th scope="col" className="py-3 px-4 text-gray-400 font-medium">Backend URL</th>
            <th scope="col" className="py-3 px-4 text-gray-400 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((s) => (
            <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-3 px-4">
                <p className="font-medium text-gray-900">{s.full_name}</p>
                <p className="text-xs text-gray-400">{s.username}</p>
              </td>
              <td className="py-3 px-4 max-w-[200px]">
                <a href={s.frontend_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs truncate block">{s.frontend_url}</a>
              </td>
              <td className="py-3 px-4 max-w-[200px]">
                <a href={s.backend_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs truncate block">{s.backend_url}</a>
              </td>
              <td className="py-3 px-4"><Badge status={s.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## B.3 แก้ `frontend/src/pages/judge/Dashboard.jsx` — เพิ่มตาราง

```jsx
import SessionControl from '../../components/judge/SessionControl';
import CandidateTable from '../../components/judge/CandidateTable';      // [!code ++]
import SubmissionsTable from '../../components/judge/SubmissionsTable';  // [!code ++]

  const [session,     setSession]     = useState(null);
  const [candidates,  setCandidates]  = useState([]);   // [!code ++]
  const [submissions, setSubmissions] = useState([]);   // [!code ++]
  const [tick,        setTick]        = useState(0);
```

```jsx
// ใน fetchAll — ดึง 3 อย่างพร้อมกัน
const [cfgRes, candRes, subRes] = await Promise.all([   // [!code ++]
  api.get('/config'),
  api.get('/candidates'),                               // [!code ++]
  api.get('/submissions'),                              // [!code ++]
]);
setSession(cfgRes.data.data);
setCandidates(candRes.data.data);                       // [!code ++]
setSubmissions(subRes.data.data);                       // [!code ++]
```

```jsx
// แทนที่ placeholder Candidates + เพิ่มการ์ด Submissions
<Card>
  <h2 className="font-semibold text-gray-900 mb-4">Candidates</h2>
  <p className="text-sm text-gray-400">— จะเพิ่มใน Phase 5 —</p>          {/* [!code --] */}
  <CandidateTable candidates={candidates} onUpdate={() => setTick(t => t + 1)} />   {/* [!code ++] */}
</Card>
<Card>                                                                   {/* [!code ++] */}
  <h2 className="font-semibold text-gray-900 mb-4">Submissions</h2>      {/* [!code ++] */}
  <SubmissionsTable submissions={submissions} />                         {/* [!code ++] */}
</Card>                                                                  {/* [!code ++] */}
```

## B.4 สร้าง `frontend/src/components/candidate/ResultCard.jsx`

```jsx
export default function ResultCard({ result }) {
  if (!result) return <p className="text-gray-400 text-sm">No result yet</p>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 text-center">
        <div><p className="text-xs text-gray-400">Frontend</p><p className="text-2xl font-bold text-blue-600">{result.frontend_score}</p><p className="text-xs text-gray-300">/ 25</p></div>
        <div><p className="text-xs text-gray-400">Backend</p><p className="text-2xl font-bold text-blue-600">{result.backend_score}</p><p className="text-xs text-gray-300">/ 40</p></div>
        <div><p className="text-xs text-gray-400">Total</p><p className="text-2xl font-bold text-gray-900">{result.total_score}</p><p className="text-xs text-gray-300">/ 65</p></div>
      </div>
      <p className={`text-center text-xs font-medium ${result.is_confirmed ? 'text-green-600' : 'text-yellow-600'}`}>
        {result.is_confirmed ? '✓ Confirmed by judge' : '⏳ Pending confirmation'}
      </p>
    </div>
  );
}
```

## B.5 แก้ `frontend/src/pages/candidate/Dashboard.jsx` — เพิ่มผลคะแนน

```jsx
import SubmissionForm from '../../components/candidate/SubmissionForm';
import ResultCard from '../../components/candidate/ResultCard';   // [!code ++]

  const [submission, setSubmission] = useState(null);
  const [result,     setResult]     = useState(null);   // [!code ++]
  const [tick,       setTick]       = useState(0);
```

```jsx
// fetchAll — เพิ่ม /my-result
const [cfgRes, taskRes, subRes, resRes] = await Promise.all([   // [!code ++]
  api.get('/config'), api.get('/tasks'), api.get('/my-submission'),
  api.get('/my-result'),                                        // [!code ++]
]);
setSubmission(subRes.data.data);
setResult(resRes.data.data);                                    // [!code ++]
```

```jsx
// แทนที่ placeholder "Latest Result"
<Card>
  <h2 className="font-semibold text-gray-900 mb-4">Latest Result</h2>
  <p className="text-sm text-gray-400">— จะเพิ่มใน Phase 5 —</p>   {/* [!code --] */}
  <ResultCard result={result} />                                  {/* [!code ++] */}
</Card>
```

## ✅ ทดสอบ Frontend (browser — judge + candidate)

1. judge กด **Re-check** → สถานะ `checking…` → ~2 วิ → `checked` + คะแนนโผล่
2. judge กด **Confirm** → ✓ Confirmed
3. candidate ภายใน 5 วิ → ResultCard เปลี่ยนจาก ⏳ เป็น ✓ Confirmed
4. judge confirm แล้วกด re-check อีก → alert error (403)

---

## ☑️ Checkpoint ปิด Phase 5

- [ ] Postman: candidates/submissions/recheck/confirm + กฎ 403/400/404
- [ ] browser: re-check → checked+score · confirm → ✓ · candidate เห็นผลเปลี่ยนเอง

➡️ [Phase 6: Manager](/integration/08-phase6-manager) — สรุป + ranking + export
