# บทเสริม 3 — Design System + Responsive + Accessibility

> **บทนี้คืออะไร:** "เปลือก" ของเวอร์ชันพร้อมแข่ง — ไฟล์ `src/styles.css` ไฟล์เดียว (CSS ธรรมดา) + วิธีเขียน JSX ให้เข้าถึงได้ (a11y) ไม่ต้องท่องทั้งไฟล์ เข้าใจ "แนวคิด + คลาสหลัก" พอ แล้วเปิดไฟล์จริงดูตอนใช้

## ทำไมใช้ CSS ธรรมดา (ไม่ใช่ Tailwind/CDN)

กติกา RSC2026 = **ออฟไลน์ 100%** ห้ามโหลด CDN/ฟอนต์ภายนอก → ใช้ไฟล์ `styles.css` ไฟล์เดียว + `system font stack` (ฟอนต์ในเครื่อง) จบในตัว ไม่ต้องติดตั้งอะไรเพิ่ม

## 1. Design tokens — `:root` variables

ประกาศสี/ขนาดไว้ที่เดียว แล้วใช้ซ้ำทั้งไฟล์ (แก้ที่เดียวเปลี่ยนทั้งระบบ):

```css
:root {
  --bg: #eef1f5;  --surface: #fff;  --text: #16202e;  --muted: #51607a;
  --primary: #1d4ed8;  --danger: #b42318;  --success: #15803d;  --warn: #b25e00;
  --border: #cdd5e0;  --radius: 10px;
  --shadow: 0 1px 3px rgba(16,32,46,.08), 0 1px 2px rgba(16,32,46,.06);
  --font: -apple-system, "Segoe UI", Roboto, "Noto Sans Thai", sans-serif; /* ฟอนต์ในเครื่อง */
}
```

## 2. คลาสหลักที่ใช้ทุกหน้า

| คลาส | ใช้ทำ |
|------|------|
| `.app-header` / `.container` / `.stack` | โครงหน้า (แถบบน + กล่องกลาง + เว้นระยะแนวตั้ง) |
| `.card` | กล่องเนื้อหา (เงา + ขอบมน) |
| `.btn` `.btn--secondary` `.btn--danger` `.btn--sm` | ปุ่มแบบต่างๆ |
| `.field` + `label` + `input` | ฟอร์ม (label อยู่บน input) |
| `.badge badge--<status>` | ป้ายสถานะสีตามค่า (active/closed/pending/confirmed…) |
| `.stat` + `.grid` | การ์ดตัวเลขสรุป (หน้า Manager) |
| `.table-wrap` + `table.data` | ตาราง (เลื่อนแนวนอนได้บนจอเล็ก) |
| `.alert alert--error/info` | กล่องแจ้งเตือน |
| `.timer timer--warn/over` | นาฬิกานับถอยหลัง (บทเสริม 2) |

ตัวอย่าง badge ที่เปลี่ยนสีตามสถานะ (ใช้ทั้ง Judge/Manager/Candidate):

```jsx
<span className={`badge badge--${session.status}`}>{session.status}</span>
```
```css
.badge--active, .badge--confirmed   { background: var(--success-bg); color: var(--success); }
.badge--closed, .badge--fail        { background: var(--danger-bg);  color: var(--danger); }
.badge--initialized, .badge--pending, .badge--submitted { background: var(--warn-bg); color: var(--warn); }
```

## 3. Responsive

ใช้ `max-width` + `margin:auto` ให้เนื้อหาอยู่กลางจอใหญ่ และ `@media` ปรับบนจอเล็ก:

```css
.container { max-width: 1100px; margin: 0 auto; padding: 1.25rem; }
.grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
.table-wrap { overflow-x: auto; }   /* ตารางกว้าง → เลื่อนแนวนอนแทนล้นจอ */

@media (max-width: 640px) {
  .timer { font-size: 1.6rem; }
  .btn { width: 100%; }            /* ปุ่มเต็มความกว้างบนมือถือ */
}
```

`.grid` แบบ `auto-fit / minmax` = การ์ดเรียงเองตามความกว้างจอ ไม่ต้องเขียน breakpoint เยอะ

## 4. Accessibility (WCAG 2.1) — เขียน JSX ยังไง

| เทคนิค | ตัวอย่าง | ช่วยอะไร |
|--------|---------|---------|
| Semantic HTML | `<header> <main> <section> <article>` | โครงสร้างสื่อความหมายต่อ screen reader |
| ผูกหัวข้อกับ section | `<section aria-labelledby="x"> <h2 id="x">` | บอกว่า section นี้คืออะไร |
| label ผูก input | `<label htmlFor="username">` + `<input id="username">` | คลิก label โฟกัส input + SR อ่านชื่อช่อง |
| ประกาศ error สด | `<p role="alert" aria-live="assertive">` | SR อ่าน error ทันทีที่ขึ้น |
| อัปเดตที่เปลี่ยนเรื่อยๆ | `<p aria-live="polite">` (นาฬิกา) | SR อ่านค่าใหม่แบบไม่ขัดจังหวะ |
| ตาราง | `<th scope="col">` + `<caption className="visually-hidden">` | บอกหัวคอลัมน์ + ชื่อตารางให้ SR |
| โฟกัสคีย์บอร์ด | `:focus-visible { outline: 3px solid ... }` | เห็นว่ากำลังโฟกัสอะไร (กด Tab) |
| ซ่อนแต่ SR อ่านได้ | คลาส `.visually-hidden` | ใส่ caption/หัวข้อให้ SR โดยไม่กินพื้นที่จอ |

ตัวอย่างฟอร์ม login ที่เข้าถึงได้:

```jsx
<form onSubmit={handleSubmit} noValidate>
  <div className="field">
    <label htmlFor="username">Username</label>
    <input id="username" autoComplete="username" required aria-required="true"
           value={username} onChange={(e) => setUsername(e.target.value)} />
  </div>
  {error && <p className="alert alert--error" role="alert" aria-live="assertive">{error}</p>}
  <button className="btn" type="submit" disabled={loading}>
    {loading ? 'Signing in…' : 'Sign In'}
  </button>
</form>
```

::: tip คลาส `.visually-hidden`
```css
.visually-hidden { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); }
```
ใช้ใส่ `<caption>`/`<h2>` ที่ต้องมีเพื่อ a11y แต่ไม่อยากให้เห็นบนจอ
:::

## สรุป — อัปเกรด simple → พร้อมแข่ง

1. เพิ่มไฟล์ `src/styles.css` + `import './styles.css'` ใน `main.jsx`
2. เปลี่ยน `<div>`/`<input>` เปลือยๆ ใน 4 หน้า → ใส่ `className` + semantic tag + `aria-*` + `<label htmlFor>`
3. (หน้า Candidate) เพิ่ม countdown timer ตาม [บทเสริม 2](/frontend-simple-real-db/12-realdb-timer)

logic API ทั้งหมด **ไม่เปลี่ยน** — ดูโค้ดเต็มได้ที่ `frontend-real-db/src/styles.css` และ `src/pages/*.jsx`
