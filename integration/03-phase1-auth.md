# บทที่ 3 — Phase 1: Auth (Login + Route Guard)

> 🎯 **ทำตามทีละขั้น** — login ได้ → ได้ token → เด้งเข้าหน้าตาม role และกันเข้าหน้าที่ไม่ใช่ของ role ตัวเอง
>
> ⏱️ ~0:45 · 🏆 Auth & Authorization **10** + Login/Route Guard **3.5**

---

# ส่วน A — Backend

## A.1 สร้าง `backend/src/middlewares/auth.js`

```js
const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

module.exports = authenticate;
```

## A.2 สร้าง `backend/src/middlewares/role.js`

```js
function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    next();
  };
}

module.exports = authorize;
```

## A.3 สร้าง `backend/src/controllers/authController.js`

```js
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const pool   = require('../config/db');

async function login(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, full_name: user.full_name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ success: true, data: { token, role: user.role, full_name: user.full_name }, meta: {} });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function logout(req, res) {
  res.json({ success: true, data: null, meta: {} });
}

module.exports = { login, logout };
```

## A.4 สร้าง `backend/src/routes/auth.js`

```js
const router       = require('express').Router();
const authenticate = require('../middlewares/auth');
const { login, logout } = require('../controllers/authController');

router.post('/login',  login);
router.post('/logout', authenticate, logout);

module.exports = router;
```

## A.5 แก้ `backend/src/app.js` — mount route auth

```js
app.use(express.json());

app.use('/api', require('./routes/auth'));   // [!code ++]

const PORT = process.env.PORT || 8080;
```

## ✅ ทดสอบ Backend (Postman)

```
POST http://localhost:8080/api/login
Body (JSON): { "username": "candidate01", "password": "cand123" }
```

- ต้องได้ `success: true` + `data.token` (สตริงยาว 3 ท่อนคั่นจุด)
- ลองรหัสผิด → `401 Invalid credentials`
- **คัดลอก token ไว้** ใช้ทดสอบ phase ถัดไป

---

# ส่วน B — Frontend

## B.1 สร้าง `frontend/src/components/common/Button.jsx`

```jsx
const styles = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
  danger:  'bg-red-600  hover:bg-red-700  text-white focus:ring-red-500',
  success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
  ghost:   'bg-gray-100 hover:bg-gray-200 text-gray-700 focus:ring-gray-400',
};

export default function Button({ children, variant = 'primary', className = '', ...props }) {
  return (
    <button
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
```

## B.2 สร้าง `frontend/src/components/common/Input.jsx`

```jsx
export default function Input({ label, error, id, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">{label}</label>
      )}
      <input
        id={id}
        className={`px-3 py-2 border rounded-lg text-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500
          disabled:bg-gray-50 disabled:text-gray-400
          ${error ? 'border-red-400' : 'border-gray-300'}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
```

## B.3 สร้าง `frontend/src/contexts/AuthContext.jsx`

```jsx
import { createContext, useContext, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

function parseToken(token) {
  try { return JSON.parse(atob(token.split('.')[1])); }
  catch { return null; }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user,  setUser]  = useState(() => parseToken(localStorage.getItem('token')));

  function login(newToken) {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(parseToken(newToken));
  }

  function logout() {
    api.post('/logout').catch(() => {});
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

## B.4 สร้าง `frontend/src/router/ProtectedRoute.jsx`

```jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const HOME = { candidate: '/candidate', judge: '/judge', manager: '/manager' };

export default function ProtectedRoute({ children, role }) {
  const { user, token } = useAuth();

  if (!token) return <Navigate to="/login" replace />;
  if (role && user?.role !== role) {
    return <Navigate to={HOME[user?.role] || '/login'} replace />;
  }
  return children;
}
```

## B.5 สร้าง `frontend/src/pages/Login.jsx`

```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { HOME } from '../router/ProtectedRoute';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const { login }  = useAuth();
  const navigate   = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/login', { username, password });
      login(data.data.token);
      navigate(HOME[data.data.role] || '/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">WorldSkill 2026</h1>
          <p className="text-gray-400 text-sm mt-1">Test Submission Management System</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Sign In</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input id="username" label="Username" type="text" placeholder="Enter username"
              value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
            <Input id="password" label="Password" type="password" placeholder="Enter password"
              value={password} onChange={(e) => setPassword(e.target.value)} required />
            {error && (
              <div role="alert" className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>
            )}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
```

## B.6 แทนที่ `frontend/src/App.jsx` — Router + Auth ครบ

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './router/ProtectedRoute';
import Login from './pages/Login';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/candidate" element={
            <ProtectedRoute role="candidate"><div className="p-6">Candidate — Coming Soon</div></ProtectedRoute>
          } />
          <Route path="/judge" element={
            <ProtectedRoute role="judge"><div className="p-6">Judge — Coming Soon</div></ProtectedRoute>
          } />
          <Route path="/manager" element={
            <ProtectedRoute role="manager"><div className="p-6">Manager — Coming Soon</div></ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

## ✅ ทดสอบ Frontend (browser)

1. เปิด `http://localhost:3000` → เด้งไป `/login`
2. login `candidate01` / `cand123` → เด้งไป `/candidate` เห็น "Candidate — Coming Soon"
3. พิมพ์ URL `/judge` ตรง ๆ → เด้งกลับ `/candidate` (role ไม่ตรง)
4. รหัสผิด → เห็น error สีแดง ไม่เด้ง
5. DevTools → Network: request หลัง login มี header `Authorization: Bearer ...`
6. Refresh หน้า → ยัง login อยู่ (ไม่เด้งกลับ login)

---

## ☑️ Checkpoint ปิด Phase 1

- [ ] Postman login ได้ token ครบ 3 role · รหัสผิด 401
- [ ] browser: login เด้งถูกหน้า · เข้าหน้าผิด role ไม่ได้ · refresh แล้วยังอยู่
- [ ] ทุก request หลัง login แนบ token อัตโนมัติ

➡️ [Phase 2: Config + Tasks](/integration/04-phase2-config-tasks) — ให้ candidate เห็นโจทย์ + นาฬิกา
