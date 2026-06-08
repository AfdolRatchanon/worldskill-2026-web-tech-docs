# บทที่ 8 — Phase 6: Manager (สรุป + Ranking + Export)

> 🎯 **ทำตามทีละขั้น** — manager ดู summary, ranking, pass/fail ของ session ที่เลือก และ export รายงาน
>
> ⏱️ ~0:45 · 🏆 Manager APIs + Manager Dashboard **7**

---

# ส่วน A — Backend

## A.1 สร้าง `backend/src/controllers/statisticsController.js`

```js
const pool = require('../config/db');
const PASS_THRESHOLD = 40;

async function getViewSession(sessionId) {
  if (sessionId) {
    const [rows] = await pool.execute('SELECT * FROM test_sessions WHERE id = ?', [sessionId]);
    return rows[0] || null;
  }
  const [rows] = await pool.execute(
    "SELECT * FROM test_sessions WHERE status IN ('open','closed') ORDER BY id DESC LIMIT 1"
  );
  return rows[0] || null;
}

async function getSummary(req, res) {
  try {
    const session   = await getViewSession(req.query.session_id);
    const sessionId = session?.id ?? 0;
    const [[{ count: total_candidates }]] = await pool.execute("SELECT COUNT(*) AS count FROM users WHERE role = 'candidate'");
    const [[{ count: submitted }]] = await pool.execute('SELECT COUNT(DISTINCT candidate_id) AS count FROM submissions WHERE session_id = ?', [sessionId]);
    const [[{ count: confirmed }]] = await pool.execute('SELECT COUNT(*) AS count FROM results WHERE is_confirmed = 1 AND session_id = ?', [sessionId]);
    const [[{ avg }]] = await pool.execute('SELECT AVG(total_score) AS avg FROM results WHERE is_confirmed = 1 AND session_id = ?', [sessionId]);
    res.json({ success: true, data: {
      total_candidates, submitted, confirmed,
      average_score: parseFloat(Number(avg || 0).toFixed(2)),
      session: session || null,
    }, meta: {} });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
}

async function getRanking(req, res) {
  try {
    const session = await getViewSession(req.query.session_id);
    if (!session) return res.json({ success: true, data: [], meta: {} });
    const [rows] = await pool.execute(`
      SELECT u.id, u.username, u.full_name,
        r.frontend_score, r.backend_score, r.total_score, r.is_confirmed,
        RANK() OVER (ORDER BY r.total_score DESC) AS \`rank\`
      FROM results r JOIN users u ON r.candidate_id = u.id
      WHERE r.is_confirmed = 1 AND r.session_id = ?
      ORDER BY r.total_score DESC
    `, [session.id]);
    res.json({ success: true, data: rows, meta: {} });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
}

async function getStatus(req, res) {
  try {
    const session   = await getViewSession(req.query.session_id);
    const sessionId = session?.id ?? 0;
    const [[row]] = await pool.execute(
      `SELECT
         SUM(CASE WHEN total_score >= ? THEN 1 ELSE 0 END) AS pass_count,
         SUM(CASE WHEN total_score <  ? THEN 1 ELSE 0 END) AS fail_count,
         COUNT(*) AS total
       FROM results WHERE is_confirmed = 1 AND session_id = ?`,
      [PASS_THRESHOLD, PASS_THRESHOLD, sessionId]
    );
    res.json({ success: true, data: { ...row, pass_threshold: PASS_THRESHOLD }, meta: {} });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
}

module.exports = { getSummary, getRanking, getStatus };
```

## A.2 สร้าง `backend/src/routes/statistics.js`

```js
const router       = require('express').Router();
const authenticate = require('../middlewares/auth');
const authorize    = require('../middlewares/role');
const ctrl         = require('../controllers/statisticsController');

router.get('/statistics/summary', authenticate, authorize('manager'), ctrl.getSummary);
router.get('/statistics/ranking', authenticate, authorize('manager'), ctrl.getRanking);
router.get('/statistics/status',  authenticate, authorize('manager'), ctrl.getStatus);

module.exports = router;
```

## A.3 สร้าง `backend/src/controllers/reportController.js`

```js
const pool = require('../config/db');

async function getReport(req, res) {
  try {
    const { format = 'json', session_id } = req.query;
    const condition = session_id ? 'AND r.session_id = ?' : '';
    const params    = session_id ? [session_id] : [];

    const [rows] = await pool.execute(`
      SELECT u.username, u.full_name,
        r.frontend_score, r.backend_score, r.total_score, r.is_confirmed,
        s.frontend_url, s.backend_url
      FROM results r
      JOIN users       u ON r.candidate_id  = u.id
      JOIN submissions s ON r.submission_id = s.id
      WHERE 1=1 ${condition}
      ORDER BY r.total_score DESC
    `, params);

    if (format === 'csv') {
      const header = 'Username,Full Name,Frontend Score,Backend Score,Total Score,Confirmed\n';
      const body   = rows.map((r) =>
        `${r.username},${r.full_name},${r.frontend_score},${r.backend_score},${r.total_score},${r.is_confirmed ? 'Yes' : 'No'}`
      ).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="report.csv"');
      return res.send(header + body);
    }
    res.json({ success: true, data: rows, meta: {} });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
}

module.exports = { getReport };
```

## A.4 สร้าง `backend/src/routes/report.js`

```js
const router       = require('express').Router();
const authenticate = require('../middlewares/auth');
const authorize    = require('../middlewares/role');
const { getReport } = require('../controllers/reportController');

router.get('/report', authenticate, authorize('manager'), getReport);

module.exports = router;
```

## A.5 สร้าง `backend/src/controllers/sessionsController.js` + `routes/sessions.js`

```js
// controllers/sessionsController.js
const pool = require('../config/db');

async function getSessions(req, res) {
  try {
    const [rows] = await pool.execute('SELECT * FROM test_sessions ORDER BY id DESC');
    res.json({ success: true, data: rows, meta: {} });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
}

module.exports = { getSessions };
```

```js
// routes/sessions.js
const router       = require('express').Router();
const authenticate = require('../middlewares/auth');
const authorize    = require('../middlewares/role');
const { getSessions } = require('../controllers/sessionsController');

router.get('/sessions', authenticate, authorize('manager'), getSessions);

module.exports = router;
```

## A.6 แก้ `backend/src/app.js` — mount statistics + report + sessions

```js
app.use('/api', require('./routes/results'));
app.use('/api', require('./routes/statistics'));   // [!code ++]
app.use('/api', require('./routes/report'));       // [!code ++]
app.use('/api', require('./routes/sessions'));     // [!code ++]
```

## ✅ ทดสอบ Backend (Postman, token manager)

- `GET /api/statistics/summary` → ตัวเลข · `/ranking` → ลำดับ · `/status` → pass/fail
- `GET /api/sessions` → รายการ session · `GET /api/report?format=csv` → ไฟล์ CSV
- token candidate/judge → 403

---

# ส่วน B — Frontend

## B.1 สร้าง `frontend/src/components/manager/SessionSelector.jsx`

```jsx
import Badge from '../common/Badge';

export default function SessionSelector({ sessions, selectedId, onChange }) {
  if (!sessions || sessions.length === 0) return null;
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-sm text-gray-500">Session:</span>
      <div className="flex gap-2 flex-wrap">
        {sessions.map((s) => (
          <button key={s.id} onClick={() => onChange(s.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors
              focus:outline-none focus:ring-2 focus:ring-blue-500
              ${selectedId === s.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'}`}>
            #{s.id} &nbsp;<Badge status={s.status} />
          </button>
        ))}
      </div>
    </div>
  );
}
```

## B.2 สร้าง `frontend/src/components/manager/SummaryCards.jsx`

```jsx
const CARDS = [
  { label: 'Total Candidates', value: (s) => s?.total_candidates, color: 'text-blue-600'   },
  { label: 'Submitted',        value: (s) => s?.submitted,        color: 'text-yellow-600' },
  { label: 'Confirmed',        value: (s) => s?.confirmed,        color: 'text-green-600'  },
  { label: 'Average Score',    value: (s) => s?.average_score,    color: 'text-purple-600' },
];

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

## B.3 สร้าง `frontend/src/components/manager/RankingTable.jsx`

```jsx
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
              <td className="py-3 px-4"><Badge status={r.total_score >= passThreshold ? 'pass' : 'fail'} /></td>
            </tr>
          ))}
          {ranking.length === 0 && (
            <tr><td colSpan={6} className="py-10 text-center text-gray-300">No confirmed results yet</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
```

## B.4 สร้าง `frontend/src/components/manager/ExportButtons.jsx`

```jsx
import api from '../../services/api';
import Button from '../common/Button';

export default function ExportButtons({ sessionId }) {
  async function download(format) {
    try {
      const params = sessionId ? `?format=${format}&session_id=${sessionId}` : `?format=${format}`;
      const res = await api.get(`/report${params}`, { responseType: format === 'json' ? 'json' : 'blob' });

      let blob;
      if (format === 'json') blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      else                   blob = res.data;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-session${sessionId ?? ''}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { alert('Export failed'); }
  }

  return (
    <div className="flex gap-2 flex-wrap">
      <Button variant="ghost" onClick={() => download('json')}>Export JSON</Button>
      <Button variant="ghost" onClick={() => download('csv')}>Export CSV</Button>
    </div>
  );
}
```

## B.5 สร้าง `frontend/src/pages/manager/Dashboard.jsx`

```jsx
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import SummaryCards from '../../components/manager/SummaryCards';
import RankingTable from '../../components/manager/RankingTable';
import ExportButtons from '../../components/manager/ExportButtons';
import SessionSelector from '../../components/manager/SessionSelector';

export default function ManagerDashboard() {
  const { user, logout } = useAuth();
  const [sessions,   setSessions]   = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [summary,    setSummary]    = useState(null);
  const [ranking,    setRanking]    = useState([]);
  const [status,     setStatus]     = useState(null);

  useEffect(() => {
    async function fetchSessions() {
      try {
        const res  = await api.get('/sessions');
        const list = res.data.data;
        setSessions(list);
        setSelectedId((prev) => (prev === null && list.length > 0 ? list[0].id : prev));
      } catch (err) { console.error('Failed to load sessions:', err); }
    }
    fetchSessions();
    const id = setInterval(fetchSessions, 5_000);
    return () => clearInterval(id);
  }, []);

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
      } catch (err) { console.error('Failed to fetch stats:', err); }
    }
    fetchStats();
    const id = setInterval(fetchStats, 5_000);
    return () => clearInterval(id);
  }, [selectedId]);

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
          <SessionSelector sessions={sessions} selectedId={selectedId} onChange={setSelectedId} />
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
            <ExportButtons sessionId={selectedId} />
          </div>
          <RankingTable ranking={ranking} passThreshold={status?.pass_threshold} />
        </Card>
      </main>
    </div>
  );
}
```

## B.6 แก้ `frontend/src/App.jsx` — ใส่ ManagerDashboard จริง

```jsx
import JudgeDashboard from './pages/judge/Dashboard';
import ManagerDashboard from './pages/manager/Dashboard';   // [!code ++]
// ...
<Route path="/manager" element={
  <ProtectedRoute role="manager"><ManagerDashboard /></ProtectedRoute>   // [!code ++]
} />
```

## ✅ ทดสอบ Frontend (browser)

1. login `manager01` / `manager123` → เห็น SummaryCards + pass/fail + Ranking
2. เปลี่ยน session ใน selector → ตัวเลขโหลดใหม่
3. กด **Export CSV** / **Export JSON** → ไฟล์ดาวน์โหลด
4. ranking ขึ้นเฉพาะคนที่ judge confirm แล้ว

---

## ☑️ Checkpoint ปิด Phase 6

- [ ] Postman: stats 3 ตัว + report (json/csv) ด้วย token manager · role อื่น 403
- [ ] browser: summary/pass-fail/ranking ขึ้น · เปลี่ยน session โหลดใหม่ · export ได้ 2 format

➡️ [Phase 7: Polish + Deploy](/integration/09-phase7-polish-deploy) — เก็บงานให้รันบน LAN
