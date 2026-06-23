# บทที่ 3 — auth.js จัดการ Token

> **บทนี้เตรียมอะไร:** สร้าง `src/auth.js` — ไฟล์เล็กๆ 3 ฟังก์ชันที่จัดการ "บัตรผ่าน" (token) ทั้งระบบ: เก็บตอน login, อ่านว่าใคร login อยู่, ลบตอน logout

## ปัญหา — login แล้วยังไงต่อ?

ตอน login สำเร็จ backend จะส่ง **token** กลับมา 1 ก้อน หลังจากนั้นทุกหน้าต้องตอบคำถาม 3 ข้อนี้ให้ได้:

1. เก็บ token ไว้**ที่ไหน** ให้อยู่รอดแม้ผู้ใช้กด refresh?
2. รู้ได้ยังไงว่าตอนนี้**ใคร** login อยู่ (ชื่ออะไร role อะไร)?
3. กด logout แล้วต้องทำอะไร?

คำตอบทั้ง 3 ข้อรวมอยู่ในไฟล์เดียว

## token คืออะไร — ผ่า JWT ดูข้างใน

token ที่ backend ส่งมาเป็นแบบ **JWT (JSON Web Token)** หน้าตาเป็นข้อความยาวๆ 3 ส่วนคั่นด้วยจุด:

```
eyJhbGciOiJIUzI1NiJ9 . eyJpZCI6Mywicm9sZSI6ImNhbmRpZGF0ZSJ9 . abc123xyz...
       ส่วนหัว                  ข้อมูล user ← เราสนใจตรงนี้           ลายเซ็น
```

ส่วนกลางคือข้อมูล user (id, username, role, full_name) ที่ถูกเข้ารหัสแบบ **base64** — ไม่ใช่การเข้ารหัสลับ แค่แปลงรูปแบบ ใครก็ถอดอ่านได้ด้วยฟังก์ชัน `atob()` ที่ browser มีให้อยู่แล้ว

::: tip แปลว่าไม่ต้องยิง API ถามว่า "ฉันคือใคร"
ข้อมูล user ฝังมากับ token อยู่แล้ว — แค่ถอด base64 ออกมาอ่านก็รู้เลยว่าใคร login อยู่ role อะไร
:::

## เขียน `src/auth.js`

```js
// จัดการ token (บัตรผ่านที่ได้ตอน login) — เก็บไว้ใน localStorage ของ browser
// เทียบกับตัวเต็ม: contexts/AuthContext.jsx ใช้ Context API แชร์ข้อมูล user ให้ทุก component
// เวอร์ชันนี้ใช้ฟังก์ชันธรรมดาอ่านจาก localStorage ตรงๆ — ผลเหมือนกัน แต่เข้าใจง่ายกว่า

export function saveToken(token) {
  localStorage.setItem('token', token);
}

export function getUser() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  // token เป็น JWT หน้าตาแบบ "xxx.yyy.zzz" — ส่วนกลาง (yyy) คือข้อมูล user เข้ารหัสแบบ base64
  // atob = ถอดรหัส base64 กลับเป็นข้อความ แล้ว JSON.parse แปลงเป็น object
  return JSON.parse(atob(token.split('.')[1]));
}

export function removeToken() {
  localStorage.removeItem('token');
}
```

## ไล่ทีละฟังก์ชัน

| ฟังก์ชัน | เรียกเมื่อไหร่ | ทำอะไร |
|---------|--------------|--------|
| `saveToken(token)` | login สำเร็จ | เก็บ token ลง localStorage |
| `getUser()` | ทุกหน้าที่อยากรู้ว่าใคร login | อ่าน token → ถอด base64 → ได้ `{ id, username, role, full_name }` |
| `removeToken()` | กด logout | ลบ token ทิ้ง |

### ทำไมเก็บใน localStorage

`localStorage` คือพื้นที่เก็บข้อมูลถาวรของ browser — ข้อมูล**ไม่หายแม้ refresh หรือปิด browser** ถ้าเก็บใน state ธรรมดา (useState) กด refresh ทีเดียว token หาย ต้อง login ใหม่ทุกครั้ง

### ไล่โค้ด `getUser()` ทีละท่อน

```js
token.split('.')[1]      // ตัดเอาส่วนกลางของ "xxx.yyy.zzz" → "yyy"
atob(...)                // ถอด base64 → ได้ข้อความ JSON เช่น '{"id":3,"role":"candidate",...}'
JSON.parse(...)          // แปลงข้อความ JSON → object ใช้งานได้จริง
```

## เทียบกับตัวเต็ม — แล้ว Context API ล่ะ?

ตัวเต็มใช้ `AuthContext` (Context API) ทำหน้าที่เดียวกันนี้ — คำถามคือทำไมเขาต้องใช้ของยากกว่า?

| | `auth.js` (ตัวนี้) | `AuthContext` (ตัวเต็ม) |
|---|---|---|
| วิธีใช้ | `const user = getUser()` | `const { user, logout } = useAuth()` |
| เมื่อ token เปลี่ยน | หน้าอื่น**ไม่รู้อัตโนมัติ** ต้องอ่านใหม่เอง | ทุก component ที่ใช้ `useAuth()` **วาดใหม่ทันที** |
| เหมาะกับ | แอปที่เปลี่ยนหน้าหลัง login/logout เสมอ (แบบเรา) | แอปที่หลาย component ต้องอัปเดตพร้อมกันแบบ realtime |

ระบบเราหลัง login จะ `navigate` ไปหน้าใหม่เสมอ — หน้าใหม่เรียก `getUser()` ก็ได้ค่าล่าสุดแล้ว Context จึง "ไม่จำเป็น" สำหรับเวอร์ชันนี้ แต่พอกลับไปอ่านตัวเต็มจะเข้าใจว่า Context มาช่วยเรื่องอะไร

::: warning ยังทดสอบไม่ได้ตอนนี้
ไฟล์นี้เป็นแค่ฟังก์ชันเปล่าๆ ยังไม่มีหน้าไหนเรียกใช้ — จะได้ทดสอบจริงตอนทำหน้า Login ในบทที่ 6
:::
