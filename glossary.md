# คำศัพท์

## A

**API (Application Programming Interface)**
ชุดของ URL ที่ backend เปิดให้ frontend เรียกใช้ เช่น `GET /api/tasks`, `POST /api/login`

**authenticate**
ตรวจสอบว่า request มี token ที่ถูกต้องหรือไม่ — "ใครคุณ?"

**authorize**
ตรวจสอบว่า user มีสิทธิ์ทำ action นั้นหรือไม่ — "คุณทำได้ไหม?"

## B

**bcrypt**
algorithm เข้ารหัส password ที่ไม่สามารถถอดรหัสกลับได้ (one-way hash) เราใช้ `bcryptjs`

**Bearer Token**
รูปแบบ Authorization header: `Authorization: Bearer eyJ...` ส่งพร้อมทุก request ที่ต้องการ authentication

## C

**CommonJS**
ระบบ module ของ Node.js ใช้ `require()` / `module.exports` (ต่างจาก ES Module ที่ใช้ `import`/`export`)

**Connection Pool**
กลุ่มของ database connection ที่เตรียมไว้ล่วงหน้า ทำให้ไม่ต้องเปิด/ปิด connection ทุก request

**CORS (Cross-Origin Resource Sharing)**
กลไก browser ที่ป้องกันไม่ให้ website หนึ่งเรียก API ของอีก domain หนึ่งโดยไม่ได้รับอนุญาต เราใช้ `cors` package เพื่ออนุญาต frontend

**CRUD**
Create, Read, Update, Delete — การกระทำพื้นฐานกับข้อมูล ตรงกับ POST, GET, PUT/PATCH, DELETE

## D

**dotenv**
package ที่อ่านค่าจากไฟล์ `.env` เข้า `process.env` ทำให้ไม่ต้อง hardcode รหัสผ่านในโค้ด

## E

**ENUM**
ชนิดข้อมูล MySQL ที่จำกัดให้ใส่ได้แค่ค่าที่กำหนดไว้ เช่น `ENUM('waiting','open','closed')`

**Express**
web framework สำหรับ Node.js ทำให้สร้าง HTTP server, router, middleware ได้ง่าย

## F

**Foreign Key**
column ที่อ้างอิง primary key ของ table อื่น เชื่อม table เข้าหากัน ถ้า id ที่อ้างถึงไม่มีจะ error

## H

**HTTP Status Code**
รหัสตัวเลขที่บอกผลลัพธ์ของ request:
- `200 OK` — สำเร็จ
- `201 Created` — สร้างสำเร็จ
- `400 Bad Request` — ข้อมูลที่ส่งมาผิด
- `401 Unauthorized` — ไม่มี/token ผิด
- `403 Forbidden` — ไม่มีสิทธิ์
- `404 Not Found` — ไม่พบข้อมูล
- `409 Conflict` — ข้อมูลซ้ำ

## J

**JOIN**
SQL คำสั่งที่เชื่อม 2 table เข้าด้วยกัน:
- `INNER JOIN` — แสดงเฉพาะแถวที่ match กันทั้ง 2 table
- `LEFT JOIN` — แสดงทุกแถวของ table ซ้าย ถึงแม้ table ขวาจะไม่มีข้อมูล match

**JWT (JSON Web Token)**
token ที่เก็บข้อมูล (payload) ในตัวเอง ใช้ลายเซ็นเข้ารหัส ไม่ต้องเก็บ session บน server

## M

**Middleware**
ฟังก์ชันที่รันระหว่าง request กับ response สามารถเรียก `next()` เพื่อส่งต่อ หรือตอบ response เพื่อหยุด

**module.exports**
วิธี export ค่าออกจาก Node.js module ให้ไฟล์อื่น `require()` ใช้ได้

**mysql2**
npm package สำหรับเชื่อมต่อ MySQL/MariaDB จาก Node.js รองรับ `async/await` และ prepared statement

## N

**nodemon**
devDependency ที่ watch file changes แล้ว restart server อัตโนมัติ ทำให้ไม่ต้อง `Ctrl+C` + `npm start` ทุกครั้ง

## P

**Pagination**
การแบ่งข้อมูลเป็นหน้าๆ ส่งทีละน้อย ใช้ `?page=1&limit=20` ใน URL

**Payload (JWT)**
ข้อมูลที่เก็บใน JWT token เช่น `{ id, username, role, full_name }` อ่านได้หลัง decode

**pdfkit**
npm package สร้างไฟล์ PDF บน Node.js เพิ่ม text, image, table ได้

**Prepared Statement**
SQL ที่ใช้ `?` แทนค่าจริง mysql2 จะ escape ค่าก่อน insert ป้องกัน SQL Injection

**PRIMARY KEY**
column ที่ระบุ row ได้อย่างไม่ซ้ำกัน มักเป็น `id INT AUTO_INCREMENT`

## R

**REST (Representational State Transfer)**
สถาปัตยกรรม API ที่ใช้ HTTP method (GET/POST/PUT/DELETE) กับ URL path แทน action

**req.body**
ข้อมูล JSON ที่ client ส่งมาใน request body อ่านได้หลังจาก `app.use(express.json())`

**req.params**
ตัวแปรจาก URL เช่น `/submissions/:id` → `req.params.id`

**req.query**
ตัวแปรจาก query string เช่น `?page=2&limit=10` → `req.query.page = "2"`

**req.user**
ข้อมูล user ที่ `authenticate` middleware decode จาก JWT token ไว้ให้ controller ใช้

## S

**Seed**
การใส่ข้อมูลเริ่มต้นเข้า database ก่อนรัน server เช่น users และ session ตัวอย่าง

**SQL Injection**
การโจมตีที่ใส่ SQL code ใน input เพื่อแก้ไข query ป้องกันด้วย prepared statement `?`

## T

**Token (JWT)**
string ยาวๆ ที่ server ออกให้หลัง login client เก็บไว้และส่งทุก request ใน `Authorization` header

## U

**UNIQUE KEY**
constraint ที่ป้องกันไม่ให้มีค่าซ้ำกันใน column เช่น `username` และ `(candidate_id, session_id)`

## W

**Window Function**
SQL function ที่คำนวณบนกลุ่มข้อมูล เช่น `RANK() OVER (ORDER BY total_score DESC)` สร้าง ranking
