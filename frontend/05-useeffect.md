# บทที่ 5 — useEffect + useCallback

> **บทนี้เตรียมอะไร:** เรียนรู้ useEffect สำหรับ side effect เช่น fetch ข้อมูลจาก API และ useCallback สำหรับสร้างฟังก์ชัน fetch แบบ stable — pattern นี้ใช้จริงใน Dashboard ทุกหน้า (บทที่ 12-15)

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
        <p className="mt-4 text-center text-gray-500 font-mono">{time}</p>  // [!code ++]
        <div className="mt-6 text-center">                                   // [!code --]
          <p className="text-4xl font-bold text-blue-600">{count}</p>       // [!code --]
          <button                                                             // [!code --]
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"  // [!code --]
            onClick={() => setCount(count + 1)}                             // [!code --]
          >                                                                   // [!code --]
            Click me                                                         // [!code --]
          </button>                                                           // [!code --]
        </div>                                                               // [!code --]
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

## Pattern Polling จริง (ที่จะใช้ใน Dashboard)

```jsx
const fetchAll = useCallback(async () => {
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
}, []);   // ไม่มี dependency — fetchAll คงที่ตลอด

useEffect(() => {
  fetchAll();                               // fetch ครั้งแรกทันที
  const id = setInterval(fetchAll, 5_000); // poll ทุก 5 วินาที
  return () => clearInterval(id);          // cleanup เมื่อ unmount
}, [fetchAll]);
```

:::tip ทำไมต้อง useCallback?
ถ้า `fetchAll` ถูกสร้างใหม่ทุก render → `useEffect` จะ detect dependency เปลี่ยน → รัน effect ใหม่ → fetch loop ไม่หยุด

`useCallback` ทำให้ `fetchAll` เป็น reference เดิมตลอด → `useEffect` รันแค่ครั้งแรก
:::

## Common Errors

| Error | สาเหตุ | วิธีแก้ |
|-------|--------|---------|
| Fetch loop ไม่หยุด | `useEffect` dependency มีฟังก์ชันที่สร้างใหม่ทุก render | ห่อฟังก์ชันด้วย `useCallback` |
| Memory leak warning | ไม่มี cleanup function | เพิ่ม `return () => clearInterval(id)` |
| Effect ไม่รัน | dependency array ผิด หรือลืมใส่ | ตรวจ dependency array |
