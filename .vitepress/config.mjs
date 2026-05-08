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
      { text: 'หน้าหลัก', link: '/' },
      { text: 'บทที่ 1', link: '/01-installation' },
    ],

    sidebar: [
      {
        text: 'Backend — เตรียมระบบ',
        items: [
          { text: 'บทที่ 1 — ติดตั้งเครื่องมือ', link: '/01-installation' },
          { text: 'บทที่ 2 — Backend คืออะไร', link: '/02-intro' },
          { text: 'บทที่ 3 — เตรียม Project', link: '/03-setup' },
          { text: 'บทที่ 4 — Database และ Schema', link: '/04-database' },
          { text: 'บทที่ 5 — Express คืออะไร', link: '/05-express-concepts' },
        ],
      },
      {
        text: 'เครื่องมือ — สร้าง Server',
        items: [
          { text: 'บทที่ 6 — dotenv: จัดการ Config', link: '/06-dotenv' },
          { text: 'บทที่ 7 — cors: แก้ปัญหา Port ต่างกัน', link: '/07-cors' },
          { text: 'บทที่ 8 — mysql2: เชื่อมต่อ Database', link: '/08-mysql2' },
          { text: 'บทที่ 9 — สร้าง Express Server', link: '/09-express-server' },
        ],
      },
      {
        text: 'เครื่องมือ — ระบบ Login',
        items: [
          { text: 'บทที่ 10 — bcryptjs: เก็บ Password', link: '/10-bcryptjs' },
          { text: 'บทที่ 11 — jsonwebtoken: Token คืออะไร', link: '/11-jsonwebtoken' },
          { text: 'บทที่ 12 — Login และ Logout', link: '/auth/12-auth' },
        ],
      },
      {
        text: 'Backend — Shared Endpoints',
        items: [
          { text: 'บทที่ 13 — Config', link: '/admin/13-config' },
          { text: 'บทที่ 14 — Tasks', link: '/admin/14-tasks' },
        ],
      },
      {
        text: 'Backend — Candidate',
        items: [
          { text: 'บทที่ 15 — My Submission', link: '/admin/15-submissions' },
          { text: 'บทที่ 16 — My Result', link: '/candidate/16-my-result' },
        ],
      },
      {
        text: 'Backend — Judge',
        items: [
          { text: 'บทที่ 17 — Session Control', link: '/judge/17-session' },
          { text: 'บทที่ 18 — Candidates', link: '/judge/18-candidates' },
          { text: 'บทที่ 19 — Submissions & Recheck', link: '/judge/19-submissions' },
          { text: 'บทที่ 20 — Confirm Result', link: '/judge/20-confirm' },
        ],
      },
      {
        text: 'Backend — Manager',
        items: [
          { text: 'บทที่ 21 — Statistics', link: '/manager/21-statistics' },
          { text: 'บทที่ 22 — Session History', link: '/manager/22-sessions' },
          { text: 'บทที่ 23 — Report Export', link: '/manager/23-report' },
        ],
      },
      {
        text: 'สรุป',
        items: [
          { text: 'บทที่ 24 — ทดสอบระบบทั้งหมด', link: '/24-test' },
          { text: 'คำศัพท์', link: '/glossary' },
        ],
      },
      {
        text: 'Frontend',
        items: [
          { text: 'กำลังพัฒนา', link: '/frontend-coming-soon' },
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
