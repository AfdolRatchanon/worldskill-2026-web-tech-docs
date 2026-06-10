# บทที่ 8 — หน้า Judge

> **บทนี้เตรียมอะไร:** เขียน `src/pages/JudgePage.jsx` — ใช้ Pattern 5 ส่วนเดิมจากบทที่แล้ว เพิ่มของใหม่ 2 อย่าง: **ปุ่ม action ที่เปลี่ยนสถานะระบบ** (เปิด/ปิด session, re-check, confirm) และ**การวาดตารางจาก array ด้วย `.map()`**

## หน้านี้ทำอะไรบ้าง

| ส่วน | API | เงื่อนไข |
|------|-----|---------|
| เปิด session | `PUT /session/start` | กดได้เมื่อ session ไม่ได้เปิดอยู่ |
| ปิด session | `PUT /session/close` | กดได้เมื่อ session เปิดอยู่ + มีกล่องยืนยัน |
| ตาราง candidates ทั้ง 5 คน | `GET /candidates` | |
| สั่งตรวจซ้ำ (re-check) | `POST /submissions/:id/recheck` | มีงานส่งมา และยังไม่ confirm |
| ยืนยันคะแนน (confirm) | `PUT /results/:id/confirm` | ตรวจเสร็จ (`checked`) และยังไม่ confirm |
| ตารางงานที่ส่งทั้งหมด | `GET /submissions` | |

## เขียน `src/pages/JudgePage.jsx`

(แทนที่ตัวชั่วคราวทั้งหมด)

```jsx
// หน้าของกรรมการ — เปิด/ปิด session, สั่งตรวจซ้ำ (re-check), ยืนยันคะแนน (confirm)
// เทียบกับตัวเต็ม: pages/judge/Dashboard.jsx + SessionControl + CandidateTable + SubmissionsTable
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

  // ----- 2. ฟังก์ชันโหลดข้อมูลจาก backend -----
  async function loadData() {
    const sessionRes = await api.get('/config');
    setSession(sessionRes.data.data);

    const candRes = await api.get('/candidates');
    setCandidates(candRes.data.data);

    const subRes = await api.get('/submissions');
    setSubmissions(subRes.data.data);
  }

  // ----- 3. useEffect: โหลดข้อมูลตอนเปิดหน้า + ดึงซ้ำทุก 5 วินาที (polling) -----
  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 5000);
    return () => clearInterval(timer);
  }, []);

  // ----- 4. ฟังก์ชัน action -----
  async function openSession() {
    try {
      await api.put('/session/start');
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to open session');
    }
  }

  async function closeSession() {
    // confirm = กล่องถามยืนยันของ browser — กด Cancel จะได้ false แล้วจบฟังก์ชันเลย
    if (!confirm('Close the session? Candidates will no longer be able to submit.')) return;
    try {
      await api.put('/session/close');
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to close session');
    }
  }

  async function recheck(submissionId) {
    try {
      await api.post('/submissions/' + submissionId + '/recheck');
      loadData(); // สถานะจะเป็น checking ก่อน แล้ว polling จะอัปเดตผลให้เอง
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to recheck');
    }
  }

  async function confirmScore(candidateId) {
    try {
      await api.put('/results/' + candidateId + '/confirm');
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to confirm');
    }
  }

  async function handleLogout() {
    // ต้องรอ backend ตอบก่อน แล้วค่อยลบ token — ถ้าลบก่อน request จะไม่มี token แนบไป
    await api.post('/logout');
    removeToken();
    navigate('/login');
  }

  // ----- 5. หน้าจอ -----
  return (
    <div>
      <h1>Judge Dashboard — WorldSkill 2026</h1>
      <p>
        {user.full_name} <button onClick={handleLogout}>Logout</button>
      </p>
      <hr />

      <h2>Session Control</h2>
      <p>
        Status: <b>{session ? session.status : '...'}</b>
      </p>
      <button onClick={openSession} disabled={session?.status === 'open'}>
        Open Session
      </button>{' '}
      <button onClick={closeSession} disabled={session?.status !== 'open'}>
        Close Session
      </button>
      <hr />

      <h2>Candidates ({candidates.length})</h2>
      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>Candidate</th>
            <th>Status</th>
            <th>Score</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((c) => (
            <tr key={c.id}>
              <td>
                {c.full_name} ({c.username})
              </td>
              <td>{c.submission_id ? c.submission_status : 'No submission'}</td>
              <td>{c.total_score != null ? c.total_score : '—'}</td>
              <td>
                {/* ปุ่ม Re-check: มีงานส่งมาแล้ว และยังไม่ confirm */}
                {c.submission_id && !c.is_confirmed && (
                  <button
                    onClick={() => recheck(c.submission_id)}
                    disabled={c.submission_status === 'checking'}
                  >
                    {c.submission_status === 'checking' ? 'Checking...' : 'Re-check'}
                  </button>
                )}{' '}
                {/* ปุ่ม Confirm: ตรวจเสร็จแล้ว (checked) และยังไม่ confirm */}
                {c.submission_status === 'checked' && !c.is_confirmed && (
                  <button onClick={() => confirmScore(c.id)}>Confirm</button>
                )}
                {c.is_confirmed ? '✓ Confirmed' : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <hr />

      <h2>Submissions ({submissions.length})</h2>
      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>Candidate</th>
            <th>Frontend URL</th>
            <th>Backend URL</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((s) => (
            <tr key={s.id}>
              <td>
                {s.full_name} ({s.username})
              </td>
              <td>
                <a href={s.frontend_url} target="_blank" rel="noreferrer">
                  {s.frontend_url}
                </a>
              </td>
              <td>
                <a href={s.backend_url} target="_blank" rel="noreferrer">
                  {s.backend_url}
                </a>
              </td>
              <td>{s.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## จุดที่ต้องเข้าใจให้ชัด

### วาดตารางจาก array — `.map()` + `key`

```jsx
{candidates.map((c) => (
  <tr key={c.id}>...</tr>
))}
```

`.map()` แปลง array ข้อมูล → array ของ `<tr>` — React วาดให้ทีละแถว ส่วน `key={c.id}` คือป้ายชื่อประจำแถว ให้ React รู้ว่าแถวไหนคือแถวไหนเวลาข้อมูลเปลี่ยน (ถ้าไม่ใส่จะมี warning ใน console)

### ปุ่มในตาราง — ทำไมต้องห่อด้วย arrow function

```jsx
<button onClick={() => recheck(c.submission_id)}>
```

ถ้าเขียน `onClick={recheck(c.submission_id)}` (ไม่มี arrow) ฟังก์ชันจะ**ถูกเรียกทันทีตอนวาดหน้า** ไม่ใช่ตอนกดปุ่ม — ต้องห่อด้วย `() =>` เพื่อบอกว่า "ค่อยเรียกตอนคลิกนะ"

### เงื่อนไขการแสดงปุ่ม — ตรงกับ business rules ของ backend

| สถานะ candidate | ปุ่มที่เห็น |
|----------------|------------|
| ยังไม่ส่งงาน | — (No submission) |
| ส่งแล้ว (`pending`) | Re-check |
| กำลังตรวจ (`checking`) | Re-check (กดไม่ได้ — Checking...) |
| ตรวจเสร็จ (`checked`) | Re-check + **Confirm** |
| confirm แล้ว | ✓ Confirmed (ไม่มีปุ่ม — แก้อะไรไม่ได้แล้ว) |

ฝั่ง frontend ซ่อนปุ่มเป็นแค่ "ความสุภาพ" — กฎจริงบังคับที่ backend (เช่น re-check งานที่ confirm แล้ว → 403) เราแค่ทำ UI ให้สอดคล้อง

### Re-check ทำงานร่วมกับ polling อย่างไร

```
กด Re-check → POST .../recheck → backend ตั้งสถานะ checking
                                   (แล้วจำลองการตรวจ ~2 วินาที)
loadData() ครั้งถัดไป (ภายใน 5 วิ) → เห็นสถานะ checked + คะแนนใหม่
```

ไม่ต้องเขียนโค้ดรอผลเอง — polling ที่มีอยู่แล้วจัดการให้

## ทดสอบ

1. login เป็น `judge01` / `judge123`
2. กด **Open Session** → สถานะเปลี่ยนเป็น `open`
3. เปิด browser อีกหน้าต่าง (โหมดไม่ระบุตัวตน) login เป็น `candidate01` → ส่ง URL ผลงาน
4. กลับมาหน้า judge — **ภายใน 5 วินาที**ตารางจะแสดงงานที่เพิ่งส่ง (polling!)
5. กด **Re-check** → เห็น Checking... → รอสักครู่ → สถานะเป็น `checked` พร้อมคะแนน
6. กด **Confirm** → ขึ้น ✓ Confirmed → กลับไปดูหน้า candidate จะเห็นคะแนน confirmed แล้วเช่นกัน
