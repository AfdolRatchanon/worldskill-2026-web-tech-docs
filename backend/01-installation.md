# บทที่ 1 — ติดตั้งเครื่องมือ

## เครื่องมือที่จะติดตั้งในบทนี้

| เครื่องมือ | หน้าที่ในโปรเจ็ค | ตรวจสอบด้วย |
|-----------|----------------|------------|
| Node.js + npm | รัน JavaScript บน server | `node -v` และ `npm -v` |
| MariaDB | เก็บข้อมูลทั้งหมดของระบบ | `mysql -u root -p` |
| Postman | ทดสอบ API ทุก endpoint | เปิดโปรแกรมได้ |
| VS Code | เขียนโค้ด (ไม่ต้องลง extension) | เปิดโปรแกรมได้ |

## 1. ติดตั้ง Node.js

Node.js ทำให้รัน JavaScript นอก browser ได้ — เราใช้มันรัน backend server

### ขั้นตอน

1. ดาวน์โหลด Node.js จาก **https://nodejs.org** เลือกเวอร์ชัน **LTS**
2. รันไฟล์ `.msi` ที่ดาวน์โหลดมา กด Next ตลอดจนเสร็จ
3. เปิด Command Prompt ใหม่ แล้วรัน:

```bash
node -v
```

ต้องเห็น:
```
v20.11.0
```
(เลขอาจต่างกัน แต่ต้องขึ้นต้นด้วย `v20` หรือสูงกว่า)

```bash
npm -v
```

ต้องเห็น:
```
10.2.4
```

::: tip
npm ติดตั้งมาพร้อมกับ Node.js อัตโนมัติ ไม่ต้องติดตั้งแยก
:::

## 2. ติดตั้ง MariaDB

MariaDB คือโปรแกรมเก็บข้อมูล เราจัดการทั้งหมดผ่าน Command Line

### ขั้นตอน

1. ดาวน์โหลด MariaDB จาก **https://mariadb.org/download** เลือก **Windows (x86_64)** ไฟล์ `.msi`
2. รันไฟล์ติดตั้ง
3. ระหว่างติดตั้ง ตั้งรหัสผ่าน root — **จดไว้ให้ดี** ใช้ตลอดการแข่งขัน
4. กด Next จนเสร็จ

### เพิ่ม MariaDB เข้า PATH

ถ้าเปิด Command Prompt แล้วพิมพ์ `mysql` แล้วขึ้น error ให้ทำขั้นตอนนี้:

1. กด `Windows + R` พิมพ์ `sysdm.cpl` กด Enter
2. ไปที่ **Advanced** → **Environment Variables**
3. ใน **System variables** หา `Path` กด Edit
4. กด New ใส่ `C:\Program Files\MariaDB 11.x\bin` (แก้เลขเวอร์ชันให้ตรง)
5. กด OK ทุกหน้าต่าง แล้วเปิด Command Prompt ใหม่

### ทดสอบเชื่อมต่อ

```bash
mysql -u root -p
```

พิมพ์รหัสผ่านที่ตั้งไว้ กด Enter (ตัวอักษรจะไม่แสดงขณะพิมพ์ — ปกติ)

ต้องเห็น:
```
Welcome to the MariaDB monitor.
MariaDB [(none)]>
```

ออกจาก MariaDB:
```sql
exit
```

## 3. ติดตั้ง Postman

Postman ใช้ส่ง HTTP request ไปทดสอบ API — เหมือน browser แต่ควบคุม method, header, body ได้เต็มที่

### ขั้นตอน

1. ดาวน์โหลด Postman จาก **https://www.postman.com/downloads** เลือก **Windows 64-bit**
2. รันไฟล์ติดตั้ง
3. เปิดโปรแกรม → กด **Skip and go to the app** (ไม่ต้อง login)

### สร้าง Collection สำหรับโปรเจ็ค

1. กด **New** มุมซ้ายบน → เลือก **Collection**
2. ตั้งชื่อ `WorldSkill 2026 API` → กด **Create**

### วิธีส่ง Request

**ส่ง GET request:**
1. กด `+` ใน Collection
2. เลือก Method: `GET`
3. ใส่ URL: `http://localhost:8080/api/tasks`
4. กด **Send**

**ส่ง POST พร้อม JSON body:**
1. เลือก Method: `POST`
2. ใส่ URL
3. คลิก **Body** → เลือก **raw** → เปลี่ยน dropdown เป็น **JSON**
4. พิมพ์ JSON:

```json
{
  "username": "judge01",
  "password": "judge123"
}
```

5. กด **Send**

**ใส่ Authorization Header (หลัง login ได้ token):**
1. คลิก **Headers**
2. เพิ่ม Key: `Authorization` Value: `Bearer <token ที่ได้จาก login>`

## 4. ติดตั้ง VS Code

VS Code คือโปรแกรมเขียนโค้ด ใช้เปล่าๆ ไม่ต้องลง extension

### ขั้นตอน

1. ดาวน์โหลด VS Code จาก **https://code.visualstudio.com**
2. รันไฟล์ติดตั้ง กด Next จนเสร็จ

::: warning ห้ามลง Extension
ในห้องแข่งขันใช้ VS Code เปล่าๆ เท่านั้น ฝึกเขียนโค้ดโดยไม่พึ่ง extension ตั้งแต่ตอนซ้อม
:::

## ทดสอบว่าทำงานได้

รันคำสั่งทั้งหมดนี้ทีละบรรทัด ต้องผ่านทุกข้อก่อนไปบทถัดไป:

```bash
node -v
```
✅ ต้องเห็นเลขเวอร์ชัน เช่น `v20.11.0`

```bash
npm -v
```
✅ ต้องเห็นเลขเวอร์ชัน เช่น `10.2.4`

```bash
mysql -u root -p
```
✅ ต้องเข้า MariaDB ได้ เห็น `MariaDB [(none)]>`

พิมพ์ `exit` เพื่อออก แล้วเปิด Postman ตรวจว่าโปรแกรมเปิดได้

## Common Errors

| Error | สาเหตุ | วิธีแก้ |
|-------|--------|---------|
| `'node' is not recognized` | Node.js ยังไม่ได้ติดตั้ง หรือ PATH ไม่ถูก | ติดตั้ง Node.js ใหม่ แล้วเปิด Command Prompt ใหม่ |
| `'mysql' is not recognized` | MariaDB ไม่อยู่ใน PATH | เพิ่ม `C:\Program Files\MariaDB 11.x\bin` เข้า PATH |
| `Access denied for user 'root'` | รหัสผ่านผิด | ตรวจสอบรหัสผ่านที่ตั้งไว้ตอนติดตั้ง |
| Postman เปิดไม่ได้ | ติดตั้งไม่สมบูรณ์ | ลบแล้วติดตั้งใหม่ |
