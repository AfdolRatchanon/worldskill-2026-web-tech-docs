# บทที่ 10 — ทดสอบทั้งระบบ + ไปต่อตัวเต็ม

> **บทนี้เตรียมอะไร:** ไล่ทดสอบ flow จริงครบทั้ง 3 role ตั้งแต่เปิด session จนถึง export รายงาน แล้วปิดท้ายด้วยแผนที่ "จาก simple ไปตัวเต็ม" — อ่านตัวเต็มยังไงให้เข้าใจว่าแต่ละอย่างที่เพิ่มมาแก้ปัญหาอะไร

## เตรียมระบบ

```bash
# Terminal 1 — backend (ต้องมี MariaDB รันอยู่)
cd backend && npm run dev

# Terminal 2 — frontend-simple
cd frontend-simple && npm run dev
```

ถ้าต้องการเริ่มจากข้อมูลสะอาด: `cd backend && npm run seed`

## Flow ทดสอบฉบับเต็ม — เล่นเป็น 3 role พร้อมกัน

เปิด browser 3 หน้าต่าง (ใช้โหมดไม่ระบุตัวตน/โปรไฟล์แยกกัน เพราะ token เก็บใน localStorage แยกตามหน้าต่างไม่ได้ถ้าอยู่โปรไฟล์เดียวกัน):

### รอบที่ 1 — เริ่มการแข่งขัน

| # | หน้าต่าง | ทำอะไร | คาดหวัง |
|---|---------|--------|---------|
| 1 | Judge | login `judge01`/`judge123` | เข้า dashboard, session เป็น `waiting` |
| 2 | Candidate | login `candidate01`/`cand123` | ฟอร์มส่งงานกดไม่ได้ (session ยังไม่เปิด) |
| 3 | Judge | กด **Open Session** | สถานะเป็น `open` |
| 4 | Candidate | รอ ≤ 5 วินาที | ฟอร์มกดได้เอง ไม่ต้อง refresh (polling!) เห็นเวลานับถอยหลัง |

### รอบที่ 2 — ส่งงานและตรวจ

| # | หน้าต่าง | ทำอะไร | คาดหวัง |
|---|---------|--------|---------|
| 5 | Candidate | กรอก URL (ต้องขึ้นต้น `http://`) แล้ว Submit | alert "Submitted!" ปุ่มเปลี่ยนเป็น Update Submission |
| 6 | Candidate | ลองกรอก URL ไม่มี `http://` แล้ว Update | alert ข้อความ error จาก backend (URL validation) |
| 7 | Judge | ดูตาราง Candidates | เห็นงานของ candidate01 สถานะ `pending` |
| 8 | Judge | กด **Re-check** | ปุ่มเป็น Checking... → ~5 วิ → สถานะ `checked` + คะแนน |
| 9 | Judge | กด **Confirm** | ขึ้น ✓ Confirmed ปุ่มหายไป |
| 10 | Candidate | รอ ≤ 5 วินาที | คะแนนขึ้น "✓ Confirmed by judge" |

### รอบที่ 3 — ดูสถิติและปิดการแข่งขัน

| # | หน้าต่าง | ทำอะไร | คาดหวัง |
|---|---------|--------|---------|
| 11 | Manager | login `manager01`/`manager123` | เห็น summary, ranking มี candidate01 |
| 12 | Manager | กด **Export CSV** และ **Export JSON** | ได้ไฟล์ดาวน์โหลดทั้งคู่ |
| 13 | Judge | กด **Close Session** → OK | สถานะ `closed` |
| 14 | Candidate | รอ ≤ 5 วินาที | ฟอร์มกดไม่ได้ ขึ้น Session closed |

### ทดสอบความปลอดภัย (ProtectedRoute)

| # | ทำอะไร | คาดหวัง |
|---|--------|---------|
| 15 | เป็น candidate แล้วพิมพ์ URL `/judge` ตรงๆ | เด้งกลับ `/login` |
| 16 | กด Logout แล้วกด Back ของ browser | เด้งกลับ `/login` (token ถูกลบแล้ว) |

ผ่านครบ 16 ข้อ = ระบบสมบูรณ์ 🎉

## สรุป Concept ที่ได้เรียนทั้งหมด

| # | Concept | เรียนที่บท |
|---|---------|----------|
| 1 | Props + children | 5 (ProtectedRoute) |
| 2 | useState | 6 |
| 3 | Controlled input | 6 |
| 4 | Conditional rendering | 6, 8 |
| 5 | useEffect + cleanup | 7 |
| 6 | Polling | 7 |
| 7 | async/await + axios | 4, 6–9 |
| 8 | localStorage + JWT | 3 |
| 9 | react-router | 5, 6 |
| 10 | Axios interceptor | 4 |
| 11 | List rendering (`.map()` + `key`) | 8, 9 |
| 12 | Dependency array แบบมีค่า | 9 |
| 13 | ดาวน์โหลดไฟล์ผ่าน blob | 9 |

## ไปต่อ — อ่าน Frontend ตัวเต็มให้รู้เรื่อง

ตอนนี้กลับไปเปิด `frontend/` (ตัวเต็ม) — ทุกอย่างที่ต่างออกไปคือการ "อัปเกรด" จากสิ่งที่เราเพิ่งเขียน โดยแต่ละอย่างมาแก้ปัญหาจริง:

| ตัวเต็มเพิ่มอะไร | มาแก้ปัญหาอะไรของเวอร์ชัน simple | อ่านต่อที่ |
|----------------|--------------------------------|-----------|
| **Tailwind CSS** | หน้าตา browser default ใช้แข่ง/ส่งลูกค้าไม่ได้ | บทที่ 3 (Frontend) |
| **AuthContext** | `getUser()` ต้อง import ทุกหน้า และถ้า user เปลี่ยนหน้าจอไม่อัปเดตเอง | บทที่ 10 (Frontend) |
| **Component ย่อย** (Button, Card, Badge) | ปุ่ม 20 ปุ่มหน้าตาเหมือนกัน — แก้สีทีต้องแก้ 20 จุด | บทที่ 11 (Frontend) |
| **`Promise.all`** | `await` ทีละบรรทัดยิง API เรียงคิว — ช้ากว่ายิงพร้อมกัน 4 เท่า | บทที่ 14 (Frontend) |
| **CountdownTimer แบบวินาที** | "about X minutes" หยาบไป — การแข่งจริงต้องเห็น HH:MM:SS | บทที่ 15 (Frontend) |
| **Response interceptor (401)** | ถ้า token หมดอายุกลางทาง ผู้ใช้เจอ error เงียบๆ ไม่รู้ต้องทำอะไร | บทที่ 7 (Frontend) |
| **ไฟล์ `.env`** | URL backend ฝังในโค้ด — ย้ายเครื่อง/deploy ต้องแก้โค้ด | บทที่ 1 (Frontend) |

::: tip วิธีอ่านตัวเต็มที่แนะนำ
เปิด 2 หน้าจอเทียบกัน: `frontend-simple/src/pages/CandidatePage.jsx` กับ `frontend/src/pages/candidate/Dashboard.jsx` แล้วไล่หาว่าโค้ดท่อนเดียวกันย้ายไปอยู่ไหน — ฟอร์มอยู่ใน `SubmissionForm.jsx`, คะแนนอยู่ใน `ResultCard.jsx` — logic ข้างในเหมือนเดิมเกือบทุกบรรทัด แค่ถูกจัดบ้านใหม่
:::
