# บทที่ 5 — App.jsx เส้นทาง + ยามเฝ้าประตู

> **บทนี้เตรียมอะไร:** เขียน `src/App.jsx` ของจริง (แทนตัวชั่วคราวจากบทที่ 2) — กำหนดว่า URL ไหนแสดงหน้าอะไร และสร้าง `ProtectedRoute` กันคนที่ยังไม่ login หรือ role ไม่ตรงเข้าหน้าที่ไม่ใช่ของตัวเอง

## ปัญหา — เว็บเดียวแต่มี 4 หน้า

ระบบเรามี 4 หน้า: Login, Candidate, Judge, Manager — ต้องการให้:

| URL | แสดงหน้า | ใครเข้าได้ |
|-----|---------|-----------|
| `/login` | Login | ทุกคน |
| `/candidate` | CandidatePage | เฉพาะ role `candidate` |
| `/judge` | JudgePage | เฉพาะ role `judge` |
| `/manager` | ManagerPage | เฉพาะ role `manager` |
| อื่นๆ | เด้งไป `/login` | — |

`react-router-dom` คือ library ที่ทำเรื่องนี้ให้

## เขียน `src/App.jsx`

(แทนที่ตัวชั่วคราวจากบทที่ 2 ทั้งหมด)

```jsx
// กำหนดเส้นทาง (routing) ของทั้งแอป — URL ไหนแสดงหน้าอะไร
// เทียบกับตัวเต็ม: App.jsx + router/ProtectedRoute.jsx (รวมไว้ไฟล์เดียว)
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getUser } from './auth';
import Login from './pages/Login';
import CandidatePage from './pages/CandidatePage';
import JudgePage from './pages/JudgePage';
import ManagerPage from './pages/ManagerPage';

// ยามเฝ้าประตู: ถ้ายังไม่ login หรือ role ไม่ตรงกับหน้านี้ → ส่งกลับไปหน้า login
function ProtectedRoute({ role, children }) {
  const user = getUser();
  if (!user || user.role !== role) return <Navigate to="/login" />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/candidate" element={
          <ProtectedRoute role="candidate"><CandidatePage /></ProtectedRoute>
        } />
        <Route path="/judge" element={
          <ProtectedRoute role="judge"><JudgePage /></ProtectedRoute>
        } />
        <Route path="/manager" element={
          <ProtectedRoute role="manager"><ManagerPage /></ProtectedRoute>
        } />
        {/* URL อื่นๆ ที่ไม่รู้จัก → เด้งไปหน้า login */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}
```

## ส่วนประกอบจาก react-router-dom

| ตัว | หน้าที่ |
|-----|--------|
| `<BrowserRouter>` | เปิดระบบ routing — ต้องห่อทุกอย่างไว้ชั้นนอกสุด |
| `<Routes>` | กล่องรวมเส้นทางทั้งหมด — เลือกแสดงอันที่ตรงกับ URL ปัจจุบัน |
| `<Route path element>` | 1 เส้นทาง: URL นี้ → แสดง component นี้ |
| `<Navigate to>` | component ที่พอถูกวาดปุ๊บ จะพาผู้ใช้ไป URL อื่นทันที |
| `path="*"` | ดักทุก URL ที่ไม่ตรงกับอันบนๆ (เช่นพิมพ์ URL มั่ว) |

## ผ่า ProtectedRoute — ยามเฝ้าประตู 5 บรรทัด

```jsx
function ProtectedRoute({ role, children }) {
  const user = getUser();                                    // ① ใครยืนอยู่หน้าประตู?
  if (!user || user.role !== role) return <Navigate to="/login" />;  // ② ไม่มีบัตร/บัตรผิดประเภท → เชิญออก
  return children;                                           // ③ ผ่าน → เข้าได้
}
```

- **`role`** (props) = ประตูนี้รับเฉพาะ role อะไร
- **`children`** (props พิเศษ) = สิ่งที่ถูกห่ออยู่ข้างใน tag — ในที่นี้คือหน้า dashboard นั่นเอง

```jsx
<ProtectedRoute role="candidate">
  <CandidatePage />     {/* ← อันนี้แหละคือ children */}
</ProtectedRoute>
```

ลองนึกภาพ: candidate พิมพ์ URL `/judge` ตรงๆ → `ProtectedRoute role="judge"` เช็คแล้ว role เป็น `candidate` ไม่ตรง → เจอ `<Navigate to="/login" />` เด้งออกทันที

::: tip เคล็ดลับที่ใช้ในบทถัดไป
ชื่อ route (`/candidate`, `/judge`, `/manager`) ตั้งให้**ตรงกับชื่อ role เป๊ะ** — เพราะฉะนั้นหลัง login สำเร็จ แค่เขียน `navigate('/' + role)` ก็พาไปหน้าที่ถูกต้องได้เลย ไม่ต้องเขียน if-else แยกตาม role
:::

::: warning ตอนนี้รันไม่ขึ้น — ปกติ!
`App.jsx` import 4 หน้าที่ยังไม่ได้สร้าง (`pages/Login.jsx` ฯลฯ) — รัน `npm run dev` ตอนนี้จะ error ให้ทำบทที่ 6 ต่อทันที พอสร้างครบแล้วถึงจะรันได้
:::
