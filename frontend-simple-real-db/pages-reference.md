# 📑 Pages Reference — สรุปทุกหน้า (สำหรับท่อง)

> **หน้านี้คืออะไร:** สรุปว่าแต่ละหน้า **ใช้ endpoint ไหน ทำอะไร เงื่อนไขปุ่มอะไร** ไว้หน้าเดียวสำหรับทบทวน/ท่องก่อนแข่ง — ตรงกับที่สอนทีละหน้าใน [บท 6–9](/frontend-simple-real-db/06-login)

แอปเป็น React + Vite + axios + react-router (v7) มี **4 หน้า** แยกตาม role
Backend อยู่ที่ `http://localhost:8080/api` (ตั้งใน `src/api.js`)

## โครงร่วมที่ทุกหน้าใช้ (ต้องจำ)
- **`src/api.js`** — axios instance + interceptor แนบ `Authorization: Bearer <token>` ให้อัตโนมัติทุก request (อ่าน token จาก `localStorage` ใหม่ทุกครั้ง)
- **`src/auth.js`** — `saveToken()` / `getUser()` / `removeToken()`
  - `getUser()` ถอด JWT (`atob` ส่วนกลาง) ได้ `{ id, username, role, full_name, candidate_code }`
- **`src/App.jsx`** — routing + `ProtectedRoute` (ถ้า `role` ไม่ตรง → เด้งไป `/login`)
- ทุกหน้า (ยกเว้น Login) **polling ทุก 5 วินาที** ด้วย `setInterval(loadData, 5000)` แล้ว `clearInterval` ตอนออกจากหน้า
- **Logout** ทุกหน้า: `POST /logout` → `removeToken()` → ไป `/login` (เรียก API ก่อนลบ token เสมอ)

## เส้นทาง (Routes)
| Path | หน้า | role ที่เข้าได้ |
|---|---|---|
| `/login` | Login | ทุกคน |
| `/candidate` | CandidatePage | candidate |
| `/judge` | JudgePage | judge |
| `/manager` | ManagerPage | manager |
| `*` (อื่นๆ) | เด้งไป `/login` | — |

---

## 1) Login — `src/pages/Login.jsx`
ฟอร์ม username + password เข้าสู่ระบบ

| ต้องมีในหน้า | Endpoint | ทำอะไร |
|---|---|---|
| ฟอร์ม login + ข้อความ error | `POST /login` | ส่ง username/password → ได้ token |

**Flow:** submit → `POST /login` → `saveToken(res.data.data.token)` → `navigate('/' + role)`
(role จาก response ตรงกับชื่อ route พอดี) → ถ้า error แสดง `err.response.data.message`

---

## 2) CandidatePage — `src/pages/CandidatePage.jsx`
ดูโจทย์ + ส่ง/แก้ URL ผลงาน + ดูคะแนนตัวเอง

**โหลดตอนเปิดหน้า (loadData):**
| ส่วนในหน้า | Endpoint | ใช้ทำอะไร |
|---|---|---|
| สถานะ session | `GET /config` | บอกว่า session `initialized`/`active`/`closed` |
| รายการโจทย์ | `GET /tasks` | แสดง title + description |
| ผลงานของฉัน | `GET /my-submission` | เอา URL เดิมมาเติมในฟอร์ม |
| คะแนนของฉัน | `GET /my-result` | แสดง score + สถานะ confirmed/pending |

**ปุ่ม/action:**
| ปุ่ม | Endpoint | เงื่อนไข |
|---|---|---|
| Submit (ยังไม่เคยส่ง) | `POST /my-submission` | เฉพาะตอน session `active` |
| Update Submission (เคยส่งแล้ว) | `PUT /my-submission` | เฉพาะตอน session `active` |
| Logout | `POST /logout` | — |

> ฟอร์มและปุ่มจะ **disabled** เมื่อ session ไม่ใช่ `active`
> ส่งสำเร็จ → `alert('Submitted!')` แล้ว `loadData()` ใหม่

---

## 3) JudgePage — `src/pages/JudgePage.jsx`
คุมการสอบ: เปิด/ปิด session, สั่งตรวจซ้ำ, ยืนยันคะแนน

**โหลดตอนเปิดหน้า (loadData):**
| ส่วนในหน้า | Endpoint | ใช้ทำอะไร |
|---|---|---|
| สถานะ session | `GET /config` | แสดง status + คุมปุ่ม Open/Close |
| ตาราง Candidates | `GET /candidates` | code, ชื่อ, สถานะ submission, score, ปุ่ม action |
| ตาราง Submissions | `GET /submissions` | code, ชื่อ, frontend/backend URL (ลิงก์เปิดได้), status |

**ปุ่ม/action:**
| ปุ่ม | Endpoint | เงื่อนไข |
|---|---|---|
| Open Session | `PUT /session/start` | disabled ถ้า session `active` อยู่แล้ว |
| Close Session | `PUT /session/close` | มี `confirm()` ก่อน; disabled ถ้าไม่ใช่ `active` |
| Re-check | `POST /submissions/:id/recheck` | แสดงเมื่อมี submission และ result ยังไม่ `confirmed` |
| Confirm | `PUT /results/:candidate_id/confirm` | แสดงเมื่อ result เป็น `pending` |
| Logout | `POST /logout` | — |

> Re-check ส่ง `submission_id`, Confirm ส่ง `candidate_id` (คนละ id — ระวังสลับ)
> หลังทุก action เรียก `loadData()` แล้ว polling อัปเดตผลตามให้เอง

---

## 4) ManagerPage — `src/pages/ManagerPage.jsx`
อ่านอย่างเดียว: สถิติภาพรวม + อันดับ + export รายงาน

**โหลดตอนเปิดหน้า (loadData):**
| ส่วนในหน้า | Endpoint | ใช้ทำอะไร |
|---|---|---|
| การ์ด Summary | `GET /statistics/summary` | total_candidates, submitted, confirmed, average_score, session |
| ตาราง Ranking | `GET /statistics/ranking` | rank, code, ชื่อ, score, ผ่าน/ไม่ผ่าน |
| Pass/Fail | `GET /statistics/status` | pass_count, fail_count, pass_threshold (เกณฑ์ผ่าน) |

**ปุ่ม/action:**
| ปุ่ม | Endpoint | ทำอะไร |
|---|---|---|
| Export JSON | `GET /report?format=json` | โหลดไฟล์ `report.json` (responseType `blob`) |
| Export CSV | `GET /report?format=csv` | โหลดไฟล์ `report.csv` |
| Logout | `POST /logout` | — |

> Pass/Fail ในตารางคิดจาก `score >= pass_threshold` (ค่า default 50)

---

## สรุป endpoint ที่แต่ละหน้าใช้ (ภาพรวม)
| หน้า | Endpoints |
|---|---|
| Login | `POST /login` |
| Candidate | `GET /config` · `GET /tasks` · `GET /my-submission` · `GET /my-result` · `POST/PUT /my-submission` · `POST /logout` |
| Judge | `GET /config` · `GET /candidates` · `GET /submissions` · `PUT /session/start` · `PUT /session/close` · `POST /submissions/:id/recheck` · `PUT /results/:candidate_id/confirm` · `POST /logout` |
| Manager | `GET /statistics/summary` · `GET /statistics/ranking` · `GET /statistics/status` · `GET /report` · `POST /logout` |

> ดูรายละเอียด request/response ของแต่ละ endpoint ได้ที่ [📑 API Reference](/backend-real-db/api-reference)
