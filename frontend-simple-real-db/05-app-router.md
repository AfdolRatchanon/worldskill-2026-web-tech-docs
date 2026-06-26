# บทที่ 5 — App.jsx เส้นทาง + ยามเฝ้าประตู

> **บทนี้เตรียมอะไร:** เขียน `src/App.jsx` กำหนดว่า URL ไหนแสดงหน้าอะไร + `ProtectedRoute` ที่กันคนไม่มีสิทธิ์ — โครงของทั้งแอปอยู่ไฟล์เดียวนี้

## `src/App.jsx`

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { getUser } from './auth';
import Login from './pages/Login';
import CandidatePage from './pages/CandidatePage';
import JudgePage from './pages/JudgePage';
import ManagerPage from './pages/ManagerPage';

// ยามเฝ้าประตู: ยังไม่ login หรือ role ไม่ตรง → เด้งไป /login
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
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}
```

## เข้าใจโค้ด

| ส่วน | ทำอะไร |
|------|--------|
| `BrowserRouter` | เปิดระบบ routing |
| `Routes` / `Route` | จับคู่ `path` กับ component |
| `ProtectedRoute` | เช็ก `getUser().role` ตรงกับ role ที่หน้าต้องการไหม |
| `<Navigate to="/login" />` | เด้งไป login (กรณีไม่มีสิทธิ์ หรือ path ไม่รู้จัก `*`) |

::: tip role ตรงกับชื่อ route พอดี
backend ส่ง `role` มาเป็น `candidate`/`judge`/`manager` ตรงกับ path `/candidate`, `/judge`, `/manager` — ตอน login เลย `navigate('/' + role)` ได้เลย (บทที่ 6)
:::

## ทดสอบ

ตอนนี้ยังไม่มีหน้า (Login/Candidate/...) → ถ้ารันจะ import error — ปกติ! สร้างหน้าทีละหน้าในบท 6–9 แล้วค่อยครบ

เริ่มจากหน้า Login บทถัดไป
