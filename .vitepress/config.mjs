import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(defineConfig({
  base: '/worldskill-2026-web-tech-docs/',
  title: 'WorldSkill 2026 — Web Tech',
  description: 'คู่มือสร้าง Backend และ Frontend (Real DB) สำหรับการแข่งขัน WorldSkill Web Tech ทีละขั้นตอน',
  lang: 'th-TH',
  ignoreDeadLinks: true,

  themeConfig: {
    nav: [
      { text: '🏠 หน้าหลัก', link: '/' },
      { text: '⚙️ Backend', link: '/backend-real-db/01-overview' },
      { text: '🌐 Frontend', link: '/frontend-simple-real-db/01-overview' },
      { text: '🏆 Checklist', link: '/backend-real-db/25-checklist' },
      {
        text: '📦 เอกสารเดิม',
        items: [
          { text: '⚙️ Backend (เดิม)', link: '/legacy/backend/01-installation' },
          { text: '🌱 Frontend Simple (เดิม)', link: '/legacy/frontend-simple/01-overview' },
          { text: '🖥️ Frontend (เดิม)', link: '/legacy/frontend/01-setup' },
          { text: '🔗 บูรณาการ (เดิม)', link: '/legacy/integration/01-overview' },
        ],
      },
      { text: '📖 คำศัพท์', link: '/glossary' },
    ],

    sidebar: {
      '/backend-real-db/': [
        {
          text: '🔧 เริ่มต้น',
          items: [
            { text: '1 — 🗺️ ภาพรวมระบบ (Real DB)', link: '/backend-real-db/01-overview' },
            { text: '2 — 💻 ติดตั้งเครื่องมือ', link: '/backend-real-db/02-installation' },
            { text: '3 — 📁 เตรียม Project', link: '/backend-real-db/03-setup' },
          ],
        },
        {
          text: '⚡ สร้าง Server ทีละขั้น',
          items: [
            { text: '4 — 🚀 Express: Hello World', link: '/backend-real-db/04-express' },
            { text: '5 — 🔑 dotenv & cors', link: '/backend-real-db/05-env-cors' },
            { text: '6 — 🗄️ Database & Schema', link: '/backend-real-db/06-database' },
            { text: '7 — 🔌 เชื่อม mysql2', link: '/backend-real-db/07-mysql2' },
            { text: '8 — ✅ Checkpoint', link: '/backend-real-db/08-checkpoint' },
          ],
        },
        {
          text: '🔐 Authentication (ไม่มี bcrypt)',
          items: [
            { text: '9 — 🎟️ jsonwebtoken', link: '/backend-real-db/09-jwt' },
            { text: '10 — 🔑 Login (plain-text) + Middleware', link: '/backend-real-db/10-auth' },
            { text: '11 — 🏗️ Architecture & app.js', link: '/backend-real-db/11-architecture' },
          ],
        },
        {
          text: '🌐 Shared Endpoints',
          items: [
            { text: '12 — ⚙️ Config', link: '/backend-real-db/12-config' },
            { text: '13 — 📋 Tasks', link: '/backend-real-db/13-tasks' },
          ],
        },
        {
          text: '🎓 Candidate Endpoints',
          items: [
            { text: '14 — 📥 My Submission (GET)', link: '/backend-real-db/14-my-submission-get' },
            { text: '15 — 📤 My Submission (POST/PUT)', link: '/backend-real-db/15-my-submission-write' },
            { text: '16 — 🏅 My Result', link: '/backend-real-db/16-my-result' },
          ],
        },
        {
          text: '⚖️ Judge Endpoints',
          items: [
            { text: '17 — ⏱️ Session Control', link: '/backend-real-db/17-session' },
            { text: '18 — 👥 Candidates', link: '/backend-real-db/18-candidates' },
            { text: '19 — 📝 Submissions', link: '/backend-real-db/19-submissions' },
            { text: '20 — 🔄 Recheck', link: '/backend-real-db/20-recheck' },
            { text: '21 — ✔️ Confirm Result', link: '/backend-real-db/21-confirm' },
          ],
        },
        {
          text: '📊 Manager Endpoints',
          items: [
            { text: '22 — 📈 Statistics', link: '/backend-real-db/22-statistics' },
            { text: '23 — 🥇 Ranking', link: '/backend-real-db/23-ranking' },
            { text: '24 — 📄 Report', link: '/backend-real-db/24-report' },
          ],
        },
        {
          text: '🏁 สรุป',
          items: [
            { text: '25 — 🏆 Competition Checklist', link: '/backend-real-db/25-checklist' },
            { text: '📖 คำศัพท์', link: '/glossary' },
          ],
        },
        {
          text: '🧩 บทเสริม (ออปชัน)',
          items: [
            { text: '⏱️ จับเวลา + ปิด session อัตโนมัติ', link: '/backend-real-db/26-session-timer' },
            { text: '🔒 จำกัด URL ให้เป็น LAN', link: '/backend-real-db/27-lan-url-validation' },
          ],
        },
      ],

      '/frontend-simple-real-db/': [
        {
          text: '🌐 เริ่มต้น',
          items: [
            { text: '1 — 🗺️ ภาพรวม Frontend (Real DB)', link: '/frontend-simple-real-db/01-overview' },
            { text: '2 — 🚀 สร้างโปรเจกต์', link: '/frontend-simple-real-db/02-setup' },
          ],
        },
        {
          text: '🧰 ไฟล์กลางที่ทุกหน้าใช้',
          items: [
            { text: '3 — 🎟️ auth.js จัดการ Token', link: '/frontend-simple-real-db/03-auth' },
            { text: '4 — 🌐 api.js คุยกับ Backend', link: '/frontend-simple-real-db/04-api' },
            { text: '5 — 🛡️ App.jsx เส้นทาง + ยามเฝ้าประตู', link: '/frontend-simple-real-db/05-app-router' },
          ],
        },
        {
          text: '📄 สร้างทีละหน้า',
          items: [
            { text: '6 — 🔒 หน้า Login', link: '/frontend-simple-real-db/06-login' },
            { text: '7 — 🎓 หน้า Candidate', link: '/frontend-simple-real-db/07-candidate' },
            { text: '8 — ⚖️ หน้า Judge', link: '/frontend-simple-real-db/08-judge' },
            { text: '9 — 📊 หน้า Manager', link: '/frontend-simple-real-db/09-manager' },
          ],
        },
        {
          text: '🏁 สรุป',
          items: [
            { text: '10 — ✅ ทดสอบทั้งระบบ', link: '/frontend-simple-real-db/10-testing' },
            { text: '📖 คำศัพท์', link: '/glossary' },
          ],
        },
        {
          text: '🏆 บทเสริม: พร้อมแข่ง (frontend-real-db)',
          items: [
            { text: '⭐ ภาพรวม + Setup', link: '/frontend-simple-real-db/11-realdb-overview' },
            { text: '⏱️ Countdown Timer', link: '/frontend-simple-real-db/12-realdb-timer' },
            { text: '🎨 Design System + a11y', link: '/frontend-simple-real-db/13-realdb-styling-a11y' },
          ],
        },
      ],

      '/legacy/backend/': [
        {
          text: '📦 เอกสารเดิม — Backend',
          items: [
            { text: '1 — 💻 ติดตั้งเครื่องมือ', link: '/legacy/backend/01-installation' },
            { text: '2 — 🤔 Backend คืออะไร', link: '/legacy/backend/02-intro' },
            { text: '3 — 📁 เตรียม Project', link: '/legacy/backend/03-setup' },
            { text: '4 — 🚀 Express: Hello World', link: '/legacy/backend/04-express' },
            { text: '5 — 📨 req & res', link: '/legacy/backend/05-req-res' },
            { text: '6 — 🔑 dotenv', link: '/legacy/backend/06-dotenv' },
            { text: '7 — 🌐 cors', link: '/legacy/backend/07-cors' },
            { text: '8 — 🗄️ Database & SQL', link: '/legacy/backend/08-database' },
            { text: '9 — 🔌 mysql2', link: '/legacy/backend/09-mysql2' },
            { text: '10 — ✅ Checkpoint', link: '/legacy/backend/10-checkpoint' },
            { text: '11 — 🔒 bcryptjs', link: '/legacy/backend/11-bcryptjs' },
            { text: '12 — 🎟️ jsonwebtoken', link: '/legacy/backend/12-jsonwebtoken' },
            { text: '13 — 🔑 Auth Routes & Login', link: '/legacy/backend/auth/13-auth' },
            { text: '14 — 🏗️ Architecture', link: '/legacy/backend/14-architecture' },
            { text: '15 — ⚙️ Config', link: '/legacy/backend/shared/15-config' },
            { text: '16 — 📋 Tasks', link: '/legacy/backend/shared/16-tasks' },
            { text: '17 — 📥 My Submission (GET)', link: '/legacy/backend/candidate/17-my-submission-get' },
            { text: '18 — 📤 My Submission (POST/PUT)', link: '/legacy/backend/candidate/18-my-submission-write' },
            { text: '19 — 🏅 My Result', link: '/legacy/backend/candidate/19-my-result' },
            { text: '20 — ⏱️ Session Control', link: '/legacy/backend/judge/20-session' },
            { text: '21 — 👥 Candidates', link: '/legacy/backend/judge/21-candidates' },
            { text: '22 — 📝 Submissions', link: '/legacy/backend/judge/22-submissions' },
            { text: '23 — 🔄 Recheck', link: '/legacy/backend/judge/23-recheck' },
            { text: '24 — ✔️ Confirm Result', link: '/legacy/backend/judge/24-confirm' },
            { text: '25 — 📈 Statistics', link: '/legacy/backend/manager/25-statistics' },
            { text: '26 — 🥇 Ranking', link: '/legacy/backend/manager/26-ranking' },
            { text: '27 — 🗓️ Sessions', link: '/legacy/backend/manager/27-sessions' },
            { text: '28 — 📄 Report', link: '/legacy/backend/manager/28-report' },
            { text: '29 — 🏆 Competition Checklist', link: '/legacy/backend/29-checklist' },
          ],
        },
      ],

      '/legacy/frontend-simple/': [
        {
          text: '📦 เอกสารเดิม — Frontend Simple',
          items: [
            { text: '1 — 🗺️ ภาพรวม Frontend Simple', link: '/legacy/frontend-simple/01-overview' },
            { text: '2 — 🚀 สร้างโปรเจกต์', link: '/legacy/frontend-simple/02-setup' },
            { text: '3 — 🎟️ auth.js จัดการ Token', link: '/legacy/frontend-simple/03-auth' },
            { text: '4 — 🌐 api.js คุยกับ Backend', link: '/legacy/frontend-simple/04-api' },
            { text: '5 — 🛡️ App.jsx เส้นทาง + ยามเฝ้าประตู', link: '/legacy/frontend-simple/05-app-router' },
            { text: '6 — 🔒 หน้า Login', link: '/legacy/frontend-simple/06-login' },
            { text: '7 — 🎓 หน้า Candidate', link: '/legacy/frontend-simple/07-candidate' },
            { text: '8 — ⚖️ หน้า Judge', link: '/legacy/frontend-simple/08-judge' },
            { text: '9 — 📊 หน้า Manager', link: '/legacy/frontend-simple/09-manager' },
            { text: '10 — ✅ ทดสอบทั้งระบบ', link: '/legacy/frontend-simple/10-testing' },
          ],
        },
      ],

      '/legacy/frontend/': [
        {
          text: '📦 เอกสารเดิม — Frontend',
          items: [
            { text: '1 — 🚀 Setup + Vite', link: '/legacy/frontend/01-setup' },
            { text: '2 — ⚛️ React คืออะไร', link: '/legacy/frontend/02-react-intro' },
            { text: '3 — 🎨 Tailwind CSS', link: '/legacy/frontend/03-tailwind' },
            { text: '4 — 🔄 useState', link: '/legacy/frontend/04-usestate' },
            { text: '5 — ⏱️ useEffect + Polling', link: '/legacy/frontend/05-useeffect' },
            { text: '6 — 🧩 Rendering Patterns', link: '/legacy/frontend/rendering-patterns' },
            { text: '7 — 🌐 Axios + api.js', link: '/legacy/frontend/06-axios' },
            { text: '8 — 🗺️ React Router', link: '/legacy/frontend/07-router' },
            { text: '9 — ✅ Todolist (Capstone)', link: '/legacy/frontend/todolist' },
            { text: '10 — 🔑 AuthContext', link: '/legacy/frontend/08-auth-context' },
            { text: '11 — 🧱 Common Components', link: '/legacy/frontend/11-common-components' },
            { text: '12 — 🔒 Login Page', link: '/legacy/frontend/09-login' },
            { text: '13 — 🛡️ ProtectedRoute', link: '/legacy/frontend/10-protected-route' },
            { text: '14 — 📐 Dashboard Pattern', link: '/legacy/frontend/dashboard-pattern' },
            { text: '15 — 🎓 Candidate Dashboard', link: '/legacy/frontend/12-candidate-dashboard' },
            { text: '16 — 📝 Candidate Forms', link: '/legacy/frontend/13-candidate-forms' },
            { text: '17 — ⚖️ Judge Dashboard', link: '/legacy/frontend/14-judge-dashboard' },
            { text: '18 — 📊 Manager Dashboard', link: '/legacy/frontend/15-manager-dashboard' },
            { text: '19 — 📄 Export', link: '/legacy/frontend/16-export' },
            { text: '20 — 🏆 Competition Checklist', link: '/legacy/frontend/17-checklist' },
          ],
        },
      ],

      '/legacy/integration/': [
        {
          text: '📦 เอกสารเดิม — บูรณาการ',
          items: [
            { text: '1 — 🗺️ แผนการรบ (Build Order)', link: '/legacy/integration/01-overview' },
            { text: '2 — 🏗️ Phase 0: รากฐาน', link: '/legacy/integration/02-phase0-foundation' },
            { text: '3 — 🔐 Phase 1: Auth', link: '/legacy/integration/03-phase1-auth' },
            { text: '4 — 📋 Phase 2: Config + Tasks', link: '/legacy/integration/04-phase2-config-tasks' },
            { text: '5 — ⏱️ Phase 3: Session', link: '/legacy/integration/05-phase3-session' },
            { text: '6 — 📤 Phase 4: Submission', link: '/legacy/integration/06-phase4-submission' },
            { text: '7 — ⚖️ Phase 5: Judge + Results', link: '/legacy/integration/07-phase5-judge-results' },
            { text: '8 — 📊 Phase 6: Manager', link: '/legacy/integration/08-phase6-manager' },
            { text: '9 — 🚀 Phase 7: Polish + Deploy', link: '/legacy/integration/09-phase7-polish-deploy' },
          ],
        },
      ],
    },

    footer: {
      message: 'WorldSkill Web Technologies 2026',
    },

    search: {
      provider: 'local',
    },

    outline: {
      label: 'หัวข้อในหน้านี้',
      level: [2, 3],
    },

    docFooter: {
      prev: 'บทก่อนหน้า',
      next: 'บทถัดไป',
    },
  },
}))
