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
        text: 'เตรียมพร้อม',
        items: [
          { text: 'บทที่ 1 — ติดตั้งเครื่องมือ', link: '/01-installation' },
          { text: 'บทที่ 2 — Backend คืออะไร', link: '/02-intro' },
          { text: 'บทที่ 3 — เตรียม Project', link: '/03-setup' },
        ],
      },
      {
        text: 'สร้าง Server ทีละขั้น',
        items: [
          { text: 'บทที่ 4 — Express: Hello World', link: '/04-express' },
          { text: 'บทที่ 5 — req & res', link: '/05-req-res' },
          { text: 'บทที่ 6 — dotenv', link: '/06-dotenv' },
          { text: 'บทที่ 7 — cors', link: '/07-cors' },
          { text: 'บทที่ 8 — Database & SQL', link: '/08-database' },
          { text: 'บทที่ 9 — mysql2', link: '/09-mysql2' },
          { text: 'บทที่ 10 — Checkpoint', link: '/10-checkpoint' },
        ],
      },
      {
        text: 'ระบบ Authentication',
        items: [
          { text: 'บทที่ 11 — bcryptjs', link: '/11-bcryptjs' },
          { text: 'บทที่ 12 — jsonwebtoken', link: '/12-jsonwebtoken' },
          { text: 'บทที่ 13 — Auth Routes & Login', link: '/auth/13-auth' },
          { text: 'บทที่ 14 — Architecture', link: '/14-architecture' },
        ],
      },
      {
        text: 'Shared Endpoints',
        items: [
          { text: 'บทที่ 15 — Config', link: '/shared/15-config' },
          { text: 'บทที่ 16 — Tasks', link: '/shared/16-tasks' },
        ],
      },
      {
        text: 'Candidate Endpoints',
        items: [
          { text: 'บทที่ 17 — My Submission (GET)', link: '/candidate/17-my-submission-get' },
          { text: 'บทที่ 18 — My Submission (POST/PUT)', link: '/candidate/18-my-submission-write' },
          { text: 'บทที่ 19 — My Result', link: '/candidate/19-my-result' },
        ],
      },
      {
        text: 'Judge Endpoints',
        items: [
          { text: 'บทที่ 20 — Session Control', link: '/judge/20-session' },
          { text: 'บทที่ 21 — Candidates', link: '/judge/21-candidates' },
          { text: 'บทที่ 22 — Submissions', link: '/judge/22-submissions' },
          { text: 'บทที่ 23 — Recheck', link: '/judge/23-recheck' },
          { text: 'บทที่ 24 — Confirm Result', link: '/judge/24-confirm' },
        ],
      },
      {
        text: 'Manager Endpoints',
        items: [
          { text: 'บทที่ 25 — Statistics', link: '/manager/25-statistics' },
          { text: 'บทที่ 26 — Ranking', link: '/manager/26-ranking' },
          { text: 'บทที่ 27 — Sessions', link: '/manager/27-sessions' },
          { text: 'บทที่ 28 — Report', link: '/manager/28-report' },
        ],
      },
      {
        text: 'สรุป',
        items: [
          { text: 'บทที่ 29 — Competition Checklist', link: '/29-checklist' },
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
