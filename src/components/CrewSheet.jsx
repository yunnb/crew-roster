import { useState, useEffect } from 'react';
import Sheet from './ui/Sheet';
import Modal from './ui/Modal';
import { I } from './ui/Icons';
import { maskSSN, fmtSSN, fmtPhone } from '../utils/formatters';
import Field from './ui/Field';

export default function CrewSheet({ open, detail, onClose, onDelete, onUpdatePerson }) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Local state for editable fields
  const [name, setName] = useState(detail?.name || '');
  const [ssn, setSsn] = useState(detail?.ssn || '');
  const [phone, setPhone] = useState(detail?.phone || '');
  const [address, setAddress] = useState(detail?.address || '');

  // Effect to update local state when detail prop changes (e.g., when a different person is viewed)
  useEffect(() => {
    if (detail) {
      setName(detail.name);
      setSsn(detail.ssn);
      setPhone(detail.phone);
      setAddress(detail.address);
    }
  }, [detail]);

  if (!detail) return null;

  // Function to handle field changes and trigger update
  const handleFieldChange = (fieldName, value) => {
    // Only update if the value has actually changed
    if (detail[fieldName] !== value) {
      const updatedPerson = { ...detail, [fieldName]: value };
      onUpdatePerson(updatedPerson); // Call the update function passed from App.jsx
    }
  };

  return (
    <>
      <Sheet open={open} onClose={onClose}>
        <div className="anim-scale">
          <div className="flex justify-center gap-4 mb-5">
            <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center">
              {detail.idImage ? (
                <img src={detail.idImage} alt="신분증" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center text-gray-300">
                  <I.Camera />
                  <div className="text-xs mt-2">신분증 없음</div>
                </div>
              )}
            </div>
            <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center">
              {detail.licenseImage ? (
                <img src={detail.licenseImage} alt="운전면허증" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center text-gray-300">
                  <I.Camera />
                  <div className="text-xs mt-2">면허증 없음</div>
                </div>
              )}
            </div>
          </div>

          {/* Editable Name Field */}
          <Field
            label="이름"
            value={name}
            onChange={v => setName(v)}
            onBlur={() => handleFieldChange('name', name)} // Save on blur
            className="mb-5"
          />

          {/* Editable SSN Field */}
          <Field
            label="주민등록번호"
            value={ssn}
            onChange={v => setSsn(v)}
            onBlur={() => handleFieldChange('ssn', ssn)} // Save on blur
            formatter={fmtSSN}
            maxLen={13}
          />

          {/* Editable Phone Field */}
          <Field
            label="전화번호"
            value={phone}
            onChange={v => setPhone(v)}
            onBlur={() => handleFieldChange('phone', phone)} // Save on blur
            type="tel"
            formatter={fmtPhone}
            maxLen={11}
          />

          {/* Editable Address Field */}
          <Field
            label="주소"
            value={address}
            onChange={v => setAddress(v)}
            onBlur={() => handleFieldChange('address', address)} // Save on blur
            area
            maxLen={100}
          />

          <div className="flex gap-2.5 mt-6">
            <button
              onClick={() => setDeleteModalOpen(true)}
              className="flex-1 py-3.5 rounded-2xl bg-red-50 text-red-400 border-0 text-[15px] font-semibold cursor-pointer flex items-center justify-center gap-1.5 hover:bg-red-100 active:scale-[0.97] transition-all"
            >
              <I.Trash /> 삭제
            </button>
          </div>
        </div>
      </Sheet>

      <Modal
        open={deleteModalOpen}
        title="인원 삭제"
        message={`${detail.name}님을 명단에서 삭제할까요? 이 작업은 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
        danger
        onConfirm={() => { setDeleteModalOpen(false); onDelete(detail.id); }}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </>
  );
}
