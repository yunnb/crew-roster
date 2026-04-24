import { I } from './ui/Icons';
import Chk from './ui/Chk';

export default function CrewList({
  loading,
  list,
  query,
  selected,
  allSelected,
  sortBy,
  onSortChange,
  onQueryChange,
  onToggleAll,
  onSelect,
  onSetView,
  onSetDetail,
  onSetSheet,
  onReset,
}) {
  if (loading) {
    return <div className="text-center py-20 text-gray-300 text-sm">불러오는 중...</div>;
  }

  return (
    <>
      <div
        className="sticky top-0 z-40 px-4 pt-4 pb-3"
        style={{ background: 'rgba(249,250,251,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
      >
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-2xl font-bold tracking-tighter text-gray-900 m-0">인력 명단</h1>
          <button
            onClick={() => { onReset(); onSetView('add'); }}
            className="flex items-center justify-center w-10 h-10 bg-blue-500 text-white border-0 rounded-full cursor-pointer hover:bg-blue-600 active:scale-95 transition-all shadow-lg shadow-blue-200/50"
          >
            <I.Plus />
          </button>
        </div>

        <div className="relative mb-3">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <I.Search />
          </span>
          <input
            value={query}
            onChange={e => onQueryChange(e.target.value)}
            placeholder="이름, 전화번호, 주소 검색"
            className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border-0 outline-none text-[16px] text-gray-900 placeholder:text-gray-300 shadow-sm focus:shadow-md transition-shadow"
          />
        </div>

        {list.length > 0 && (
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400">
                총 <strong className="text-gray-600">{list.length}</strong>명
              </span>
              <span className="text-gray-200 text-xs">|</span>
              <div className="flex gap-1 overflow-x-auto flex-nowrap scrollbar-none" style={{ WebkitOverflowScrolling: 'touch' }}>
                {[
                  { v: 'ts', label: '최신순' },
                  { v: 'name', label: '이름순' },
                  { v: 'age-desc', label: '나이많은순' },
                  { v: 'age-asc', label: '나이어린순' },
                ].map(({ v, label }) => (
                  <button
                    key={v}
                    onClick={() => onSortChange(v)}
                    className={`flex-shrink-0 text-sm px-3 py-1.5 rounded-full border-0 cursor-pointer transition-colors min-h-[36px] flex items-center
                      ${sortBy === v
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={onToggleAll}
              className="bg-transparent border-0 text-blue-500 text-xs font-semibold cursor-pointer p-0"
            >
              {allSelected ? '선택 해제' : '전체 선택'}
            </button>
          </div>
        )}
      </div>

      <div className="pt-1 px-4 pb-6">
        {list.length === 0 ? (
          <div className="text-center pt-24 px-6 anim-fade">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <I.User />
            </div>
            <div className="text-base font-semibold text-gray-800 mb-1">
              {query ? '검색 결과가 없습니다' : '등록된 인원이 없습니다'}
            </div>
            <div className="text-sm text-gray-400">
              {query ? '다른 키워드로 검색해보세요' : '상단의 + 버튼으로 추가하세요'}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden">
            {list.map((person, i) => (
              <div
                key={person.id}
                onClick={() => { onSetDetail(person); onSetSheet(true); }}
                className="press flex items-center gap-4 px-4 py-3.5 cursor-pointer active:bg-gray-50 transition-colors"
                style={{
                  borderBottom: i < list.length - 1 ? '1px solid #F3F4F6' : 'none',
                  animation: `slideR .3s ease ${i * 25}ms forwards`,
                  opacity: 0,
                }}
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                  {person.idImage
                    ? <img src={person.idImage} alt="" className="w-full h-full object-cover" />
                    : <I.User />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-base font-semibold text-gray-800 truncate">{person.name}</div>
                  <div className="text-sm text-gray-400 mt-0.5">{person.phone || '연락처 없음'}</div>
                </div>
                <Chk checked={selected.has(person.id)} onChange={() => onSelect(person.id)} />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
