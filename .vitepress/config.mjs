import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(defineConfig({
  base: '/worldskill-2026-web-tech-docs/',
  title: 'WorldSkill 2026 — Web Tech',
  description: 'คู่มือสร้าง Backend และ Frontend สำหรับการแข่งขัน WorldSkill Web Tech ทีละขั้นตอน',
  lang: 'th-TH',
  ignoreDeadLinks: true,

  themeConfig: {
    nav: [
      { text: '🏠 หน้าหลัก', link: '/' },
      { text: '⚙️ Backend', link: '/backend/01-installation' },
      { text: '🖥️ Frontend', link: '/frontend/01-setup' },
      { text: '🏆 BE Checklist', link: '/backend/29-checklist' },
      { text: '🏆 FE Checklist', link: '/frontend/17-checklist' },
    ],

    sidebar: {
      '/backend/': [
        {
          text: '🔧 เตรียมพร้อม',
          items: [
            { text: '1 — 💻 ติดตั้งเครื่องมือ', link: '/backend/01-installation' },
            { text: '2 — 🤔 Backend คืออะไร', link: '/backend/02-intro' },
            { text: '3 — 📁 เตรียม Project', link: '/backend/03-setup' },
          ],
        },
        {
          text: '⚡ สร้าง Server ทีละขั้น',
          items: [
            { text: '4 — 🚀 Express: Hello World', link: '/backend/04-express' },
            { text: '5 — 📨 req & res', link: '/backend/05-req-res' },
            { text: '6 — 🔑 dotenv', link: '/backend/06-dotenv' },
            { text: '7 — 🌐 cors', link: '/backend/07-cors' },
            { text: '8 — 🗄️ Database & SQL', link: '/backend/08-database' },
            { text: '9 — 🔌 mysql2', link: '/backend/09-mysql2' },
            { text: '10 — ✅ Checkpoint', link: '/backend/10-checkpoint' },
          ],
        },
        {
          text: '🔐 ระบบ Authentication',
          items: [
            { text: '11 — 🔒 bcryptjs', link: '/backend/11-bcryptjs' },
            { text: '12 — 🎟️ jsonwebtoken', link: '/backend/12-jsonwebtoken' },
            { text: '13 — 🔑 Auth Routes & Login', link: '/backend/auth/13-auth' },
            { text: '14 — 🏗️ Architecture', link: '/backend/14-architecture' },
          ],
        },
        {
          text: '🌐 Shared Endpoints',
          items: [
            { text: '15 — ⚙️ Config', link: '/backend/shared/15-config' },
            { text: '16 — 📋 Tasks', link: '/backend/shared/16-tasks' },
          ],
        },
        {
          text: '🎓 Candidate Endpoints',
          items: [
            { text: '17 — 📥 My Submission (GET)', link: '/backend/candidate/17-my-submission-get' },
            { text: '18 — 📤 My Submission (POST/PUT)', link: '/backend/candidate/18-my-submission-write' },
            { text: '19 — 🏅 My Result', link: '/backend/candidate/19-my-result' },
          ],
        },
        {
          text: '⚖️ Judge Endpoints',
          items: [
            { text: '20 — ⏱️ Session Control', link: '/backend/judge/20-session' },
            { text: '21 — 👥 Candidates', link: '/backend/judge/21-candidates' },
            { text: '22 — 📝 Submissions', link: '/backend/judge/22-submissions' },
            { text: '23 — 🔄 Recheck', link: '/backend/judge/23-recheck' },
            { text: '24 — ✔️ Confirm Result', link: '/backend/judge/24-confirm' },
          ],
        },
        {
          text: '📊 Manager Endpoints',
          items: [
            { text: '25 — 📈 Statistics', link: '/backend/manager/25-statistics' },
            { text: '26 — 🥇 Ranking', link: '/backend/manager/26-ranking' },
            { text: '27 — 🗓️ Sessions', link: '/backend/manager/27-sessions' },
            { text: '28 — 📄 Report', link: '/backend/manager/28-report' },
          ],
        },
        {
          text: '🏁 สรุป',
          items: [
            { text: '29 — 🏆 Competition Checklist', link: '/backend/29-checklist' },
            { text: '📖 คำศัพท์', link: '/glossary' },
          ],
        },
      ],

      '/frontend/': [
        {
          text: '⚡ เตรียมพร้อม + Concept',
          items: [
            { text: '1 — 🚀 Setup + Vite', link: '/frontend/01-setup' },
            { text: '2 — ⚛️ React คืออะไร', link: '/frontend/02-react-intro' },
            { text: '3 — 🎨 Tailwind CSS', link: '/frontend/03-tailwind' },
            { text: '4 — 🔄 useState', link: '/frontend/04-usestate' },
            { text: '5 — ⏱️ useEffect + useCallback', link: '/frontend/05-useeffect' },
            { text: '6 — 🌐 Axios + api.js', link: '/frontend/06-axios' },
          ],
        },
        {
          text: '🔐 Routing + Auth',
          items: [
            { text: '7 — 🗺️ React Router', link: '/frontend/07-router' },
            { text: '8 — 🔑 AuthContext', link: '/frontend/08-auth-context' },
            { text: '9 — 🔒 Login Page', link: '/frontend/09-login' },
            { text: '10 — 🛡️ ProtectedRoute', link: '/frontend/10-protected-route' },
          ],
        },
        {
          text: '🧩 Components + Pages',
          items: [
            { text: '11 — 🧱 Common Components', link: '/frontend/11-common-components' },
            { text: '12 — 🎓 Candidate Dashboard', link: '/frontend/12-candidate-dashboard' },
            { text: '13 — 📝 Candidate Forms', link: '/frontend/13-candidate-forms' },
            { text: '14 — ⚖️ Judge Dashboard', link: '/frontend/14-judge-dashboard' },
            { text: '15 — 📊 Manager Dashboard', link: '/frontend/15-manager-dashboard' },
            { text: '16 — 📄 Export', link: '/frontend/16-export' },
          ],
        },
        {
          text: '🏁 สรุป',
          items: [
            { text: '17 — 🏆 Competition Checklist', link: '/frontend/17-checklist' },
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
