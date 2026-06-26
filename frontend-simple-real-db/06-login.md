# บทที่ 6 — หน้า Login

> **บทนี้เตรียมอะไร:** เขียน `src/pages/Login.jsx` — ฟอร์มแรกสุด ง่ายสุด ได้ฝึก controlled input + การยิง `POST /login` + เก็บ token + เด้งไปหน้าตาม role

## `src/pages/Login.jsx`

```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router';
import api from '../api';
import { saveToken } from '../auth';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();   // กัน browser refresh หน้าตอน submit
    try {
      const res = await api.post('/login', { username, password });
      saveToken(res.data.data.token);
      navigate('/' + res.data.data.role);   // role = candidate/judge/manager → ตรงกับ route
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  }

  return (
    <div>
      <h1>WorldSkill 2026 — Test Submission</h1>
      <h2>Sign In</h2>
      <form onSubmit={handleSubmit}>
        <p>Username:{' '}
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </p>
        <p>Password:{' '}
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </p>
        <button type="submit">Sign In</button>
      </form>
      {error && <p><b>{error}</b></p>}
    </div>
  );
}
```

## จุดที่ต้องเข้าใจ

- **Controlled input**: `value={username}` + `onChange={...setUsername...}` → state เป็นแหล่งความจริงเดียวของช่องกรอก
- **`res.data.data.token`**: backend ตอบ `{ success, data: { token, role, full_name, candidate_code }, meta }` → token อยู่ที่ `data.data.token`
- **`navigate('/' + res.data.data.role)`**: role เป็น `candidate`/`judge`/`manager` ตรงกับ path ใน `App.jsx` พอดี

::: tip รหัส plain-text — login ได้เลย
backend-real-db เทียบรหัสตรงๆ ใช้บัญชีจาก `seed_data.sql` ได้ทันที เช่น `admin`/`password`, `candidate1`/`123456`
:::

## ทดสอบ

1. `npm run dev` → เปิด `http://localhost:3000` เด้งมา `/login`
2. login `admin`/`password` → เด้งไป `/judge`
3. login `candidate1`/`123456` → เด้งไป `/candidate`
4. ใส่รหัสผิด → เห็นข้อความ error (จาก backend `Invalid credentials`)

> หน้า /judge, /candidate ยังว่างอยู่ — สร้างในบทถัดไป
