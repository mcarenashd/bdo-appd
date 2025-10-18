import React, { useState, useMemo, useEffect } from "react";
import { Project, Drawing, DrawingDiscipline } from "../types";
import apiFetch from "../src/services/api"; // <-- ¡Importante!
import { useAuth } from "../contexts/AuthContext";
import Button from "./ui/Button";
import EmptyState from "./ui/EmptyState";
import {
  PlusIcon,
  MapIcon,
  ListBulletIcon,
  TableCellsIcon,
} from "./icons/Icon";
import DrawingFilterBar from "./DrawingFilterBar";
import DrawingCard from "./DrawingCard";
import DrawingsTable from "./DrawingsTable";
import DrawingDetailModal from "./DrawingDetailModal";
import DrawingUploadModal from "./DrawingUploadModal";

interface DrawingsDashboardProps {
  project: Project;
}

const DrawingsDashboard: React.FC<DrawingsDashboardProps> = ({ project }) => {
  const { user } = useAuth();

  // --- Estado local para datos reales ---
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({ searchTerm: "", discipline: "all" });
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDrawing, setSelectedDrawing] = useState<Drawing | null>(null);
  const [drawingToUpdate, setDrawingToUpdate] = useState<Drawing | null>(null);

  // --- useEffect para obtener los planos del backend ---
  useEffect(() => {
    const fetchDrawings = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await apiFetch("/drawings");
        setDrawings(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Ocurrió un error desconocido al cargar los planos."
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchDrawings();
  }, []);

  const filteredDrawings = useMemo(() => {
    return drawings.filter((d) => {
      const searchTermMatch =
        d.code.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        d.title.toLowerCase().includes(filters.searchTerm.toLowerCase());
      const disciplineMatch =
        filters.discipline === "all" || d.discipline === filters.discipline;
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
    setIsDetailModalOpen(false);
  };

  const handleOpenDetailModal = (drawing: Drawing) => {
    setSelectedDrawing(drawing);
    setIsDetailModalOpen(true);
  };

  // --- Lógica de Creación de Plano (¡LA PARTE NUEVA!) ---
  const handleSaveDrawing = async (
    data: Omit<Drawing, "id" | "status" | "versions" | "comments">,
    file: File
  ) => {
    if (!user) return;
    try {
      // Paso 1: Subir el archivo
      const formData = new FormData();
      formData.append("file", file);

      const uploadResult = await fetch("http://localhost:4000/api/upload", {
        method: "POST",
        body: formData,
        // ¡OJO! No pongas 'Content-Type', el navegador lo hace por ti con FormData
      }).then((res) => res.json());

      if (uploadResult.error) {
        throw new Error(uploadResult.error);
      }

      // Paso 2: Crear el registro del plano con los datos del archivo subido
      const drawingPayload = {
        ...data,
        version: {
          fileName: uploadResult.fileName,
          url: uploadResult.url,
          size: uploadResult.size,
          uploaderId: user.id,
        },
      };

      const newDrawing = await apiFetch("/drawings", {
        method: "POST",
        body: JSON.stringify(drawingPayload),
      });

      setDrawings((prev) => [newDrawing, ...prev]);
      setIsUploadModalOpen(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al guardar el plano."
      );
    }
  };

  // Estas funciones las implementaremos después
  const handleSaveNewVersion = async (drawingId: string, file: File) => {
    if (!user) return;
    try {
      // Paso 1: Subir el nuevo archivo (igual que antes)
      const formData = new FormData();
      formData.append("file", file);

      const uploadResult = await fetch("http://localhost:4000/api/upload", {
        method: "POST",
        body: formData,
      }).then((res) => res.json());

      if (uploadResult.error) throw new Error(uploadResult.error);

      // Paso 2: Llamar al nuevo endpoint para registrar la versión
      const versionPayload = {
        version: {
          fileName: uploadResult.fileName,
          url: uploadResult.url,
          size: uploadResult.size,
          uploaderId: user.id,
        },
      };

      const updatedDrawing = await apiFetch(`/drawings/${drawingId}/versions`, {
        method: "POST",
        body: JSON.stringify(versionPayload),
      });

      // Actualizamos el estado local para reflejar el cambio al instante
      setDrawings((prev) =>
        prev.map((d) => (d.id === drawingId ? updatedDrawing : d))
      );
      setIsUploadModalOpen(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al guardar la nueva versión."
      );
    }
  };

const handleAddCommentToDrawing = async (
    drawingId: string,
    commentText: string
  ) => {
    if (!user) return; // Guarda de seguridad
    try {
      // 1. Llama al endpoint del backend para crear el comentario
      const newComment = await apiFetch(`/drawings/${drawingId}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          content: commentText,
          authorId: user.id, // Envía el ID del usuario actual
        }),
      });

      // 2. Actualiza el estado local para que el cambio se vea al instante
      const updateDrawings = (prevDrawings: Drawing[]) => 
        prevDrawings.map(d => 
          d.id === drawingId 
            // Si es el plano correcto, añade el nuevo comentario a su lista
            ? { ...d, comments: [...(d.comments || []), newComment] } 
            : d
        );

      setDrawings(updateDrawings);

      // 3. Actualiza también el plano que está abierto en el modal
      setSelectedDrawing(prev => prev ? updateDrawings([prev])[0] : null);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al añadir el comentario.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Planos de Obra</h2>
          <p className="text-sm text-gray-500">
            Gestión de documentos técnicos del proyecto: {project.name}
          </p>
        </div>
        <div className="flex items-center flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="flex items-center bg-gray-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode("card")}
              title="Vista de Tarjetas"
              className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors flex items-center gap-2 ${
                viewMode === "card"
                  ? "bg-white text-brand-primary shadow"
                  : "text-gray-600 hover:bg-gray-300/50"
              }`}
            >
              <ListBulletIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Tarjetas</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              title="Vista de Tabla"
              className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors flex items-center gap-2 ${
                viewMode === "table"
                  ? "bg-white text-brand-primary shadow"
                  : "text-gray-600 hover:bg-gray-300/50"
              }`}
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
            viewMode === "card" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredDrawings.map((d) => (
                  <DrawingCard
                    key={d.id}
                    drawing={d}
                    onSelect={handleOpenDetailModal}
                    onAddVersion={handleOpenNewVersionModal}
                  />
                ))}
              </div>
            ) : (
              <DrawingsTable
                drawings={filteredDrawings}
                onSelect={handleOpenDetailModal}
              />
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
