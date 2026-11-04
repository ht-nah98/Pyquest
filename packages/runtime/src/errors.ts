/** Turns a Python error into one short Vietnamese sentence a 12-year-old can act on (≤ 12 words). */
export function translateError(type: string, msg: string, line: number | null): string {
  const at = line === null ? '' : `Dòng ${String(line)}: `;
  const where = line === null ? 'Code có lỗi.' : `Code có lỗi ở dòng ${String(line)}.`;

  if (type === 'PyQuestError' && msg === 'missing update') {
    return 'Game cần hàm update() để chạy mỗi khung hình.';
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
  if (type === 'ZeroDivisionError') return `${at}không chia cho 0 được.`;
  if (type === 'TypeError') {
    if (/concatenate|unsupported operand/.test(msg)) return `${at}không cộng được chữ với số.`;
    if (/argument/.test(msg)) return `${at}lệnh này cần số giá trị khác.`;
    if (/phải là một số/.test(msg)) return `${at}${msg}.`;
  }
  if (type === 'ModuleNotFoundError') {
    const name = /module named '([^']+)'/.exec(msg)?.[1] ?? '';
    return `${at}không tìm thấy file hay thư viện ${name}.`;
  }
  return where;
}
