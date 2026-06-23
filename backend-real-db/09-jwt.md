# บทที่ 9 — jsonwebtoken (JWT)

> **บทนี้เตรียมอะไร:** เข้าใจว่า JWT (บัตรผ่าน) ทำงานยังไง ก่อนเอาไปใช้จริงตอน login บทที่ 10 — บทนี้เน้นแนวคิด + รูปแบบ token ที่ระบบเราใช้

## ปัญหาที่ JWT แก้

HTTP เป็นแบบ "ขอแล้วจบ" จำไม่ได้ว่าใครเคย login — แล้วจะรู้ได้ไงว่า request ถัดไปคือใคร? คำตอบคือ **หลัง login สำเร็จ server แจก token** ให้ client เก็บไว้ แล้วแนบมาทุก request เหมือนบัตรผ่าน

## หน้าตา JWT

token เป็นข้อความ 3 ส่วนคั่นด้วยจุด `xxxxx.yyyyy.zzzzz`

| ส่วน | คือ |
|------|-----|
| Header | บอกชนิด/อัลกอริทึม |
| **Payload** | ข้อมูล user (เราใส่ id, username, role, full_name, candidate_code) |
| Signature | ลายเซ็นจาก `JWT_SECRET` — กันการปลอม |

## payload ที่ระบบเราใช้

ตอนสร้าง token เราจะใส่ข้อมูลนี้ลงไป:

```js
{ id, username, role, full_name, candidate_code }
```

`candidate_code` = รหัสผู้เข้าแข่ง (เช่น `C01`) — เป็น `null` สำหรับ judge/manager · ฝั่ง frontend อ่านจาก token มาแสดงได้เลย

ทำไมต้องมี `role`? เพราะ middleware จะใช้ `role` ตัดสินว่า user คนนี้เข้า endpoint ของ judge/manager ได้ไหม (บทที่ 11)

## คำสั่งหลัก 2 ตัว

```js
const jwt = require('jsonwebtoken');

// 1) สร้าง token ตอน login สำเร็จ
const token = jwt.sign(
  { id: 3, username: 'candidate1', role: 'candidate', full_name: 'Competitor One', candidate_code: 'C01' },
  process.env.JWT_SECRET,   // กุญแจลับสำหรับเซ็น
  { expiresIn: '7d' }       // หมดอายุใน 7 วัน
);

// 2) ตรวจ token ตอนมี request เข้ามา
const payload = jwt.verify(token, process.env.JWT_SECRET);
// ถ้า token ถูกต้อง → ได้ payload กลับ; ถ้าปลอม/หมดอายุ → throw error
```

::: warning JWT_SECRET ต้องลับและเหมือนกัน
ทั้งตอน `sign` และ `verify` ต้องใช้ `JWT_SECRET` ตัวเดียวกัน (ตั้งใน `.env`) — ถ้าใครรู้ secret นี้จะปลอม token ได้ ดังนั้นห้าม commit `.env`
:::

บทถัดไปเอา `jwt.sign` ไปใช้สร้าง endpoint login จริง
