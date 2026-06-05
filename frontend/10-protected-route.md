# บทที่ 13 — ProtectedRoute

> **บทนี้เตรียมอะไร:** สร้าง `ProtectedRoute.jsx` ที่ตรวจสอบ token และ role ก่อนให้เข้าหน้า dashboard — ถ้าไม่ได้ login → redirect `/login`, ถ้า role ผิด → redirect หน้าตัวเอง

## ปัญหา — ใครก็เข้า /candidate ได้

ตอนนี้ใครพิมพ์ `/candidate` ใน URL ก็เข้าได้เลย ไม่ว่าจะ login อยู่ไหม หรือจะเป็น role อะไร

## ชิ้นงาน — สร้าง ProtectedRoute.jsx

```
src/
├── App.jsx
├── router/
│   └── ProtectedRoute.jsx   ← สร้างในบทนี้
└── pages/
    └── Login.jsx
```

สร้างโฟลเดอร์ `src/router/` แล้วสร้างไฟล์ `src/router/ProtectedRoute.jsx`:

```jsx
// router/ProtectedRoute.jsx — บทที่ 10
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const HOME = { candidate: '/candidate', judge: '/judge', manager: '/manager' };
// export เพื่อให้ Login.jsx import ใช้ได้ — HOME อยู่ที่นี่ที่เดียว

export default function ProtectedRoute({ children, role }) {
  const { user, token } = useAuth();

  if (!token) return <Navigate to="/login" replace />;    // ไม่ได้ login

  if (role && user?.role !== role) {
    return <Navigate to={HOME[user?.role] || '/login'} replace />;  // role ผิด → หน้าตัวเอง
  }

  return children;
}
```

:::warning prop ชื่อ `role` ไม่ใช่ `allowedRoles`
```jsx
// ✅ ถูก
<ProtectedRoute role="candidate"><Dashboard /></ProtectedRoute>

// ❌ ผิด
<ProtectedRoute allowedRoles={['candidate']}><Dashboard /></ProtectedRoute>
```
:::

## Logic การตัดสินใจ

```
เข้า URL /candidate
    ↓
ตรวจ token ใน AuthContext
    ├── ไม่มี token → redirect /login
    └── มี token
            ↓
        ตรวจ role
            ├── role ตรงกับ "candidate" → แสดง children ✅
            └── role ไม่ตรง → redirect HOME ของ role ตัวเอง
                    judge → /judge
                    manager → /manager
```

## อัปเดต App.jsx — ห่อทุก Route ด้วย ProtectedRoute

```jsx
// App.jsx — บทที่ 10 เพิ่ม ProtectedRoute
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './router/ProtectedRoute';            // [!code ++]
import Login from './pages/Login';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/candidate" element={
            <ProtectedRoute role="candidate"> {/* [!code ++] */}
              <div>Candidate Dashboard — Coming Soon</div>
            </ProtectedRoute> {/* [!code ++] */}
          } />
          <Route path="/judge" element={
            <ProtectedRoute role="judge"> {/* [!code ++] */}
              <div>Judge Dashboard — Coming Soon</div>
            </ProtectedRoute> {/* [!code ++] */}
          } />
          <Route path="/manager" element={
            <ProtectedRoute role="manager"> {/* [!code ++] */}
              <div>Manager Dashboard — Coming Soon</div>
            </ProtectedRoute> {/* [!code ++] */}
          } />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

## ทดสอบ

```bash
npm run dev
```

**ทดสอบ 1 — ไม่ได้ login:**
1. ลบ token ออกจาก localStorage (DevTools → Application → Local Storage)
2. ไปที่ `/candidate` → ต้อง redirect `/login` ทันที

**ทดสอบ 2 — login เป็น candidate แล้วไป /judge:**
1. Login เป็น `candidate01` / `cand123`
2. พิมพ์ URL ไปที่ `/judge` → ต้อง redirect กลับ `/candidate`

**ทดสอบ 3 — login ปกติ:**
1. Login เป็น `judge01` / `judge123`
2. ต้อง navigate ไป `/judge` → เห็น "Judge Dashboard — Coming Soon"

## Common Errors

| Error | สาเหตุ | วิธีแก้ |
|-------|--------|---------|
| Redirect loop | `token` มีค่าแต่ `user` เป็น null | ตรวจ `parseToken` ใน AuthContext ว่า parse ได้ |
| ยังเข้าได้แม้ไม่ login | ลืมห่อ `<ProtectedRoute>` | ตรวจ App.jsx ว่าทุก Route มี ProtectedRoute |
| role ผิด แต่ไม่ redirect | `HOME` map ไม่มี role นั้น | ตรวจ role ที่ backend ส่งมาใน token payload |
| Login redirect ผิดหน้า | Login.jsx นิยาม `HOME` เองแยกจาก ProtectedRoute | ให้ `import { HOME } from '../router/ProtectedRoute'` ใน Login.jsx |
