import React, { useState, useMemo } from 'react';
// Fix: Corrected import path for types
import { Project, Communication, CommunicationStatus } from '../types';
// Fix: Corrected import path for custom hook
import { useMockApi } from '../hooks/useMockApi';
import CommunicationFilterBar from './CommunicationFilterBar';
import CommunicationCard from './CommunicationCard';
import CommunicationFormModal from './CommunicationFormModal';
import CommunicationDetailModal from './CommunicationDetailModal';
import Button from './ui/Button';
import EmptyState from './ui/EmptyState';
// Fix: Corrected import path for icon
import { PlusIcon, ChatBubbleLeftRightIcon, ListBulletIcon, TableCellsIcon } from './icons/Icon';
// Fix: Import useAuth to get the current user for API calls
import { useAuth } from '../contexts/AuthContext';
import CommunicationsTable from './CommunicationsTable';

interface CommunicationsDashboardProps {
  project: Project;
  api: ReturnType<typeof useMockApi>;
}

const CommunicationsDashboard: React.FC<CommunicationsDashboardProps> = ({ project, api }) => {
  // Fix: Get current user from auth context
  const { user } = useAuth();
  const { communications, isLoading, error, addCommunication, updateCommunicationStatus } = api;
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedComm, setSelectedComm] = useState<Communication | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  
  const [filters, setFilters] = useState({
    searchTerm: '',
    sender: '',
    recipient: '',
    status: 'all',
  });

  const filteredCommunications = useMemo(() => {
    return communications.filter(comm => {
      const searchTermMatch = comm.subject.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                              comm.radicado.toLowerCase().includes(filters.searchTerm.toLowerCase());
      const senderMatch = filters.sender === '' || comm.senderDetails.entity.toLowerCase().includes(filters.sender.toLowerCase());
      const recipientMatch = filters.recipient === '' || comm.recipientDetails.entity.toLowerCase().includes(filters.recipient.toLowerCase());
      const statusMatch = filters.status === 'all' || comm.status === filters.status;
      return searchTermMatch && senderMatch && recipientMatch && statusMatch;
    });
  }, [communications, filters]);
  
  const handleOpenForm = () => setIsFormModalOpen(true);
  const handleCloseForm = () => setIsFormModalOpen(false);

  const handleOpenDetail = (comm: Communication) => {
    setSelectedComm(comm);
    setIsDetailModalOpen(true);
  };
  
  const handleCloseDetail = () => {
    setIsDetailModalOpen(false);
    setSelectedComm(null);
  };

  const handleSaveCommunication = async (newCommData: Omit<Communication, 'id' | 'uploader' | 'attachments' | 'status' | 'statusHistory'>) => {
    // Fix: Add user guard and pass user to API call as required
    if (!user) return;
    await addCommunication(newCommData, user);
    handleCloseForm();
  }

  const handleStatusChange = async (commId: string, newStatus: CommunicationStatus) => {
    // Fix: Add user guard and pass user to API call as required
    if (!user) return;
    await updateCommunicationStatus(commId, newStatus, user);
    // Update selected communication to reflect changes immediately in modal
    const updatedComm = communications.find(c => c.id === commId);
    if (updatedComm) {
        // Fix: Use the authenticated user from useAuth instead of a mock user
        const newHistoryEntry = { status: newStatus, user: user, timestamp: new Date().toISOString() };
        setSelectedComm(prev => prev ? {...prev, status: newStatus, statusHistory: [...prev.statusHistory, newHistoryEntry] } : null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-gray-900">Comunicaciones Oficiales</h2>
            <p className="text-sm text-gray-500">Proyecto: {project.name}</p>
        </div>
        <div className="flex items-center flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="flex items-center bg-gray-200 rounded-lg p-1">
                <button 
                    onClick={() => setViewMode('card')}
                    title="Vista de Tarjetas"
                    className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors flex items-center gap-2 ${viewMode === 'card' ? 'bg-white text-brand-primary shadow' : 'text-gray-600 hover:bg-gray-300/50'}`}
                >
                    <ListBulletIcon className="h-5 w-5" />
                    <span className="hidden sm:inline">Tarjetas</span>
                </button>
                <button 
                    onClick={() => setViewMode('table')}
                    title="Vista de Tabla"
                    className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors flex items-center gap-2 ${viewMode === 'table' ? 'bg-white text-brand-primary shadow' : 'text-gray-600 hover:bg-gray-300/50'}`}
                >
                    <TableCellsIcon className="h-5 w-5" />
                    <span className="hidden sm:inline">Tabla</span>
                </button>
            </div>
            <Button onClick={handleOpenForm} leftIcon={<PlusIcon />}>
              Registrar Comunicación
            </Button>
        </div>
      </div>

      <CommunicationFilterBar filters={filters} setFilters={setFilters} />

      {isLoading && <div className="text-center p-8">Cargando comunicaciones...</div>}
      {error && <div className="text-center p-8 text-red-500">{error}</div>}
      
      {!isLoading && !error && (
        <>
            {filteredCommunications.length === 0 ? (
                <EmptyState
                    icon={<ChatBubbleLeftRightIcon />}
                    title="No hay comunicaciones registradas"
                    message="Mantén un registro centralizado de todas las comunicaciones oficiales del proyecto, como oficios, solicitudes y respuestas."
                    actionButton={
                        <Button onClick={handleOpenForm} leftIcon={<PlusIcon />}>
                        Registrar Comunicación
                        </Button>
                    }
                />
            ) : viewMode === 'card' ? (
                <div className="space-y-4">
                {filteredCommunications.map(comm => (
                    <CommunicationCard 
                        key={comm.id} 
                        communication={comm} 
                        onSelect={handleOpenDetail}
                        allCommunications={communications}
                    />
                ))}
                </div>
            ) : (
                <CommunicationsTable 
                    communications={filteredCommunications}
                    onSelect={handleOpenDetail}
                />
            )}
        </>
      )}

      <CommunicationFormModal 
        isOpen={isFormModalOpen}
        onClose={handleCloseForm}
        onSave={handleSaveCommunication}
        communications={communications}
      />

      {selectedComm && (
        <CommunicationDetailModal
            isOpen={isDetailModalOpen}
            onClose={handleCloseDetail}
            communication={selectedComm}
            onStatusChange={handleStatusChange}
            allCommunications={communications}
        />
      )}
    </div>
  );
};

export default CommunicationsDashboard;