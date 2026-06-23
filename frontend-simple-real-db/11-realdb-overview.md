# บทเสริม 1 — ภาพรวม frontend-real-db (เวอร์ชันพร้อมแข่ง)

> **บทนี้คืออะไร:** แนะนำโฟลเดอร์ `frontend-real-db/` — เวอร์ชัน "พร้อมแข่ง" ที่ต่อยอดจาก `frontend-simple-real-db` ให้ครบเกณฑ์การแข่งจริง เรียน **ตัว simple ให้แม่นก่อน** (บท 1–10) แล้วค่อยมาดูบทเสริมชุดนี้ว่าเพิ่มอะไรบ้าง

::: tip ทำไมแยกเป็นบทเสริม
logic การคุย API + pattern 5 ส่วน **เหมือนตัว simple ทุกอย่าง** — ตัวพร้อมแข่งแค่เพิ่ม "เปลือก" (หน้าตา + การเข้าถึง + นับเวลา) ทับลงไป จึงเรียนทีหลังได้ ไม่ต้องจำใหม่
:::

## simple vs พร้อมแข่ง

| เรื่อง | `frontend-simple-real-db` (main) | `frontend-real-db` (เสริม) |
|-------|------------|------------|
| โครงไฟล์ / logic API | ✅ เหมือนกัน | ✅ เหมือนกัน |
| หน้าตา | HTML เปลือยๆ ไม่มี CSS | **Design system** (`styles.css`) — การ์ด, ตาราง, badge, ปุ่ม |
| Responsive | ❌ | ✅ ใช้ได้ทั้ง desktop/mobile (`@media`) |
| Accessibility | ❌ | ✅ semantic + aria + label + focus (WCAG 2.1) |
| Countdown timer | ❌ (โชว์แค่ status) | ✅ นับถอยหลัง HH:MM:SS (ใช้ `remaining_seconds`) |
| Error/Notice | `alert()` | ข้อความ inline + `aria-live` |

## 3 เสาหลักที่เพิ่มเข้ามา

1. **Design system + Responsive** — ไฟล์ `src/styles.css` ไฟล์เดียว (CSS ธรรมดา ไม่มี Tailwind/CDN — ออฟไลน์ 100%) → [บทเสริม 3](/frontend-simple-real-db/13-realdb-styling-a11y)
2. **Accessibility (WCAG)** — semantic HTML, `aria-*`, label ผูก input, focus มองเห็นชัด → [บทเสริม 3](/frontend-simple-real-db/13-realdb-styling-a11y)
3. **Countdown timer** — นับเวลาสอบถอยหลัง (ต้องใช้คู่กับ [backend บทเสริม 26](/backend-real-db/26-session-timer) ที่ส่ง `remaining_seconds`) → [บทเสริม 2](/frontend-simple-real-db/12-realdb-timer)

## โครงไฟล์ (ต่างจาก simple แค่ `styles.css`)

```
frontend-real-db/
├── .env                 ← VITE_API_URL (เหมือน simple)
├── index.html
└── src/
    ├── main.jsx         ← import './styles.css'  ← จุดเดียวที่เพิ่ม
    ├── styles.css       ← 🆕 design system ทั้งหมด
    ├── App.jsx · api.js · auth.js   ← เหมือน simple
    └── pages/           ← Login/Candidate/Judge/Manager (logic เดิม + className + aria)
```

`src/main.jsx` เพิ่มบรรทัดเดียว:

```jsx
import './styles.css'; // โหลด design system (responsive + accessibility)
```

## รัน

เป็นคนละโฟลเดอร์กับ simple (ใช้ port 3000 เหมือนกัน — รันทีละตัว):

```bash
cd frontend-real-db
npm install
npm run dev
```

`.env` ใช้ `VITE_API_URL` เหมือน simple (ดู [บท 4](/frontend-simple-real-db/04-api)) — ชี้ไป backend-real-db ที่ port 8080

::: warning ของจริงใน 2 โฟลเดอร์
`frontend-simple-real-db` (สอนใน main) กับ `frontend-real-db` (บทเสริมชุดนี้) เป็นคนละ repo — แชร์ logic เดียวกัน ต่างที่เปลือก เลือกใช้ตัวใดตัวหนึ่งตอนแข่ง
:::

ไปต่อ [บทเสริม 2 — Countdown Timer](/frontend-simple-real-db/12-realdb-timer)
