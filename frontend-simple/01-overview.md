# บทที่ 1 — ภาพรวม Frontend Simple

> **บทนี้เตรียมอะไร:** ทำความรู้จัก `frontend-simple` — เวอร์ชันเรียบง่ายที่สุดของระบบ TSMS ที่**ฟีเจอร์ครบเหมือนตัวเต็มทุกอย่าง** แต่เหลือไฟล์แค่ 9 ไฟล์ ไม่มี CSS เลยสักบรรทัด — เหมาะสำหรับคนที่ยังไม่เคยเขียน React มาก่อน

## ทำไมต้องมีเวอร์ชัน Simple

Frontend ตัวเต็มมี 24 ไฟล์ — แยก component ย่อย, ใช้ Tailwind CSS, ใช้ Context API ซึ่ง**ดีสำหรับงานจริง** แต่สำหรับคนเพิ่งเริ่ม การต้องกระโดดข้ามไฟล์ไปมา 5–6 ไฟล์เพื่อเข้าใจหน้าเดียว ทำให้จับใจความยาก

`frontend-simple` แก้ปัญหานี้ด้วยหลักการเดียว: **อ่านบนลงล่างจบในไฟล์เดียว**

| เรื่อง | ตัวเต็ม (`frontend/`) | ตัวนี้ (`frontend-simple/`) |
|-------|----------------------|---------------------------|
| จำนวนไฟล์ใน `src/` | 24 ไฟล์ | 9 ไฟล์ |
| CSS | Tailwind CSS | **ไม่มีเลย** — HTML เพียวๆ |
| ข้อมูล user | Context API (`AuthContext`) | ฟังก์ชันธรรมดาใน `auth.js` |
| Component | แยกย่อย (Button, Card, Badge…) | เขียน JSX ตรงๆ ในหน้า |
| API URL | อ่านจากไฟล์ `.env` | เขียนตรงๆ ใน `api.js` |
| โหลดข้อมูล | `Promise.all` (ยิงขนานกัน) | `await` ทีละบรรทัด |
| Hook ที่ใช้ | useState, useEffect, useContext, custom hook | **useState + useEffect เท่านั้น** |

::: tip ฟีเจอร์ไม่ได้หายไปไหน
ทั้ง 2 เวอร์ชันใช้ **backend ตัวเดียวกัน เรียก API ครบทุกเส้นเหมือนกัน** — login 3 role, ส่ง/แก้ submission, เปิด/ปิด session, re-check, confirm, statistics, export ครบหมด ต่างกันแค่ "วิธีเขียน" เท่านั้น
:::

## โครงสร้างไฟล์ทั้งหมด

```
frontend-simple/
├── index.html              ← หน้า HTML เปล่าๆ มี <div id="root">
├── package.json            ← รายการ library ที่ใช้
├── vite.config.js          ← ตั้งค่า Vite (port 3000)
└── src/
    ├── main.jsx            ← จุดเริ่มต้น — เอา <App /> ไปวาดใน root
    ├── App.jsx             ← เส้นทาง (routing) + ProtectedRoute
    ├── auth.js             ← จัดการ token (เก็บ/อ่าน/ลบ)
    ├── api.js              ← axios + interceptor คุยกับ backend
    └── pages/
        ├── Login.jsx           ← หน้า login
        ├── CandidatePage.jsx   ← หน้าผู้เข้าแข่งขัน
        ├── JudgePage.jsx       ← หน้ากรรมการ
        └── ManagerPage.jsx     ← หน้าผู้จัดการแข่งขัน
```

## หัวใจของทั้งโปรเจกต์ — Pattern 5 ส่วน

ทุกหน้า dashboard (Candidate, Judge, Manager) เรียงโค้ด**แบบเดียวกันเป๊ะ**:

```
1. state                ← ข้อมูลที่หน้าจอต้องใช้ (useState)
2. ฟังก์ชันโหลดข้อมูล      ← loadData() ยิง API แล้วเก็บใส่ state
3. useEffect            ← เรียก loadData ตอนเปิดหน้า + ทุก 5 วินาที (polling)
4. ฟังก์ชัน action        ← กดปุ่มแล้วทำอะไร (submit, open session, export ฯลฯ)
5. return JSX           ← หน้าจอ
```

จำ pattern นี้อันเดียว → อ่านได้ทั้ง 3 หน้า เพราะต่างกันแค่ "เรียก API เส้นไหน" กับ "มีปุ่มอะไรบ้าง"

## ระบบทำอะไรได้บ้าง (ทบทวนสั้นๆ)

| Role | ทำอะไรได้ |
|------|----------|
| **candidate** | ดูโจทย์, ส่ง/แก้ URL ผลงาน, ดูคะแนนตัวเอง |
| **judge** | เปิด/ปิด session, สั่งตรวจซ้ำ (re-check), ยืนยันคะแนน (confirm) |
| **manager** | ดูสถิติ + อันดับคะแนน, เลือกดู session ย้อนหลัง, export รายงาน (อ่านอย่างเดียว) |

## ลำดับบทในหมวดนี้

| บท | เนื้อหา | ไฟล์ที่ได้ |
|----|--------|----------|
| 2 | สร้างโปรเจกต์ | `package.json`, `vite.config.js`, `index.html`, `main.jsx` |
| 3 | จัดการ token | `auth.js` |
| 4 | คุยกับ backend | `api.js` |
| 5 | เส้นทาง + ยามเฝ้าประตู | `App.jsx` |
| 6 | หน้า Login | `pages/Login.jsx` |
| 7 | หน้า Candidate | `pages/CandidatePage.jsx` |
| 8 | หน้า Judge | `pages/JudgePage.jsx` |
| 9 | หน้า Manager | `pages/ManagerPage.jsx` |
| 10 | ทดสอบทั้งระบบ + ไปต่อตัวเต็ม | — |

::: warning ต้องมี Backend รันอยู่ก่อน
ทุกบทตั้งแต่บทที่ 6 เป็นต้นไปต้องมี backend รันที่ port 8080 และ MariaDB ที่ port 3306 — ถ้ายังไม่ได้ทำ ให้ไปทำตามหมวด Backend ให้จบก่อน หรือรันตัวที่ทำเสร็จแล้วด้วย `cd backend && npm run dev`
:::
