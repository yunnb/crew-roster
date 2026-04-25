import { useRef, useState } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

/* 초기 영역만 가운데 80% — 비율은 자유, 사용자가 위치·크기·종횡비 모두 조정 */
const INITIAL_CROP = { unit: '%', x: 10, y: 10, width: 80, height: 80 };

export default function CropModal({ src, onCancel, onConfirm }) {
  const imgRef = useRef(null);
  const [crop, setCrop] = useState(null);

  const onImageLoad = () => {
    setCrop(INITIAL_CROP);
  };

  const handleConfirm = () => {
    const img = imgRef.current;
    if (!img || !crop) return;
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;
    const pxX = (crop.x / 100) * img.width * scaleX;
    const pxY = (crop.y / 100) * img.height * scaleY;
    const pxW = (crop.width / 100) * img.width * scaleX;
    const pxH = (crop.height / 100) * img.height * scaleY;

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(pxW);
    canvas.height = Math.round(pxH);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, pxX, pxY, pxW, pxH, 0, 0, canvas.width, canvas.height);
    onConfirm(canvas.toDataURL('image/jpeg', 0.95));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-4 w-full max-w-md flex flex-col gap-3 max-h-[92vh]">
        <div>
          <div className="text-base font-bold text-gray-900 text-center">사진 자르기</div>
          <div className="text-xs text-gray-400 text-center mt-1">원하는 영역을 자유롭게 선택하세요</div>
        </div>

        <div className="flex-1 overflow-hidden flex items-center justify-center bg-gray-50 rounded-xl min-h-0">
          <ReactCrop
            crop={crop ?? undefined}
            onChange={(_, percent) => setCrop(percent)}
            keepSelection
            ruleOfThirds
          >
            <img
              ref={imgRef}
              src={src}
              onLoad={onImageLoad}
              alt=""
              style={{ maxHeight: '60vh', maxWidth: '100%', display: 'block' }}
            />
          </ReactCrop>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 border-0 text-base font-semibold cursor-pointer hover:bg-gray-200 transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!crop}
            className="flex-1 py-3 rounded-xl bg-blue-500 text-white border-0 text-base font-semibold cursor-pointer hover:bg-blue-600 disabled:bg-gray-100 disabled:text-gray-300 transition-colors"
          >
            자르기
          </button>
        </div>
      </div>
    </div>
  );
}
