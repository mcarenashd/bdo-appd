import React, { useState, useEffect } from 'react';
import { Project, ControlPoint, PhotoEntry } from '../types';
import { useMockApi } from '../hooks/useMockApi';
import Button from './ui/Button';
import { PlusIcon, CameraIcon } from './icons/Icon';
import EmptyState from './ui/EmptyState';
import ControlPointCard from './ControlPointCard';
import ControlPointFormModal from './ControlPointFormModal';
import PhotoUploadModal from './PhotoUploadModal';
import ProgressViewerModal from './ProgressViewerModal';
import { useAuth } from '../contexts/AuthContext';

interface PhotographicProgressDashboardProps {
  project: Project;
  api: ReturnType<typeof useMockApi>;
}

const PhotographicProgressDashboard: React.FC<PhotographicProgressDashboardProps> = ({ project, api }) => {
  // Fix: Get current user from auth context
  const { user } = useAuth();
  const { controlPoints, addControlPoint, addPhotoToControlPoint } = api;

  const [selectedControlPoint, setSelectedControlPoint] = useState<ControlPoint | null>(null);
  const [isControlPointFormOpen, setIsControlPointFormOpen] = useState(false);
  const [isPhotoUploadOpen, setIsPhotoUploadOpen] = useState(false);
  const [isProgressViewerOpen, setIsProgressViewerOpen] = useState(false);
  
  // This effect ensures that if the master list of control points changes (e.g., a photo is added),
  // the currently selected point in our local state is updated to reflect that change.
  useEffect(() => {
    if (selectedControlPoint) {
      const freshData = controlPoints.find(p => p.id === selectedControlPoint.id);
      if (freshData) {
        // A simple length check is sufficient and performant to avoid infinite re-renders.
        if (freshData.photos.length !== selectedControlPoint.photos.length) {
          setSelectedControlPoint(freshData);
        }
      } else {
        // The selected point was deleted from the main list, so clear it locally.
        setSelectedControlPoint(null);
      }
    }
  }, [controlPoints, selectedControlPoint]);
  
  const handleOpenControlPointForm = () => setIsControlPointFormOpen(true);
  
  const handleOpenPhotoUpload = (point: ControlPoint) => {
    setSelectedControlPoint(point);
    setIsPhotoUploadOpen(true);
  };
  
  const handleOpenProgressViewer = (point: ControlPoint) => {
    setSelectedControlPoint(point);
    setIsProgressViewerOpen(true);
  };

  const handleSaveControlPoint = async (data: Omit<ControlPoint, 'id' | 'photos'>) => {
    await addControlPoint(data);
    setIsControlPointFormOpen(false);
  };
  
  const handleSavePhoto = async (data: Omit<PhotoEntry, 'id' | 'author' | 'date'>, file: File) => {
      if(selectedControlPoint && user) {
          // Fix: Pass current user to API call as required
          await addPhotoToControlPoint(selectedControlPoint.id, data, file, user);
          setIsPhotoUploadOpen(false);
          // The manual state update logic has been removed. 
          // The useEffect above will now handle syncing the state correctly.
      }
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Avance Fotográfico</h2>
          <p className="text-sm text-gray-500">Proyecto: {project.name}</p>
        </div>
         <Button onClick={handleOpenControlPointForm} leftIcon={<PlusIcon />}>
            Crear Nuevo Punto de Control
        </Button>
      </div>

       {controlPoints.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {controlPoints.map(point => (
              <ControlPointCard
                key={point.id}
                point={point}
                onAddPhoto={() => handleOpenPhotoUpload(point)}
                onViewProgress={() => handleOpenProgressViewer(point)}
              />
            ))}
          </div>
        ) : (
           <EmptyState
              icon={<CameraIcon />}
              title="Aún no hay Puntos de Control"
              message="Crea puntos de control para zonas clave de la obra y sube fotos periódicamente para visualizar el avance en el tiempo."
              actionButton={
                <Button onClick={handleOpenControlPointForm} leftIcon={<PlusIcon />}>
                  Crear Primer Punto
                </Button>
              }
            />
        )}


       <ControlPointFormModal
        isOpen={isControlPointFormOpen}
        onClose={() => setIsControlPointFormOpen(false)}
        onSave={handleSaveControlPoint}
      />

      {selectedControlPoint && (
          <>
            <PhotoUploadModal
              isOpen={isPhotoUploadOpen}
              onClose={() => setIsPhotoUploadOpen(false)}
              onSave={handleSavePhoto}
              controlPoint={selectedControlPoint}
            />
            <ProgressViewerModal
              isOpen={isProgressViewerOpen}
              onClose={() => setIsProgressViewerOpen(false)}
              controlPoint={selectedControlPoint}
            />
          </>
      )}

    </div>
  );
};

export default PhotographicProgressDashboard;