# บทเสริม — จับเวลาสอบ + ปิด session อัตโนมัติ

> **บทนี้คืออะไร:** ส่วน "นับเวลาสอบ + ปิด session เองเมื่อหมดเวลา" ที่ `backend-real-db` มีอยู่จริง — แต่แยกออกมาเป็น **บทเสริม (ออปชัน)** เพราะคะแนนน้อยและรายละเอียดจำยาก เรียน core (บท 1–25) ให้แน่นก่อน แล้วค่อยมาเติม 3 ชิ้นในบทนี้ทับลงไป

::: tip ทำไมแยกบท
ระบบหลัก (core) ปิด session ได้ทางเดียวคือ **judge กดปิดเอง** (บท 17) — เพียงพอต่อการใช้งานและจำง่าย
บทนี้เพิ่ม "หมดเวลาแล้วปิดเอง" ซึ่งต้องเพิ่มคอลัมน์ + ฟังก์ชันคำนวณเวลา — ทำได้ทีหลัง ไม่กระทบ endpoint อื่น
:::

## ภาพรวม — เติม 3 ชิ้น

1. **`.env`** → `SESSION_DURATION_MINUTES` (ระยะเวลาสอบ)
2. **`src/config/schema.js`** → เพิ่มคอลัมน์ `started_at` ให้ตาราง `sessions` อัตโนมัติ (ไม่แก้ `seed_data.sql`)
3. **`src/utils/session.js`** → `resolveSession()` คำนวณเวลาที่เหลือ + ปิด session ที่หมดเวลา

แล้วนำไป "เสียบ" 3 จุด: `config` (คืนเวลาที่เหลือ), `session/start` (เริ่มจับเวลา), `my-submission` (กันส่งหลังหมดเวลา)

## 1. `.env` — ระยะเวลาสอบ

```bash
# เพิ่มท้ายไฟล์ .env
SESSION_DURATION_MINUTES=360   # 6 ชม. ตามเอกสาร RSC2026
```

## 2. `src/config/schema.js` — เพิ่ม `started_at` อัตโนมัติ

`seed_data.sql` เป็นไฟล์ทางการ ห้ามแก้ — เราเลยเติมคอลัมน์ที่ต้องใช้ตอน server เริ่มทำงานแทน (TP2026 §7 อนุญาตให้ขยาย schema)

```js
const pool = require('./db');

// เพิ่มคอลัมน์แบบ idempotent — เช็ค information_schema ก่อน (MySQL ไม่มี ADD COLUMN IF NOT EXISTS)
async function addColumnIfMissing(table, column, definition) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  if (rows[0].n === 0) {
    await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN ${column} ${definition}`);
    console.log(`[schema] added column ${table}.${column}`);
  }
}

async function ensureSchema() {
  await addColumnIfMissing('sessions', 'started_at', 'DATETIME NULL');
}

module.exports = { ensureSchema };
```

แล้วเรียก `ensureSchema()` ก่อน `app.listen` ใน `src/app.js`:

```js
const { ensureSchema } = require('./config/schema');   // [!code ++]
const PORT = process.env.PORT || 8080;

ensureSchema()                                           // [!code ++]
  .catch((err) => console.error('[schema] ensureSchema failed:', err.message)) // [!code ++]
  .finally(() => {                                       // [!code ++]
    app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
  });                                                    // [!code ++]
```

## 3. `src/utils/session.js` — `resolveSession()`

```js
const pool = require('../config/db');

const DURATION_MINUTES = parseInt(process.env.SESSION_DURATION_MINUTES, 10) || 360;

// ดึง session ล่าสุด + คำนวณเวลา และปิด session ที่หมดอายุให้อัตโนมัติ (lazy — ไม่ต้องมี cron)
async function resolveSession() {
  const [rows] = await pool.execute(
    `SELECT *,
            CASE WHEN started_at IS NULL THEN NULL
                 ELSE TIMESTAMPDIFF(SECOND, started_at, NOW()) END AS elapsed_seconds
       FROM sessions ORDER BY id DESC LIMIT 1`
  );
  const session = rows[0] || null;
  if (!session) {
    return { session: null, elapsed_seconds: null, remaining_seconds: null, duration_minutes: DURATION_MINUTES };
  }

  const durationSeconds = DURATION_MINUTES * 60;
  const elapsed = session.elapsed_seconds;
  let remaining = null;

  if (session.status === 'active' && elapsed != null) {
    remaining = Math.max(0, durationSeconds - elapsed);
    if (elapsed >= durationSeconds) {                     // หมดเวลา → ปิดอัตโนมัติ
      await pool.execute("UPDATE sessions SET status = 'closed' WHERE id = ?", [session.id]);
      session.status = 'closed';
      remaining = 0;
    }
  }

  return { session, elapsed_seconds: elapsed, remaining_seconds: remaining, duration_minutes: DURATION_MINUTES };
}

module.exports = { resolveSession, DURATION_MINUTES };
```

::: tip ใช้ `NOW()` ของฐานข้อมูล
คำนวณเวลาที่ผ่านไปด้วย `TIMESTAMPDIFF(SECOND, started_at, NOW())` ในฝั่ง SQL — เลี่ยงปัญหานาฬิกาเครื่อง client/server ไม่ตรงกัน
:::

## 4. เสียบเข้า `config` (แทนที่ของบท 12)

```js
const { resolveSession } = require('../utils/session');   // แทน require pool

async function getConfig(req, res) {
  try {
    const { session, elapsed_seconds, remaining_seconds, duration_minutes } = await resolveSession();
    const data = session
      ? { ...session, duration_minutes, elapsed_seconds, remaining_seconds }
      : null;
    res.json({ success: true, data, meta: {} });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { getConfig };
```

ตอนนี้ `/config` จะคืน `remaining_seconds` ให้ frontend เอาไปทำ countdown ได้ (frontend ตัว "พร้อมแข่ง" ใช้ค่านี้)

## 5. เสียบเข้า `session/start` (แทนที่ของบท 17)

เริ่มจับเวลาตอนเปิด session — เพิ่ม `started_at = NOW()`:

```js
await pool.execute(
  "UPDATE sessions SET status = 'active', started_at = NOW() WHERE id = ?",
  [session.id]
);
```

## 6. เสียบเข้า `my-submission` (แทนที่ของบท 15)

ใช้ `resolveSession()` แทน `getLatestSession()` — ถ้าหมดเวลา session จะถูกปิดก่อนแล้วการส่งงานถูกปฏิเสธทันที:

```js
const { resolveSession } = require('../utils/session');   // บนสุดของไฟล์

// ใน createSubmission / updateSubmission:
const { session } = await resolveSession();   // แทน const session = await getLatestSession();
if (!session || session.status !== 'active') {
  return res.status(403).json({ success: false, message: 'Session is not active' });
}
```

## ทดสอบ

1. ตั้ง `SESSION_DURATION_MINUTES=1` (1 นาที) ชั่วคราว → restart server (เห็น log `[schema] added column sessions.started_at` ครั้งแรก)
2. judge เปิด session → `GET /config` เห็น `remaining_seconds` นับถอยหลัง
3. รอเกิน 1 นาที → เรียก `/config` หรือให้ candidate ส่งงาน → session กลายเป็น `closed` เอง, ส่งงานได้ **403**
4. ทดสอบเสร็จอย่าลืมตั้ง `SESSION_DURATION_MINUTES` กลับเป็น 360

::: warning นี่คือสิ่งที่โค้ดจริงมี
โค้ดใน repo `backend-real-db/` ติดตั้ง 3 ชิ้นนี้ไว้แล้ว — บท 12/15/17 ในเล่มหลักถูกทำให้ "ง่ายลง" เพื่อให้จำง่าย ส่วนบทนี้คือเวอร์ชันเต็มที่ตรงกับ repo
:::
