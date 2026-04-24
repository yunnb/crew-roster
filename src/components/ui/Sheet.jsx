import { useState, useEffect } from 'react';
import { useViewportHeight } from '../../hooks/useKeyboardOffset';

export default function Sheet({ open, onClose, children }) {
  const [vis, setVis] = useState(false);
  const [an, setAn] = useState(false);
  const vh = useViewportHeight();

  useEffect(() => {
    if (open) {
      setVis(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setAn(true)));
    } else {
      setAn(false);
      const t = setTimeout(() => setVis(false), 320);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!vis) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end"
      style={{
        background: an ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0)",
        transition: "background .3s ease",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full bg-white rounded-t-3xl overflow-y-auto"
        style={{
          maxHeight: vh ? `${Math.floor(vh * 0.92)}px` : "88vh",
          transform: an ? "translateY(0)" : "translateY(100%)",
          transition: "transform .32s cubic-bezier(.32,.72,0,1)",
        }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1.5 rounded-full bg-gray-200" />
        </div>
        <div className="px-6 pb-8">{children}</div>
      </div>
    </div>
  );
}
