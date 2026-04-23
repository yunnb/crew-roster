import Field from './ui/Field';
import ImgUp from './ui/ImgUp';
import { I } from './ui/Icons';
import { fmtSSN, fmtPhone } from '../utils/formatters';

export default function CrewForm({ view, form, onReset, onSetView, onSubmit }) {
  return (
    <>
      <div
        className="sticky top-0 z-40 px-4 py-3 flex items-center gap-2"
        style={{ background: 'rgba(249,250,251,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
      >
        <button
          type="button"
          onClick={() => { onReset(); onSetView('list'); }}
          className="p-1 bg-transparent border-0 cursor-pointer text-gray-900"
        >
          <I.Back />
        </button>
        <span className="text-lg font-bold">{view === 'add' ? '명단 추가' : '정보 수정'}</span>
      </div>

      <div className="px-4 pt-4 pb-32 anim-slide">
        <div className="flex gap-4 justify-center mb-6">
          <ImgUp image={form.idImage} onChange={form.setIdImage} label="신분증 촬영" />
          <ImgUp image={form.licenseImage} onChange={form.setLicenseImage} label="면허증 촬영" />
        </div>
        <Field label="이름 *" value={form.name} onChange={form.setName} placeholder="홍길동" />
        <Field
          label="주민등록번호"
          value={form.ssn}
          onChange={form.setSsn}
          placeholder="000000-0000000"
          formatter={fmtSSN}
          maxLen={13}
        />
        <Field
          label="전화번호"
          value={form.phone}
          onChange={form.setPhone}
          placeholder="010-0000-0000"
          type="tel"
          formatter={fmtPhone}
          maxLen={11}
        />
        <Field
          label="주소"
          value={form.address}
          onChange={form.setAddress}
          placeholder="서울특별시 강남구..."
          area
          maxLen={100}
        />
      </div>

      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 border-t border-gray-100 px-4 py-3"
        style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', paddingBottom: 'max(12px,env(safe-area-inset-bottom))' }}
      >
        <button
          type="button"
          onClick={onSubmit}
          className="w-full py-4 bg-blue-500 text-white rounded-2xl text-base font-bold border-0 cursor-pointer hover:bg-blue-600 active:scale-[0.98] transition-all shadow-lg shadow-blue-200/40"
        >
          {view === 'add' ? '추가하기' : '수정 완료'}
        </button>
      </div>
    </>
  );
}
