# บทเสริม 2 — Countdown Timer (หน้า Candidate)

> **บทนี้คืออะไร:** ฟีเจอร์เด่นของเวอร์ชันพร้อมแข่ง — นาฬิกานับเวลาสอบถอยหลังในหน้า Candidate (`frontend-real-db/src/pages/CandidatePage.jsx`)

::: warning ต้องมี backend บทเสริม 26 ก่อน
timer อ่านค่า `remaining_seconds` จาก `GET /config` ซึ่งมีให้เฉพาะเมื่อทำ [backend บทเสริม 26 (จับเวลา)](/backend-real-db/26-session-timer) แล้ว — ถ้า backend ยังไม่ส่งค่านี้ timer จะไม่ทำงาน
:::

## ไอเดีย

- backend ส่ง `remaining_seconds` มากับ `/config` (คำนวณจาก `started_at` + ระยะเวลาสอบ)
- frontend **นับถอยหลังเองทุก 1 วินาที** (ลื่น ไม่ต้องยิง API ถี่) แล้ว **re-sync กับ backend ทุก 5 วินาที** (กันเวลาเพี้ยน)
- หมดเวลา → ปิดฟอร์มส่งงานทันที (backend ก็ปิด session อัตโนมัติเช่นกัน)

## 1. แปลงวินาที → HH:MM:SS

```jsx
function formatTime(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}
```

## 2. state + ดึงค่าจาก /config

```jsx
const [remaining, setRemaining] = useState(null); // วินาทีที่เหลือ (null = ยังไม่เริ่ม/ปิดแล้ว)

async function loadData() {
  const sessionRes = await api.get('/config');
  const cfg = sessionRes.data.data;
  setSession(cfg);
  setRemaining(cfg && cfg.status === 'active' ? cfg.remaining_seconds : null);
  // ... โหลด tasks / submission / result ต่อ
}
```

## 3. สอง useEffect — re-sync + นับถอยหลัง

```jsx
// (A) โหลด + re-sync ทุก 5 วินาที
useEffect(() => {
  loadData();
  const timer = setInterval(loadData, 5000);
  return () => clearInterval(timer);
}, []);

// (B) นับถอยหลังในเครื่องทุก 1 วินาที
useEffect(() => {
  if (remaining == null) return;
  const tick = setInterval(() => {
    setRemaining((prev) => {
      if (prev == null) return prev;
      if (prev <= 1) {
        clearInterval(tick);
        loadData();      // หมดเวลา → ดึงสถานะใหม่ (backend ปิด session ให้)
        return 0;
      }
      return prev - 1;
    });
  }, 1000);
  return () => clearInterval(tick);
}, [remaining == null]);   // ← รันใหม่เฉพาะตอนเริ่ม/หยุดนับ ไม่ใช่ทุกวินาที
```

::: tip ทำไม dependency เป็น `[remaining == null]`
ถ้าใส่ `[remaining]` ตรงๆ effect จะถูกสร้าง interval ใหม่ทุกวินาที — เปลือง เราต้องการแค่ "เริ่มนับเมื่อมีค่า / หยุดเมื่อเป็น null" จึงผูกกับ boolean `remaining == null`
:::

## 4. gate ฟอร์ม + แสดงผล

```jsx
// ส่งได้เฉพาะ active และยังมีเวลาเหลือ
const sessionOpen = session?.status === 'active' && (remaining == null || remaining > 0);

const timerClass =
  remaining === 0 ? 'timer timer--over'
  : remaining != null && remaining <= 300 ? 'timer timer--warn'   // เหลือ ≤ 5 นาที → สีเตือน
  : 'timer';
```

```jsx
{session?.status === 'active' && (
  <p aria-live="polite">
    เวลาที่เหลือ: <span className={timerClass}>{formatTime(remaining ?? 0)}</span>
  </p>
)}
{remaining === 0 && (
  <p className="alert alert--error" role="alert">หมดเวลาสอบแล้ว — ไม่สามารถส่งงานได้</p>
)}
```

(`<input>`/`<button>` ของฟอร์มใช้ `disabled={!sessionOpen}` → พอหมดเวลากดไม่ได้ทันที)

## ทดสอบ

1. ทำ backend บทเสริม 26 + ตั้ง `SESSION_DURATION_MINUTES=1` ชั่วคราว
2. judge เปิด session → หน้า candidate เห็นนาฬิกานับถอยหลัง
3. เหลือ ≤ 5 นาที → ตัวเลขเปลี่ยนสีเตือน (`timer--warn`)
4. ครบเวลา → ขึ้น "หมดเวลาสอบแล้ว" + ฟอร์มถูกปิด

ไปต่อ [บทเสริม 3 — Design System + Accessibility](/frontend-simple-real-db/13-realdb-styling-a11y)
