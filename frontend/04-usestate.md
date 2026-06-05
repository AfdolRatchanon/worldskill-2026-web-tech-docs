# บทที่ 4 — useState

> **บทนี้เตรียมอะไร:** เรียนรู้ useState สำหรับจัดการ state ใน component — จะใช้จริงตั้งแต่บทที่ 7 เป็นต้นไปในทุก form (Login, SubmissionForm) และทุก Dashboard

## ปัญหา — ตัวแปรธรรมดาทำให้ UI ไม่อัปเดต

```jsx
// ❌ ตัวแปรธรรมดา — กดปุ่มแล้ว UI ไม่เปลี่ยน
function Counter() {
  let count = 0;
  return (
    <button onClick={() => { count += 1; }}>
      Clicked {count} times  {/* ค่าใน UI ไม่เปลี่ยนเลย */}
    </button>
  );
}
```

React ไม่รู้ว่า `count` เปลี่ยน เพราะเป็นแค่ตัวแปร JavaScript ธรรมดา

## ทำไมถึงต้องใช้ useState ไม่ใช่ตัวแปรธรรมดา

| วิธี | ปัญหา |
|-----|-------|
| `let count = 0` | React ไม่ track การเปลี่ยนแปลง → UI ไม่ re-render |
| `window.myCount = 0` | Global state, ปนกันหมด, ไม่ safe |
| **`useState`** ✅ | React track ได้ → re-render ทันทีที่ค่าเปลี่ยน |

## useState คืออะไร

`useState` เป็น React Hook ที่ทำให้ component **จำค่าได้** และ **re-render เมื่อค่าเปลี่ยน**

```jsx
const [state, setState] = useState(initialValue);
//     ↑         ↑              ↑
//   ค่าปัจจุบัน  function แก้ค่า  ค่าเริ่มต้น
```

กฎสำคัญ:
- **ห้ามแก้ state โดยตรง** — ต้องใช้ `setState` เสมอ
- `setState` ทำให้ React **re-render** component นั้น
- `useState` ต้องเรียกที่ **top level** — ห้ามอยู่ใน if/loop

## วิธีใช้งาน

```jsx
const [count,  setCount]  = useState(0);     // ตัวเลข
const [name,   setName]   = useState('');    // string ว่าง
const [data,   setData]   = useState(null);  // null (ยังไม่มีข้อมูล)
const [loading, setLoading] = useState(false); // boolean
```

**Controlled Input** — pattern หลักสำหรับ form:

```jsx
const [username, setUsername] = useState('');

<input
  value={username}                               // ผูก state กับ input
  onChange={(e) => setUsername(e.target.value)}  // อัปเดตทุกครั้งที่พิมพ์
/>
```

## ชิ้นงาน — เพิ่ม Counter ชั่วคราวใน App.jsx

:::warning โค้ดชั่วคราว
Counter นี้มีไว้สาธิต useState เท่านั้น — จะลบออกในบทที่ 5 ด้วย `[!code --]`
:::

แก้ `src/App.jsx`:

```jsx
// App.jsx — บทที่ 4 เพิ่ม useState counter (ชั่วคราว)
import { useState } from 'react';                                  // [!code ++]

export default function App() {
  const [count, setCount] = useState(0); // ลบในบทที่ 5           // [!code ++]

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-gray-900">WorldSkill 2026</h1>
        <p className="text-gray-400 text-sm mt-2">Test Submission Management System</p>
        <div className="mt-6 text-center"> {/* [!code ++] */}
          <p className="text-4xl font-bold text-blue-600">{count}</p> {/* [!code ++] */}
          <button {/* [!code ++] */}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700" // [!code ++]
            onClick={() => setCount(count + 1)}                    // [!code ++]
          > {/* [!code ++] */}
            Click me
          </button> {/* [!code ++] */}
        </div> {/* [!code ++] */}
      </div>
    </div>
  );
}
```

## ทดสอบ

```bash
npm run dev
```

**URL:** `http://localhost:3000`

ต้องเห็น:
- ตัวเลข `0` สีน้ำเงินขนาดใหญ่ใต้หัวข้อ
- ปุ่ม "Click me" สีน้ำเงิน

**ทดสอบ interaction:**
- กดปุ่ม "Click me" → ตัวเลขเพิ่มขึ้นทีละ 1 ทันที
- กดหลายครั้ง → ตัวเลขเพิ่มต่อเนื่อง
- ตัวเลขต้องเปลี่ยนโดยไม่ต้อง refresh หน้า

## ใช้ในระบบนี้ที่ไหน

```jsx
// ทุก Dashboard มี state เหล่านี้เสมอ
const [session,    setSession]    = useState(null)
const [tick,       setTick]       = useState(0)     // trigger refresh

// เพิ่มตาม role
// Candidate
const [tasks,      setTasks]      = useState([])
const [submission, setSubmission] = useState(null)
const [result,     setResult]     = useState(null)

// Judge
const [candidates,  setCandidates]  = useState([])
const [submissions, setSubmissions] = useState([])

// Manager
const [sessions,   setSessions]   = useState([])
const [selectedId, setSelectedId] = useState(null)
const [summary,    setSummary]    = useState(null)
const [ranking,    setRanking]    = useState([])
const [status,     setStatus]     = useState(null)
```

pattern `useState(null)` สำหรับ object เดี่ยว, `useState([])` สำหรับ array — แสดง `—` หรือ loading state ในระหว่างรอข้อมูล

## 🏋️ Workshop ย่อย — Toggle + Like

**โจทย์:** ทำ 2 อย่างในหน้าเดียว — (1) ปุ่ม Toggle สลับซ่อน/แสดงข้อความ (2) ปุ่ม ❤️ กดแล้วเลขเพิ่มขึ้น

**ต้องใช้:** `useState` (boolean + number) · `setState` · conditional render (`&&`)

**เริ่มจาก:**

```jsx
import { useState } from 'react';
export default function App() {
  const [show,  setShow]  = useState(true);
  const [likes, setLikes] = useState(0);
  return (
    <div className="p-6 space-y-4">
      <button onClick={() => setShow(!show)}>Toggle</button>
      {/* TODO 1: ถ้า show เป็น true → แสดง <p>ข้อความลับ</p> */}

      <button onClick={() => setLikes(likes + 1)}>❤️ {likes}</button>
    </div>
  );
}
```

**ผลลัพธ์ที่ต้องเห็น:** กด Toggle → ข้อความซ่อน/แสดง · กด ❤️ → เลขเพิ่มทันทีโดยไม่ต้อง refresh

**ท้าทายเพิ่ม (ออปชัน):** เพิ่มช่อง input ที่พิมพ์แล้วโชว์ "สวัสดี {name}" สด ๆ (controlled input)

## Common Errors

| Error | สาเหตุ | วิธีแก้ |
|-------|--------|---------|
| `Invalid hook call` | เรียก `useState` นอก component หรืออยู่ใน if/loop | ย้าย `useState` ไว้ที่ top level ของฟังก์ชัน |
| UI ไม่เปลี่ยนเมื่อกดปุ่ม | แก้ state โดยตรง `count = count + 1` | ใช้ `setCount(count + 1)` เสมอ |
| `React is not defined` | ลืม import | เพิ่ม `import { useState } from 'react'` |
