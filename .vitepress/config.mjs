import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(defineConfig({
  base: '/worldskill-2026-web-tech-docs/',
  title: 'WorldSkill 2026 — Web Tech',
  description: 'คู่มือสร้าง Backend สำหรับการแข่งขัน WorldSkill Web Tech ทีละขั้นตอน',
  lang: 'th-TH',
  ignoreDeadLinks: true,

  themeConfig: {
    nav: [
      { text: '🏠 หน้าหลัก', link: '/' },
      { text: '🚀 เริ่มต้นเลย', link: '/01-installation' },
      { text: '🏆 Checklist แข่งขัน', link: '/29-checklist' },
    ],

    sidebar: [
      {
        text: '🔧 เตรียมพร้อม',
        items: [
          { text: '1 — 💻 ติดตั้งเครื่องมือ', link: '/01-installation' },
          { text: '2 — 🤔 Backend คืออะไร', link: '/02-intro' },
          { text: '3 — 📁 เตรียม Project', link: '/03-setup' },
        ],
      },
      {
        text: '⚡ สร้าง Server ทีละขั้น',
        items: [
          { text: '4 — 🚀 Express: Hello World', link: '/04-express' },
          { text: '5 — 📨 req & res', link: '/05-req-res' },
          { text: '6 — 🔑 dotenv', link: '/06-dotenv' },
          { text: '7 — 🌐 cors', link: '/07-cors' },
          { text: '8 — 🗄️ Database & SQL', link: '/08-database' },
          { text: '9 — 🔌 mysql2', link: '/09-mysql2' },
          { text: '10 — ✅ Checkpoint', link: '/10-checkpoint' },
        ],
      },
      {
        text: '🔐 ระบบ Authentication',
        items: [
          { text: '11 — 🔒 bcryptjs', link: '/11-bcryptjs' },
          { text: '12 — 🎟️ jsonwebtoken', link: '/12-jsonwebtoken' },
          { text: '13 — 🔑 Auth Routes & Login', link: '/auth/13-auth' },
          { text: '14 — 🏗️ Architecture', link: '/14-architecture' },
        ],
      },
      {
        text: '🌐 Shared Endpoints',
        items: [
          { text: '15 — ⚙️ Config', link: '/shared/15-config' },
          { text: '16 — 📋 Tasks', link: '/shared/16-tasks' },
        ],
      },
      {
        text: '🎓 Candidate Endpoints',
        items: [
          { text: '17 — 📥 My Submission (GET)', link: '/candidate/17-my-submission-get' },
          { text: '18 — 📤 My Submission (POST/PUT)', link: '/candidate/18-my-submission-write' },
          { text: '19 — 🏅 My Result', link: '/candidate/19-my-result' },
        ],
      },
      {
        text: '⚖️ Judge Endpoints',
        items: [
          { text: '20 — ⏱️ Session Control', link: '/judge/20-session' },
          { text: '21 — 👥 Candidates', link: '/judge/21-candidates' },
          { text: '22 — 📝 Submissions', link: '/judge/22-submissions' },
          { text: '23 — 🔄 Recheck', link: '/judge/23-recheck' },
          { text: '24 — ✔️ Confirm Result', link: '/judge/24-confirm' },
        ],
      },
      {
        text: '📊 Manager Endpoints',
        items: [
          { text: '25 — 📈 Statistics', link: '/manager/25-statistics' },
          { text: '26 — 🥇 Ranking', link: '/manager/26-ranking' },
          { text: '27 — 🗓️ Sessions', link: '/manager/27-sessions' },
          { text: '28 — 📄 Report', link: '/manager/28-report' },
        ],
      },
      {
        text: '🏁 สรุป',
        items: [
          { text: '29 — 🏆 Competition Checklist', link: '/29-checklist' },
          { text: '📖 คำศัพท์', link: '/glossary' },
        ],
      },
      {
        text: '🖥️ Frontend',
        items: [
          { text: '🚧 กำลังพัฒนา', link: '/frontend-coming-soon' },
        ],
      },
    ],

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
