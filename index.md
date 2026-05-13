---
layout: home

hero:
  name: "WorldSkill 2026"
  text: "Web Technologies — Backend"
  tagline: "คู่มือสร้าง Backend ทีละขั้นตอน สำหรับนักเรียนที่เตรียมแข่งขัน WorldSkill Web Technologies"
  actions:
    - theme: brand
      text: เริ่มต้นที่บทที่ 1 →
      link: /01-installation
    - theme: alt
      text: Checklist แข่งขัน
      link: /29-checklist

features:
  - title: 📦 โค้ดต่อยอดทีละบท
    details: แต่ละบทเพิ่มโค้ดเพียง 2–5 บรรทัดจากบทก่อน เห็นชัดว่าเพิ่มอะไร เปลี่ยนอะไร ไม่มีโค้ดที่ต้องทิ้งทีหลัง
  - title: ✅ ทดสอบได้ทุกขั้นตอน
    details: ทุกบทมีขั้นตอนทดสอบผ่าน Postman พร้อมบอกว่าต้องเห็นอะไร ผ่านแล้วค่อยไปบทถัดไป
  - title: 🏆 เหมาะกับห้องแข่งขัน
    details: สอนผ่าน Command Line และ Postman ทั้งหมด ไม่ต้องพึ่ง extension หรือ internet ในห้องสอบ

---

## 🎯 ระบบที่จะสร้าง

**Test Submission Management System** — ระบบจัดการการส่งผลสอบสำหรับการแข่งขัน WorldSkill Web Technologies

| บทบาท | สิทธิ์ |
|-------|--------|
| 🎓 **Candidate** | เข้าสู่ระบบ ดูโจทย์ ส่ง URL แก้ไข ดูคะแนนตัวเอง |
| ⚖️ **Judge** | เปิด/ปิดการสอบ ดูรายชื่อ ตรวจซ้ำ ยืนยันคะแนน |
| 📊 **Manager** | ดูสถิติ ดู ranking export report |

## 🛠️ Tech Stack

| ส่วน | Technology | Port |
|------|-----------|------|
| 🖥️ Frontend | React + Vite + Tailwind CSS | 3000 |
| ⚙️ Backend | Node.js + Express | 8080 |
| 🗄️ Database | MariaDB | 3306 |

## 📚 สารบัญ (29 บท)

| กลุ่ม | บท | เป้าหมาย |
|------|-----|---------|
| 🔧 เตรียมระบบ | 1–3 | ติดตั้งเครื่องมือ · ภาพรวม Backend · เตรียม Project |
| ⚡ สร้าง Server | 4–10 | Express · req&res · dotenv · cors · Database & SQL · mysql2 · Checkpoint |
| 🔐 ระบบ Login | 11–14 | bcryptjs · JWT · Auth Routes · Middleware Stack |
| 🌐 Shared Endpoints | 15–16 | GET /api/config · GET /api/tasks |
| 🎓 Candidate | 17–19 | GET/POST/PUT /api/my-submission · GET /api/my-result |
| ⚖️ Judge | 20–24 | Session Control · Candidates · Submissions · Recheck · Confirm |
| 📊 Manager | 25–28 | Statistics · Ranking · Sessions · Report |
| 🏁 สรุป | 29 | Competition Checklist — ขั้นตอนเริ่มแข่งจริง |

## 📖 วิธีใช้คู่มือนี้

เรียนตามลำดับบท **อย่าข้ามบท** เพราะโค้ดแต่ละบทต่อยอดจากบทก่อนหน้า

1. สร้างไฟล์และพิมพ์โค้ดตามที่แสดงในแต่ละบท
2. ผ่านขั้นตอน **ทดสอบ** ก่อนไปบทถัดไปเสมอ
3. เมื่อเรียนครบ 28 บท จะได้ backend ที่รันได้จริงครบทุก endpoint

## 🗂️ โครงสร้างโฟลเดอร์เมื่อเรียนครบ

```
backend/
├── src/
│   ├── app.js
│   ├── config/
│   │   └── db.js
│   ├── middlewares/
│   │   ├── auth.js
│   │   ├── role.js
│   │   └── autoClose.js
│   ├── routes/          (10 ไฟล์)
│   └── controllers/     (10 ไฟล์)
├── .env
└── package.json
```

> **หมายเหตุ:** โฟลเดอร์ `database/` (schema.sql, seed.js) จะได้รับจากกรรมการตอนแข่ง ไม่ต้องเขียนเอง
