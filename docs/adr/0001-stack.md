# 0001. Bộ công nghệ nền

04/11/2026 · Chấp nhận

## Bối cảnh
PyQuest cần ra bản dùng được cho lớp trong 4 ngày, và HLV đã quen vận hành CodeQuest.

## Quyết định
Dùng lại bộ của CodeQuest, cùng phiên bản: Node 22, npm workspaces, TypeScript 6.0.3, React 19, Vite 8, react-router 8,
Tailwind 4, zod 4, Dexie 4 (IndexedDB), Vitest 5, Playwright 1.63, ESLint 10, Prettier 3. Thêm Blockly 13.4.0,
CodeMirror 6 (`codemirror`, `@codemirror/lang-python`) cho khung code, `@fontsource/vt323` cho font pixel có tiếng Việt.
Pyodide: ADR 0002. Python → khối: ADR 0003.

## Hệ quả
Kinh nghiệm và bài học của CodeQuest (AGENTS.md §9) áp dụng thẳng. Không dùng PixiJS: sân chơi chỉ cần Canvas 2D.
