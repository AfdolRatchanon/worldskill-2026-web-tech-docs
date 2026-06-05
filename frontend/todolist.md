# บทที่ 9 — 🏆 Workshop รวม: Todolist (Capstone)

> **บทนี้คืออะไร:** workshop รวมที่เอา **พื้นฐานบท 1–8 มาประกอบกันในที่เดียว** ผ่านการสร้าง Todolist — เพิ่ม/ติ๊กเสร็จ/ลบ/กรอง/จำค่าไว้ โดย **ไม่ต้องมี backend** เป็นสะพานก่อนไปเจอ Dashboard จริงที่มี API/auth

ทำจบบทนี้ = พร้อมอ่าน/เขียน component ในโปรเจ็ค TSMS จริง เพราะใช้ pattern เดียวกันหมด

## 🎯 ใช้พื้นฐานบทไหนบ้าง

| เรื่อง | บท | ใช้ตรงไหนใน Todolist |
|-------|:--:|---------------------|
| `useState` | [4](/frontend/04-usestate) | เก็บรายการ todo + ค่าในช่องกรอก |
| controlled form + event | [4](/frontend/04-usestate) | พิมพ์ + กด Add (`onSubmit`/`preventDefault`) |
| `.map` + `key` | [6](/frontend/rendering-patterns) | วาดรายการ todo |
| conditional rendering | [6](/frontend/rendering-patterns) | empty state, ติ๊กแล้วขีดฆ่า, ปุ่ม filter |
| `useEffect` + cleanup | [5](/frontend/05-useeffect) | จำ todo ไว้ใน localStorage |

> ไม่มี API → ไม่ต้องใช้บท 7 (Axios) และ 8 (Router) — Todolist โฟกัสที่ state + rendering ล้วน ๆ

## 📁 เตรียมไฟล์

สร้าง `src/TodoApp.jsx` แล้วชี้ `App.jsx` มาที่มันชั่วคราว:

```jsx
// App.jsx — ชั่วคราวสำหรับ workshop นี้
import TodoApp from './TodoApp';
export default function App() {
  return <TodoApp />;
}
```

---

## Step 1 — useState: เก็บรายการ + เพิ่ม todo

แต่ละ todo เป็น object `{ id, text, done }` — เก็บทั้งหมดเป็น array

```jsx
// src/TodoApp.jsx
import { useState } from 'react';

export default function TodoApp() {
  const [todos, setTodos] = useState([]);   // รายการทั้งหมด
  const [text,  setText]  = useState('');    // ค่าในช่องกรอก

  function addTodo(e) {
    e.preventDefault();                      // กัน browser reload หน้า
    if (!text.trim()) return;                // ว่าง → ไม่เพิ่ม
    const newTodo = { id: Date.now(), text: text.trim(), done: false };
    setTodos([...todos, newTodo]);           // สร้าง array ใหม่ (ไม่ push ของเดิม)
    setText('');                             // ล้างช่อง
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">📝 Todolist</h1>

      <form onSubmit={addTodo} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="มีอะไรต้องทำ?"
          className="border border-gray-300 rounded-lg px-3 py-2 flex-1"
        />
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-lg">Add</button>
      </form>
    </div>
  );
}
```

:::warning อย่าแก้ array เดิมตรง ๆ
`todos.push(x)` แล้ว `setTodos(todos)` → React ไม่เห็นว่าเปลี่ยน (reference เดิม) จอไม่อัปเดต **ต้องสร้าง array ใหม่เสมอ:** `[...todos, x]`
:::

---

## Step 2 — `.map` + `key` + empty state

แสดงรายการใต้ฟอร์ม — ถ้าว่างให้บอกผู้ใช้

```jsx
{/* วางใต้ </form> */}
{todos.length === 0 && (                                      // [!code highlight] empty state
  <p className="text-gray-400 text-center mt-6">ยังไม่มีงาน เพิ่มเลย!</p>
)}

<ul className="mt-4 space-y-2">
  {todos.map((todo) => (                                      // [!code highlight] .map + key
    <li key={todo.id} className="flex items-center gap-2 border-b py-2">
      <span className="flex-1">{todo.text}</span>
    </li>
  ))}
</ul>
```

---

## Step 3 — ติ๊กเสร็จ (toggle) + ขีดฆ่าแบบมีเงื่อนไข

คลิกข้อความ → สลับ `done` แล้วใช้ ternary เปลี่ยนสไตล์

```jsx
function toggleTodo(id) {
  setTodos(todos.map((t) =>                                   // สร้าง array ใหม่
    t.id === id ? { ...t, done: !t.done } : t                 // ตัวที่คลิก → สลับ done
  ));
}
```

```jsx
{/* ใน <li> — แก้ <span> */}
<span
  onClick={() => toggleTodo(todo.id)}
  className={`flex-1 cursor-pointer ${todo.done ? 'line-through text-gray-400' : ''}`}
>                                                             {/* [!code highlight] ternary เปลี่ยนสไตล์ */}
  {todo.text}
</span>
```

---

## Step 4 — ลบ (filter)

```jsx
function deleteTodo(id) {
  setTodos(todos.filter((t) => t.id !== id));   // เก็บทุกตัวที่ "ไม่ใช่" id นี้
}
```

```jsx
{/* ใน <li> ต่อจาก <span> */}
<button onClick={() => deleteTodo(todo.id)} className="text-red-500 hover:text-red-700">❌</button>
```

---

## Step 5 — กรอง All / Active / Done (derived + conditional)

เพิ่ม state `filter` แล้ว **คำนวณรายการที่จะแสดง** จาก `todos` (ไม่เก็บซ้ำใน state)

```jsx
const [filter, setFilter] = useState('all');   // 'all' | 'active' | 'done'

const visible = todos.filter((t) =>            // derived — คำนวณตอน render
  filter === 'active' ? !t.done :
  filter === 'done'   ?  t.done : true
);
```

```jsx
{/* ปุ่ม filter — วางเหนือ <ul> */}
<div className="flex gap-2 mt-4">
  {['all', 'active', 'done'].map((f) => (
    <button
      key={f}
      onClick={() => setFilter(f)}
      className={filter === f ? 'font-bold text-blue-600' : 'text-gray-500'}  // [!code highlight] active style
    >
      {f}
    </button>
  ))}
</div>
```

แล้วเปลี่ยน `todos.map` ใน `<ul>` เป็น **`visible.map`**

:::tip ทำไมไม่เก็บ "รายการที่กรองแล้ว" ใน state
เพราะมันคำนวณได้จาก `todos` + `filter` อยู่แล้ว — เก็บซ้ำเสี่ยง state ไม่ตรงกัน หลักคือ **อะไรที่ derive ได้ อย่าเก็บเป็น state** (ใช้กับ Manager Dashboard เรื่อง pass/fail ด้วย)
:::

---

## Step 6 — จำไว้ด้วย `useEffect` + localStorage

ตอนนี้ refresh แล้ว todo หาย — แก้ด้วย effect ที่ **เซฟทุกครั้งที่ `todos` เปลี่ยน** และอ่านคืนตอนเปิด (lazy initializer แบบเดียวกับ AuthContext บท 10)

```jsx
const [todos, setTodos] = useState(() => {                    // [!code highlight] อ่านคืนตอน mount
  const saved = localStorage.getItem('todos');
  return saved ? JSON.parse(saved) : [];
});

useEffect(() => {                                             // [!code highlight] เซฟเมื่อ todos เปลี่ยน
  localStorage.setItem('todos', JSON.stringify(todos));
}, [todos]);
```

อย่าลืม `import { useState, useEffect } from 'react';`

**ทดสอบ:** เพิ่ม todo → refresh หน้า → todo ยังอยู่ ✅

---

## ✅ Checkpoint — ทำได้ครบไหม

- [ ] เพิ่ม todo ได้ + ช่องกรอกถูกล้าง
- [ ] รายการว่าง → เห็น "ยังไม่มีงาน"
- [ ] คลิกข้อความ → ขีดฆ่า/ยกเลิกได้
- [ ] กด ❌ → ลบได้
- [ ] filter All/Active/Done เปลี่ยนรายการที่แสดงถูกต้อง
- [ ] refresh แล้ว todo ยังอยู่
- [ ] Console ไม่มี warning เรื่อง `key`

## 🚀 ท้าทายเพิ่ม (ออปชัน)

- แสดงตัวนับ "เหลือ {active} งาน" ด้วย `??` กันค่าว่าง
- ปุ่ม "Clear done" ลบเฉพาะที่เสร็จแล้ว (`filter`)
- แก้ข้อความ todo ได้ (double-click → input)

## 🎓 เชื่อมกับโปรเจ็คจริง

Todolist กับ Dashboard ใน TSMS ใช้ **โครงเดียวกัน** ต่างแค่ที่มาของข้อมูล:

| Todolist (บทนี้) | TSMS Dashboard |
|------------------|----------------|
| `todos` มาจาก `useState`/localStorage | `submissions` มาจาก `api.get()` |
| `addTodo` แก้ state ตรง ๆ | `SubmissionForm` ยิง `api.post()` แล้ว refresh |
| `visible = todos.filter(...)` | `ranking`, pass/fail derive จากข้อมูล API |

→ ขึ้นบท [10 AuthContext](/frontend/08-auth-context) เป็นต้นไป จะเริ่มต่อ backend จริง แต่ "ลีลา" การจัดการ state + วาด UI เหมือนที่ฝึกในบทนี้ทุกอย่าง
