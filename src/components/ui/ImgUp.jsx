import { useRef, useState } from 'react';
import { I } from './Icons';
import { compressImage } from '../../utils/imageUtils';
import CropModal from './CropModal';

export default function ImgUp({ image, onChange, label = '사진 촬영' }) {
  const inputRef = useRef(null);
  const [cropSrc, setCropSrc] = useState(null);

  const handleFile = e => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result);
    reader.readAsDataURL(file);
  };

  const handleCropConfirm = async dataUrl => {
    setCropSrc(null);
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'cropped.jpg', { type: 'image/jpeg' });
      const compressed = await compressImage(file);
      onChange(compressed);
    } catch {
      onChange(dataUrl); // 압축 실패 시 크롭 결과 그대로 사용
    }
  };

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`w-36 h-36 rounded-2xl overflow-hidden flex items-center justify-center cursor-pointer transition-all duration-200 hover:shadow-lg
          ${image
            ? 'border-0 shadow-md'
            : 'border-2 border-dashed border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/30'
          }`}
      >
        {image ? (
          <img src={image} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="text-center">
            <I.Camera />
            <div className="text-[11px] text-gray-300 mt-1 font-medium">{label}</div>
          </div>
        )}
      </button>
      <span className="text-[11px] text-gray-400 font-medium">{label}</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFile}
      />

      {cropSrc && (
        <CropModal
          src={cropSrc}
          onCancel={() => setCropSrc(null)}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  );
}
