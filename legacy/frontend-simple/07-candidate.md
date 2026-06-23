# บทที่ 7 — หน้า Candidate

> **บทนี้เตรียมอะไร:** เขียน `src/pages/CandidatePage.jsx` ของจริง — หน้าแรกที่ใช้ **Pattern 5 ส่วน** เต็มรูปแบบ ได้เรียน useEffect, polling, การส่งฟอร์มไป backend และการจัดการ logout ที่ถูกต้อง — บทนี้สำคัญที่สุด เพราะอีก 2 หน้าที่เหลือใช้โครงเดียวกันหมด

## หน้านี้ทำอะไรบ้าง

| ส่วน | ข้อมูลจาก | หมายเหตุ |
|------|----------|----------|
| สถานะ session + เวลาที่เหลือ | `GET /config` | อัปเดตทุก 5 วินาที |
| โจทย์การแข่งขัน | `GET /tasks` | |
| ฟอร์มส่ง URL ผลงาน | `GET/POST/PUT /my-submission` | ส่งได้เฉพาะตอน session เปิด |
| คะแนนตัวเอง | `GET /my-result` | |

## Pattern 5 ส่วน — ดูโครงก่อนลงรายละเอียด

```jsx
export default function CandidatePage() {
  // ----- 1. state -----                 ข้อมูลที่หน้าจอต้องใช้
  // ----- 2. ฟังก์ชันโหลดข้อมูล -----        loadData() ยิง API → เก็บใส่ state
  // ----- 3. useEffect -----              เรียก loadData ตอนเปิดหน้า + ทุก 5 วินาที
  // ----- 4. ฟังก์ชัน action -----          กดปุ่มแล้วทำอะไร
  // ----- 5. return JSX -----             หน้าจอ
}
```

ทั้ง 3 dashboard เรียงแบบนี้เป๊ะ — จำอันเดียว อ่านได้ทุกหน้า

## เขียน `src/pages/CandidatePage.jsx`

(แทนที่ตัวชั่วคราวจากบทที่ 6 ทั้งหมด)

```jsx
// หน้าของผู้เข้าแข่งขัน — ดูโจทย์, ส่ง/แก้ URL ผลงาน, ดูคะแนนตัวเอง
// เทียบกับตัวเต็ม: pages/candidate/Dashboard.jsx + SubmissionForm + ResultCard + CountdownTimer
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

  // ----- 2. ฟังก์ชันโหลดข้อมูลจาก backend -----
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

  // ----- 3. useEffect: โหลดข้อมูลตอนเปิดหน้า + ดึงซ้ำทุก 5 วินาที (polling) -----
  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 5000);
    return () => clearInterval(timer); // ปิดหน้าเมื่อไหร่ ให้หยุดดึงข้อมูล
  }, []);

  // ถ้าเคยส่งงานไว้แล้ว → เอา URL เดิมมาใส่ในฟอร์มให้ (ทำงานเมื่อโหลดเจอ submission ครั้งแรก)
  useEffect(() => {
    if (submission) {
      setFrontendUrl(submission.frontend_url);
      setBackendUrl(submission.backend_url);
    }
  }, [submission?.id]);

  // ----- 4. ฟังก์ชัน action -----
  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const body = { frontend_url: frontendUrl, backend_url: backendUrl };
      if (submission) {
        await api.put('/my-submission', body); // เคยส่งแล้ว → แก้ไข
      } else {
        await api.post('/my-submission', body); // ยังไม่เคยส่ง → ส่งใหม่
      }
      alert('Submitted!');
      loadData();
    } catch (err) {
      // backend จะบอกเหตุผลมา เช่น session ยังไม่เปิด หรือ URL ผิดรูปแบบ
      alert(err.response?.data?.message || 'Submit failed');
    }
  }

  async function handleLogout() {
    // ต้องรอ backend ตอบก่อน แล้วค่อยลบ token — ถ้าลบก่อน request จะไม่มี token แนบไป
    await api.post('/logout');
    removeToken();
    navigate('/login');
  }

  // คำนวณเวลาที่เหลือจากเวลาเปิด session + ระยะเวลาสอบ (อัปเดตทุกครั้งที่ polling)
  function timeText() {
    if (!session || session.status === 'waiting') return 'Session has not started yet';
    if (session.status === 'closed') return 'Session closed';
    const endTime = new Date(session.opened_at).getTime() + session.duration_minutes * 60000;
    const minutesLeft = Math.max(0, Math.round((endTime - Date.now()) / 60000));
    return 'Time remaining: about ' + minutesLeft + ' minutes';
  }

  const sessionOpen = session?.status === 'open';

  // ----- 5. หน้าจอ -----
  return (
    <div>
      <h1>Candidate — WorldSkill 2026</h1>
      <p>
        Welcome, {user.full_name}{' '}
        <button onClick={handleLogout}>Logout</button>
      </p>
      <p>
        Session status: <b>{session ? session.status : '...'}</b> — {timeText()}
      </p>
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
        <p>
          Frontend URL:{' '}
          <input
            size="40"
            placeholder="http://192.168.x.x:3000"
            value={frontendUrl}
            onChange={(e) => setFrontendUrl(e.target.value)}
            disabled={!sessionOpen}
            required
          />
        </p>
        <p>
          Backend URL:{' '}
          <input
            size="40"
            placeholder="http://192.168.x.x:8080"
            value={backendUrl}
            onChange={(e) => setBackendUrl(e.target.value)}
            disabled={!sessionOpen}
            required
          />
        </p>
        <button type="submit" disabled={!sessionOpen}>
          {submission ? 'Update Submission' : 'Submit'}
        </button>
        {!sessionOpen && <p>Submission is allowed only while session is open</p>}
      </form>
      <hr />

      <h2>My Result</h2>
      {result ? (
        <p>
          Frontend: {result.frontend_score} / 25 <br />
          Backend: {result.backend_score} / 40 <br />
          Total: <b>{result.total_score}</b> / 65 <br />
          {result.is_confirmed ? '✓ Confirmed by judge' : 'Pending confirmation'}
        </p>
      ) : (
        <p>No result yet</p>
      )}
    </div>
  );
}
```

## จุดที่ต้องเข้าใจให้ชัด

### useEffect + Polling — หัวใจของระบบ realtime แบบง่าย

```jsx
useEffect(() => {
  loadData();                                  // ① โหลดทันทีตอนเปิดหน้า
  const timer = setInterval(loadData, 5000);   // ② แล้วโหลดซ้ำทุก 5 วินาที
  return () => clearInterval(timer);           // ③ ออกจากหน้า → หยุด
}, []);                                        // ④ [] = ทำแค่รอบเดียวตอนเปิดหน้า
```

- **ทำไมต้อง polling?** เพื่อให้ candidate เห็นทันทีเมื่อ judge เปิด session หรือคะแนนถูก confirm — โดยไม่ต้องกด refresh เอง
- **ทำไมต้อง `clearInterval`?** ถ้าไม่หยุด timer ตอนออกจากหน้า มันจะยิง API ต่อไปเรื่อยๆ ทั้งที่หน้านั้นไม่อยู่แล้ว (memory leak)

### POST หรือ PUT — ดูจากว่าเคยส่งหรือยัง

```jsx
if (submission) {
  await api.put('/my-submission', body);   // เคยส่งแล้ว → แก้ของเดิม
} else {
  await api.post('/my-submission', body);  // ครั้งแรก → สร้างใหม่
}
```

ตรงตาม business rule ของ backend: **1 คน = 1 submission ต่อ session** — ถ้า POST ซ้ำ backend จะตอบ 409 กลับมา

### useEffect ตัวที่สอง — เติมฟอร์มด้วยค่าเดิม

```jsx
useEffect(() => {
  if (submission) {
    setFrontendUrl(submission.frontend_url);
    setBackendUrl(submission.backend_url);
  }
}, [submission?.id]);   // ← สังเกต: ผูกกับ id ไม่ใช่ submission ทั้งก้อน
```

ทำไมผูกกับ `submission?.id`? เพราะ polling ได้ submission **ก้อนใหม่ทุก 5 วินาที** (ข้อมูลเดิมแต่เป็น object คนละตัว) — ถ้าผูกกับทั้งก้อน effect จะรันทุก 5 วินาทีแล้ว**เขียนทับสิ่งที่ผู้ใช้กำลังพิมพ์อยู่** ผูกกับ `id` (ซึ่งไม่เปลี่ยน) → effect รันแค่ตอน submission โผล่มาครั้งแรกเท่านั้น

### handleLogout — ลำดับสำคัญมาก

```jsx
async function handleLogout() {
  await api.post('/logout');  // ① บอก backend ก่อน (ตอนนี้ยังมี token แนบไป)
  removeToken();              // ② แล้วค่อยลบ token
  navigate('/login');         // ③ กลับหน้า login
}
```

::: danger บั๊กจริงที่เจอตอนพัฒนา
ถ้าสลับเป็น "ลบ token ก่อน แล้วค่อยยิง /logout" จะได้ **401** — เพราะ interceptor (บทที่ 4) ทำงานแบบ async มันจะมาอ่าน token **หลังจาก**ที่เราลบไปแล้ว ทำให้ request ออกไปโดยไม่มีบัตรผ่าน ต้อง `await` ให้ backend ตอบก่อนเสมอ แล้วค่อยลบ
:::

## ทดสอบ

1. login เป็น `candidate01` / `cand123` → เห็นหน้าเต็ม สถานะ session, โจทย์, ฟอร์ม, ผลคะแนน
2. ถ้า session ยังเป็น `waiting` ฟอร์มจะกดไม่ได้ (ปุ่มเทา) — ถูกต้องแล้ว! เดี๋ยวบทหน้าจะให้ judge เปิด session
3. เปิด DevTools แท็บ Network ทิ้งไว้ จะเห็น request `/config`, `/tasks`, … ยิงซ้ำทุก 5 วินาที — นั่นคือ polling ทำงานอยู่
