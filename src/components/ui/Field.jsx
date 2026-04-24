import { PatternFormat } from 'react-number-format';

export default function Field({
  label, value, onChange, onBlur, placeholder,
  type = 'text', maxLen, formatter, area, numFormat,
}) {
  const handleFocus = e => {
    const el = e.currentTarget;
    setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
  };

  // text-[16px] 강제 → iOS 자동 줌인 방지
  const cls =
    'w-full px-4 py-3.5 text-[16px] bg-gray-50 rounded-xl border-[1.5px] border-gray-100 ' +
    'outline-none transition-colors duration-200 focus:border-blue-400 focus:bg-white placeholder:text-gray-300';

  /* ── PatternFormat (SSN / 전화번호 커서 보존) ── */
  if (numFormat) {
    return (
      <div className="mb-4">
        <label className="block text-xs font-semibold text-gray-400 mb-2 tracking-wide">{label}</label>
        <PatternFormat
          format={numFormat}
          value={value}
          onValueChange={({ formattedValue }) => onChange(formattedValue)}
          onBlur={onBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          inputMode="numeric"
          className={cls}
        />
      </div>
    );
  }

  /* ── 일반 input / textarea ── */
  const handle = e => {
    let v = e.target.value;
    if (formatter) v = formatter(v);
    if (maxLen && v.replace(/\D/g, '').length > maxLen) return;
    onChange(v);
  };

  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-gray-400 mb-2 tracking-wide">{label}</label>
      {area ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={onBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          maxLength={70}
          rows={2}
          className={cls + ' resize-none'}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={handle}
          onBlur={onBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          className={cls}
        />
      )}
    </div>
  );
}
