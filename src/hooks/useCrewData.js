import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { db, dbLoad, dbSave, dbDelete } from '../db';
import { uid, getAgeFromSSN } from '../utils/formatters';
import { LEGACY_KEY, SELECTED_KEY } from '../constants';

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

export function useCrewData(authed, flash) {
  const [allPeople, setAllPeople] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(new Set());
  const [query, setQuery]         = useState('');
  const [sortBy, setSortBy]       = useState('ts');
  const selectionHydrated         = useRef(false);

  const loadPeople = useCallback(async () => {
    const all = await db.people.toArray();
    setAllPeople(all);
  }, []);

  // DB 초기 로드 및 선택 상태 복원
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

  // 선택 상태 영속
  useEffect(() => {
    if (!authed || !selectionHydrated.current) return;
    dbSave(SELECTED_KEY, Array.from(selected));
  }, [selected, authed]);

  // 필터 + 정렬된 목록
  const list = useMemo(() => {
    const filtered = allPeople.filter(p =>
      !query ||
      p.name.includes(query) ||
      p.phone?.includes(query) ||
      p.address?.includes(query),
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

  // ── CRUD ─────────────────────────────────────────────

  /** formData: { name, ssn, phone, address, idImage, licenseImage }
   *  성공 시 새 id 반환, 실패 시 null */
  const addPerson = useCallback(async formData => {
    if (!formData.name.trim()) { flash('이름을 입력해주세요'); return null; }
    const newId = uid();
    await db.people.put({
      id: newId,
      name: formData.name.trim(),
      ssn: formData.ssn,
      phone: formData.phone,
      address: formData.address.trim(),
      idImage: formData.idImage,
      licenseImage: formData.licenseImage,
      ts: Date.now(),
    });
    setSelected(s => { const n = new Set(s); n.add(newId); return n; });
    await loadPeople();
    flash('추가되었습니다');
    return newId;
  }, [flash, loadPeople]);

  const updatePerson = useCallback(async person => {
    if (!person.name.trim()) { flash('이름을 입력해주세요'); await loadPeople(); return; }
    await db.people.update(person.id, {
      name: person.name.trim(),
      ssn: person.ssn,
      phone: person.phone,
      address: person.address.trim(),
      idImage: person.idImage ?? null,
      licenseImage: person.licenseImage ?? null,
    });
    await loadPeople();
    flash('수정 완료');
  }, [flash, loadPeople]);

  const deletePerson = useCallback(async id => {
    await db.people.delete(id);
    setSelected(s => { const n = new Set(s); n.delete(id); return n; });
    await loadPeople();
    flash('삭제되었습니다');
  }, [flash, loadPeople]);

  // ── 선택 ─────────────────────────────────────────────

  const toggleSelect = useCallback(id => setSelected(s => {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  }), []);

  const toggleAll = useCallback(() => {
    const ids = list.map(p => p.id);
    if (allSelected) {
      setSelected(s => { const n = new Set(s); ids.forEach(id => n.delete(id)); return n; });
    } else {
      setSelected(s => { const n = new Set(s); ids.forEach(id => n.add(id)); return n; });
    }
  }, [list, allSelected]);

  return {
    loading, allPeople, list, selected, allSelected,
    query, setQuery, sortBy, setSortBy,
    addPerson, updatePerson, deletePerson,
    toggleSelect, toggleAll,
  };
}
