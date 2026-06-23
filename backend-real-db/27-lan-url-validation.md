# บทเสริม — ตรวจสอบ URL (validation)

> **บทนี้คืออะไร:** เพิ่มการตรวจรูปแบบ URL ให้ endpoint ส่ง submission (บท 15) — มี 2 ระดับ: (1) เช็ค http/https พื้นฐาน, (2) จำกัดให้เป็น **LAN เท่านั้น** (เวอร์ชันที่ `backend-real-db` ใช้จริง) — เป็น **ออปชัน** แยกไว้เพราะคะแนนน้อยและ logic เช็ค IP จำยาก

::: tip core ไม่มี validation
บท 15 (core) ไม่ตรวจรูปแบบ URL เลย — กรอกอะไรก็ insert ลง DB ได้ บทนี้คือการ "เพิ่ม" การตรวจเข้าไป (ทำทีหลังได้ ไม่กระทบส่วนอื่น)
:::

## ระดับ 1 — เช็ค http/https พื้นฐาน

เพิ่มฟังก์ชัน `validateUrls` ลง `submissionsController.js`:

```js
function validateUrls({ frontend_url, backend_url }) {
  const isHttp = (s) => { try { const u = new URL(s); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; } };
  if (!frontend_url || !backend_url) return 'Both URLs are required';
  if (!isHttp(frontend_url) || !isHttp(backend_url)) return 'URLs must start with http:// or https://';
  return null;
}
```

## ระดับ 2 — จำกัดให้เป็น LAN เท่านั้น (เวอร์ชัน repo)

ในห้องแข่งจริง ผลงานรันบนเครื่องในวง LAN (เช่น `http://10.10.0.5:3000`) — auto-grader ต้องเข้าถึงได้ ถ้ากรอกโดเมน/public IP จะตรวจไม่ได้ จึงบล็อกตั้งแต่ตอนส่ง ใช้ `validateUrls` เวอร์ชันนี้แทน (เพิ่ม `isLanHost` + `validateOne`):

```js
// host ต้องเป็น IP ภายใน LAN (private/loopback) หรือ localhost เท่านั้น
function isLanHost(host) {
  if (host === 'localhost') return true;
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;                              // ไม่ใช่ IPv4 (เช่น domain) → ไม่ผ่าน
  const oct = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])];
  if (oct.some((n) => n > 255)) return false;
  const [a, b] = oct;
  if (a === 10) return true;                         // 10.0.0.0/8
  if (a === 172 && b >= 16 && b <= 31) return true;  // 172.16.0.0/12
  if (a === 192 && b === 168) return true;           // 192.168.0.0/16
  if (a === 127) return true;                        // loopback 127.0.0.0/8
  return false;                                      // public IP / โดเมน → ไม่ผ่าน
}

function validateOne(label, value) {
  if (!value) return `${label} is required`;
  let u;
  try { u = new URL(value); } catch { return `${label} must be a valid URL`; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    return `${label} must start with http:// or https://`;
  }
  if (!isLanHost(u.hostname)) {
    return `${label} must be an internal LAN address (private IP or localhost), not a public or domain address`;
  }
  return null;
}

function validateUrls({ frontend_url, backend_url }) {
  return validateOne('Frontend URL', frontend_url) || validateOne('Backend URL', backend_url);
}
```

## เสียบเข้า `createSubmission` / `updateSubmission`

เพิ่มการเรียก `validateUrls` ในทั้ง 2 ฟังก์ชัน (หลังเช็ค session/task ก่อน insert) — เพราะบท 15 core ตัดส่วนนี้ออกไป:

```js
    const { frontend_url, backend_url } = req.body;
    const urlError = validateUrls(req.body);                                            // [!code ++]
    if (urlError) return res.status(400).json({ success: false, message: urlError });   // [!code ++]
```

## เข้าใจช่วง IP ภายใน (private ranges)

| ช่วง | ตัวอย่าง | หมายเหตุ |
|------|---------|---------|
| `10.0.0.0/8` | `10.10.0.5` | ใช้บ่อยในห้องแข่ง |
| `172.16.0.0/12` | `172.20.1.3` | octet ที่สองอยู่ 16–31 |
| `192.168.0.0/16` | `192.168.1.8` | วง home/office |
| `127.0.0.0/8` | `127.0.0.1` | loopback |
| `localhost` | `localhost` | ชื่อพิเศษ |

ทุกอย่างนอกเหนือนี้ (โดเมนเช่น `example.com`, public IP เช่น `8.8.8.8`) → ไม่ผ่าน คืน **400**

## ทดสอบ

login candidate (session `active`):

| ส่ง | ผล |
|-----|-----|
| `http://10.0.0.5:3000` | ✅ 201 |
| `http://localhost:8080/api` | ✅ ผ่าน |
| `https://example.com` (โดเมน) | ❌ 400 — must be an internal LAN address |
| `http://8.8.8.8` (public IP) | ❌ 400 |
| `ftp://10.0.0.5` | ❌ 400 — ต้อง http(s) |

::: warning นี่คือสิ่งที่โค้ดจริงมี
`backend-real-db/src/controllers/submissionsController.js` ใช้เวอร์ชัน LAN (ระดับ 2) นี้แล้ว — บท 15 ในเล่มหลักถูกทำให้ง่ายลง (**ไม่ตรวจ URL เลย**) เพื่อให้จำง่าย
:::
