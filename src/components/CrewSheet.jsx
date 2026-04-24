import { useState, useEffect } from 'react';
import Sheet from './ui/Sheet';
import Modal from './ui/Modal';
import Field from './ui/Field';
import { I } from './ui/Icons';
import { maskSSN, fmtSSN, fmtPhone } from '../utils/formatters';

export default function CrewSheet({ open, detail, onClose, onDelete, onUpdatePerson }) {
  const [editing, setEditing] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [ssn, setSsn] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (detail) {
      setName(detail.name || '');
      setSsn(detail.ssn || '');
      setPhone(detail.phone || '');
      setAddress(detail.address || '');
    }
    setEditing(false);
  }, [detail]);

  if (!detail) return null;

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onUpdatePerson({ ...detail, name: name.trim(), ssn, phone, address });
    setSaving(false);
    setEditing(false);
  };

  const handleCancel = () => {
    setName(detail.name || '');
    setSsn(detail.ssn || '');
    setPhone(detail.phone || '');
    setAddress(detail.address || '');
    setEditing(false);
  };

  const infoRows = [
    { label: '주민등록번호', value: maskSSN(detail.ssn) },
    { label: '전화번호', value: detail.phone },
    { label: '주소', value: detail.address },
  ].filter(r => r.value);

  return (
    <>
      <Sheet open={open} onClose={editing ? undefined : onClose}>
        <div className="anim-scale">

          {/* Images */}
          <div className="flex gap-3 mb-5">
            <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center">
              {detail.idImage ? (
                <img src={detail.idImage} alt="신분증" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center text-gray-300">
                  <I.Camera />
                  <div className="text-xs mt-1.5">신분증 없음</div>
                </div>
              )}
            </div>
            <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center">
              {detail.licenseImage ? (
                <img src={detail.licenseImage} alt="운전면허증" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center text-gray-300">
                  <I.Camera />
                  <div className="text-xs mt-1.5">면허증 없음</div>
                </div>
              )}
            </div>
          </div>

          {/* View mode */}
          {!editing ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 m-0">{detail.name}</h2>
                <button
                  onClick={() => setEditing(true)}
                  className="text-sm text-blue-500 font-semibold bg-transparent border-0 cursor-pointer px-1 py-0.5 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  수정
                </button>
              </div>

              {infoRows.length > 0 && (
                <div className="bg-gray-50 rounded-2xl overflow-hidden mb-4">
                  {infoRows.map((row, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-start px-4 py-3.5 border-b border-white last:border-0"
                    >
                      <span className="text-sm text-gray-400 flex-shrink-0">{row.label}</span>
                      <span className="text-sm font-medium text-gray-800 text-right ml-4 break-all">{row.value}</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setDeleteModalOpen(true)}
                className="w-full py-3.5 rounded-2xl bg-red-50 text-red-400 border-0 text-[15px] font-semibold cursor-pointer flex items-center justify-center gap-1.5 hover:bg-red-100 active:scale-[0.97] transition-all"
              >
                <I.Trash /> 삭제
              </button>
            </>
          ) : (
            /* Edit mode */
            <>
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-base font-bold text-gray-900 m-0">정보 수정</h2>
              </div>

              <Field label="이름 *" value={name} onChange={setName} placeholder="홍길동" />
              <Field
                label="주민등록번호"
                value={ssn}
                onChange={setSsn}
                placeholder="000000-0000000"
                formatter={fmtSSN}
                maxLen={13}
              />
              <Field
                label="전화번호"
                value={phone}
                onChange={setPhone}
                placeholder="010-0000-0000"
                type="tel"
                formatter={fmtPhone}
                maxLen={11}
              />
              <Field
                label="주소"
                value={address}
                onChange={setAddress}
                placeholder="서울특별시 강남구..."
                area
              />

              <div className="flex gap-2.5 mt-2">
                <button
                  onClick={handleCancel}
                  className="flex-1 py-3.5 rounded-2xl bg-gray-100 text-gray-600 border-0 text-base font-semibold cursor-pointer hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !name.trim()}
                  className={`flex-1 py-3.5 rounded-2xl border-0 text-base font-semibold cursor-pointer transition-all
                    ${saving || !name.trim()
                      ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600 active:scale-[0.98] shadow-lg shadow-blue-200/40'
                    }`}
                >
                  {saving ? '저장 중...' : '저장하기'}
                </button>
              </div>
            </>
          )}
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
