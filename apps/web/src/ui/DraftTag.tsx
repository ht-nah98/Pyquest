/** Marks a course or a lesson the coach has not approved yet. */
export function DraftTag({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-block self-start rounded-full bg-sun px-2 text-xs font-bold ${className}`}
    >
      Bản nháp · chỉ HLV thấy
    </span>
  );
}
