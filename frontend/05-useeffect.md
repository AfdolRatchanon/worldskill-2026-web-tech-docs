# บทที่ 5 — useEffect + useCallback

> **บทนี้เตรียมอะไร:** เรียนรู้ useEffect สำหรับ side effect เช่น fetch ข้อมูลจาก API และ useCallback สำหรับสร้างฟังก์ชัน fetch แบบ stable — pattern นี้ใช้จริงใน Dashboard ทุกหน้า (บทที่ 14-18)

## ปัญหา — ดึงข้อมูลตอนไหน?

ถ้า fetch ข้อมูลตรงๆ ใน component body — React จะ render ซ้ำไปเรื่อยๆ:

```
fetch ใน body → data มา → setState → re-render → fetch อีก → วน loop ไม่หยุด
```

**วิธีแก้:** ใช้ `useEffect` ซึ่งรันหลัง render เสร็จแล้ว

## useEffect คืออะไร

`useEffect` รัน **หลัง** DOM ถูกอัปเดต — ใช้สำหรับ "side effect" เช่น fetch API, subscribe event, set timer

```jsx
useEffect(() => {
  // โค้ดที่รันหลัง render
}, [dependency1, dependency2]);
//  ↑
//  dependency array — รัน effect เมื่อค่าเหล่านี้เปลี่ยน
```

### Dependency Array

| dependency array | รัน effect เมื่อ |
|-----------------|----------------|
| `[]` (array ว่าง) | render ครั้งแรกครั้งเดียว (mount) |
| `[id]` | render ครั้งแรก + ทุกครั้งที่ `id` เปลี่ยน |
| ไม่ใส่ | **ทุกครั้ง** ที่ render (อันตราย — อาจ infinite loop) |

### Cleanup function

```jsx
useEffect(() => {
  const id = setInterval(fetchData, 5000);
  return () => clearInterval(id);   // รันเมื่อ component unmount หรือก่อน re-run effect
}, [fetchData]);
```

## useCallback คืออะไร

:::info โปรเจ็คนี้ไม่ได้ใช้ useCallback
Dashboard ในระบบนี้ใช้ **tick pattern** แทน (ดูหัวข้อ "Pattern Polling จริง" ด้านล่าง) — รู้จัก useCallback ไว้เพื่ออ่าน code โปรเจ็คอื่นได้
:::

`useCallback` ทำให้ฟังก์ชัน **ไม่ถูกสร้างใหม่** ทุก render — จำเป็นเมื่อต้องใส่ฟังก์ชันเป็น dependency ของ `useEffect`

**ปัญหาถ้าไม่ใช้ useCallback:**

```
render → fetchAll() สร้างใหม่ (reference ใหม่)
       → useEffect เห็นว่า fetchAll เปลี่ยน
       → รัน effect อีก → fetch อีก
       → setState → render อีก → วน loop
```

```jsx
const fetchAll = useCallback(async () => {
  // fetch logic
}, []);             // [] = ฟังก์ชันนี้ไม่เปลี่ยนตลอด lifetime ของ component
```

## ชิ้นงาน — แก้ App.jsx (ลบ counter + เพิ่ม timer ชั่วคราว)

:::warning โค้ดชั่วคราว
timer นี้มีไว้สาธิต useEffect เท่านั้น — จะลบออกในบทที่ 6 ด้วย `[!code --]`
:::

แก้ `src/App.jsx`:

```jsx
// App.jsx — บทที่ 5 ลบ counter + เพิ่ม useEffect timer
import { useState } from 'react';                                     // [!code --]
import { useState, useEffect, useCallback } from 'react';             // [!code ++]

export default function App() {
  const [count, setCount] = useState(0); // ลบในบทที่ 5              // [!code --]
  const [time,  setTime]  = useState(''); // ลบในบทที่ 6             // [!code ++]

  const tick = useCallback(() => {                                     // [!code ++]
    setTime(new Date().toLocaleTimeString());                         // [!code ++]
  }, []);                                                              // [!code ++]

  useEffect(() => {                                                    // [!code ++]
    tick();                                                            // [!code ++]
    const id = setInterval(tick, 1000);                               // [!code ++]
    return () => clearInterval(id);                                   // [!code ++]
  }, [tick]);                                                          // [!code ++]

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-gray-900">WorldSkill 2026</h1>
        <p className="text-gray-400 text-sm mt-2">Test Submission Management System</p>
        <p className="mt-4 text-center text-gray-500 font-mono">{time}</p> {/* [!code ++] */}
        <div className="mt-6 text-center"> {/* [!code --] */}
          <p className="text-4xl font-bold text-blue-600">{count}</p> {/* [!code --] */}
          <button {/* [!code --] */}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"  // [!code --]
            onClick={() => setCount(count + 1)}                             // [!code --]
          > {/* [!code --] */}
            Click me
          </button> {/* [!code --] */}
        </div> {/* [!code --] */}
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
- ข้อความเวลา เช่น `14:30:05` แสดงกลางหน้า (ไม่มีปุ่ม Click me อีกต่อไป)
- เวลาเปลี่ยนทุก 1 วินาทีโดยอัตโนมัติ โดยไม่ต้อง refresh

**DevTools → Console:** ต้องไม่มี error หรือ warning ใดๆ

## Pattern Polling จริง (ที่ใช้ใน Dashboard)

Dashboard ทุกหน้าใช้ **tick counter** เป็น dependency ของ `useEffect` แทนที่จะใส่ฟังก์ชัน fetch ลงใน dependency array โดยตรง:

```jsx
const [tick, setTick] = useState(0);  // counter สำหรับ trigger refresh

useEffect(() => {
  async function fetchAll() {         // ประกาศ async function ภายใน effect
    try {
      const [res1, res2] = await Promise.all([
        api.get('/endpoint1'),
        api.get('/endpoint2'),
      ]);
      setData1(res1.data.data);
      setData2(res2.data.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
  }
  fetchAll();                               // fetch ครั้งแรกทันที
  const id = setInterval(fetchAll, 5_000); // poll ทุก 5 วินาที
  return () => clearInterval(id);          // cleanup เมื่อ unmount
}, [tick]);  // ← เปลี่ยนจาก [fetchAll] มาเป็น [tick]

// เมื่อ child component ทำ action (เช่น submit, recheck) → เรียก
// setTick(t => t + 1) เพื่อ trigger fetch ใหม่ทันที
```

:::tip ทำไมใช้ tick แทนการใส่ fetchAll ใน dependency?
ถ้าประกาศ `fetchAll` ข้างนอก `useEffect` → React จะเห็นว่ามันสร้างใหม่ทุก render → `useEffect` รัน loop ไม่หยุด

แก้ได้ 2 วิธี:
1. **tick pattern** (ใช้ในโปรเจ็คนี้) — ประกาศ fetchAll ภายใน effect ไม่ต้องใส่ใน dependency, ใช้ `tick` เป็นตัว trigger แทน — เข้าใจง่าย
2. **useCallback** — ห่อฟังก์ชันด้วย `useCallback` เพื่อให้ reference คงที่ — เป็น pattern ที่พบบ่อยในโปรเจ็คทั่วไป
:::

## 🏋️ Workshop ย่อย — นาฬิกา + document.title

**โจทย์:** แสดงเวลาที่เดินทุกวินาที และอัปเดตชื่อแท็บ browser ตามจำนวนครั้งที่กดปุ่ม

**ต้องใช้:** `useEffect` + `setInterval` + cleanup (`clearInterval`) · dependency array 2 แบบ (`[]` กับ `[count]`)

**เริ่มจาก:**

```jsx
import { useState, useEffect } from 'react';
export default function App() {
  const [now,   setNow]   = useState(new Date().toLocaleTimeString());
  const [count, setCount] = useState(0);

  // TODO 1: useEffect([]) — setInterval อัปเดต now ทุก 1 วิ + return cleanup

  // TODO 2: useEffect([count]) — document.title = `กดไป ${count} ครั้ง`

  return (
    <div className="p-6">
      <p className="text-3xl font-mono">{now}</p>
      <button onClick={() => setCount(count + 1)}>กดเพิ่ม ({count})</button>
    </div>
  );
}
```

**ผลลัพธ์ที่ต้องเห็น:** เวลาเดินเอง · กดปุ่ม → ชื่อแท็บ browser เปลี่ยนตามจำนวนครั้ง · Console ไม่มี warning

**ท้าทายเพิ่ม (ออปชัน):** ลองลบ cleanup ออกแล้วดูว่าเกิดอะไร — เข้าใจว่าทำไมต้อง `return () => clearInterval(id)`

## Common Errors

| Error | สาเหตุ | วิธีแก้ |
|-------|--------|---------|
| Fetch loop ไม่หยุด | ประกาศ async function ข้างนอก `useEffect` แล้วใส่เป็น dependency | ย้าย function ไว้ภายใน `useEffect` หรือใช้ tick pattern |
| Memory leak warning | ไม่มี cleanup function | เพิ่ม `return () => clearInterval(id)` |
| Effect ไม่รัน | dependency array ผิด หรือลืมใส่ | ตรวจ dependency array |
