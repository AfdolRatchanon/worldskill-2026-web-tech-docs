# บทที่ 17 — Export

> **Manager** ดาวน์โหลดรายงานได้ 2 format: JSON, CSV — ส่ง JWT header ผ่าน axios แล้วดาวน์โหลดผ่าน Blob URL

## ปัญหา — ดาวน์โหลดไฟล์ที่ต้อง Auth

ปกติดาวน์โหลดไฟล์ใช้ `<a href="url" download>` ธรรมดา — แต่ endpoint `/api/report` ต้องการ JWT token ใน header

**วิธีแก้:** ดาวน์โหลดผ่าน `axios` แล้วแปลง response เป็น Blob URL สำหรับสร้าง `<a>` ชั่วคราว

## Blob URL คืออะไร

Browser สร้าง URL ชั่วคราวจาก binary data ใน memory ได้:

```
axios.get('/report', { responseType: 'blob' })
    ↓
res.data เป็น Blob object (binary data)
    ↓
URL.createObjectURL(blob) → "blob:http://localhost:3000/abc-123"
    ↓
สร้าง <a href="blob:..." download="file.pdf"> แล้วกด .click()
    ↓
Browser trigger ดาวน์โหลด
    ↓
URL.revokeObjectURL(url) — คืน memory
```

## ชิ้นงาน — สร้าง ExportButtons.jsx

```
src/
└── components/
    └── manager/
        ├── SummaryCards.jsx
        ├── RankingTable.jsx
        ├── SessionSelector.jsx
        └── ExportButtons.jsx    ← สร้างในบทนี้
```

สร้าง `src/components/manager/ExportButtons.jsx`:

```jsx
// components/manager/ExportButtons.jsx — บทที่ 16
import api from '../../services/api';
import Button from '../common/Button';

export default function ExportButtons({ sessionId }) {
  async function download(format) {
    try {
      const params = sessionId ? `?format=${format}&session_id=${sessionId}` : `?format=${format}`;
      const res = await api.get(`/report${params}`, {
        responseType: format === 'json' ? 'json' : 'blob',  // json ≠ blob — ต้องแยก
      });

      let blob;
      if (format === 'json') {
        blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      } else {
        blob = res.data;  // CSV เป็น binary ตรงๆ
      }

      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `report-session${sessionId ?? ''}.${format}`;
      a.click();
      URL.revokeObjectURL(url);  // คืน memory หลังดาวน์โหลด
    } catch {
      alert('Export failed');
    }
  }

  return (
    <div className="flex gap-2 flex-wrap">
      <Button variant="ghost" onClick={() => download('json')}>Export JSON</Button>
      <Button variant="ghost" onClick={() => download('csv')}>Export CSV</Button>
    </div>
  );
}
```

:::warning JSON ต้องใช้ responseType 'json' ไม่ใช่ 'blob'
- `format === 'json'` → `responseType: 'json'` → axios parse เป็น object → แปลงเป็น Blob เอง
- `format === 'csv'` → `responseType: 'blob'` → axios คืน Blob ตรงๆ

ถ้าใช้ `'blob'` กับ JSON จะได้ string เป็น `[object Object]` แทนที่จะเป็น JSON จริง
:::

## อัปเดต Manager Dashboard — เพิ่ม ExportButtons

แก้ `src/pages/manager/Dashboard.jsx`:

```jsx
// pages/manager/Dashboard.jsx — บทที่ 16 เพิ่ม ExportButtons
import SummaryCards from '../../components/manager/SummaryCards';
import RankingTable from '../../components/manager/RankingTable';
import SessionSelector from '../../components/manager/SessionSelector';
import ExportButtons from '../../components/manager/ExportButtons';  // [!code ++]

// ... (ส่วน state และ fetchAll เหมือนเดิม)

// ใน return — แก้ส่วน Ranking Card
<Card>
  <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
    <h2 className="font-semibold text-gray-900">Ranking</h2>
    <ExportButtons sessionId={selectedId} /> {/* [!code ++] */}
    <p className="text-sm text-gray-400">Export — จะเพิ่มในบทที่ 16</p> {/* [!code --] */}
  </div>
  <RankingTable ranking={ranking} passThreshold={status?.pass_threshold} />
</Card>
```

## App.jsx สุดท้าย — ครบทุก Route

หลังบทที่ 16 `App.jsx` ควรมีหน้าตาเป็นแบบนี้:

```jsx
// App.jsx — Final (บทที่ 16)
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './router/ProtectedRoute';
import Login from './pages/Login';
import CandidateDashboard from './pages/candidate/Dashboard';
import JudgeDashboard from './pages/judge/Dashboard';
import ManagerDashboard from './pages/manager/Dashboard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"     element={<Login />} />
          <Route path="/candidate" element={
            <ProtectedRoute role="candidate"><CandidateDashboard /></ProtectedRoute>
          } />
          <Route path="/judge" element={
            <ProtectedRoute role="judge"><JudgeDashboard /></ProtectedRoute>
          } />
          <Route path="/manager" element={
            <ProtectedRoute role="manager"><ManagerDashboard /></ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

## ทดสอบ

```bash
npm run dev
```

1. Login เป็น `manager01` / `manager123`
2. เลือก session ที่มี confirmed result
3. กด **Export JSON** → browser ดาวน์โหลดไฟล์ `report-session1.json`
4. เปิดไฟล์ → ต้องเห็น JSON มีข้อมูล ranking
5. กด **Export CSV** → ดาวน์โหลด `.csv` → เปิดใน Notepad ต้องเห็น comma-separated data

:::tip ทดสอบ JWT ส่งครบ
เปิด DevTools → Network → คลิก request `/report` → ดู Request Headers → ต้องมี `Authorization: Bearer ...`
:::

## โครงสร้างไฟล์ทั้งหมด (สรุปสุดท้าย)

```
frontend/
├── package.json
├── vite.config.js
├── index.html
├── .env
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── contexts/
    │   └── AuthContext.jsx
    ├── services/
    │   └── api.js
    ├── router/
    │   └── ProtectedRoute.jsx
    ├── components/
    │   ├── common/
    │   │   ├── Button.jsx
    │   │   ├── Input.jsx
    │   │   ├── Card.jsx
    │   │   └── Badge.jsx
    │   ├── candidate/
    │   │   ├── CountdownTimer.jsx
    │   │   ├── SubmissionForm.jsx
    │   │   └── ResultCard.jsx
    │   ├── judge/
    │   │   ├── SessionControl.jsx
    │   │   ├── CandidateTable.jsx
    │   │   └── SubmissionsTable.jsx
    │   └── manager/
    │       ├── SummaryCards.jsx
    │       ├── RankingTable.jsx
    │       ├── SessionSelector.jsx
    │       └── ExportButtons.jsx
    └── pages/
        ├── Login.jsx
        ├── candidate/
        │   └── Dashboard.jsx
        ├── judge/
        │   └── Dashboard.jsx
        └── manager/
            └── Dashboard.jsx
```

## Common Errors

| Error | สาเหตุ | วิธีแก้ |
|-------|--------|---------|
| Export failed | backend ไม่รัน | รัน `cd backend && npm run dev` แล้วลองใหม่ |
| ไฟล์ JSON เป็น `[object Object]` | ใช้ `responseType: 'blob'` กับ JSON | ใช้ `responseType: 'json'` แล้วแปลงเป็น Blob ด้วย `JSON.stringify` |
| ดาวน์โหลดแล้วไฟล์เปิดไม่ได้ | `URL.revokeObjectURL` รันก่อนดาวน์โหลดเสร็จ | `.revokeObjectURL` อยู่หลัง `.click()` แล้ว (ถูกต้อง) |
