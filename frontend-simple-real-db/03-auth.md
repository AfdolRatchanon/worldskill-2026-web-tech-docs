# บทที่ 3 — auth.js จัดการ Token

> **บทนี้เตรียมอะไร:** เขียน `src/auth.js` ไฟล์เล็กๆ ที่ดูแล token ใน localStorage — เก็บ, อ่านข้อมูล user จาก token, และลบตอน logout

## `src/auth.js`

```js
export function saveToken(token) {
  localStorage.setItem('token', token);
}

export function getUser() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  // JWT หน้าตา "xxx.yyy.zzz" — ส่วนกลาง (yyy) คือข้อมูล user เข้ารหัส base64
  return JSON.parse(atob(token.split('.')[1]));
}

export function removeToken() {
  localStorage.removeItem('token');
}
```

## เข้าใจโค้ด

| ฟังก์ชัน | ทำอะไร |
|----------|--------|
| `saveToken(token)` | เก็บ token ลง localStorage หลัง login สำเร็จ |
| `getUser()` | ถอด payload จาก token → ได้ `{ id, username, role, full_name, candidate_code }` |
| `removeToken()` | ลบ token ตอน logout |

::: tip `atob(token.split('.')[1])`
- `token.split('.')` แยก JWT เป็น 3 ส่วน → `[1]` คือ payload
- `atob(...)` ถอด base64 กลับเป็นข้อความ JSON
- `JSON.parse(...)` แปลงเป็น object → อ่าน `user.role`, `user.full_name` ได้

 payload นี้ backend ใส่มาตอน login (ดู [Backend บทที่ 9](/backend-real-db/09-jwt)) — ฝั่ง frontend แค่ "อ่าน" ไม่ได้ตรวจลายเซ็น (การตรวจจริงเกิดที่ backend ทุก request)
:::

## ทดสอบ

ไฟล์นี้ยังเรียกใช้ไม่ได้จนกว่าจะมีหน้า Login (บทที่ 6) — ตอนนี้แค่สร้างไฟล์ให้ถูก แล้วไปต่อ `api.js`
