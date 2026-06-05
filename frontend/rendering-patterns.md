# บทที่ 6 — Rendering Patterns

> **บทนี้เตรียมอะไร:** 3 ลีลาการ "วาด UI ตามข้อมูล" ที่โผล่ใน**ทุกหน้า**ของโปรเจ็ค — แสดงรายการด้วย `.map`, แสดงแบบมีเงื่อนไข, และสั่งให้ effect ทำงานใหม่เมื่อค่าเปลี่ยน รู้ 3 อย่างนี้แล้วอ่าน/เขียน component ไหนก็เข้าใจ

บทก่อนหน้าเรียน `useState` (ข้อมูลเปลี่ยน) และ `useEffect` (ทำงานหลัง render) มาแล้ว — บทนี้คือ "เอาข้อมูลนั้นมาวาดออกจอ" ซึ่งมีอยู่ 3 แบบหลัก

:::tip บทนี้ฝึกแบบโดด ๆ
ตัวอย่างในบทนี้เป็นโจทย์เล็ก ๆ ไม่เกี่ยวกับ TSMS — ตั้งใจให้ฝึกทีละเรื่องโดยไม่มี API/auth มากวน เข้าใจแล้วค่อยไปเจอของจริงในบท Dashboard
:::

## 1️⃣ แสดงรายการด้วย `.map()` + `key`

ข้อมูลที่เป็น **array** (เช่น รายชื่อ, รายการ task, แถวในตาราง) วาดออกจอด้วย `.map()` — แปลงแต่ละ item เป็น JSX:

```jsx
const fruits = ['🍎 Apple', '🍌 Banana', '🍊 Orange'];

function FruitList() {
  return (
    <ul>
      {fruits.map((fruit) => (
        <li key={fruit}>{fruit}</li>   // [!code highlight]
      ))}
    </ul>
  );
}
```

### ทำไมต้องมี `key`

`key` คือ "ป้ายชื่อ" ที่ทำให้ React รู้ว่าแต่ละ item คือตัวไหน — เวลา list เปลี่ยน (เพิ่ม/ลบ/สลับ) React จะแก้เฉพาะ item ที่ต่าง ไม่วาดใหม่ทั้งหมด

```jsx
// ✅ ใช้ id ที่ไม่ซ้ำเป็น key (ดีที่สุด)
{users.map((u) => <li key={u.id}>{u.full_name}</li>)}

// ⚠️ ใช้ index เป็น key — ใช้ได้ถ้า list ไม่มีการเรียง/ลบกลางทาง
{items.map((item, index) => <li key={index}>{item}</li>)}
```

:::warning ลืม key = warning + บั๊กแปลก ๆ
ถ้าไม่ใส่ `key` → Console ขึ้น `Warning: Each child in a list should have a unique "key" prop` และเวลา list เปลี่ยน อาจเกิดบั๊กที่ข้อมูลแสดงผิดแถว — **ใส่ `key` ที่ไม่ซ้ำเสมอ** (นิยมใช้ `id` จากฐานข้อมูล)
:::

ในโปรเจ็คนี้ `.map()` + `key` อยู่ทุกตาราง: `tasks.map`, `candidates.map`, `submissions.map`, `ranking.map`, `sessions.map`

## 2️⃣ แสดงแบบมีเงื่อนไข (Conditional Rendering)

วาด UI ต่างกันตามค่า — มี 3 ลีลาที่ใช้บ่อย:

### `&&` — มีก็แสดง ไม่มีก็ไม่แสดง

```jsx
{error && <p className="text-red-600">{error}</p>}
//  ↑ ถ้า error เป็นค่าว่าง ('') → ไม่ render อะไร
//    ถ้า error มีข้อความ → render <p>
```

### `? :` (ternary) — เลือก A หรือ B

```jsx
{loading ? <Spinner /> : <Button>Submit</Button>}
//         ↑ จริง → Spinner   ↑ เท็จ → Button
```

ใช้กับข้อความสั้น ๆ ก็ได้:

```jsx
<Badge status={session?.status || 'waiting'} />
{result.is_confirmed ? '✓ Confirmed' : '⏳ Pending'}
```

### `??` (nullish) — กันค่าว่าง/undefined

```jsx
<p>{status.pass_count ?? 0}</p>
//                     ↑ ถ้า pass_count เป็น null/undefined → ใช้ 0 แทน
```

:::tip `??` ต่างจาก `||` ตรงไหน
`||` มองว่า `0`, `''`, `false` เป็น "เท็จ" ด้วย — `0 || 5` ได้ `5`
`??` สนใจแค่ `null`/`undefined` — `0 ?? 5` ได้ `0` (ถูกต้องกว่าเมื่อ `0` เป็นค่าจริง เช่นคะแนน)
:::

### Empty State — pattern ที่ต้องมีทุกตาราง

list ว่าง ห้ามโชว์ตารางเปล่า ให้บอกผู้ใช้:

```jsx
{candidates.length === 0 && (
  <p className="text-gray-400 text-center">ยังไม่มีข้อมูล</p>
)}
```

โปรเจ็คจริงทำแบบนี้ใน `CandidateTable`, `RankingTable`, `SubmissionsTable` ทุกตัว

## 3️⃣ Effect ที่ทำงานใหม่เมื่อค่าเปลี่ยน

บท 5 เรียน `useEffect` ที่ fetch ตอน mount (`[]`) และ polling แล้ว — อีกแบบที่ใช้บ่อยคือ **"ค่าหนึ่งเปลี่ยน → โหลด/คำนวณใหม่"** โดยใส่ค่านั้นใน dependency array:

```jsx
const [selectedId, setSelectedId] = useState(null);
const [detail,     setDetail]     = useState(null);

useEffect(() => {
  if (selectedId === null) return;          // ยังไม่เลือก → ไม่ทำอะไร
  api.get(`/items/${selectedId}`)           // โหลดใหม่ทุกครั้งที่ selectedId เปลี่ยน
     .then((res) => setDetail(res.data.data));
}, [selectedId]);   // [!code highlight] เปลี่ยน selectedId → effect รันใหม่
```

นี่คือสิ่งที่ **Manager Dashboard** ทำจริง: มี `useEffect` ตัวที่สองที่โหลด statistics ใหม่ทุกครั้งที่ผู้ใช้เลือก session อื่น (`[selectedId, tick]`)

:::tip 1 component มี useEffect ได้หลายตัว
แยกตามหน้าที่: effect หนึ่งทำ polling, อีก effect ทำ "โหลดใหม่เมื่อเลือกเปลี่ยน" — ชัดเจนกว่ายัดรวมกัน
:::

## 🏋️ Workshop ย่อย — Name List

ฝึก 3 เรื่องในบทนี้พร้อมกันบนโจทย์เดียว (ไม่ต้องมี backend)

**โจทย์:** ทำหน้าที่มีช่องกรอกชื่อ + ปุ่ม Add → ชื่อไปต่อท้ายรายการ, แต่ละชื่อมีปุ่ม ❌ ลบได้, ถ้ายังไม่มีชื่อให้ขึ้นข้อความ "ยังไม่มีรายชื่อ"

**ต้องใช้:** `useState` (array + ช่อง input) · `.map`+`key` · `&&` (empty state) · event `onClick`/`onSubmit`

**เริ่มจากโครงนี้** (สร้างไฟล์ทดลอง `src/Playground.jsx` แล้วชี้ `App.jsx` มาที่มันชั่วคราว):

```jsx
import { useState } from 'react';

export default function Playground() {
  const [names, setNames] = useState([]);   // รายการชื่อ
  const [text,  setText]  = useState('');    // ค่าในช่องกรอก

  function addName(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setNames([...names, text.trim()]);   // เพิ่มชื่อต่อท้าย (สร้าง array ใหม่)
    setText('');                         // ล้างช่อง
  }

  function removeName(target) {
    setNames(names.filter((n) => n !== target));   // เอาออกด้วย .filter
  }

  return (
    <div className="max-w-sm mx-auto p-6">
      <form onSubmit={addName} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="border rounded px-2 py-1 flex-1"
          placeholder="พิมพ์ชื่อ"
        />
        <button className="bg-blue-600 text-white px-3 rounded">Add</button>
      </form>

      {/* TODO 1: ถ้า names ว่าง → แสดง "ยังไม่มีรายชื่อ" ด้วย && */}

      <ul className="mt-4 space-y-1">
        {/* TODO 2: .map รายชื่อ + key + ปุ่ม ❌ เรียก removeName */}
      </ul>
    </div>
  );
}
```

**ผลลัพธ์ที่ต้องเห็น:**
- เปิดมาว่าง → เห็น "ยังไม่มีรายชื่อ"
- พิมพ์ชื่อ + Add → ชื่อโผล่ในรายการ, ช่องกรอกถูกล้าง
- กด ❌ → ชื่อนั้นหายไป, ถ้าลบหมด → กลับมาเห็น "ยังไม่มีรายชื่อ"
- Console ต้อง**ไม่มี** warning เรื่อง `key`

**ท้าทายเพิ่ม (ออปชัน):** แสดงจำนวนชื่อด้วย `??` เช่น `ทั้งหมด {names.length ?? 0} คน` และกันชื่อซ้ำด้วยเงื่อนไขก่อน `setNames`

:::details เฉลย TODO
```jsx
{names.length === 0 && (
  <p className="text-gray-400 text-center mt-4">ยังไม่มีรายชื่อ</p>
)}

<ul className="mt-4 space-y-1">
  {names.map((name) => (
    <li key={name} className="flex justify-between border-b py-1">
      {name}
      <button onClick={() => removeName(name)} className="text-red-500">❌</button>
    </li>
  ))}
</ul>
```
:::

## Common Errors

| Error | สาเหตุ | วิธีแก้ |
|-------|--------|---------|
| `Each child should have a unique "key"` | ลืม `key` ใน `.map` | ใส่ `key={item.id}` (หรือค่าที่ไม่ซ้ำ) |
| list ไม่อัปเดตหลังเพิ่ม/ลบ | แก้ array เดิมตรง ๆ (`names.push`) | สร้าง array ใหม่เสมอ: `[...names, x]` / `names.filter(...)` |
| `{0 && <X/>}` โชว์เลข 0 บนจอ | ใช้ `&&` กับตัวเลข | เช็คให้เป็น boolean: `{count > 0 && <X/>}` |
| effect ไม่รันตอนเลือกเปลี่ยน | ลืมใส่ค่าใน dependency | เพิ่มค่านั้นใน `[...]` ของ `useEffect` |
