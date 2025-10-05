import React, { useState, useMemo, useEffect } from 'react';
import { Project, Acta } from '../types';
import { useMockApi } from '../hooks/useMockApi';
import Button from './ui/Button';
import { PlusIcon, ClipboardDocumentListIcon } from './icons/Icon';
import ActaCard from './ActaCard';
import ActaDetailModal from './ActaDetailModal';
import ActaFormModal from './ActaFormModal';
import EmptyState from './ui/EmptyState';
import ActaFilterBar from './ActaFilterBar';

interface MinutesDashboardProps {
  project: Project;
  api: ReturnType<typeof useMockApi>;
  initialItemToOpen: { type: string; id: string } | null;
  clearInitialItem: () => void;
}

const MinutesDashboard: React.FC<MinutesDashboardProps> = ({ project, api, initialItemToOpen, clearInitialItem }) => {
  const { actas, isLoading, error, addActa, updateActa, sendCommitmentReminderEmail } = api;
  const [selectedActa, setSelectedActa] = useState<Acta | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    searchTerm: '',
    status: 'all',
    area: 'all',
    startDate: '',
    endDate: '',
  });

  const handleOpenDetail = (acta: Acta) => {
    setSelectedActa(acta);
    setIsDetailModalOpen(true);
  };

  useEffect(() => {
    if (initialItemToOpen && initialItemToOpen.type === 'acta') {
        const actaToOpen = actas.find(a => a.id === initialItemToOpen.id);
        if (actaToOpen) {
            handleOpenDetail(actaToOpen);
        }
        clearInitialItem();
    }
  }, [initialItemToOpen, actas, clearInitialItem]);

  const filteredActas = useMemo(() => {
    return actas.filter(acta => {
      const searchTermMatch = acta.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                              acta.number.toLowerCase().includes(filters.searchTerm.toLowerCase());
      const statusMatch = filters.status === 'all' || acta.status === filters.status;
      const areaMatch = filters.area === 'all' || acta.area === filters.area;
      
      const actaDate = new Date(acta.date);
      actaDate.setHours(0,0,0,0);
      
      const startDate = filters.startDate ? new Date(filters.startDate) : null;
      if (startDate) startDate.setHours(0,0,0,0);

      const endDate = filters.endDate ? new Date(filters.endDate) : null;
      if (endDate) endDate.setHours(0,0,0,0);

      const startDateMatch = !startDate || actaDate >= startDate;
      const endDateMatch = !endDate || actaDate <= endDate;

      return searchTermMatch && statusMatch && areaMatch && startDateMatch && endDateMatch;
    });
  }, [actas, filters]);

  const handleCloseDetail = () => {
    setIsDetailModalOpen(false);
    setSelectedActa(null);
  };

  const handleOpenForm = () => {
    setIsFormModalOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormModalOpen(false);
  };

  const handleSaveActa = async (newActaData: Omit<Acta, 'id'>) => {
    await addActa(newActaData);
    handleCloseForm();
  };

  const handleUpdateActa = async (updatedActa: Acta) => {
    await updateActa(updatedActa);
    // Refresh the selectedActa to show the latest data if the modal is reopened
    setSelectedActa(updatedActa);
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Actas de Comité</h2>
          <p className="text-sm text-gray-500">Proyecto: {project.name}</p>
        </div>
        <Button onClick={handleOpenForm} leftIcon={<PlusIcon />}>
          Registrar Acta
        </Button>
      </div>

      <ActaFilterBar filters={filters} setFilters={setFilters} />

      {isLoading && <div className="text-center p-8">Cargando actas...</div>}
      {error && <div className="text-center p-8 text-red-500">{error}</div>}

      {!isLoading && !error && (
        <div>
          {filteredActas.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredActas.map(acta => (
                  <ActaCard key={acta.id} acta={acta} onSelect={handleOpenDetail} />
                ))}
             </div>
          ) : (
            <EmptyState
              icon={<ClipboardDocumentListIcon />}
              title="No se encontraron actas"
              message="No hay actas que coincidan con los filtros seleccionados. Intenta ajustar o limpiar los filtros para ver más resultados."
              actionButton={
                <Button onClick={() => setFilters({ searchTerm: '', status: 'all', area: 'all', startDate: '', endDate: '' })} variant="secondary">
                  Limpiar Filtros
                </Button>
              }
            />
          )}
        </div>
      )}

      {selectedActa && (
        <ActaDetailModal
          isOpen={isDetailModalOpen}
          onClose={handleCloseDetail}
          acta={selectedActa}
          onUpdate={handleUpdateActa}
          onSendReminder={sendCommitmentReminderEmail}
        />
      )}

      <ActaFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseForm}
        onSave={handleSaveActa}
      />
    </div>
  );
};

export default MinutesDashboard;