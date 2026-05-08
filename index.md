---
layout: home

hero:
  name: "WorldSkill 2026"
  text: "Web Technologies"
  tagline: "คู่มือสร้าง Backend ทีละขั้นตอน สำหรับการแข่งขัน WorldSkill Web Technologies"
  actions:
    - theme: brand
      text: เริ่มต้นที่บทที่ 1
      link: /01-installation
    - theme: alt
      text: ภาพรวมระบบ
      link: /02-intro

features:
  - title: โค้ดสมบูรณ์ 100%
    details: ทุกบรรทัดที่เขียนคือโค้ดจริงในโปรเจ็ค ไม่มีโค้ดตัวอย่างที่ต้องทิ้งทีหลัง เมื่อเรียนครบทุกบทจะได้ backend ที่รันได้จริง
  - title: ทดสอบได้ทุกขั้นตอน
    details: ทุกบทมีขั้นตอนทดสอบผ่าน Postman พร้อมบอกว่าต้องเห็นอะไร ก่อนไปบทถัดไปเสมอ
  - title: เหมาะกับห้องแข่งขัน
    details: สอนผ่าน Command Line และ Postman ทั้งหมด ไม่ต้องพึ่ง extension หรือ internet ในห้องสอบ

---

## ภาพรวมโปรเจ็ค

คู่มือนี้สอนวิธีสร้าง **Test Submission Management System** — ระบบจัดการการส่งผลสอบสำหรับการแข่งขัน WorldSkill Web Technologies

ระบบรองรับผู้ใช้ 3 บทบาท:

| บทบาท | หน้าที่ |
|-------|---------|
| **Candidate** | เข้าสู่ระบบ ดูโจทย์ ส่ง URL ติดตามสถานะ ดูคะแนน |
| **Judge** | เปิด/ปิดการสอบ ดูรายชื่อ ตรวจซ้ำ ยืนยันคะแนน |
| **Manager** | ดูสถิติ ranking และ export report |

## Tech Stack

| ส่วน | Technology | Port |
|------|-----------|------|
| Frontend | React + Vite + Tailwind CSS | 3000 |
| Backend | Node.js + Express | 8080 |
| Database | MariaDB | 3306 |

## สารบัญ

| บท | หัวข้อ | สิ่งที่จะสร้าง |
|----|--------|--------------|
| บทที่ 1 | ติดตั้งเครื่องมือ | Node.js, MariaDB, Postman, VS Code |
| บทที่ 2 | Backend คืออะไร | ภาพรวมระบบ, Data Flow |
| บทที่ 3 | เตรียม Project | package.json, .env, โครงสร้างโฟลเดอร์ |
| บทที่ 4 | Database และ Schema | schema.sql, seed.js |
| บทที่ 5 | Express Server | db.js, app.js |
| บทที่ 6 | Middlewares และ Utilities | auth.js, role.js, autoClose.js, paginate.js |
| บทที่ 7 | Auth, Config และ Tasks API | login, logout, config, tasks |
| บทที่ 8 | Submission และ Result System | submission CRUD, recheck, confirm |
| บทที่ 9 | Judge API | session control, candidates |
| บทที่ 10 | Manager API | statistics, report JSON/CSV/PDF |
| บทที่ 11 | ทดสอบระบบทั้งหมด | Full system test checklist |

## วิธีใช้คู่มือนี้

เรียนตามลำดับบท **อย่าข้ามบท** เพราะโค้ดแต่ละบทต่อยอดจากบทก่อนหน้า

1. สร้างไฟล์และพิมพ์โค้ดตามที่แสดงในแต่ละบท
2. ผ่านขั้นตอน **ทดสอบ** ก่อนไปบทถัดไปเสมอ
3. โค้ดสุดท้ายเมื่อเรียนครบ = backend จริงที่รันได้

## โครงสร้างโฟลเดอร์ที่จะได้เมื่อเรียนครบ

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
│   ├── controllers/     (10 ไฟล์)
│   └── utils/
│       └── paginate.js
├── database/
│   ├── schema.sql
│   └── seed.js
├── .env
└── package.json
```
