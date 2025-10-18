import React, { useState, useMemo, useEffect } from 'react'; // <-- Se añade useEffect
import { Project, Communication, CommunicationStatus } from '../types';
import apiFetch from '../src/services/api'; // <-- Se importa apiFetch
import CommunicationFilterBar from './CommunicationFilterBar';
import CommunicationCard from './CommunicationCard';
import CommunicationFormModal from './CommunicationFormModal';
import CommunicationDetailModal from './CommunicationDetailModal';
import Button from './ui/Button';
import EmptyState from './ui/EmptyState';
import { PlusIcon, ChatBubbleLeftRightIcon, ListBulletIcon, TableCellsIcon } from './icons/Icon';
import { useAuth } from '../contexts/AuthContext';
import CommunicationsTable from './CommunicationsTable';
import { MOCK_PROJECT } from '../src/services/mockData'; // Mantenemos el proyecto mock por ahora

// Se elimina la interfaz de props, ya no recibe 'api'
interface CommunicationsDashboardProps {
  project: Project;
}

const CommunicationsDashboard: React.FC<CommunicationsDashboardProps> = ({ project }) => {
  const { user } = useAuth();

  // --- ¡NUEVO ESTADO LOCAL PARA DATOS REALES! ---
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // ------------------------------------------------

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

  // --- useEffect PARA OBTENER DATOS DEL BACKEND ---
  useEffect(() => {
    const fetchCommunications = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await apiFetch('/communications');
        setCommunications(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ocurrió un error desconocido.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCommunications();
  }, []);
  // ----------------------------------------------------

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
    if (!user) return;
    try {
        const dataToSend = { ...newCommData, uploaderId: user.id };
        const createdComm = await apiFetch('/communications', {
            method: 'POST',
            body: JSON.stringify(dataToSend),
        });
        // Actualizamos el estado local para ver el cambio al instante
        setCommunications(prev => [createdComm, ...prev]);
        handleCloseForm();
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al guardar la comunicación.');
    }
  }

  const handleStatusChange = async (commId: string, newStatus: CommunicationStatus) => {
      // Lógica para actualizar estado (lo haremos más adelante)
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