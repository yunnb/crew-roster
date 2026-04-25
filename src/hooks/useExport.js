import { useState, useCallback } from 'react';
import { renderA4 } from '../utils/exportA4';
import { ITEMS_PER_PAGE } from '../constants';

async function buildPages(people) {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const pages = [];
  for (let i = 0; i < people.length; i += ITEMS_PER_PAGE) {
    const pageIdx = Math.floor(i / ITEMS_PER_PAGE) + 1;
    const canvas = await renderA4(people.slice(i, i + ITEMS_PER_PAGE));
    pages.push({ canvas, name: `명단_${dateStr}_${pageIdx}.png` });
  }
  return pages;
}

function pagesToFiles(pages) {
  return Promise.all(
    pages.map(p => new Promise(res =>
      p.canvas.toBlob(blob => res(new File([blob], p.name, { type: 'image/png' })), 'image/png'),
    )),
  );
}

export function useExport(allPeople, selected, flash) {
  const [exporting, setExporting] = useState(false);

  /** 모바일: 공유 시트 (갤러리 저장) */
  const doShare = useCallback(async () => {
    const people = allPeople.filter(p => selected.has(p.id));
    if (!people.length) { flash('내보낼 인원을 선택하세요'); return; }
    setExporting(true);
    try {
      const pages = await buildPages(people);
      const files = await pagesToFiles(pages);
      await navigator.share({ files, title: '인력 명단' });
    } catch (e) {
      if (e?.name !== 'AbortError') { flash('오류가 발생했습니다'); console.error(e); }
    } finally {
      setExporting(false);
    }
  }, [allPeople, selected, flash]);

  /** 데스크탑: Blob 다운로드 */
  const doDownload = useCallback(async () => {
    const people = allPeople.filter(p => selected.has(p.id));
    if (!people.length) { flash('내보낼 인원을 선택하세요'); return; }
    setExporting(true);
    try {
      const pages = await buildPages(people);
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
    } catch (e) {
      if (e?.name !== 'AbortError') { flash('오류가 발생했습니다'); console.error(e); }
    } finally {
      setExporting(false);
    }
  }, [allPeople, selected, flash]);

  return { exporting, doShare, doDownload };
}
