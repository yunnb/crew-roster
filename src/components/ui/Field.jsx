export default function Field({ label, value, onChange, placeholder, type = "text", maxLen, formatter, area }) {
  const handle = e => {
    let v = e.target.value;
    if (formatter) v = formatter(v);
    if (maxLen && v.replace(/\D/g, "").length > maxLen) return;
    onChange(v);
  };

  const cls = "w-full px-4 py-3.5 text-base bg-gray-50 rounded-xl border-[1.5px] border-gray-100 outline-none transition-colors duration-200 focus:border-blue-400 focus:bg-white placeholder:text-gray-300";

  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-gray-400 mb-2 tracking-wide">{label}</label>
      {area ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className={cls + " resize-none"}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={handle}
          placeholder={placeholder}
          className={cls}
        />
      )}
    </div>
  );
}
