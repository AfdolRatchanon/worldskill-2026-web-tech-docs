# บทที่ 9 — หน้า Manager

> **บทนี้เตรียมอะไร:** เขียน `src/pages/ManagerPage.jsx` — หน้าสุดท้าย! ใช้ Pattern 5 ส่วนเดิม เพิ่มของใหม่ 2 อย่าง: **dependency array แบบมีค่า** (`[sessionId]`) สำหรับเลือกดู session ย้อนหลัง และ**การดาวน์โหลดไฟล์**จาก API

## หน้านี้ทำอะไรบ้าง

| ส่วน | API |
|------|-----|
| dropdown เลือก session | `GET /sessions` |
| สรุปตัวเลข (สมัคร/ส่ง/confirm/คะแนนเฉลี่ย) | `GET /statistics/summary?session_id=N` |
| จำนวนผ่าน/ตก | `GET /statistics/status?session_id=N` |
| ตารางอันดับคะแนน | `GET /statistics/ranking?session_id=N` |
| ดาวน์โหลดรายงาน JSON / CSV | `GET /report?format=…&session_id=N` |

Manager เป็น role **อ่านอย่างเดียว** — ไม่มีปุ่มที่เปลี่ยนแปลงข้อมูลเลย

## เขียน `src/pages/ManagerPage.jsx`

(แทนที่ตัวชั่วคราวทั้งหมด)

```jsx
// หน้าของผู้จัดการแข่งขัน — ดูสถิติ, อันดับคะแนน, export รายงาน (อ่านอย่างเดียว)
// เทียบกับตัวเต็ม: pages/manager/Dashboard.jsx + SummaryCards + RankingTable
//                  + ExportButtons + SessionSelector
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { getUser, removeToken } from '../auth';

export default function ManagerPage() {
  const user = getUser();
  const navigate = useNavigate();

  // ----- 1. state -----
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState(null); // session ที่เลือกดูอยู่
  const [summary, setSummary] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [status, setStatus] = useState(null);

  // ----- 2. ฟังก์ชันโหลดข้อมูลจาก backend -----
  async function loadData() {
    const sessionRes = await api.get('/sessions');
    const sessionList = sessionRes.data.data;
    setSessions(sessionList);

    // ครั้งแรกยังไม่ได้เลือก session → เลือกอันล่าสุดให้อัตโนมัติ
    // (พอ setSessionId แล้ว useEffect ข้างล่างจะรันใหม่ มาโหลดสถิติให้เอง)
    if (sessionId === null) {
      if (sessionList.length > 0) setSessionId(sessionList[0].id);
      return;
    }

    const summaryRes = await api.get('/statistics/summary?session_id=' + sessionId);
    setSummary(summaryRes.data.data);

    const rankingRes = await api.get('/statistics/ranking?session_id=' + sessionId);
    setRanking(rankingRes.data.data);

    const statusRes = await api.get('/statistics/status?session_id=' + sessionId);
    setStatus(statusRes.data.data);
  }

  // ----- 3. useEffect: โหลดตอนเปิดหน้า + ทุก 5 วินาที + ทุกครั้งที่เปลี่ยน session -----
  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 5000);
    return () => clearInterval(timer);
  }, [sessionId]); // [sessionId] = ถ้าค่านี้เปลี่ยน ให้รัน effect นี้ใหม่

  // ----- 4. ฟังก์ชัน action -----
  async function exportReport(format) {
    try {
      // responseType: 'blob' = ขอข้อมูลเป็นไฟล์ (ไม่ใช่ JSON ปกติ)
      const res = await api.get(
        '/report?format=' + format + '&session_id=' + sessionId,
        { responseType: 'blob' }
      );
      // สร้างลิงก์ชั่วคราวชี้ไปที่ไฟล์ แล้วสั่งคลิกเพื่อให้ browser ดาวน์โหลด
      const link = document.createElement('a');
      link.href = URL.createObjectURL(res.data);
      link.download = 'report-session' + sessionId + '.' + format;
      link.click();
    } catch {
      alert('Export failed');
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
      <h1>Manager Dashboard — WorldSkill 2026</h1>
      <p>
        {user.full_name} <button onClick={handleLogout}>Logout</button>
      </p>
      <hr />

      <h2>Select Session</h2>
      {/* dropdown เลือกดู session ย้อนหลัง — ค่าใน <select> เป็นข้อความเสมอ เลยต้องแปลงเป็นตัวเลข */}
      <select
        value={sessionId || ''}
        onChange={(e) => setSessionId(Number(e.target.value))}
      >
        {sessions.map((s) => (
          <option key={s.id} value={s.id}>
            Session #{s.id} ({s.status})
          </option>
        ))}
      </select>
      <hr />

      <h2>Summary</h2>
      <p>
        Total Candidates: <b>{summary?.total_candidates ?? '—'}</b> <br />
        Submitted: <b>{summary?.submitted ?? '—'}</b> <br />
        Confirmed: <b>{summary?.confirmed ?? '—'}</b> <br />
        Average Score: <b>{summary?.average_score ?? '—'}</b>
      </p>
      {status && (
        <p>
          Pass (≥ {status.pass_threshold} pts): <b>{status.pass_count}</b> |
          Fail: <b>{status.fail_count}</b>
        </p>
      )}
      <hr />

      <h2>Ranking</h2>
      <p>
        <button onClick={() => exportReport('json')}>Export JSON</button>{' '}
        <button onClick={() => exportReport('csv')}>Export CSV</button>
      </p>
      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Candidate</th>
            <th>Frontend</th>
            <th>Backend</th>
            <th>Total</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((r) => (
            <tr key={r.id}>
              <td>#{r.rank}</td>
              <td>
                {r.full_name} ({r.username})
              </td>
              <td>{r.frontend_score}</td>
              <td>{r.backend_score}</td>
              <td>
                <b>{r.total_score}</b>
              </td>
              <td>{r.total_score >= (status?.pass_threshold ?? 40) ? 'Pass' : 'Fail'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {ranking.length === 0 && <p>No confirmed results yet</p>}
    </div>
  );
}
```

## จุดที่ต้องเข้าใจให้ชัด

### Dependency array แบบมีค่า — `[sessionId]`

หน้าก่อนๆ ใช้ `useEffect(..., [])` = รันครั้งเดียวตอนเปิดหน้า — หน้านี้ต่างออกไป:

```jsx
useEffect(() => {
  loadData();
  const timer = setInterval(loadData, 5000);
  return () => clearInterval(timer);
}, [sessionId]);   // ← มีค่าข้างใน!
```

ความหมาย: "ถ้า `sessionId` เปลี่ยนเมื่อไหร่ ให้**หยุด timer เก่า** (cleanup) แล้ว**เริ่มรอบใหม่**" — ผู้ใช้เลือก session อื่นใน dropdown ปุ๊บ ข้อมูลสถิติของ session นั้นโหลดมาทันที ไม่ต้องรอ 5 วินาที

### ท่าเลือก session แรกอัตโนมัติ

```
เปิดหน้า → sessionId เป็น null
  → loadData รอบแรก: ได้รายชื่อ sessions → setSessionId(อันล่าสุด) → return
  → sessionId เปลี่ยน → useEffect รันใหม่
  → loadData รอบสอง: คราวนี้ sessionId มีค่าแล้ว → โหลดสถิติครบ
```

เป็นการทำงานร่วมกันระหว่าง state กับ dependency array — ไล่ตามลำดับนี้ให้เข้าใจ เพราะเป็นท่าที่เจอบ่อยในงานจริง

### `<select>` กับกับดักชนิดข้อมูล

```jsx
onChange={(e) => setSessionId(Number(e.target.value))}
```

ค่าที่ได้จาก HTML form เป็น**ข้อความเสมอ** — `e.target.value` ของ option ที่ value เป็น 3 คือ `"3"` (string) ไม่ใช่ `3` (number) ถ้าไม่แปลงด้วย `Number()` การเปรียบเทียบ `sessionId === s.id` จะพังแบบเงียบๆ

### ดาวน์โหลดไฟล์จาก API ที่ต้องใช้ token

จะใช้ `<a href="...">` ตรงๆ ไม่ได้ เพราะลิงก์ธรรมดา**ไม่ผ่าน interceptor** → ไม่มี token แนบไป → 401 ต้องใช้ท่านี้แทน:

```jsx
const res = await api.get('/report?...', { responseType: 'blob' });  // ① ยิงผ่าน api (มี token)
const link = document.createElement('a');                            // ② สร้างลิงก์ปลอมในหน่วยความจำ
link.href = URL.createObjectURL(res.data);                           // ③ ชี้ไปที่ไฟล์ที่เพิ่งโหลดมา
link.download = 'report.csv';                                        // ④ ตั้งชื่อไฟล์
link.click();                                                        // ⑤ จำลองการคลิก → browser ดาวน์โหลด
```

## ทดสอบ

1. login เป็น `manager01` / `manager123`
2. เห็น dropdown เลือก session, ตัวเลขสรุป, ตารางอันดับ (ต้องมีคะแนนที่ confirm แล้วจากบทที่ 8 ถึงจะเห็นอันดับ)
3. กด **Export CSV** → ได้ไฟล์ `report-session1.csv` ลองเปิดดู
4. ถ้ามีหลาย session (judge เคยปิดแล้วเปิดใหม่) → เลือก session เก่าใน dropdown → สถิติเปลี่ยนทันที
