# บทที่ 6 — หน้า Login

> **บทนี้เตรียมอะไร:** สร้าง `src/pages/Login.jsx` — หน้าแรกของระบบ ได้เรียน 3 concept สำคัญที่จะใช้ทุกหน้า: **useState**, **controlled input** และ **conditional rendering** — จบบทนี้จะ login เข้าระบบได้จริง

## ปัญหา — รับค่าจากผู้ใช้ยังไง?

หน้า login ต้องทำ 4 อย่าง:

1. มีช่องกรอก username / password ที่ React **รู้ค่าตลอดเวลา**
2. กดปุ่มแล้วส่งค่าไปถาม backend
3. ถ้าถูก → เก็บ token แล้วพาไปหน้าตาม role
4. ถ้าผิด → โชว์ข้อความ error

## เขียน `src/pages/Login.jsx`

สร้างโฟลเดอร์ `src/pages/` ก่อน แล้วสร้างไฟล์:

```jsx
// หน้า login — เทียบกับตัวเต็ม: pages/Login.jsx (ตัด component Input/Button ใช้ HTML ตรงๆ)
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { saveToken } from '../auth';

export default function Login() {
  // state = ข้อมูลที่เปลี่ยนแล้วหน้าจอต้องวาดใหม่
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault(); // กันไม่ให้ browser refresh หน้าตอนกด submit
    try {
      const res = await api.post('/login', { username, password });
      saveToken(res.data.data.token);
      // role เป็น candidate / judge / manager ซึ่งตรงกับชื่อ route ใน App.jsx พอดี
      navigate('/' + res.data.data.role);
    } catch (err) {
      // ?. = ถ้าไม่มีค่าให้ข้ามไปเลย ไม่ error — กันกรณี backend ไม่ตอบกลับมา
      setError(err.response?.data?.message || 'Login failed');
    }
  }

  return (
    <div>
      <h1>WorldSkill 2026 — Test Submission</h1>
      <h2>Sign In</h2>

      <form onSubmit={handleSubmit}>
        <p>
          Username:{' '}
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </p>
        <p>
          Password:{' '}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </p>
        <button type="submit">Sign In</button>
      </form>

      {/* แสดงข้อความ error เฉพาะตอนที่มี error เท่านั้น (conditional rendering) */}
      {error && <p><b>{error}</b></p>}
    </div>
  );
}
```

## Concept ที่ 1 — useState

```jsx
const [username, setUsername] = useState('');
//      ↑ ค่าปัจจุบัน  ↑ ฟังก์ชันเปลี่ยนค่า    ↑ ค่าเริ่มต้น
```

กฎเหล็กของ React: **เปลี่ยน state ผ่านฟังก์ชัน set เท่านั้น** — เพราะการเรียก `setUsername(...)` คือสัญญาณบอก React ว่า "ข้อมูลเปลี่ยนแล้ว วาดหน้าจอใหม่ด้วย" ถ้าแก้ตัวแปรตรงๆ React จะไม่รู้ หน้าจอจะไม่อัปเดต

## Concept ที่ 2 — Controlled Input

```jsx
<input
  value={username}                              // ① ค่าในช่อง = state เสมอ
  onChange={(e) => setUsername(e.target.value)} // ② พิมพ์ปุ๊บ → อัปเดต state ปั๊บ
/>
```

ข้อมูลวิ่งเป็นวงกลม: **state → หน้าจอ → ผู้ใช้พิมพ์ → setState → state → หน้าจอ** — ทำให้ตอน submit เราหยิบค่าจาก state ได้เลย ไม่ต้องไปงมหาใน DOM

## Concept ที่ 3 — Conditional Rendering

```jsx
{error && <p><b>{error}</b></p>}
```

อ่านว่า: "ถ้า `error` มีค่า → แสดง `<p>`, ถ้าว่าง → ไม่แสดงอะไรเลย" — เป็นท่ามาตรฐานของ React ที่จะเจอทุกหน้าหลังจากนี้

## เส้นทางของข้อมูลตอนกด Sign In

```
ผู้ใช้กดปุ่ม
  → handleSubmit ทำงาน
  → POST /api/login { username, password }     (api.js แนบอะไรไม่ได้เพราะยังไม่มี token — ไม่เป็นไร /login ไม่ต้องใช้)
  → backend ตอบ { data: { token, role } }
  → saveToken(token)                            (เก็บลง localStorage — บทที่ 3)
  → navigate('/' + role)                        (เช่น role=judge → ไป /judge)
  → ProtectedRoute เช็คผ่าน → เข้า dashboard
```

## สร้างหน้า Dashboard ชั่วคราว เพื่อทดสอบ login

อีก 3 หน้ายังไม่ได้สร้าง — ใส่โครงเปล่าไว้ก่อนให้ระบบรันได้ สร้าง 3 ไฟล์นี้ใน `src/pages/`:

```jsx
// src/pages/CandidatePage.jsx (ชั่วคราว — บทที่ 7 จะเขียนของจริง)
export default function CandidatePage() {
  return <h1>Candidate Page</h1>;
}
```

```jsx
// src/pages/JudgePage.jsx (ชั่วคราว)
export default function JudgePage() {
  return <h1>Judge Page</h1>;
}
```

```jsx
// src/pages/ManagerPage.jsx (ชั่วคราว)
export default function ManagerPage() {
  return <h1>Manager Page</h1>;
}
```

## ทดสอบ

เปิด backend ไว้ (port 8080) แล้วรัน `npm run dev` เปิด http://localhost:3000

| ทดสอบ | คาดหวัง |
|-------|---------|
| เปิด `/` หรือ URL มั่วๆ | เด้งไป `/login` |
| login `candidate01` / รหัสผิด | เห็นข้อความ error จาก backend |
| login `candidate01` / `cand123` | ไปหน้า `/candidate` เห็น "Candidate Page" |
| พิมพ์ URL `/judge` ทั้งที่เป็น candidate | เด้งกลับ `/login` (ProtectedRoute ทำงาน!) |
| login `judge01` / `judge123` | ไปหน้า `/judge` |

::: tip ลองเปิด DevTools ดู token จริง
กด F12 → แท็บ Application → Local Storage → http://localhost:3000 จะเห็น key `token` — ลองคัดลอกส่วนกลาง (ระหว่างจุดสองตัว) ไปวางใน console: `JSON.parse(atob("...ส่วนกลาง..."))` จะเห็นข้อมูล user ตัวเอง
:::
