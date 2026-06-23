# บทที่ 10 — Login (plain-text) + Middleware

> **บทนี้เตรียมอะไร:** สร้าง endpoint `POST /api/login` ที่เทียบรหัสผ่าน **แบบ plain-text** (ไม่มี bcrypt), `POST /api/logout`, และ middleware `authenticate` ที่ตรวจ token ให้ endpoint อื่นๆ — นี่คือจุดที่ schema ทางการต่างจากเวอร์ชันเดิมชัดที่สุด

## 1. `src/controllers/authController.js`

```js
const jwt  = require('jsonwebtoken');
const pool = require('../config/db');

async function login(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
    const user = rows[0];

    if (!user || user.password !== password) {     // ← เทียบ plain-text ตรงๆ
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, full_name: user.full_name, candidate_code: user.candidate_code },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ success: true, data: { token, role: user.role, full_name: user.full_name, candidate_code: user.candidate_code }, meta: {} });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function logout(req, res) {
  try {
    res.json({ success: true, data: null, meta: {} });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { login, logout };
```

::: danger จุดต่างจากเวอร์ชันเดิม — ไม่มี bcrypt
เวอร์ชันเดิมเก็บ `password_hash` แล้วเทียบด้วย `await bcrypt.compare(password, user.password_hash)`
แต่ schema ทางการเก็บรหัส **plain-text** ในคอลัมน์ `password` → เทียบด้วย `user.password !== password` ตรงๆ
ไม่ต้อง `require('bcryptjs')` และไม่ต้องติดตั้งเลย
:::

ทำไม logout ไม่ต้องทำอะไรกับ token? เพราะ JWT เป็น stateless — server ไม่ได้เก็บ token ไว้ การ logout จริงคือ "ฝั่ง frontend ลบ token ทิ้ง" (บทที่ 3 ฝั่ง frontend) endpoint นี้แค่ตอบ 200 ให้ฝั่ง client เรียกได้สวยงาม

## 2. `src/middlewares/auth.js`

ด่านตรวจบัตรผ่าน — endpoint ไหนต้อง login ก่อน ให้เอา middleware นี้ไปคั่น

```js
const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);   // แปะ payload ไว้ที่ req.user
    next();                                                  // ผ่าน → ไป controller ต่อ
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

module.exports = authenticate;
```

หลังผ่าน middleware นี้ controller จะอ่าน `req.user.id`, `req.user.role` ได้เลย

## 3. `src/routes/auth.js`

```js
const router       = require('express').Router();
const authenticate = require('../middlewares/auth');
const { login, logout } = require('../controllers/authController');

router.post('/login',  login);                 // login ไม่ต้องมี token
router.post('/logout', authenticate, logout);  // logout ต้องมี token ก่อน

module.exports = router;
```

## 4. ต่อ route เข้า `src/app.js`

```js
app.use('/api', require('./routes/auth'));   // [!code ++]
```

## ทดสอบ

| request | ต้องได้ |
|---------|---------|
| `POST /api/login` body `{"username":"admin","password":"password"}` | 200 + `data.token`, `role: "judge"` |
| `POST /api/login` รหัสผิด | 401 `Invalid credentials` |
| `POST /api/login` ไม่ส่ง password | 400 |

เก็บ `token` ที่ได้ไว้ — บทถัดๆ ไปต้องแนบ header `Authorization: Bearer <token>` ทุกครั้ง
