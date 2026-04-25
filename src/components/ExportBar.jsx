import { I } from './ui/Icons';

const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

export default function ExportBar({ exporting, selectedCount, onShare, onDownload }) {
  const disabled = exporting || selectedCount === 0;

  const primaryCls = `flex-1 py-4 rounded-2xl text-base font-bold border-0 cursor-pointer flex items-center justify-center gap-2 transition-all ${
    disabled
      ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
      : 'bg-blue-500 text-white hover:bg-blue-600 active:scale-[0.98] shadow-lg shadow-blue-200/40'
  }`;

  const secondaryCls = `flex-1 py-4 rounded-2xl text-base font-bold border cursor-pointer flex items-center justify-center gap-2 transition-all ${
    disabled
      ? 'border-gray-200 bg-white text-gray-300 cursor-not-allowed'
      : 'border-blue-500 bg-white text-blue-500 hover:bg-blue-50 active:scale-[0.98]'
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
        {/* 이미지 저장: 모바일=공유 시트로 갤러리 저장 / 데스크탑=blob 다운로드 */}
        <button onClick={onDownload} disabled={disabled} className={primaryCls}>
          {exporting ? '처리 중...' : <><I.Dl /> 이미지 저장</>}
        </button>
        {/* 공유하기: 다른 앱으로 보내기 (모바일에서만 노출) */}
        {canShare && (
          <button onClick={onShare} disabled={disabled} className={secondaryCls}>
            <I.Share /> 공유하기
          </button>
        )}
      </div>
    </div>
  );
}
