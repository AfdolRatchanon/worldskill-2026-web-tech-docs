# บทที่ 9 — หน้า Manager

> **บทนี้เตรียมอะไร:** เขียน `src/pages/ManagerPage.jsx` — หน้าอ่านอย่างเดียว: การ์ดสรุป, ranking, export report จุดต่าง: เป็น **single-session** (ไม่มี dropdown เลือก session แล้ว), ranking เหลือคอลัมน์ `score` + `Code`, เกณฑ์ผ่าน ≥ 50

## `src/pages/ManagerPage.jsx`

```jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import api from '../api';
import { getUser, removeToken } from '../auth';

export default function ManagerPage() {
  const user = getUser();
  const navigate = useNavigate();

  // ----- 1. state ----- (ไม่มี sessionId แล้ว — สถิติเป็นภาพรวมทั้งงาน)
  const [summary, setSummary] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [status, setStatus] = useState(null);

  // ----- 2. โหลดข้อมูล (global ไม่ส่ง session_id) -----
  async function loadData() {
    const summaryRes = await api.get('/statistics/summary');
    setSummary(summaryRes.data.data);
    const rankingRes = await api.get('/statistics/ranking');
    setRanking(rankingRes.data.data);
    const statusRes = await api.get('/statistics/status');
    setStatus(statusRes.data.data);
  }

  // ----- 3. useEffect: โหลด + polling ทุก 5 วิ -----
  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 5000);
    return () => clearInterval(timer);
  }, []);

  // ----- 4. action -----
  async function exportReport(format) {
    try {
      const res = await api.get('/report?format=' + format, { responseType: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(res.data);
      link.download = 'report.' + format;
      link.click();
    } catch {
      alert('Export failed');
    }
  }

  async function handleLogout() {
    await api.post('/logout');
    removeToken();
    navigate('/login');
  }

  // ----- 5. หน้าจอ -----
  return (
    <div>
      <h1>Manager Dashboard — WorldSkill 2026</h1>
      <p>{user.full_name} <button onClick={handleLogout}>Logout</button></p>
      <hr />

      <h2>Summary</h2>
      <p>Current session: <b>{summary?.session?.status ?? '—'}</b></p>
      <p>
        Total Candidates: <b>{summary?.total_candidates ?? '—'}</b> <br />
        Submitted: <b>{summary?.submitted ?? '—'}</b> <br />
        Confirmed: <b>{summary?.confirmed ?? '—'}</b> <br />
        Average Score: <b>{summary?.average_score ?? '—'}</b>
      </p>
      {status && (
        <p>Pass (≥ {status.pass_threshold} pts): <b>{status.pass_count}</b> | Fail: <b>{status.fail_count}</b></p>
      )}
      <hr />

      <h2>Ranking</h2>
      <p>
        <button onClick={() => exportReport('json')}>Export JSON</button>{' '}
        <button onClick={() => exportReport('csv')}>Export CSV</button>
      </p>
      <table border="1" cellPadding="6">
        <thead>
          <tr><th>Rank</th><th>Code</th><th>Candidate</th><th>Score</th><th>Result</th></tr>
        </thead>
        <tbody>
          {ranking.map((r) => (
            <tr key={r.id}>
              <td>#{r.rank}</td>
              <td>{r.candidate_code || '—'}</td>
              <td>{r.full_name} ({r.username})</td>
              <td><b>{r.score}</b></td>
              <td>{r.score >= (status?.pass_threshold ?? 50) ? 'Pass' : 'Fail'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {ranking.length === 0 && <p>No confirmed results yet</p>}
    </div>
  );
}
```

## จุดต่างจากเวอร์ชันเดิม

| เดิม | Simple Real DB |
|------|---------|
| มี dropdown "Select Session" + ส่ง `?session_id=` | **ตัดทิ้ง** — single-session, ยิงสถิติแบบ global |
| ranking 3 คอลัมน์ (Frontend/Backend/Total) | คอลัมน์ `score` เดียว + เพิ่ม `Code` |
| ผ่าน/ไม่ผ่านเทียบ `total_score` | เทียบ `r.score >= pass_threshold` (default 50) |
| filename `report-session{id}.csv` | `report.csv` |

::: tip ทำไมตัด Select Session
schema ทางการ `results`/`submissions` ไม่มี `session_id` และระบบเป็น **session เดียวทั้งงาน** → สถิติเป็นภาพรวมเสมอ ไม่มีอะไรให้เลือกย้อนหลัง · แสดง "Current session" จาก `summary.session.status` แทน
:::

## ทดสอบ

login `manager`/`password`:
1. การ์ด Summary แสดง Current session + จำนวน candidate/submitted/confirmed/average
2. ตาราง Ranking โชว์คนที่ confirm แล้ว (มีคอลัมน์ Code) เรียงคะแนน + Pass/Fail
3. กด **Export CSV** → ดาวน์โหลดไฟล์ `report.csv`
