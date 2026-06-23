# บทที่ 8 — หน้า Judge

> **บทนี้เตรียมอะไร:** เขียน `src/pages/JudgePage.jsx` — โครง Pattern 5 ส่วนเดิม + ปุ่ม action เยอะขึ้น (เปิด/ปิด session, recheck, confirm) จุดต่าง: สถานะ `active`, ตารางใช้ `score` + `result_status`

## `src/pages/JudgePage.jsx`

```jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { getUser, removeToken } from '../auth';

export default function JudgePage() {
  const user = getUser();
  const navigate = useNavigate();

  // ----- 1. state -----
  const [session, setSession] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  // ----- 2. โหลดข้อมูล -----
  async function loadData() {
    const sessionRes = await api.get('/config');
    setSession(sessionRes.data.data);
    const candRes = await api.get('/candidates');
    setCandidates(candRes.data.data);
    const subRes = await api.get('/submissions');
    setSubmissions(subRes.data.data);
  }

  // ----- 3. useEffect: โหลด + polling -----
  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 5000);
    return () => clearInterval(timer);
  }, []);

  // ----- 4. action -----
  async function openSession() {
    try { await api.put('/session/start'); loadData(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to open session'); }
  }

  async function closeSession() {
    if (!confirm('Close the session? Candidates will no longer be able to submit.')) return;
    try { await api.put('/session/close'); loadData(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to close session'); }
  }

  async function recheck(submissionId) {
    try { await api.post('/submissions/' + submissionId + '/recheck'); loadData(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to recheck'); }
  }

  async function confirmScore(candidateId) {
    try { await api.put('/results/' + candidateId + '/confirm'); loadData(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to confirm'); }
  }

  async function handleLogout() {
    await api.post('/logout');
    removeToken();
    navigate('/login');
  }

  // ----- 5. หน้าจอ -----
  return (
    <div>
      <h1>Judge Dashboard — WorldSkill 2026</h1>
      <p>{user.full_name} <button onClick={handleLogout}>Logout</button></p>
      <hr />

      <h2>Session Control</h2>
      <p>Status: <b>{session ? session.status : '...'}</b></p>
      <button onClick={openSession} disabled={session?.status === 'active'}>Open Session</button>{' '}
      <button onClick={closeSession} disabled={session?.status !== 'active'}>Close Session</button>
      <hr />

      <h2>Candidates ({candidates.length})</h2>
      <table border="1" cellPadding="6">
        <thead>
          <tr><th>Code</th><th>Candidate</th><th>Status</th><th>Score</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {candidates.map((c) => (
            <tr key={c.id}>
              <td>{c.candidate_code || '—'}</td>
              <td>{c.full_name} ({c.username})</td>
              <td>{c.submission_id ? c.submission_status : 'No submission'}</td>
              <td>{c.score != null ? c.score : '—'}</td>
              <td>
                {/* Re-check: มีงานส่งแล้ว และยังไม่ confirm */}
                {c.submission_id && c.result_status !== 'confirmed' && (
                  <button onClick={() => recheck(c.submission_id)} disabled={c.submission_status === 'recheck'}>
                    {c.submission_status === 'recheck' ? 'Checking...' : 'Re-check'}
                  </button>
                )}{' '}
                {/* Confirm: มีคะแนนแล้ว (pending) */}
                {c.result_status === 'pending' && (
                  <button onClick={() => confirmScore(c.id)}>Confirm</button>
                )}
                {c.result_status === 'confirmed' ? '✓ Confirmed' : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <hr />

      <h2>Submissions ({submissions.length})</h2>
      <table border="1" cellPadding="6">
        <thead>
          <tr><th>Code</th><th>Candidate</th><th>Frontend URL</th><th>Backend URL</th><th>Status</th></tr>
        </thead>
        <tbody>
          {submissions.map((s) => (
            <tr key={s.id}>
              <td>{s.candidate_code || '—'}</td>
              <td>{s.full_name} ({s.username})</td>
              <td><a href={s.frontend_url} target="_blank" rel="noreferrer">{s.frontend_url}</a></td>
              <td><a href={s.backend_url} target="_blank" rel="noreferrer">{s.backend_url}</a></td>
              <td>{s.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## จุดต่างจากเวอร์ชันเดิม

| เดิม | Real DB |
|------|---------|
| ปุ่ม disabled เช็ก `status === 'open'` | `status === 'active'` |
| คะแนน `c.total_score` | `c.score` |
| เงื่อนไขปุ่มใช้ `c.is_confirmed`, สถานะ `checking`/`checked` | `c.result_status` (`pending`/`confirmed`), สถานะ recheck คือ `recheck` |
| ไม่มีคอลัมน์รหัส | เพิ่มคอลัมน์ **Code** (`candidate_code`) ทั้ง 2 ตาราง |

## ตรรกะปุ่ม Action

| ปุ่ม | แสดงเมื่อ |
|------|----------|
| Re-check | มี submission และ `result_status !== 'confirmed'` (disabled ระหว่าง `recheck`) |
| Confirm | `result_status === 'pending'` (มีคะแนนแล้ว ยังไม่ยืนยัน) |
| ✓ Confirmed | `result_status === 'confirmed'` |

::: tip recheck แล้วคะแนนมาเลย
backend คำนวณ recheck แบบ synchronous → กดปุ่ม Re-check แล้ว `score` โผล่ในตารางทันทีรอบ polling ถัดไป
:::

## ทดสอบ

1. login `admin`/`password` → กด **Open Session** → status เป็น `active`
2. ให้ candidate ส่งงาน (อีกแท็บ) แล้วดูตาราง Candidates อัปเดต
3. กด **Re-check** → เห็น score · กด **Confirm** → ขึ้น ✓ Confirmed
4. กด **Close Session**
