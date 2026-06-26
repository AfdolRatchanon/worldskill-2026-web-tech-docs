# บทเสริม — ตรวจสอบ URL (validation)

> **บทนี้คืออะไร:** เพิ่มการตรวจรูปแบบ URL ให้ endpoint ส่ง submission (บท 15) — **เวอร์ชันที่ `backend-real-db` ใช้จริงคือการตรวจ format** (ต้อง parse เป็น URL ได้ และขึ้นต้น http/https) · ส่วนการ "จำกัดให้เป็น LAN เท่านั้น" เป็น **ออปชันเสริม (ไม่ได้อยู่ใน repo)** เก็บไว้ให้ลองทำเพิ่มเอง — แยกเป็นบทเสริมเพราะคะแนนน้อยและ logic จำยาก

::: tip core ไม่มี validation
บท 15 (core) ไม่ตรวจรูปแบบ URL เลย — กรอกอะไรก็ insert ลง DB ได้ บทนี้คือการ "เพิ่ม" การตรวจเข้าไป (ทำทีหลังได้ ไม่กระทบส่วนอื่น)
:::

## ระดับ 1 — ตรวจ format http/https (เวอร์ชันที่ repo ใช้จริง)

เพิ่มฟังก์ชัน `validateOne` + `validateUrls` ลง `submissionsController.js` — ตรวจ **ทีละช่อง**: ต้องกรอก, ต้อง parse เป็น URL ได้, และ protocol ต้องเป็น http/https (ไม่จำกัดว่าต้องเป็น LAN — รับ URL ทั่วไป เช่น `https://example.com` ได้):

```js
function validateOne(label, value) {
  if (!value) return `${label} is required`;
  let u;
  try { u = new URL(value); } catch { return `${label} must be a valid URL`; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    return `${label} must start with http:// or https://`;
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

## ทดสอบ (เวอร์ชัน repo)

login candidate (session `active`):

| ส่ง | ผล |
|-----|-----|
| `http://10.0.0.5:3000` | ✅ 201 |
| `http://localhost:8080/api` | ✅ 201 |
| `https://example.com` (โดเมน) | ✅ 201 — repo รับ URL ทั่วไปได้ |
| `example.com` (ไม่มี scheme) | ❌ 400 — must be a valid URL |
| `ftp://10.0.0.5` | ❌ 400 — must start with http:// or https:// |
| (เว้นว่าง) | ❌ 400 — is required |

::: warning โค้ดจริงใน repo
`backend-real-db/src/controllers/submissionsController.js` ใช้การตรวจ **format (ระดับ 1)** นี้ — รับ URL ที่ขึ้นต้น http/https ได้ทั้งหมด (รวมโดเมน) · บท 15 ในเล่มหลักถูกทำให้ง่ายลง (**ไม่ตรวจ URL เลย**) เพื่อให้จำง่าย
:::

---

## ระดับ 2 — (ออปชันเสริม) จำกัดให้เป็น LAN เท่านั้น

::: tip ออปชันนี้ไม่ได้อยู่ใน repo — เก็บไว้ให้ลองทำเพิ่ม
ในห้องแข่งจริง ผลงานมักรันบนเครื่องในวง LAN (เช่น `http://10.10.0.5:3000`) — ถ้าอยากบล็อกโดเมน/public IP ตั้งแต่ตอนส่ง ก็เพิ่ม `isLanHost` แล้วเรียกใน `validateOne` (ต่อจากเช็ค protocol) เวอร์ชันนี้ **เข้มกว่า** ระดับ 1 และ **repo ไม่ได้เปิดใช้**
:::

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

// เพิ่มบรรทัดนี้ใน validateOne ต่อจากเช็ค protocol:
//   if (!isLanHost(u.hostname)) {
//     return `${label} must be an internal LAN address (private IP or localhost), not a public or domain address`;
//   }
```

### เข้าใจช่วง IP ภายใน (private ranges)

| ช่วง | ตัวอย่าง | หมายเหตุ |
|------|---------|---------|
| `10.0.0.0/8` | `10.10.0.5` | ใช้บ่อยในห้องแข่ง |
| `172.16.0.0/12` | `172.20.1.3` | octet ที่สองอยู่ 16–31 |
| `192.168.0.0/16` | `192.168.1.8` | วง home/office |
| `127.0.0.0/8` | `127.0.0.1` | loopback |
| `localhost` | `localhost` | ชื่อพิเศษ |

ถ้าเปิดใช้ระดับ 2 → ทุกอย่างนอกช่วงนี้ (โดเมนเช่น `example.com`, public IP เช่น `8.8.8.8`) จะกลายเป็น **400** (ต่างจาก repo ที่รับโดเมนได้)
