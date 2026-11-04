# Quy ước code

1. TypeScript strict (`tsconfig.base.json`), không `any`, không `@ts-ignore`, không `console.log` thừa.
2. Mỗi tệp một trách nhiệm; tệp lớn thì tách theo trách nhiệm, không theo tầng kỹ thuật.
3. Import package khác chỉ qua `index` công khai (`@pyquest/runtime`), không đào sâu vào `src/`.
4. Package headless: không DOM, không `Math.random()` / `Date.now()`.
5. Python trong repo (`pyquest.py`, `fromPython.py`, tools): Python 3.12+, chỉ thư viện chuẩn (tools có thể dùng Pillow).
6. Test đặt cạnh code (`*.test.ts`). Test của Python chạy qua Pyodide trong vitest.
7. Prettier chỉ chạy trên tệp đã đổi (`git diff --name-only`), xem AGENTS.md §9.13.
8. Commit tiếng Anh, kiểu `feat(scope): ...`, `fix: ...`, `docs: ...`.
