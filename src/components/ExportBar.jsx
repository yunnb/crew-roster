import { I } from './ui/Icons';

const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

export default function ExportBar({ exporting, selectedCount, onShare, onDownload }) {
  const disabled = exporting || selectedCount === 0;
  const btnCls = `flex-1 py-4 rounded-2xl text-base font-bold border-0 cursor-pointer flex items-center justify-center gap-2 transition-all ${
    disabled
      ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
      : 'bg-blue-500 text-white hover:bg-blue-600 active:scale-[0.98] shadow-lg shadow-blue-200/40'
  }`;

  return (
    <div
      className="flex-shrink-0 border-t border-gray-100 px-4 py-3 bg-white"
      style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
    >
      <div className="text-xs text-gray-400 text-center mb-2 h-4">
        {selectedCount > 0 && (
          <span className="font-bold text-blue-500 anim-fade">{selectedCount}명 선택됨</span>
        )}
      </div>
      <div className="flex gap-2">
        {canShare ? (
          <button onClick={onShare} disabled={disabled} className={btnCls}>
            {exporting ? '처리 중...' : <><I.Share /> 내보내기</>}
          </button>
        ) : (
          <button onClick={onDownload} disabled={disabled} className={btnCls}>
            {exporting ? '처리 중...' : <><I.Dl /> 이미지 저장</>}
          </button>
        )}
      </div>
    </div>
  );
}
