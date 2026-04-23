import { useState, useEffect } from 'react';

export default function Modal({ open, title, message, confirmLabel = '확인', danger = false, onConfirm, onCancel }) {
  const [visible, setVisible] = useState(false);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimated(true)));
    } else {
      setAnimated(false);
      const t = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-6"
      style={{
        background: animated ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0)',
        transition: 'background .2s ease',
      }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-xs bg-white rounded-2xl p-6 shadow-2xl"
        style={{
          transform: animated ? 'scale(1)' : 'scale(0.94)',
          opacity: animated ? 1 : 0,
          transition: 'all .2s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-base font-bold text-gray-900 mb-1.5 m-0">{title}</h3>
        <p className="text-sm text-gray-500 mb-5 leading-relaxed">{message}</p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold border-0 cursor-pointer hover:bg-gray-200 transition-colors"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl text-white text-sm font-semibold border-0 cursor-pointer transition-colors
              ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
