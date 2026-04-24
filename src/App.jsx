import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { db, dbLoad, dbSave, dbDelete } from './db';
import { uid, getAgeFromSSN } from './utils/formatters';
import { renderA4 } from './utils/exportA4';
import { useCrewForm } from './hooks/useCrewForm';
import { useViewportHeight } from './hooks/useKeyboardOffset';

import PinScreen from './components/PinScreen';
import CrewList from './components/CrewList';
import CrewForm from './components/CrewForm';
import CrewSheet from './components/CrewSheet';
import Toast from './components/ui/Toast';
import { I } from './components/ui/Icons';

const LEGACY_KEY   = 'crew-roster-v3';
const SELECTED_KEY = 'crew-selected-ids';
const ITEMS_PER_PAGE = 6; // 2×3 grid

async function migrateLegacyData() {
  const legacy = await dbLoad(LEGACY_KEY);
  if (!Array.isArray(legacy) || legacy.length === 0) return;
  const migrated = legacy.map(({ image, image2, ...rest }) => ({
    ...rest,
    idImage: image ?? null,
    licenseImage: image2 ?? null,
  }));
  await db.people.bulkPut(migrated);
  await dbDelete(LEGACY_KEY);
}

export default function App() {
  const [authed, setAuthed]         = useState(false);
  const [allPeople, setAllPeople]   = useState([]);
  const [selected, setSelected]     = useState(new Set());
  const [loading, setLoading]       = useState(true);
  const [view, setView]             = useState('list');
  const [sheetOpen, setSheetOpen]   = useState(false);
  const [sheetPerson, setSheetPerson] = useState(null);
  const [query, setQuery]           = useState('');
  const [sortBy, setSortBy]         = useState('ts');
  const [toast, setToast]           = useState({ message: '', visible: false });
  const [exporting, setExporting]   = useState(false);

  const form = useCrewForm();
  // visualViewport.height → 가상 키보드 올라와도 레이아웃 밀림 방지
  const vh   = useViewportHeight();

  const flash = useCallback(msg => {
    setToast({ message: msg, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2200);
  }, []);

  const loadPeople = useCallback(async () => {
    const all = await db.people.toArray();
    setAllPeople(all);
  }, []);

  const selectionHydrated = useRef(false);

  useEffect(() => {
    if (!authed) return;
    (async () => {
      await migrateLegacyData();
      await loadPeople();
      const savedIds = await dbLoad(SELECTED_KEY);
      if (Array.isArray(savedIds) && savedIds.length) {
        const existing = new Set((await db.people.toArray()).map(p => p.id));
        setSelected(new Set(savedIds.filter(id => existing.has(id))));
      }
      selectionHydrated.current = true;
      setLoading(false);
    })();
  }, [authed, loadPeople]);

  useEffect(() => {
    if (!authed || !selectionHydrated.current) return;
    dbSave(SELECTED_KEY, Array.from(selected));
  }, [selected, authed]);

  const list = useMemo(() => {
    const filtered = allPeople.filter(p =>
      !query ||
      p.name.includes(query) ||
      p.phone?.includes(query) ||
      p.address?.includes(query)
    );
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':     return a.name.localeCompare(b.name, 'ko');
        case 'age-desc': return getAgeFromSSN(b.ssn) - getAgeFromSSN(a.ssn);
        case 'age-asc':  return getAgeFromSSN(a.ssn) - getAgeFromSSN(b.ssn);
        default:         return b.ts - a.ts;
      }
    });
  }, [allPeople, query, sortBy]);

  const allSelected = list.length > 0 && list.every(p => selected.has(p.id));

  const addPerson = async () => {
    if (!form.name.trim()) { flash('이름을 입력해주세요'); return; }
    await db.people.put({
      id: uid(),
      name: form.name.trim(),
      ssn: form.ssn,
      phone: form.phone,
      address: form.address.trim(),
      idImage: form.idImage,
      licenseImage: form.licenseImage,
      ts: Date.now(),
    });
    form.reset();
    setView('list');
    await loadPeople();
    flash('추가되었습니다');
  };

  const updatePerson = async person => {
    if (!person.name.trim()) { flash('이름을 입력해주세요'); loadPeople(); return; }
    await db.people.update(person.id, {
      name: person.name.trim(),
      ssn: person.ssn,
      phone: person.phone,
      address: person.address.trim(),
    });
    await loadPeople();
    flash('수정 완료');
  };

  const deletePerson = async id => {
    await db.people.delete(id);
    setSelected(s => { const n = new Set(s); n.delete(id); return n; });
    setSheetOpen(false);
    await loadPeople();
    flash('삭제되었습니다');
  };

  const toggleSelect = id => setSelected(s => {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const toggleAll = () => {
    const ids = list.map(p => p.id);
    if (allSelected) {
      setSelected(s => { const n = new Set(s); ids.forEach(id => n.delete(id)); return n; });
    } else {
      setSelected(s => { const n = new Set(s); ids.forEach(id => n.add(id)); return n; });
    }
  };

  const buildPages = async people => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const pages = [];
    for (let i = 0; i < people.length; i += ITEMS_PER_PAGE) {
      const pageIdx = Math.floor(i / ITEMS_PER_PAGE) + 1;
      const canvas = await renderA4(people.slice(i, i + ITEMS_PER_PAGE));
      pages.push({ canvas, name: `명단_${dateStr}_${pageIdx}.png` });
    }
    return pages;
  };

  /** PNG 저장 — 모바일은 Web Share API(갤러리 저장), 데스크탑은 blob download */
  const doExport = async () => {
    const people = allPeople.filter(p => selected.has(p.id));
    if (!people.length) { flash('내보낼 인원을 선택하세요'); return; }
    setExporting(true);
    try {
      const pages = await buildPages(people);
      const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

      if (isMobile && typeof navigator.share === 'function') {
        // 모바일: share sheet → 갤러리 저장
        const files = await Promise.all(
          pages.map(p => new Promise(res =>
            p.canvas.toBlob(blob => res(new File([blob], p.name, { type: 'image/png' })), 'image/png')
          ))
        );
        await navigator.share({ files, title: '인력 명단' });
        flash(`${pages.length}장 완료`);
      } else {
        // 데스크탑: Blob Object URL 다운로드
        for (const { canvas, name } of pages) {
          await new Promise(resolve => {
            canvas.toBlob(blob => {
              const url = URL.createObjectURL(blob);
              const a   = document.createElement('a');
              a.href     = url;
              a.download = name;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              setTimeout(() => { URL.revokeObjectURL(url); resolve(); }, 150);
            }, 'image/png');
          });
        }
        flash(`${pages.length}장 다운로드 완료`);
      }
    } catch (e) {
      if (e?.name !== 'AbortError') { flash('오류가 발생했습니다'); console.error(e); }
    }
    setExporting(false);
  };

  const doShare = async () => {
    const people = allPeople.filter(p => selected.has(p.id));
    if (!people.length) { flash('공유할 인원을 선택하세요'); return; }
    setExporting(true);
    try {
      const pages = await buildPages(people);
      const files = await Promise.all(
        pages.map(p => new Promise(res =>
          p.canvas.toBlob(blob => res(new File([blob], p.name, { type: 'image/png' })), 'image/png')
        ))
      );
      await navigator.share({ files, title: '인력 명단' });
    } catch (e) {
      if (e?.name !== 'AbortError') { flash('공유에 실패했습니다'); console.error(e); }
    }
    setExporting(false);
  };

  /* ───────────────────────────────────────────────
   * 레이아웃
   * - height: visualViewport.height → 키보드 올라와도 container가 줄어들어 밀림 없음
   * - flex-col → 리스트(flex-1 스크롤) + 하단 바(flex-shrink-0)
   * ─────────────────────────────────────────────── */
  return (
    <div
      className="max-w-md mx-auto bg-white flex flex-col overflow-hidden"
      style={{
        height: vh ? `${vh}px` : '100dvh',
        transition: 'height 0.15s ease',
      }}
    >
      {!authed ? (
        <PinScreen onUnlock={() => setAuthed(true)} />
      ) : view === 'add' ? (
        <CrewForm
          view={view}
          form={form}
          onReset={form.reset}
          onSetView={setView}
          onSubmit={addPerson}
        />
      ) : (
        /* ── 리스트 뷰 ── */
        <>
          {/* 스크롤 영역 */}
          <div className="flex-1 overflow-y-auto min-h-0 bg-gray-50">
            <CrewList
              loading={loading}
              list={list}
              query={query}
              selected={selected}
              allSelected={allSelected}
              sortBy={sortBy}
              onSortChange={setSortBy}
              onQueryChange={setQuery}
              onToggleAll={toggleAll}
              onSelect={toggleSelect}
              onSetView={setView}
              onSetDetail={setSheetPerson}
              onSetSheet={setSheetOpen}
              onReset={form.reset}
            />
          </div>

          {/* 하단 내보내기 바 — flex-shrink-0, 키보드와 함께 자동으로 올라옴 */}
          <div
            className="flex-shrink-0 border-t border-gray-100 px-4 py-3 bg-white"
            style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
          >
            <div className="text-xs text-gray-400 text-center mb-2 h-4">
              {selected.size > 0 && (
                <span className="font-bold text-blue-500 anim-fade">{selected.size}명 선택됨</span>
              )}
            </div>
            <div className="flex gap-2">
              {typeof navigator.share === 'function' && (
                <button
                  onClick={doShare}
                  disabled={exporting || selected.size === 0}
                  className={`flex-1 py-4 rounded-2xl text-base font-bold border cursor-pointer flex items-center justify-center gap-2 transition-all
                    ${exporting || selected.size === 0
                      ? 'border-gray-200 bg-white text-gray-300 cursor-not-allowed'
                      : 'border-blue-500 bg-white text-blue-500 hover:bg-blue-50 active:scale-[0.98]'
                    }`}
                >
                  <I.Share /> 공유하기
                </button>
              )}
              <button
                onClick={doExport}
                disabled={exporting || selected.size === 0}
                className={`flex-1 py-4 rounded-2xl text-base font-bold border-0 cursor-pointer flex items-center justify-center gap-2 transition-all
                  ${exporting || selected.size === 0
                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600 active:scale-[0.98] shadow-lg shadow-blue-200/40'
                  }`}
              >
                {exporting ? '처리 중...' : <><I.Dl /> 이미지 저장</>}
              </button>
            </div>
          </div>

          <CrewSheet
            open={sheetOpen}
            detail={sheetPerson}
            onClose={() => setSheetOpen(false)}
            onUpdatePerson={updatePerson}
            onDelete={deletePerson}
          />
        </>
      )}

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}
