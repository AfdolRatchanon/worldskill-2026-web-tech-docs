# บทที่ 7 — หน้า Candidate

> **บทนี้เตรียมอะไร:** เขียน `src/pages/CandidatePage.jsx` — หน้าแรกที่ใช้ **Pattern 5 ส่วน** เต็มรูปแบบ (useEffect + polling + ส่งฟอร์ม) จุดต่างจากเวอร์ชันเดิม: **ไม่มีนับถอยหลัง** และผลคะแนนเป็น **score ตัวเดียว**

## `src/pages/CandidatePage.jsx`

```jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import api from '../api';
import { getUser, removeToken } from '../auth';

export default function CandidatePage() {
  const user = getUser();
  const navigate = useNavigate();

  // ----- 1. state -----
  const [session, setSession] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [submission, setSubmission] = useState(null);
  const [result, setResult] = useState(null);
  const [frontendUrl, setFrontendUrl] = useState('');
  const [backendUrl, setBackendUrl] = useState('');

  // ----- 2. โหลดข้อมูล -----
  async function loadData() {
    const sessionRes = await api.get('/config');
    setSession(sessionRes.data.data);
    const taskRes = await api.get('/tasks');
    setTasks(taskRes.data.data);
    const subRes = await api.get('/my-submission');
    setSubmission(subRes.data.data);
    const resultRes = await api.get('/my-result');
    setResult(resultRes.data.data);
  }

  // ----- 3. useEffect: โหลด + polling ทุก 5 วิ -----
  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 5000);
    return () => clearInterval(timer);
  }, []);

  // เติมฟอร์มด้วย URL เดิม (เฉพาะตอนเจอ submission ครั้งแรก)
  useEffect(() => {
    if (submission) {
      setFrontendUrl(submission.frontend_url);
      setBackendUrl(submission.backend_url);
    }
  }, [submission?.id]);

  // ----- 4. action -----
  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const body = { frontend_url: frontendUrl, backend_url: backendUrl };
      if (submission) {
        await api.put('/my-submission', body);   // เคยส่งแล้ว → แก้
      } else {
        await api.post('/my-submission', body);  // ครั้งแรก → ส่งใหม่
      }
      alert('Submitted!');
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Submit failed');
    }
  }

  async function handleLogout() {
    await api.post('/logout');   // ① บอก backend ก่อน (ยังมี token)
    removeToken();               // ② แล้วค่อยลบ token
    navigate('/login');
  }

  // schema official ไม่มีเวลาเปิด/ระยะเวลา → บอกแค่สถานะ (ไม่มีนับถอยหลัง)
  function sessionText() {
    if (!session || session.status === 'initialized') return 'Session has not started yet';
    if (session.status === 'closed') return 'Session closed';
    return 'Session is active';
  }

  const sessionOpen = session?.status === 'active';

  // ----- 5. หน้าจอ -----
  return (
    <div>
      <h1>Candidate — WorldSkill 2026</h1>
      <p>Welcome, {user.full_name}
        {user.candidate_code ? ' (' + user.candidate_code + ')' : ''}{' '}
        <button onClick={handleLogout}>Logout</button>
      </p>
      <p>Session status: <b>{session ? session.status : '...'}</b> — {sessionText()}</p>
      <hr />

      <h2>Tasks</h2>
      {tasks.map((task) => (
        <div key={task.id}>
          <h3>{task.title}</h3>
          <p>{task.description}</p>
        </div>
      ))}
      <hr />

      <h2>My Submission</h2>
      <form onSubmit={handleSubmit}>
        <p>Frontend URL:{' '}
          <input size="40" placeholder="http://192.168.x.x:3000"
            value={frontendUrl} onChange={(e) => setFrontendUrl(e.target.value)}
            disabled={!sessionOpen} required />
        </p>
        <p>Backend URL:{' '}
          <input size="40" placeholder="http://192.168.x.x:8080"
            value={backendUrl} onChange={(e) => setBackendUrl(e.target.value)}
            disabled={!sessionOpen} required />
        </p>
        <button type="submit" disabled={!sessionOpen}>
          {submission ? 'Update Submission' : 'Submit'}
        </button>
        {!sessionOpen && <p>Submission is allowed only while session is active</p>}
      </form>
      <hr />

      <h2>My Result</h2>
      {result ? (
        <p>
          Score: <b>{result.score}</b> / 100 <br />
          {result.status === 'confirmed' ? '✓ Confirmed by judge' : 'Pending confirmation'}
        </p>
      ) : (
        <p>No result yet</p>
      )}
    </div>
  );
}
```

## จุดต่างจากเวอร์ชันเดิม

| เดิม | Real DB |
|------|---------|
| `session.status === 'waiting'` + นับเวลาจาก `opened_at`/`duration_minutes` | `sessionText()` บอกแค่สถานะ (ไม่มี timer) |
| `sessionOpen = status === 'open'` | `status === 'active'` |
| `frontend_score`/`backend_score`/`total_score` + `is_confirmed` | `result.score` /100 + `result.status === 'confirmed'` |

## จุดที่ต้องเข้าใจ

::: tip useEffect ตัวที่สอง ผูกกับ `submission?.id`
polling ได้ submission object ก้อนใหม่ทุก 5 วิ — ถ้าผูก effect กับทั้งก้อนจะเขียนทับสิ่งที่ผู้ใช้กำลังพิมพ์ ผูกกับ `id` (ไม่เปลี่ยน) → effect รันแค่ตอน submission โผล่ครั้งแรก
:::

::: danger handleLogout — ลำดับสำคัญ
ต้อง `await api.post('/logout')` ก่อน แล้วค่อย `removeToken()` — ถ้าลบ token ก่อน request logout จะไม่มี token แนบไป (ได้ 401)
:::

## ทดสอบ

1. login `candidate1`/`123456` → เห็นสถานะ session, โจทย์, ฟอร์ม, คะแนน
2. ถ้า session ยัง `initialized` ฟอร์มกดไม่ได้ (ปุ่มเทา) — ถูกแล้ว รอ judge เปิด
3. เปิด DevTools → Network เห็น `/config`, `/tasks`, ... ยิงซ้ำทุก 5 วิ = polling ทำงาน
