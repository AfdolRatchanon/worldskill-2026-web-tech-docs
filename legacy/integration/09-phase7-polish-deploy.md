# บทที่ 9 — Phase 7: Polish + Deploy (LAN)

> 🎯 **ทำตามทีละขั้น** — เก็บงานให้ครบเกณฑ์ที่เหลือ: รันบน **LAN ไร้อินเทอร์เน็ต**, responsive + accessibility, seed ผ่าน, README
>
> ⏱️ ~0:40 + buffer · 🏆 Deployment LAN **6** + Offline/Stability **4** + Responsive/Accessible **1** + API Quality **4** + Maintainability **2**

## 🌐 1. Deploy บน LAN (คะแนนก้อนใหญ่ที่หลายคนลืม)

ระบบตรวจ + กรรมการเข้าจาก **IP ในห้อง** (เช่น `10.10.0.105`) ไม่ใช่ `localhost` — ต้องแก้ 2 ปลายของสายให้ตรง

```bash
# backend/.env — อนุญาต origin ของ FE ในห้อง
FRONTEND_URL=http://10.10.0.105:3000        # IP เครื่องตัวเอง ไม่ใช่ localhost
```

```bash
# frontend/.env — baseURL ชี้ backend ผ่าน IP
VITE_API_URL=http://10.10.0.105:8080/api
```

```bash
# เปิดให้เครื่องอื่นในห้องเข้าถึง (--host)
cd frontend && npm run build && npm run preview   # preview ตั้ง --host --port 3000 ไว้แล้ว
cd backend  && npm start                          # ฟังทุก interface ที่ port 8080
```

:::warning ตรวจจากเครื่องอื่นจริง
เปิดมือถือ/โน้ตบุ๊กอีกเครื่องในวง LAN เดียวกัน พิมพ์ `http://10.10.0.105:3000` ต้องเข้าได้ — ถ้าเข้าจากเครื่องตัวเองได้แต่เครื่องอื่นไม่ได้ มักเป็น **Firewall** หรือลืม `--host`
:::

> รายละเอียดเต็ม: [FE Checklist บท 20](/legacy/frontend/17-checklist) · [BE Checklist บท 29](/legacy/backend/29-checklist)

## 🔌 2. Offline Compliance (ห้ามแตะอินเทอร์เน็ต)

ผิดข้อนี้ = โดนหักทั้งหมวด ตรวจให้ครบ:

- [ ] **ไม่มี external font** — ไม่มี `<link href="fonts.googleapis...">` / `@import url(...)` ใช้ system font หรือฝัง font เอง
- [ ] **ไม่มี CDN** — ไม่มี `<script src="https://cdn...">`, ทุก lib มาจาก `npm install` (Tailwind v4 เป็น Vite plugin อยู่แล้ว ✅)
- [ ] **ไม่มี cloud/3rd-party API** — เรียกแค่ backend ตัวเอง
- [ ] **ตัด DevTools → Network แล้วยังรันได้** (ตัดเน็ตจริงทดสอบ)

## 📱 3. Responsive + Accessibility (TP §8 — WCAG 2.1)

**Responsive** — ใช้งานได้ทั้ง 375px (มือถือ) และ 1366px (เดสก์ท็อป):

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">   // มือถือ 1 คอลัมน์ · จอใหญ่ 2
```

**Accessibility checklist:**

- [ ] `<label htmlFor>` คู่กับ `id` ของ input ทุกช่อง (มีใน `Input.jsx` แล้ว)
- [ ] ใช้ semantic tag: `<header>`, `<main>`, `<table>`, `<th scope="col">`
- [ ] focus มองเห็น (`focus:ring-2` ใน Button/Input แล้ว)
- [ ] error มี `role="alert"` (มีในหน้า Login แล้ว)
- [ ] contrast พอ (ใช้ palette เข้ม เช่น `text-gray-900` บนพื้นขาว)
- [ ] กดด้วย keyboard อย่างเดียวทำงานครบ (Tab/Enter)

## 🌱 4. Database + README

- [ ] ระบบทำงานกับ **seed data ที่ผู้จัดเตรียมให้** — ห้ามแก้ของเดิม (ต่อ schema เพิ่มได้) (TP §10)
- [ ] เตรียม **Database export หรือ migration/seed instructions** สำหรับส่งมอบ (TP §11) เช่น `mysqldump`
- [ ] **README สั้น ๆ** มี: วิธีรัน BE/FE, ตั้ง `.env`, วิธีโหลด/เชื่อม DB, Frontend URL + Backend API Base URL ที่ต้องส่ง (TP §11 / RSC §10)

## 🧹 5. Code Quality (5 คะแนน เก็บง่าย)

- [ ] โครงไฟล์ชัด (controllers/routes/middlewares · components แยก role)
- [ ] ชื่อตัวแปรสื่อความหมาย ไม่มีโค้ดตาย/console.log เกลื่อน
- [ ] response ทุกตัวตรง format `{ success, data, meta }` / `{ success, message }` (API Quality)

## ☑️ Checkpoint สุดท้าย — พร้อมส่ง

- [ ] เครื่องอื่นในห้องเข้า FE + ยิง API ได้ผ่าน IP
- [ ] ตัดเน็ตแล้วระบบยังครบทุกฟีเจอร์
- [ ] responsive 375/1366 + a11y ผ่าน
- [ ] seed สะอาด + README ครบ
- [ ] ส่ง **Frontend URL** + **Backend API Base URL** เข้า Candidate Portal

## 🏁 จบแล้ว — ทบทวนทั้งระบบ

ครบ 8 phase = full-stack ที่รันได้จริงในห้องแข่ง ทบทวนรายละเอียดแต่ละชิ้นได้ที่:

- ฝั่ง Backend: [Competition Checklist บท 29](/legacy/backend/29-checklist)
- ฝั่ง Frontend: [Competition Checklist บท 20](/legacy/frontend/17-checklist)
- กลับไปดูภาพรวมลำดับ: [แผนการรบ 6 ชม.](/legacy/integration/01-overview)
