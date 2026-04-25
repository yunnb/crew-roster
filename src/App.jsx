import { useState } from 'react';
import { useCrewForm } from './hooks/useCrewForm';
import { useToast } from './hooks/useToast';
import { useCrewData } from './hooks/useCrewData';
import { useExport } from './hooks/useExport';

import PinScreen from './components/PinScreen';
import CrewList from './components/CrewList';
import CrewForm from './components/CrewForm';
import CrewSheet from './components/CrewSheet';
import ExportBar from './components/ExportBar';
import Toast from './components/ui/Toast';

export default function App() {
  const [authed, setAuthed]           = useState(false);
  const [view, setView]               = useState('list');
  const [sheetOpen, setSheetOpen]     = useState(false);
  const [sheetPerson, setSheetPerson] = useState(null);

  const form                          = useCrewForm();
  const { toast, flash }              = useToast();
  const crew                          = useCrewData(authed, flash);
  const { exporting, doShare, doDownload } = useExport(crew.allPeople, crew.selected, flash);

  const handleAddPerson = async () => {
    const newId = await crew.addPerson(form);
    if (newId) { form.reset(); setView('list'); }
  };

  const handleDeletePerson = async id => {
    await crew.deletePerson(id);
    setSheetOpen(false);
  };

  return (
    <div
      className="bg-white flex flex-col overflow-hidden"
      style={{
        position: 'fixed',
        top: 0, bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '448px',
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
          onSubmit={handleAddPerson}
        />
      ) : (
        <>
          <div className="flex-1 overflow-y-auto min-h-0 bg-gray-50">
            <CrewList
              loading={crew.loading}
              list={crew.list}
              query={crew.query}
              selected={crew.selected}
              allSelected={crew.allSelected}
              sortBy={crew.sortBy}
              onSortChange={crew.setSortBy}
              onQueryChange={crew.setQuery}
              onToggleAll={crew.toggleAll}
              onSelect={crew.toggleSelect}
              onSetView={setView}
              onSetDetail={setSheetPerson}
              onSetSheet={setSheetOpen}
              onReset={form.reset}
            />
          </div>

          <ExportBar
            exporting={exporting}
            selectedCount={crew.selected.size}
            onShare={doShare}
            onDownload={doDownload}
          />

          <CrewSheet
            open={sheetOpen}
            detail={sheetPerson}
            onClose={() => setSheetOpen(false)}
            onUpdatePerson={crew.updatePerson}
            onDelete={handleDeletePerson}
          />
        </>
      )}

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}
