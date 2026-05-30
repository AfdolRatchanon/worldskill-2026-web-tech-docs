# บทที่ 9 — Common Components

> **บทนี้เตรียมอะไร:** สร้าง component ที่ใช้ซ้ำได้ทั่วโปรเจ็ค: `Button`, `Input`, `Card`, `Badge` — แล้วนำไปใช้ใน Login.jsx เพื่อลดโค้ดซ้ำ

## ชิ้นงาน — สร้าง 4 components

```
src/
├── App.jsx
├── components/
│   └── common/
│       ├── Button.jsx   ← สร้างในบทนี้
│       ├── Input.jsx    ← สร้างในบทนี้
│       ├── Card.jsx     ← สร้างในบทนี้
│       └── Badge.jsx    ← สร้างในบทนี้
└── pages/
    └── Login.jsx
```

## Button.jsx

สร้าง `src/components/common/Button.jsx`:

```jsx
// components/common/Button.jsx — บทที่ 11
const styles = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
  danger:  'bg-red-600  hover:bg-red-700  text-white focus:ring-red-500',
  success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
  ghost:   'bg-gray-100 hover:bg-gray-200 text-gray-700 focus:ring-gray-400',
};

export default function Button({ children, variant = 'primary', className = '', ...props }) {
  // ...props = "rest props" — รับ prop อื่นๆ ที่ไม่ได้ระบุชื่อ เช่น disabled, onClick, type
  return (
    <button
      className={`
        px-4 py-2 rounded-lg text-sm font-medium transition-colors
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${styles[variant]} ${className}
      `}
      {...props}  // spread props ลง <button> → <Button disabled> ทำให้ <button disabled> อัตโนมัติ
    >
      {children}
    </button>
  );
}
```

### วิธีใช้

```jsx
<Button>Submit</Button>                          // primary (default)
<Button variant="danger">Delete</Button>         // danger
<Button variant="success">Confirm</Button>       // success
<Button variant="ghost">Cancel</Button>          // ghost
<Button disabled>Loading…</Button>               // disabled
<Button className="w-full">Full Width</Button>   // เพิ่ม class พิเศษ
```

## Input.jsx

สร้าง `src/components/common/Input.jsx`:

```jsx
// components/common/Input.jsx — บทที่ 11
export default function Input({ label, error, id, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`
          px-3 py-2 border rounded-lg text-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500
          disabled:bg-gray-50 disabled:text-gray-400
          ${error ? 'border-red-400' : 'border-gray-300'}
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
```

### วิธีใช้

```jsx
<Input
  id="username"
  label="Username"
  type="text"
  placeholder="Enter username"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
  required
/>
<Input
  id="url"
  label="Frontend URL"
  type="url"
  error="URL is required"     // แสดง error text + border แดง
  disabled                    // ปิดการแก้ไข
/>
```

## Card.jsx

สร้าง `src/components/common/Card.jsx`:

```jsx
// components/common/Card.jsx — บทที่ 11
export default function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
      {children}
    </div>
  );
}
```

:::tip children คืออะไร?
`children` คือ props พิเศษที่ React ส่งให้อัตโนมัติ — คือ content ที่อยู่ระหว่าง opening และ closing tag

```jsx
<Card>
  <h2>Title</h2>   // ← ทั้งหมดนี้คือ "children" ที่ Card จะได้รับ
  <p>Content</p>
</Card>
```

Card ไม่รู้ล่วงหน้าว่าจะมี content อะไรอยู่ข้างใน — แค่รับ `children` แล้ว render ออกมา ทำให้ Card ใช้ได้กับ content ทุกประเภท
:::

### วิธีใช้

```jsx
<Card>
  <h2>Title</h2>
  <p>Content</p>
</Card>
<Card className="text-center">   {/* เพิ่ม class พิเศษ */}
  ...
</Card>
```

## Badge.jsx

สร้าง `src/components/common/Badge.jsx`:

```jsx
// components/common/Badge.jsx — บทที่ 11
const styles = {
  waiting:  'bg-gray-100   text-gray-600',
  open:     'bg-green-100  text-green-700',
  closed:   'bg-red-100    text-red-700',
  pending:  'bg-yellow-100 text-yellow-700',
  checking: 'bg-blue-100   text-blue-700',
  checked:  'bg-green-100  text-green-700',
  pass:     'bg-green-100  text-green-700',
  fail:     'bg-red-100    text-red-700',
};

export default function Badge({ status }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}
```

### วิธีใช้

```jsx
<Badge status="open" />      // เขียว
<Badge status="closed" />    // แดง
<Badge status="waiting" />   // เทา
<Badge status="pending" />   // เหลือง
<Badge status="checking" />  // น้ำเงิน
<Badge status="checked" />   // เขียว
<Badge status="pass" />      // เขียว (ใช้ใน RankingTable)
<Badge status="fail" />      // แดง  (ใช้ใน RankingTable)
```

## อัปเดต Login.jsx — ใช้ Button และ Input

แก้ `src/pages/Login.jsx` เปลี่ยน `<input>` และ `<button>` ธรรมดาให้ใช้ component:

```jsx
// pages/Login.jsx — บทที่ 11 ใช้ Button + Input
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Input from '../components/common/Input';    // [!code ++]
import Button from '../components/common/Button';  // [!code ++]
import { HOME } from '../router/ProtectedRoute';   // [!code ++]

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
            <Input                                            // [!code ++]
              id="username"                                   // [!code ++]
              label="Username"                                // [!code ++]
              type="text"                                     // [!code ++]
              placeholder="Enter username"                    // [!code ++]
              value={username}                                // [!code ++]
              onChange={(e) => setUsername(e.target.value)}  // [!code ++]
              required                                        // [!code ++]
              autoFocus                                       // [!code ++]
            /> {/* [!code ++] */}
            <Input                                            // [!code ++]
              id="password"                                   // [!code ++]
              label="Password"                                // [!code ++]
              type="password"                                 // [!code ++]
              placeholder="Enter password"                    // [!code ++]
              value={password}                                // [!code ++]
              onChange={(e) => setPassword(e.target.value)}  // [!code ++]
              required                                        // [!code ++]
            /> {/* [!code ++] */}
            {error && (
              <div role="alert" className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">
                {error}
              </div>
            )}
            <Button type="submit" disabled={loading} className="w-full"> {/* [!code ++] */}
              {loading ? 'Signing in…' : 'Sign In'}
            </Button> {/* [!code ++] */}
          </form>
        </div>
      </div>
    </div>
  );
}
```

## ทดสอบ

```bash
npm run dev
```

เปิด `http://localhost:3000/login`:
1. หน้า Login ต้องแสดงเหมือนเดิม — แต่ตอนนี้ใช้ `<Input>` และ `<Button>` component
2. กรอก username/password ผิด → ต้องเห็น error message สีแดง
3. Login สำเร็จ → redirect ปกติ

## Common Errors

| Error | สาเหตุ | วิธีแก้ |
|-------|--------|---------|
| `Button is not defined` | ลืม import | เพิ่ม `import Button from '../components/common/Button'` |
| Input ไม่แสดง label | ลืมส่ง prop `id` | `id` ต้องตรงกับที่ `htmlFor` ใน label ใช้ |
| Badge สีไม่ถูก | typo ใน `status` | ตรวจค่า string ที่ส่งเข้า: `"open"`, `"closed"`, ฯลฯ |
