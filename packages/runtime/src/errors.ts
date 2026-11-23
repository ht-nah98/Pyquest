/** What children call Python's types, for "… không có lệnh …". */
const TYPES: Record<string, string> = {
  str: 'chữ',
  list: 'danh sách',
  dict: 'hộp',
  int: 'số',
  float: 'số',
};

/** A dict key as Python shows it: 'sped' → "sped", 5 → 5; long ones cut short. */
function keyOf(repr: string): string {
  const word = /^(['"])(.*)\1$/s.exec(repr)?.[2];
  const short = (s: string) => (s.length > 20 ? `${s.slice(0, 19)}…` : s);
  if (word !== undefined) return `ngăn "${short(word)}"`;
  return repr === '' ? 'ngăn đó' : `ngăn ${short(repr)}`;
}

/** Turns a Python error into one short Vietnamese sentence a 12-year-old can act on (≤ 12 words). */
export function translateError(type: string, msg: string, line: number | null): string {
  const at = line === null ? '' : `Dòng ${String(line)}: `;
  const where = line === null ? 'Code có lỗi.' : `Code có lỗi ở dòng ${String(line)}.`;

  if (type === 'PyQuestError' && msg === 'missing update') {
    return 'Game cần hàm update() để chạy mỗi khung hình.';
  }
  if (type === 'PyQuestError') return `${at}${msg}.`;
  if (type === 'MissingImport') {
    const name = /name '([^']+)'/.exec(msg)?.[1] ?? '';
    return `${at}chưa có lệnh ${name}. Thêm dòng from pyquest import * ở đầu file.`;
  }
  if (type === 'IndentationError' || type === 'TabError') return `${at}thụt lề chưa đúng.`;
  if (type === 'SyntaxError') {
    if (/never closed|unexpected EOF|unmatched|does not match/.test(msg))
      return `${at}thiếu dấu ngoặc đóng hoặc mở.`;
    if (/expected ':'/.test(msg)) return `${at}thiếu dấu hai chấm ở cuối dòng.`;
    if (/unterminated string/.test(msg)) return `${at}thiếu dấu nháy đóng chuỗi chữ.`;
    return `${at}viết chưa đúng cách của Python.`;
  }
  if (type === 'NameError') {
    const name = /name '([^']+)'/.exec(msg)?.[1];
    if (name !== undefined) return `${at}chưa có lệnh hay biến tên ${name}.`;
  }
  if (type === 'UnboundLocalError') {
    const name = /variable '([^']+)'/.exec(msg)?.[1];
    if (name !== undefined) return `${at}thiếu global cho biến ${name}.`;
  }
  if (type === 'KeyError') return `${at}hộp không có ${keyOf(msg)}.`;
  if (type === 'IndexError') {
    if (/empty/.test(msg)) return `${at}danh sách đang trống.`;
    if (/^string/.test(msg)) return `${at}chữ không có vị trí đó.`;
    return `${at}danh sách không có ngăn số đó.`;
  }
  if (type === 'AttributeError') {
    const m = /^'([^']+)' object has no attribute '([^']+)'/.exec(msg);
    if (m?.[1] !== undefined && m[2] !== undefined)
      return `${at}${TYPES[m[1]] ?? 'giá trị này'} không có lệnh ${m[2]}.`;
  }
  if (type === 'ValueError' && /^list\.remove/.test(msg))
    return `${at}danh sách không có thứ cần bỏ.`;
  if (type === 'RecursionError') return `${at}lệnh tự gọi chính nó mãi không dừng.`;
  if (type === 'ZeroDivisionError') return `${at}không chia cho 0 được.`;
  if (type === 'TypeError') {
    const plus = /^can only concatenate str|for \+=?: /.test(msg);
    if (plus && /\bstr\b/.test(msg) && /\b(int|float)\b/.test(msg))
      return `${at}không cộng được chữ với số, dùng str(...).`;
    if (/concatenate|unsupported operand/.test(msg))
      return `${at}hai giá trị này không tính với nhau được.`;
    if (/argument/.test(msg)) return `${at}lệnh này cần số giá trị khác.`;
    if (/phải là một số/.test(msg)) return `${at}${msg}.`;
  }
  if (type === 'ModuleNotFoundError') {
    const name = /module named '([^']+)'/.exec(msg)?.[1] ?? '';
    return `${at}không tìm thấy file hay thư viện ${name}.`;
  }
  return where;
}
