# บทที่ 6 — Database & Schema

> **บทนี้เตรียมอะไร:** วางไฟล์ `seed_data.sql` (schema + ข้อมูลทางการ), เขียน `seed.js` สำหรับสร้างฐานข้อมูล, แล้วรัน `npm run seed` ให้มี DB จริงพร้อมข้อมูล — บทนี้คือ **รากฐานของทุก endpoint**

## 1. ไฟล์ `database/seed_data.sql`

นี่คือไฟล์ทางการ — สร้าง 5 ตาราง + ใส่ข้อมูลตั้งต้น **ห้ามแก้โครงหรือรหัสผ่าน**

```sql
-- 5 ตาราง
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    candidate_code VARCHAR(20) NULL
);
CREATE TABLE sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    status VARCHAR(20) NOT NULL DEFAULT 'initialized',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT
);
CREATE TABLE submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_id INT NOT NULL,
    task_id INT NOT NULL,
    frontend_url VARCHAR(255),
    backend_url VARCHAR(255),
    status VARCHAR(20) DEFAULT 'submitted',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (candidate_id) REFERENCES users(id),
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);
CREATE TABLE results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    submission_id INT NOT NULL,
    score DECIMAL(5,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'pending',
    FOREIGN KEY (submission_id) REFERENCES submissions(id)
);

-- ข้อมูลตั้งต้น
INSERT INTO users (username, password, role, full_name, candidate_code) VALUES
('admin', 'password', 'judge', 'Chief Expert', NULL),
('manager', 'password', 'manager', 'Center Manager', NULL),
('candidate1', '123456', 'candidate', 'Competitor One', 'C01'),
('candidate2', '123456', 'candidate', 'Competitor Two', 'C02');

INSERT INTO sessions (status) VALUES ('initialized');

INSERT INTO tasks (title, description) VALUES
('Web Technologies 2026', 'Build a Test Submission Management System for a competition room.');

INSERT INTO submissions (candidate_id, task_id, frontend_url, backend_url, status) VALUES
(3, 1, 'http://10.0.0.1:3000', 'http://10.0.0.1:8000/api', 'submitted');

INSERT INTO results (submission_id, score, status) VALUES
(1, 45.50, 'pending');
```

::: tip รหัสผ่าน plain-text + candidate_code
- `password` เป็นข้อความตรงๆ (`password`, `123456`) — ไม่เข้ารหัส ทำให้ login บทที่ 10 ง่าย (เทียบสตริงตรงๆ)
- `candidate_code` (C01/C02) = รหัสผู้เข้าแข่ง เป็น `NULL` สำหรับ admin/manager
:::


## 2. เขียน `database/seed.js`

สคริปต์นี้ลบ DB เดิมทิ้งแล้วสร้างใหม่จาก `seed_data.sql` — รันซ้ำได้เสมอเพื่อรีเซ็ตข้อมูลกลับเป็นค่าตั้งต้น

```js
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function seed() {
  const dbName = process.env.DB_NAME || 'worldskill2026_real';

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true,        // ← รันหลายคำสั่ง SQL ในครั้งเดียว
  });

  console.log(`Resetting database \`${dbName}\`...`);
  await conn.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
  await conn.query(`CREATE DATABASE \`${dbName}\``);
  await conn.query(`USE \`${dbName}\``);

  console.log('Applying schema + seed data from seed_data.sql...');
  const sql = fs.readFileSync(path.join(__dirname, 'seed_data.sql'), 'utf8');
  await conn.query(sql);

  console.log('Seed completed.');
  await conn.end();
}

seed().catch((err) => { console.error(err); process.exit(1); });
```

::: warning ทำไมต้อง `DROP DATABASE` ก่อน
`seed_data.sql` ใช้ `CREATE TABLE` (ไม่ใช่ `IF NOT EXISTS`) ถ้ารันซ้ำบน DB เดิมจะ error "table already exists" — เราเลยลบทั้ง DB ทิ้งก่อนสร้างใหม่ ทำให้ `npm run seed` รันกี่ครั้งก็ได้ข้อมูลสะอาดเสมอ
:::

## 3. รัน seed

```bash
npm run seed
```

เห็น `Seed completed.` = ฐานข้อมูล `worldskill2026_real` ถูกสร้างพร้อมข้อมูลแล้ว

## ทดสอบ

เปิด `mysql -u root -p` แล้วลอง:

```sql
USE worldskill2026_real;
SELECT username, password, role, candidate_code FROM users;
```

ต้องเห็น 4 บัญชี (admin, manager, candidate1, candidate2) พร้อมรหัส plain-text + candidate_code (C01/C02) → ไปบทที่ 7 เชื่อม Node เข้ากับ DB นี้
