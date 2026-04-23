import { useState, useEffect, useCallback, useMemo } from 'react';
import { db, dbLoad, dbDelete } from './db';
import { uid, getAgeFromSSN } from './utils/formatters';
import { renderA4 } from './utils/exportA4';
import { useCrewForm } from './hooks/useCrewForm';

import PinScreen from './components/PinScreen';
import CrewList from './components/CrewList';
import CrewForm from './components/CrewForm';
import CrewSheet from './components/CrewSheet';
import Toast from './components/ui/Toast';
import { I } from './components/ui/Icons';

const LEGACY_KEY = 'crew-roster-v3';
const ITEMS_PER_PAGE = 6; // 2×3 grid per export page

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
  const [authed, setAuthed] = useState(false);
  const [allPeople, setAllPeople] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // 'list' | 'add'
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetPerson, setSheetPerson] = useState(null);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('ts'); // 'ts' | 'name' | 'age-desc' | 'age-asc'
  const [toast, setToast] = useState({ message: '', visible: false });
  const [exporting, setExporting] = useState(false);

  const form = useCrewForm();

  const flash = useCallback(msg => {
    setToast({ message: msg, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2200);
  }, []);

  const loadPeople = useCallback(async () => {
    const all = await db.people.toArray();
    setAllPeople(all);
  }, []);

  useEffect(() => {
    if (!authed) return;
    (async () => {
      await migrateLegacyData();
      await loadPeople();
      setLoading(false);
    })();
  }, [authed, loadPeople]);

  const list = useMemo(() => {
    const filtered = allPeople.filter(p =>
      !query ||
      p.name.includes(query) ||
      p.phone?.includes(query) ||
      p.address?.includes(query)
    );
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name, 'ko');
        case 'age-desc':
          return getAgeFromSSN(b.ssn) - getAgeFromSSN(a.ssn);
        case 'age-asc':
          return getAgeFromSSN(a.ssn) - getAgeFromSSN(b.ssn);
        case 'ts':
        default:
          return b.ts - a.ts;
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

  const updatePerson = async (person) => {
    if (!person.name.trim()) {
      flash('이름을 입력해주세요');
      loadPeople(); // Reload to revert optimistic UI change
      return;
    }
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

  const doExport = async () => {
    const people = allPeople.filter(p => selected.has(p.id));
    if (!people.length) { flash('내보낼 인원을 선택하세요'); return; }

    setExporting(true);
    try {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const totalPages = Math.ceil(people.length / ITEMS_PER_PAGE);
      for (let i = 0; i < people.length; i += ITEMS_PER_PAGE) {
        const pageIdx = Math.floor(i / ITEMS_PER_PAGE) + 1;
        const canvas = await renderA4(people.slice(i, i + ITEMS_PER_PAGE), pageIdx, totalPages);
        const a = document.createElement('a');
        a.download = `명단_${dateStr}_${pageIdx}.jpg`;
        a.href = canvas.toDataURL('image/jpeg', 0.95);
        a.click();
        if (i + ITEMS_PER_PAGE < people.length) await new Promise(r => setTimeout(r, 400));
      }
      flash(`${totalPages}장 다운로드 완료`);
    } catch (e) {
      flash('오류가 발생했습니다');
      console.error(e);
    }
    setExporting(false);
  };

  if (!authed) return <PinScreen onUnlock={() => setAuthed(true)} />;

  return (
    <div className="min-h-screen max-w-md mx-auto relative bg-gray-50">
      {view === 'list' && (
        <>
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

          <div
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 border-t border-gray-100 px-4 py-3"
            style={{
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(20px)',
              paddingBottom: 'max(12px,env(safe-area-inset-bottom))',
            }}
          >
            <div className="text-xs text-gray-400 text-center mb-2 h-4">
              {selected.size > 0 && (
                <span className="font-bold text-blue-500 anim-fade">{selected.size}명</span>
              )}
            </div>
            <button
              onClick={doExport}
              disabled={exporting || selected.size === 0}
              className={`w-full py-4 rounded-2xl text-base font-bold border-0 cursor-pointer flex items-center justify-center gap-2 transition-all
                ${exporting || selected.size === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600 active:scale-[0.98] shadow-lg shadow-blue-200/40'
                }`}
            >
              {exporting ? '내보내는 중...' : <><I.Dl /> JPG로 내보내기</>}
            </button>
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

      {view === 'add' && (
        <CrewForm
          view={view}
          form={form}
          onReset={form.reset}
          onSetView={setView}
          onSubmit={addPerson}
        />
      )}

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}
