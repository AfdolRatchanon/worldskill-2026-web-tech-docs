# บทที่ 3 — Tailwind CSS

> **บทนี้เตรียมอะไร:** เรียนรู้ utility classes ของ Tailwind CSS และ design system ที่ใช้ทั่วโปรเจ็ค — แก้ `App.jsx` ให้มี UI มีสีและ spacing เพื่อเตรียมรับ component จริงในบทที่ 9-16

## ปัญหา — Hello World ไม่มีสไตล์

บทที่ 1 ได้ Hello World ที่รันได้ แต่ยังเป็นข้อความดำบนพื้นขาวธรรมดา — ถ้าไม่มีระบบ styling ทุก component จะต้องเขียน CSS เองซึ่งช้าและ inconsistent

## ทำไมถึงใช้ Tailwind ไม่ใช่ตัวอื่น

| ตัวเลือก | เหตุผลที่ไม่ใช้ |
|---------|--------------|
| Plain CSS | เขียนนาน, ต้องตั้งชื่อ class เอง, ไฟล์ CSS โตเรื่อยๆ |
| CSS Modules | ดีกว่า plain CSS แต่ยังต้องเขียน CSS property เองทุกตัว |
| Styled Components | ต้องติดตั้งเพิ่ม, โค้ด JSX อ่านยากขึ้น |
| **Tailwind CSS** ✅ | class สำเร็จรูป, ไม่ต้องออกจาก JSX, design system ในตัว |

## Tailwind CSS คืออะไร

Tailwind คือ **utility-first CSS** — ใช้ class สำเร็จรูปแทนการเขียน CSS เอง:

```jsx
/* ❌ เขียน CSS เอง */
<div style={{ backgroundColor: '#2563eb', color: 'white', padding: '8px 16px' }}>
  Submit
</div>

/* ✅ ใช้ Tailwind class */
<div className="bg-blue-600 text-white px-4 py-2">
  Submit
</div>
```

ทุก class ทำงาน 1 อย่าง — ประกอบกันได้เลยใน `className`

## Design System ของโปรเจ็คนี้

ใช้ **Tailwind default palette เท่านั้น** ห้ามใช้ arbitrary value เช่น `text-[#333]`

### สี

| ใช้เมื่อ | Class |
|---------|-------|
| Primary button | `bg-blue-600 hover:bg-blue-700 text-white` |
| Success / Confirm | `bg-green-600 hover:bg-green-700 text-white` |
| Danger / Delete | `bg-red-600 hover:bg-red-700 text-white` |
| Ghost / Secondary | `bg-gray-100 hover:bg-gray-200 text-gray-700` |
| Page background | `bg-gray-50` |
| Card | `bg-white rounded-xl shadow-sm border border-gray-100 p-6` |
| Heading | `text-gray-900 font-bold` |
| Body text | `text-gray-600` |
| Muted text | `text-gray-400` |
| Error text | `text-red-600` |

### Status Badge

| Status | Class |
|--------|-------|
| `waiting` | `bg-gray-100 text-gray-600` |
| `open` | `bg-green-100 text-green-700` |
| `closed` | `bg-red-100 text-red-700` |
| `pending` | `bg-yellow-100 text-yellow-700` |
| `checking` | `bg-blue-100 text-blue-700` |
| `checked` | `bg-green-100 text-green-700` |

### Class ที่ใช้บ่อยๆ

| หมวด | Class | ความหมาย |
|------|-------|---------|
| Spacing | `p-4`, `px-6`, `py-2`, `gap-4`, `space-y-6` | padding, gap |
| Layout | `flex`, `grid`, `items-center`, `justify-between` | flex/grid |
| Sizing | `w-full`, `max-w-4xl`, `mx-auto` | ความกว้าง |
| Typography | `text-sm`, `text-2xl`, `font-bold`, `font-medium` | ขนาด + น้ำหนัก |
| Border | `rounded-xl`, `rounded-lg`, `border`, `border-gray-100` | มุมโค้ง |
| Shadow | `shadow-sm` | เงา |
| Hover | `hover:bg-blue-700`, `hover:bg-gray-50` | mouse ชี้ |

## ชิ้นงาน — อัปเดต App.jsx

แก้ `src/App.jsx`:

```jsx
// App.jsx — บทที่ 3 เพิ่ม Tailwind
export default function App() {
  return (                                                          // [!code --]
    <div>Hello World</div>                                         // [!code --]
  );                                                               // [!code --]
  return (                                                         // [!code ++]
    <div className="min-h-screen bg-gray-50 flex items-center justify-center"> // [!code ++]
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8"> // [!code ++]
        <h1 className="text-2xl font-bold text-gray-900">WorldSkill 2026</h1>   // [!code ++]
        <p className="text-gray-400 text-sm mt-2">Test Submission Management System</p> // [!code ++]
      </div>                                                        // [!code ++]
    </div>                                                          // [!code ++]
  );                                                               // [!code ++]
}
```

## ทดสอบ

```bash
npm run dev
```

**URL:** `http://localhost:3000`

ต้องเห็น:
- พื้นหลังสีเทาอ่อน (ไม่ใช่ขาวจัด)
- Card สีขาวกลางหน้าจอ มีเงาเบาๆ และขอบโค้ง
- ข้อความ "WorldSkill 2026" ตัวหนาสีดำ
- ข้อความ "Test Submission Management System" สีเทาขนาดเล็กกว่า

**DevTools → Elements:**
- คลิกที่ `<div>` หลัก → ด้านขวาใน Styles ต้องเห็น Tailwind class ทำงาน

## Responsive Design (ใช้ใน Dashboard)

Tailwind ใช้ breakpoint prefix เพิ่มหน้า class:

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* mobile: 1 คอลัมน์ | tablet+: 2 คอลัมน์ */}
</div>
```

| Prefix | Breakpoint |
|--------|-----------|
| (ไม่มี) | ทุกขนาด (mobile first) |
| `md:` | ≥ 768px (tablet) |
| `lg:` | ≥ 1024px (desktop) |

## Common Errors

| ปัญหา | สาเหตุ | วิธีแก้ |
|-------|--------|---------|
| Tailwind class ไม่มีผลเลย | `index.css` ไม่มี `@import "tailwindcss"` | เพิ่ม `@import "tailwindcss";` บรรทัดแรก |
| `index.css` ถูกต้องแต่ยังไม่ work | `main.jsx` ไม่ได้ `import './index.css'` | เพิ่ม import ใน `main.jsx` |
| สีใน browser ต่างจาก class ที่ใส่ | typo ใน class name | ตรวจ class ใน DevTools → Elements |
| `hover:` ไม่ทำงาน | ลืม prefix ` hover:` | ต้องเป็น `hover:bg-blue-700` ไม่ใช่ `bg-blue-hover-700` |
