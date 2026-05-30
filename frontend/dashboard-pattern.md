# บทที่ 12 — Dashboard Pattern (สูตรสำเร็จ)

> **บทนี้เตรียมอะไร:** ก่อนสร้าง Dashboard จริง — ทำความรู้จักกับ **2 Pattern** ที่ใช้ซ้ำใน **ทุก Dashboard** ในระบบนี้ รู้จัก 2 อย่างนี้ → สร้าง Candidate, Judge, Manager Dashboard ได้ทั้งหมด

Candidate, Judge, Manager Dashboard ต่างก็สร้างจาก pattern เดียวกัน — เหมือนที่ Backend ทุก endpoint ใช้ `authenticate → authorize → controller` เหมือนกันหมด

## Anchor 1 — useAuth()

เหมือน `authenticate` middleware ใน Backend ที่อ่าน token แล้วส่ง `req.user` ต่อให้ controller

```jsx
// ทุก Dashboard เขียนบรรทัดนี้บรรทัดแรกเสมอ
const { user, logout } = useAuth()
```

| ค่าที่ได้ | ตัวอย่าง | ใช้ที่ |
|----------|---------|--------|
| `user.id` | `3` | ส่งไปกับ API request อัตโนมัติผ่าน token |
| `user.username` | `"candidate01"` | แสดงใน header |
| `user.role` | `"candidate"` | ตรวจสิทธิ์ใน ProtectedRoute |
| `user.full_name` | `"Alice Johnson"` | แสดงใน header ทุกหน้า |
| `logout()` | — | ล้าง localStorage + redirect ไป `/login` |

`useAuth()` ทำงานได้เพราะ `AuthProvider` ห่อ App ทั้งหมดไว้ตั้งแต่ main.jsx — ไม่ต้อง pass `user` เป็น props ทีละชั้น

## Anchor 2 — Fetch-Poll-Display Pattern

เหมือน `Route → Controller → pool.execute() → res.json()` ใน Backend — เรียนครั้งเดียว ใช้ทุก Dashboard

```jsx
const [data, setData]   = useState(null) // เก็บข้อมูลที่ได้จาก API
const [tick, setTick]   = useState(0)    // counter สำหรับ trigger refresh

useEffect(() => {
  async function fetchAll() {
    try {
      const res = await api.get('/endpoint')
      setData(res.data.data)              // บันทึกข้อมูล → React re-render
    } catch (err) {
      console.error('Failed to fetch:', err)
    }
  }
  fetchAll()                                // fetch ทันทีตอน component mount
  const id = setInterval(fetchAll, 5_000)  // fetch ซ้ำทุก 5 วินาที
  return () => clearInterval(id)           // หยุด polling เมื่อ component unmount
}, [tick])  // tick เพิ่ม → effect รันใหม่ → fetchAll รันทันที
```

### 3 Dashboard ใช้ pattern เดิม ต่างกันแค่ endpoint

| Dashboard | Endpoints ที่ fetch |
|-----------|-------------------|
| Candidate | `/config`, `/tasks`, `/my-submission`, `/my-result` |
| Judge | `/config`, `/candidates`, `/submissions` |
| Manager | `/sessions` แยก + `/statistics/summary`, `/statistics/ranking`, `/statistics/status` |

### เมื่อ Child ทำ Action → Refresh ทันที

```jsx
// Dashboard ส่ง callback ให้ child
<SubmissionForm onUpdate={() => setTick(t => t + 1)} />

// Child เรียก onUpdate หลัง submit สำเร็จ → tick เพิ่ม → fetchAll รัน
```

ไม่ต้องรอ 5 วินาที — ข้อมูลอัปเดตทันทีหลังกด Submit, Re-check, Confirm

## Component Communication

**Props ลงไป — Callback ขึ้นมา**

```
Dashboard (Parent)
    │
    ├── ส่งข้อมูลลงผ่าน props ───────────────────→ Component (Child)
    │   submission={submission}                      ใช้ข้อมูลแสดงผล
    │   sessionOpen={session?.status === 'open'}
    │
    └── รับ event กลับผ่าน callback ←─────────────── Component (Child)
        onUpdate={() => setTick(t => t+1)}           เรียก onUpdate() หลัง action สำเร็จ
```

```jsx
// Parent — Dashboard
<SubmissionForm
  submission={submission}                // props ลงไป
  sessionOpen={session?.status === 'open'}
  onUpdate={() => setTick(t => t + 1)}  // callback ขึ้นมา
/>

// Child — SubmissionForm
export default function SubmissionForm({ submission, sessionOpen, onUpdate }) {
  async function handleSubmit(e) {
    e.preventDefault()   // ป้องกัน browser reload หน้าเมื่อกด submit
    await api.post('/my-submission', { ... })
    onUpdate()           // แจ้ง parent → tick++ → fetchAll รัน
  }
}
```

:::tip กฎ Component Communication
- **Parent** เก็บ state และ fetch ข้อมูล
- **Child** แสดงผลและส่ง event กลับขึ้นมา
- Child ไม่เคย fetch ข้อมูลเอง — รับมาจาก parent เสมอ (ยกเว้น SessionControl ที่ต้อง call API action)
:::

## โครงสร้าง HTML ทุก Dashboard

```jsx
<div className="min-h-screen bg-gray-50">

  {/* Header — เหมือนกันทุกหน้า เปลี่ยนแค่ชื่อ */}
  <header className="bg-white border-b border-gray-100 px-6 py-4">
    <div className="max-w-5xl mx-auto flex justify-between items-center">
      <div>
        <h1 className="font-bold text-gray-900">Judge Dashboard</h1>
        <p className="text-sm text-gray-400">{user?.full_name}</p>
      </div>
      <Button variant="ghost" onClick={logout}>Logout</Button>
    </div>
  </header>

  {/* Main — เนื้อหาแตกต่างตาม role */}
  <main className="max-w-5xl mx-auto p-6 space-y-6">
    <Card>
      <SomeComponent data={data} onUpdate={() => setTick(t => t + 1)} />
    </Card>
  </main>

</div>
```

:::tip max-w-4xl vs max-w-5xl
- Candidate Dashboard ใช้ `max-w-4xl` (แคบกว่า — เนื้อหาน้อย)
- Judge และ Manager ใช้ `max-w-5xl` (กว้างกว่า — มีตาราง)
:::

## สรุป — Checklist สร้าง Dashboard ใหม่

ทุกครั้งที่สร้าง Dashboard ใหม่ — ทำตามลำดับนี้:

```
☐ 1. import { useState, useEffect } from 'react'
☐ 2. import api + useAuth + Card + Button + components ที่ต้องใช้
☐ 3. const { user, logout } = useAuth()           ← Anchor 1
☐ 4. useState สำหรับแต่ละ data + const [tick, setTick] = useState(0)
☐ 5. useEffect + fetchAll + setInterval + [tick]  ← Anchor 2
☐ 6. Copy โครงสร้าง header (เปลี่ยนแค่ชื่อ)
☐ 7. เพิ่ม Card + Component ใน main
☐ 8. ส่ง onUpdate={() => setTick(t => t+1)} ให้ component ที่ต้อง trigger refresh
```
