# บทที่ 8 — React Router

> **บทนี้เตรียมอะไร:** ทำให้ React **รู้จัก URL** — เปลี่ยนหน้าโดยไม่ reload เรียนแบบโดด ๆ บนเดโมจิ๋วก่อน (`<Link>` → `useNavigate` → `<Navigate>`) แล้วค่อยเอาไปวาง routing จริงใน `App.jsx`

React Router เป็น **library** (เหมือน Tailwind, Axios ที่มีบทของตัวเอง) — ไม่ใช่ของที่ติดมากับ React จึงต้องเรียนเป็นพื้นฐานแยกหนึ่งบท

## ปัญหา — ทุก URL แสดงหน้าเดิม

ถ้าไม่มี router ไม่ว่าจะเปิด `/login`, `/candidate`, หรือ `/judge` → React render `App.jsx` เดิมทุกครั้ง ไม่รู้ว่า URL เปลี่ยน

## ทำไมถึงใช้ React Router ไม่ใช่ตัวอื่น

| ตัวเลือก | เหตุผลที่ไม่ใช้ |
|---------|-------------|
| `<a href="/login">` | reload ทั้งหน้าทุกครั้ง — state และ context หาย |
| `window.location.href` | reload ทั้งหน้า — ไม่ใช่ SPA |
| `history.pushState()` | ต้องเขียน routing logic เองทั้งหมด |
| **React Router DOM** ✅ | navigate โดยไม่ reload, component-based routes, มี `useNavigate` ในตัว |

## 5 ตัวที่ต้องรู้จัก

| ตัว | หน้าที่ |
|-----|---------|
| `BrowserRouter` | ห่อ app ทั้งหมด — เปิดใช้ routing |
| `Routes` / `Route` | จับคู่ `path` กับ `element` |
| `<Link>` / `<NavLink>` | คลิกเปลี่ยนหน้า (ไม่ reload) |
| `useNavigate` | เปลี่ยนหน้าด้วยโค้ด (เช่น หลัง submit สำเร็จ) |
| `<Navigate>` | redirect แบบประกาศใน JSX (เช่น หน้า 404, กันสิทธิ์) |

---

## 🧪 Part 1 — เรียนบนเดโมจิ๋วก่อน (โดด ๆ)

ก่อนแตะ TSMS ลองทำเว็บ 2 หน้าเล็ก ๆ ให้เข้าใจ routing ล้วน ๆ — แก้ `src/App.jsx` ชั่วคราว (เดี๋ยวลบใน Part 4):

```jsx
// App.jsx — เดโมเรียน routing (ชั่วคราว)
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

function Home()  { return <h1 className="text-2xl">🏠 Home</h1>; }
function About() { return <h1 className="text-2xl">ℹ️ About</h1>; }

export default function App() {
  return (
    <BrowserRouter>
      {/* แถบเมนู — คลิกเปลี่ยนหน้าโดยไม่ reload */}
      <nav className="flex gap-4 p-4">
        <Link to="/">Home</Link>          {/* [!code highlight] */}
        <Link to="/about">About</Link>    {/* [!code highlight] */}
      </nav>

      <Routes>
        <Route path="/"      element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  );
}
```

**ทดสอบ:** กด Home/About → เนื้อหาเปลี่ยน, **URL เปลี่ยน, หน้าไม่กระพริบ (ไม่ reload)** — ลองกดปุ่ม Back ของ browser ก็ย้อนหน้าได้

:::tip `<Link to="...">` แทน `<a href="...">`
`<a>` reload ทั้งหน้า ทำให้ state หาย — `<Link>` เปลี่ยนเฉพาะส่วนที่ต่าง นี่คือหัวใจของ Single Page Application (SPA)
:::

### `<NavLink>` — Link ที่รู้ว่า "หน้าไหน active"

เหมือน `<Link>` แต่ใส่สไตล์ให้เมนูของหน้าปัจจุบันอัตโนมัติ:

```jsx
import { NavLink } from 'react-router-dom';

<NavLink
  to="/about"
  className={({ isActive }) => isActive ? 'font-bold text-blue-600' : 'text-gray-600'}
>
  About
</NavLink>
```

---

## 🧭 Part 2 — `useNavigate` (เปลี่ยนหน้าด้วยโค้ด)

บางครั้งต้องเปลี่ยนหน้า **หลังเกิด event** ไม่ใช่จากการคลิกลิงก์ — เช่น หลัง login สำเร็จ:

```jsx
import { useNavigate } from 'react-router-dom';

function LoginDemo() {
  const navigate = useNavigate();   // [!code highlight]

  function handleLogin() {
    // ...ยิง API login...
    navigate('/about');             // [!code highlight] เปลี่ยนหน้าด้วยโค้ด
  }

  return <button onClick={handleLogin}>Login แล้วไป About</button>;
}
```

> **`<Link>` vs `useNavigate`:** คลิกลิงก์เอง → `<Link>` · เปลี่ยนหน้าหลังโค้ดทำงานเสร็จ (submit, login) → `useNavigate`

---

## 🚧 Part 3 — `<Navigate>` (redirect + หน้า 404)

`<Navigate>` redirect ทันทีเมื่อถูก render — ใช้ทำ fallback สำหรับ path ที่ไม่มี:

```jsx
import { Navigate } from 'react-router-dom';

<Routes>
  <Route path="/"      element={<Home />} />
  <Route path="/about" element={<About />} />
  <Route path="*"      element={<Navigate to="/" replace />} />  {/* [!code highlight] ทุก path ที่ไม่ตรง → กลับ Home */}
</Routes>
```

:::tip `replace` คืออะไร
`replace` แทนที่ประวัติหน้าปัจจุบัน แทนที่จะเพิ่มเข้าไป — กด Back แล้วจะไม่ย้อนกลับมาหน้า 404 ที่ไม่มีอยู่จริง
:::

### `useParams` — อ่านค่าจาก URL (รู้ไว้)

ถ้า route เป็นแบบ `path="/user/:id"` อ่านค่า `id` ด้วย `useParams()`:

```jsx
import { useParams } from 'react-router-dom';
function User() {
  const { id } = useParams();   // /user/7 → id = "7"
  return <p>User #{id}</p>;
}
```

:::info TSMS ไม่ใช้ `<Link>`/`<NavLink>`/`useParams`
โปรเจ็คนี้เปลี่ยนหน้าแบบ **auto-redirect ตาม role** (ใช้ `useNavigate` + `<Navigate>`) และทุก route เป็น path คงที่ ไม่มี `:id` — แต่ 3 ตัวข้างบนคือ routing พื้นฐานที่ต้องรู้ เผื่อโจทย์อื่นและเพื่อเข้าใจภาพรวม (เหมือนที่บท 5 สอน `useCallback` ที่โปรเจ็คไม่ใช้)
:::

---

## 🔧 Part 4 — เอา routing ไปใช้กับ TSMS จริง

เข้าใจ routing แล้ว — ลบเดโม Part 1 ออก แล้วเขียน route จริงของระบบใน `App.jsx`:

```jsx
// App.jsx — บทที่ 8 routing จริงของ TSMS
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"     element={<div>Login Page — Coming Soon</div>} />
        <Route path="/candidate" element={<div>Candidate Dashboard — Coming Soon</div>} />
        <Route path="/judge"     element={<div>Judge Dashboard — Coming Soon</div>} />
        <Route path="/manager"   element={<div>Manager Dashboard — Coming Soon</div>} />
        <Route path="*"          element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

> ตอนนี้ใช้ placeholder `Coming Soon` ไปก่อน — หน้าจริงจะมาแทนทีละบท (Login บท 12, Dashboard บท 15–18) ส่วน `<Navigate>` กันคนเข้า path มั่ว ๆ ให้เด้งกลับ `/login`

**ทดสอบ:**

1. `http://localhost:3000/login` → เห็น "Login Page — Coming Soon"
2. `/candidate`, `/judge`, `/manager` → เห็นข้อความตรงตาม role
3. `/อะไรก็ได้` → เด้งไป `/login` อัตโนมัติ (route `*`)

**DevTools → Console:** ต้องไม่มี error

---

## 🏋️ Workshop ย่อย — เว็บ 3 หน้า

**โจทย์:** ทำเว็บ 3 หน้า Home / Profile / Settings มีแถบเมนูคลิกเปลี่ยนหน้าได้, หน้า Settings มีปุ่ม "Save แล้วกลับ Home", และ path มั่ว ๆ ให้เด้งกลับ Home

**ต้องใช้:** `BrowserRouter`/`Routes`/`Route` · `<Link>` (หรือ `<NavLink>`) · `useNavigate` · `<Navigate>` route `*`

**เริ่มจากโครงนี้** (แก้ `src/App.jsx` ชั่วคราว):

```jsx
import { BrowserRouter, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';

function Home()     { return <h1>🏠 Home</h1>; }
function Profile()  { return <h1>👤 Profile</h1>; }
function Settings() {
  // TODO 3: useNavigate → ปุ่ม Save แล้ว navigate('/')
  return <h1>⚙️ Settings</h1>;
}

export default function App() {
  return (
    <BrowserRouter>
      <nav className="flex gap-4 p-4">
        {/* TODO 1: <Link> ไป /, /profile, /settings */}
      </nav>
      <Routes>
        {/* TODO 2: 3 Route + 1 route * เด้งกลับ Home */}
      </Routes>
    </BrowserRouter>
  );
}
```

**ผลลัพธ์ที่ต้องเห็น:**
- คลิกเมนู → เปลี่ยนหน้า, URL เปลี่ยน, **ไม่ reload**
- หน้า Settings กด Save → กลับมา Home
- พิมพ์ `/xyz` ที่ URL → เด้งกลับ Home

**ท้าทายเพิ่ม (ออปชัน):** เปลี่ยน `<Link>` เป็น `<NavLink>` ให้เมนูหน้าปัจจุบันเป็นตัวหนาสีน้ำเงิน

:::details เฉลย
```jsx
<nav className="flex gap-4 p-4">
  <Link to="/">Home</Link>
  <Link to="/profile">Profile</Link>
  <Link to="/settings">Settings</Link>
</nav>
<Routes>
  <Route path="/"         element={<Home />} />
  <Route path="/profile"  element={<Profile />} />
  <Route path="/settings" element={<Settings />} />
  <Route path="*"         element={<Navigate to="/" replace />} />
</Routes>

// ใน Settings
function Settings() {
  const navigate = useNavigate();
  return <button onClick={() => navigate('/')}>Save แล้วกลับ Home</button>;
}
```
:::

## Common Errors

| Error | สาเหตุ | วิธีแก้ |
|-------|--------|---------|
| `useNavigate()` / `<Link>` ไม่ทำงาน | เรียกนอก `<BrowserRouter>` | component ต้องอยู่ใน `<BrowserRouter>` |
| คลิก `<Link>` แล้วหน้า reload | เผลอใช้ `<a href>` แทน `<Link to>` | เปลี่ยนเป็น `<Link to="...">` |
| กด Back แล้วเด้งหน้า 404 ซ้ำ | `<Navigate>` ไม่มี `replace` | ใส่ `<Navigate to="/" replace />` |
| `react-router-dom` not found | ยังไม่ได้ install | `npm install react-router-dom` |
