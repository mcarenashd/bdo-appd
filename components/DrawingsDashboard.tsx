import React, { useState, useMemo } from 'react';
import { Project, Drawing } from '../types';
import { useMockApi } from '../hooks/useMockApi';
import { useAuth } from '../contexts/AuthContext';
import Button from './ui/Button';
import EmptyState from './ui/EmptyState';
import { PlusIcon, MapIcon, ListBulletIcon, TableCellsIcon } from './icons/Icon';
import DrawingFilterBar from './DrawingFilterBar';
import DrawingCard from './DrawingCard';
import DrawingsTable from './DrawingsTable';
import DrawingDetailModal from './DrawingDetailModal';
import DrawingUploadModal from './DrawingUploadModal';

interface DrawingsDashboardProps {
  project: Project;
  api: ReturnType<typeof useMockApi>;
}

const DrawingsDashboard: React.FC<DrawingsDashboardProps> = ({ project, api }) => {
  const { user } = useAuth();
  const { drawings, isLoading, error, addDrawing, addDrawingVersion, addCommentToDrawing } = api;
  
  const [filters, setFilters] = useState({ searchTerm: '', discipline: 'all' });
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDrawing, setSelectedDrawing] = useState<Drawing | null>(null);
  const [drawingToUpdate, setDrawingToUpdate] = useState<Drawing | null>(null);

  const filteredDrawings = useMemo(() => {
    return drawings.filter(d => {
      const searchTermMatch = d.code.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                              d.title.toLowerCase().includes(filters.searchTerm.toLowerCase());
      const disciplineMatch = filters.discipline === 'all' || d.discipline === filters.discipline;
      return searchTermMatch && disciplineMatch;
    });
  }, [drawings, filters]);

  const handleOpenUploadModal = () => {
    setDrawingToUpdate(null);
    setIsUploadModalOpen(true);
  };
  
  const handleOpenNewVersionModal = (drawing: Drawing) => {
    setDrawingToUpdate(drawing);
    setIsUploadModalOpen(true);
  };

  const handleOpenDetailModal = (drawing: Drawing) => {
    setSelectedDrawing(drawing);
    setIsDetailModalOpen(true);
  };
  
  const handleSaveDrawing = async (data: Omit<Drawing, 'id' | 'status' | 'versions' | 'comments'>, file: File) => {
    if (!user) return;
    await addDrawing(data, file, user);
    setIsUploadModalOpen(false);
  };

  const handleSaveNewVersion = async (drawingId: string, file: File) => {
    if (!user) return;
    await addDrawingVersion(drawingId, file, user);
    setIsUploadModalOpen(false);
  };
  
  const handleAddCommentToDrawing = async (drawingId: string, commentText: string) => {
    if (!user) return;
    const updatedDrawing = await addCommentToDrawing(drawingId, commentText, user);
    if (updatedDrawing) {
        // Re-set the selected drawing to trigger a re-render of the modal with the new comment
        setSelectedDrawing(updatedDrawing);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Planos de Obra</h2>
          <p className="text-sm text-gray-500">Gestión de documentos técnicos del proyecto: {project.name}</p>
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
          <Button onClick={handleOpenUploadModal} leftIcon={<PlusIcon />}>
            Cargar Plano
          </Button>
        </div>
      </div>

      <DrawingFilterBar filters={filters} setFilters={setFilters} />

      {isLoading && <p>Cargando planos...</p>}
      {error && <p className="text-red-500">{error}</p>}
      
      {!isLoading && !error && (
        <>
          {filteredDrawings.length > 0 ? (
            viewMode === 'card' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredDrawings.map(d => (
                  <DrawingCard 
                    key={d.id} 
                    drawing={d} 
                    onSelect={handleOpenDetailModal}
                    onAddVersion={handleOpenNewVersionModal}
                  />
                ))}
              </div>
            ) : (
              <DrawingsTable drawings={filteredDrawings} onSelect={handleOpenDetailModal} />
            )
          ) : (
            <EmptyState
              icon={<MapIcon />}
              title="No hay planos cargados"
              message="Comienza por cargar el primer plano del proyecto para centralizar toda la documentación técnica."
              actionButton={
                <Button onClick={handleOpenUploadModal} leftIcon={<PlusIcon />}>
                  Cargar Primer Plano
                </Button>
              }
            />
          )}
        </>
      )}
      
      <DrawingUploadModal 
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSaveDrawing={handleSaveDrawing}
        onSaveNewVersion={handleSaveNewVersion}
        existingDrawing={drawingToUpdate}
        allDrawings={drawings}
      />
      
      {selectedDrawing && user && (
        <DrawingDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          drawing={selectedDrawing}
          onAddVersion={() => handleOpenNewVersionModal(selectedDrawing)}
          onAddComment={handleAddCommentToDrawing}
          currentUser={user}
        />
      )}
    </div>
  );
};

export default DrawingsDashboard;