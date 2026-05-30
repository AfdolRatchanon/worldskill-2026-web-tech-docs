# บทที่ 8 — AuthContext

> **บทนี้เตรียมอะไร:** สร้าง `AuthContext.jsx` ที่เก็บ `user` และ `token` ไว้กลาง ทุก component เข้าถึงได้ผ่าน `useAuth()` — login state คงอยู่หลัง refresh หน้า

## ปัญหา — ข้อมูล user อยู่ที่ไหน?

หลัง login สำเร็จ ได้ token กลับมา — แต่ถ้าเก็บไว้แค่ใน state ของ component เดียว:
- component อื่นไม่รู้ว่า login อยู่ไหม
- Refresh หน้า → state หาย → กลับไป login ใหม่

## ทำไมถึงใช้ Context API ไม่ใช่ตัวอื่น

| ตัวเลือก | เหตุผลที่ไม่ใช้ |
|---------|-------------|
| Prop drilling | ต้องส่ง `user`/`token` ทุกชั้น — App → Layout → Header → UserMenu → ทุก component |
| Global variable (`window.user`) | ไม่ trigger re-render เมื่อ login/logout |
| Redux / Zustand | ติดตั้งเพิ่ม, boilerplate เยอะ, เกินจำเป็นสำหรับโปรเจ็คนี้ |
| **Context API** ✅ | built-in React, trigger re-render, ทุก component เข้าถึงผ่าน `useAuth()` |

## React Context คืออะไร

Context คือช่องทาง **ส่งข้อมูลจาก parent ไปหา child ลึกๆ** โดยไม่ต้องส่ง props ทีละชั้น

```
AuthProvider (เก็บ user, token)
    ├── Header (useAuth → ดู user?.full_name)
    ├── CandidateDashboard (useAuth → ดู user?.role)
    └── ProtectedRoute (useAuth → ดู token)
```

## ชิ้นงาน — สร้าง AuthContext.jsx

```
src/
├── App.jsx
└── contexts/
    └── AuthContext.jsx   ← สร้างในบทนี้
```

สร้างโฟลเดอร์ `src/contexts/` แล้วสร้างไฟล์ `src/contexts/AuthContext.jsx`:

```jsx
// contexts/AuthContext.jsx — บทที่ 8
import { createContext, useContext, useState } from 'react';
import api from '../services/api';                           // สำหรับเรียก POST /logout

const AuthContext = createContext(null);

function parseToken(token) {                     // แปลง JWT เป็น object
  try {
    return JSON.parse(atob(token.split('.')[1])); // decode payload ส่วนกลาง
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(             // synchronous init — อ่าน localStorage ทันที
    () => localStorage.getItem('token')           // ป้องกัน race condition ตอน reload
  );
  const [user,  setUser]  = useState(() => parseToken(localStorage.getItem('token')));

  function login(newToken) {                      // รับ token string ไม่ใช่ username/password
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(parseToken(newToken));               // ใช้ parseToken เดิม ไม่ต้อง decode เอง
  }

  function logout() {
    api.post('/logout').catch(() => {}); // แจ้ง backend — non-blocking ไม่รอผล
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

:::warning login() รับ token ไม่ใช่ username/password
```jsx
// ✅ ถูก — เรียกหลัง API login สำเร็จ
login(data.data.token);

// ❌ ผิด
login(username, password);
```
:::

## JWT Payload คืออะไร

Token ที่ backend ส่งมาเป็น JWT รูปแบบ: `header.payload.signature`

`parseToken` decode ส่วน `payload` ออกมาเป็น object:

```json
{
  "id": 1,
  "username": "judge01",
  "role": "judge",
  "full_name": "Judge User",
  "iat": 1710000000,
  "exp": 1710604800
}
```

ข้อมูลนี้คือ `user` ที่ทุก component ใช้งาน

## อัปเดต App.jsx — เพิ่ม AuthProvider

```jsx
// App.jsx — บทที่ 8 เพิ่ม AuthProvider
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';           // [!code ++]

export default function App() {
  return (
    <AuthProvider> {/* [!code ++] */}
      <BrowserRouter>
        <Routes>
          <Route path="/login"     element={<div>Login Page — Coming Soon</div>} />
          <Route path="/candidate" element={<div>Candidate Dashboard — Coming Soon</div>} />
          <Route path="/judge"     element={<div>Judge Dashboard — Coming Soon</div>} />
          <Route path="/manager"   element={<div>Manager Dashboard — Coming Soon</div>} />
          <Route path="*"          element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider> {/* [!code ++] */}
  );
}
```

:::warning ลำดับสำคัญ
`AuthProvider` ต้องอยู่**นอก** `BrowserRouter` เพราะ `ProtectedRoute` (ที่จะสร้างในบทที่ 10) ต้องเข้าถึงทั้ง auth และ router พร้อมกัน
:::

## สิ่งที่ทุก component เข้าถึงได้ผ่าน useAuth()

```jsx
const { user, token, login, logout } = useAuth();

user.id         // เช่น 1
user.username   // เช่น "judge01"
user.role       // เช่น "judge"
user.full_name  // เช่น "Judge User"
token           // JWT string (ใช้ตรวจสอบว่า login อยู่ไหม)
login(token)    // เรียกหลัง POST /login สำเร็จ
logout()        // POST /api/logout → ลบ token → component re-render
```

## ทดสอบ

```bash
npm run dev
```

**URL:** `http://localhost:3000`

**ทดสอบ login state คงอยู่หลัง refresh:**
1. เปิด DevTools → Application → Local Storage
2. เพิ่ม key: `token` value: ใส่ JWT จริงจาก backend (POST /api/login ผ่าน Postman แล้วคัดลอก token)
3. Refresh หน้า → ต้องไม่กลับไป login (AuthProvider อ่าน localStorage ทันทีตอน init)

**DevTools → Console:** ต้องไม่มี error ใดๆ

> `logout()` เรียก `POST /api/logout` ก่อน clear token — ทดสอบได้ในบทที่ 12, 14, 15 เมื่อมีปุ่ม Logout จริง โดย DevTools → Network → ต้องเห็น `POST /api/logout` เมื่อกด Logout

:::tip ทดสอบง่ายๆ ว่า user ถูกอ่านหรือเปล่า
เพิ่ม `console.log` ชั่วคราวใน component ใดๆ:
```jsx
const { user } = useAuth();
console.log('user:', user);
```
:::

## Common Errors

| Error | สาเหตุ | วิธีแก้ |
|-------|--------|---------|
| `useAuth must be used within AuthProvider` | เรียก `useAuth` นอก `<AuthProvider>` | ย้าย `<AuthProvider>` ให้ห่อ component นั้น |
| `user` เป็น null แม้ localStorage มี token | `parseToken` fail เพราะ token ผิด format | ตรวจ token ใน localStorage ว่าเป็น JWT จริง |
| Refresh แล้วกลับ login | `useState` ไม่ได้ใช้ lazy initializer | ใส่ `() =>` หน้า `localStorage.getItem` |
