# บทที่ 2 — React คืออะไร

> **บทนี้เตรียมอะไร:** ทำความเข้าใจแนวคิดหลักของ React ก่อนเริ่มเขียนโค้ดจริงในบทถัดไป — ไม่มีโค้ดในบทนี้

## React คืออะไร

React คือ **JavaScript library** สำหรับสร้าง UI โดยแบ่ง UI ออกเป็น **Component** ย่อยๆ แต่ละ Component จัดการตัวเองได้ และนำกลับมาใช้ซ้ำได้

:::tip Library ≠ Framework
React เป็น **library** ไม่ใช่ framework — React ดูแลแค่ส่วน UI ส่วนการ routing, HTTP request, state management ต้องใช้ library อื่นเพิ่ม (เช่น react-router-dom, axios)
:::

## ทำไมถึงใช้ React ไม่ใช่ตัวอื่น

| ตัวเลือก | เหตุผลที่ไม่ใช้ |
|---------|-------------|
| Vanilla JavaScript | ต้องเขียน DOM manipulation เอง — โค้ดยาว, ดูแลยาก, ไม่มี component model |
| Vue.js | syntax ต่างกัน (template-based) — ecosystem ในสายงานส่วนใหญ่ใช้ React |
| Angular | framework ใหญ่, ต้องเรียน TypeScript, เหมาะกับโปรเจ็คขนาดใหญ่กว่านี้ |
| **React** ✅ | JavaScript ล้วนๆ (JSX), component model ชัดเจน, ecosystem ใหญ่ที่สุด |

## แนวคิดหลัก 5 อย่าง

### 1. Component

Component คือฟังก์ชัน JavaScript ที่ **คืนค่า JSX** (HTML ที่เขียนใน JavaScript)

```jsx
function Greeting() {            // ชื่อต้องขึ้นต้นด้วยตัวพิมพ์ใหญ่
  return <h1>Hello World</h1>;  // คืนค่า JSX
}
```

Component ย่อยๆ รวมกันเป็น UI ทั้งหมด:

```
App
├── Header
├── TaskList
│   ├── TaskCard
│   └── TaskCard
└── SubmissionForm
```

### 2. JSX

JSX คือ syntax ที่ผสม HTML เข้ากับ JavaScript — Vite แปลงให้เป็น JavaScript จริงๆ ก่อน run

```jsx
// JSX — เขียนง่ายอ่านง่าย
const element = <h1 className="text-blue-600">Hello</h1>;

// JavaScript จริงๆ ที่ Vite แปลงให้ (ไม่ต้องเขียนเอง)
const element = React.createElement('h1', { className: 'text-blue-600' }, 'Hello');
```

ข้อแตกต่างจาก HTML:
- `class` → `className`
- `for` → `htmlFor`
- ต้อง `return` element เดียว (ห่อด้วย `<div>` หรือ `<>...</>`)

### 3. Props

Props คือ **ข้อมูลที่ parent ส่งให้ child** — ส่งแบบ HTML attribute

```jsx
// Parent ส่งข้อมูล
<Greeting name="Alice" role="candidate" />

// Child รับผ่าน parameter
function Greeting({ name, role }) {
  return <p>{name} — {role}</p>;
}
```

Props เป็น **read-only** — child ห้ามแก้ไข props ที่รับมา

### 4. State

State คือ **ข้อมูลภายใน component ที่เปลี่ยนได้** — เมื่อ state เปลี่ยน React จะ re-render component นั้นอัตโนมัติ

```jsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);   // count = state, setCount = function แก้ค่า

  return (
    <button onClick={() => setCount(count + 1)}>
      Clicked {count} times
    </button>
  );
}
```

| | Props | State |
|--|-------|-------|
| แก้ค่าได้โดย | parent เท่านั้น | component ตัวเอง |
| เมื่อเปลี่ยน | re-render | re-render |
| ตัวอย่าง | `username`, `role` | form input, loading flag |

### 5. Virtual DOM

React ไม่แก้ไข DOM จริงทุกครั้งที่ state เปลี่ยน — แต่เปรียบเทียบ Virtual DOM ก่อน แล้วแก้เฉพาะส่วนที่เปลี่ยน

```
State เปลี่ยน
    ↓
React สร้าง Virtual DOM ใหม่
    ↓
เปรียบเทียบกับ Virtual DOM เดิม (Diffing)
    ↓
แก้ไข DOM จริงเฉพาะส่วนที่ต่าง (Reconciliation)
```

ผลลัพธ์: UI อัปเดตเร็วขึ้น เพราะแก้แค่ส่วนที่จำเป็น

## Data Flow ในโปรเจ็คนี้

```
AuthProvider (เก็บ user, token)
    └── BrowserRouter
            └── Routes
                    ├── /login     → Login.jsx
                    ├── /candidate → ProtectedRoute → CandidateDashboard
                    ├── /judge     → ProtectedRoute → JudgeDashboard
                    └── /manager   → ProtectedRoute → ManagerDashboard
```

ข้อมูล `user` และ `token` อยู่ใน `AuthProvider` — component ลูกทุกตัวเข้าถึงได้ผ่าน `useAuth()`

## สรุป

| Concept | ย่อ |
|---------|-----|
| Component | ฟังก์ชันที่คืน JSX — ชิ้นส่วน UI |
| JSX | HTML ที่เขียนใน JavaScript |
| Props | ข้อมูลจาก parent → child (read-only) |
| State | ข้อมูลภายในที่เปลี่ยนได้ ทำให้ re-render |
| Virtual DOM | React อัปเดตแค่ส่วนที่เปลี่ยน |
