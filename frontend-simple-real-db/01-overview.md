# บทที่ 1 — ภาพรวม Frontend (Real DB)

> **บทนี้เตรียมอะไร:** เห็นภาพรวมว่า frontend คุยกับ `backend-real-db` ยังไง, มีกี่หน้า, และ **field ไหนเปลี่ยนตาม schema ทางการ** — บทนี้ยังไม่เขียนโค้ด แต่ต้องเข้าใจว่าทำไมหน้าตาบางอย่างต่างจากเวอร์ชันเดิม

## frontend นี้คืออะไร

`frontend-simple-real-db` = เวอร์ชัน **เรียบง่ายเพื่อการเรียน** (ไม่มี CSS, ไม่มี countdown UI, 9 ไฟล์) ที่ต่อกับ `backend-real-db` — โครงเหมือน `frontend-simple` เดิม แต่ปรับ field/สถานะให้ตรง schema ทางการ + แสดง `candidate_code`

| หน้า | role | ใช้ endpoint |
|------|------|-------------|
| Login | ทุกคน | `POST /login` |
| Candidate | candidate | `/config`, `/tasks`, `/my-submission`, `/my-result` |
| Judge | judge | `/config`, `/candidates`, `/submissions`, `/session/*`, recheck, confirm |
| Manager | manager | `/statistics/*`, `/report` |

::: tip มีอีกตัวที่ "พร้อมแข่ง"
โฟลเดอร์ `frontend-real-db` (คนละตัว) คือเวอร์ชันพร้อมแข่งที่ทำครบเกณฑ์ (responsive + accessibility + countdown timer) — คู่มือนี้สอน **ตัว simple** เพื่อเข้าใจ logic ก่อน
:::

## จุดที่ต่างจากเวอร์ชันเดิม (สำคัญ!)

| เรื่อง | เวอร์ชันเดิม | Simple Real DB |
|-------|------------|---------|
| สถานะ session | `waiting`/`open`/`closed` + นับถอยหลัง | `initialized`/`active`/`closed` — โชว์แค่สถานะ (backend จับเวลา/auto-close ให้) |
| คะแนน candidate | frontend_score + backend_score + total_score | **`score` ตัวเดียว** / 100 |
| ยืนยันแล้ว? | `is_confirmed` (true/false) | `status === 'confirmed'` |
| รหัสผู้เข้าแข่ง | — | **`candidate_code`** (อ่านจาก token / API) แสดงทุกตาราง |
| ตาราง judge | `total_score`, `is_confirmed` | `score`, `result_status` |
| Manager เลือก session | มี dropdown ย้อนหลัง | **ไม่มี** (single-session — สถิติเป็นภาพรวม) |
| ranking | 3 คอลัมน์คะแนน | คอลัมน์ `score` เดียว (ผ่าน ≥ 50) |

## Pattern 5 ส่วน (ทุกหน้าเหมือนกัน)

```jsx
export default function SomePage() {
  // 1. state              ← ข้อมูลที่หน้าจอใช้
  // 2. loadData()         ← ยิง API เก็บใส่ state
  // 3. useEffect          ← โหลดตอนเปิดหน้า + ทุก 5 วิ (polling)
  // 4. ฟังก์ชัน action      ← กดปุ่มแล้วทำอะไร
  // 5. return JSX         ← หน้าจอ
}
```

จำ pattern เดียว อ่านได้ทั้ง 3 dashboard

## เตรียมตัว

ต้องมี **`backend-real-db` รันอยู่ที่ port 8080** ก่อน (ดู [Backend บทที่ 25](/backend-real-db/25-checklist)) แล้วค่อยเริ่มบทที่ 2 สร้างโปรเจกต์ frontend
