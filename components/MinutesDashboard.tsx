import React, { useState, useMemo, useEffect } from "react";
import { Project, Acta, User } from "../types";
// Se elimina la importación de useMockApi
import Button from "./ui/Button";
import { PlusIcon, ClipboardDocumentListIcon } from "./icons/Icon";
import ActaCard from "./ActaCard";
import ActaDetailModal from "./ActaDetailModal";
import ActaFormModal from "./ActaFormModal";
import EmptyState from "./ui/EmptyState";
import ActaFilterBar from "./ActaFilterBar";
import { useAuth } from "../contexts/AuthContext";
import { MOCK_PROJECT, MOCK_USERS } from "../services/mockData"; // Aún usamos MOCK_PROJECT

interface MinutesDashboardProps {
  // project: Project; // Ya no se recibe por props
  initialItemToOpen: { type: string; id: string } | null;
  clearInitialItem: () => void;
}

const MinutesDashboard: React.FC<MinutesDashboardProps> = ({
  initialItemToOpen,
  clearInitialItem,
}) => {
  const { user } = useAuth();
  const project = MOCK_PROJECT; // Usamos el de prueba por ahora

  // --- ¡NUEVO ESTADO PARA DATOS REALES! ---
  const [actas, setActas] = useState<Acta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedActa, setSelectedActa] = useState<Acta | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    searchTerm: "",
    status: "all",
    area: "all",
    startDate: "",
    endDate: "",
  });

  // --- useEffect PARA OBTENER DATOS DEL BACKEND ---
  useEffect(() => {
    const fetchActas = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch("http://localhost:4000/api/actas");
        if (!response.ok) {
          throw new Error(
            "La respuesta del servidor para obtener actas no fue exitosa."
          );
        }
        const data = await response.json();
        setActas(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Ocurrió un error desconocido."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchActas();
  }, []);

  const handleOpenDetail = (acta: Acta) => {
    setSelectedActa(acta);
    setIsDetailModalOpen(true);
  };

  useEffect(() => {
    if (initialItemToOpen && initialItemToOpen.type === "acta") {
      const actaToOpen = actas.find((a) => a.id === initialItemToOpen.id);
      if (actaToOpen) {
        handleOpenDetail(actaToOpen);
      }
      clearInitialItem();
    }
  }, [initialItemToOpen, actas, clearInitialItem]);

  const filteredActas = useMemo(() => {
    // ... (lógica de filtrado se queda igual) ...
    return actas.filter((acta) => {
      const searchTermMatch =
        acta.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        acta.number.toLowerCase().includes(filters.searchTerm.toLowerCase());
      const statusMatch =
        filters.status === "all" || acta.status === filters.status;
      const areaMatch = filters.area === "all" || acta.area === filters.area;
      const actaDate = new Date(acta.date);
      actaDate.setHours(0, 0, 0, 0);
      const startDate = filters.startDate ? new Date(filters.startDate) : null;
      if (startDate) startDate.setHours(0, 0, 0, 0);
      const endDate = filters.endDate ? new Date(filters.endDate) : null;
      if (endDate) endDate.setHours(0, 0, 0, 0);
      const startDateMatch = !startDate || actaDate >= startDate;
      const endDateMatch = !endDate || actaDate <= endDate;
      return (
        searchTermMatch &&
        statusMatch &&
        areaMatch &&
        startDateMatch &&
        endDateMatch
      );
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

  // --- ¡CONECTAMOS LA FUNCIÓN DE GUARDADO! ---
  const handleSaveActa = async (newActaData: Omit<Acta, "id">) => {
    try {
      const response = await fetch("http://localhost:4000/api/actas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newActaData),
      });

      if (!response.ok) {
        throw new Error("Falló la creación del acta.");
      }

      const createdActa = await response.json();
      setActas((prevActas) => [createdActa, ...prevActas]);
      handleCloseForm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al guardar el acta."
      );
    }
  };

  // Dejamos estas funciones vacías por ahora, las implementaremos después
 const handleUpdateActa = async (updatedActa: Acta) => {
  // La lógica principal será actualizar los compromisos que hayan cambiado
  const originalActa = actas.find(a => a.id === updatedActa.id);
  if (!originalActa) return;

  // Comparamos los compromisos para ver cuáles cambiaron de estado
  for (const updatedCommitment of updatedActa.commitments) {
    const originalCommitment = originalActa.commitments.find(c => c.id === updatedCommitment.id);
    if (originalCommitment && originalCommitment.status !== updatedCommitment.status) {
      // Si el estado cambió, llamamos a la API para actualizarlo
      try {
        await fetch(`http://localhost:4000/api/commitments/${updatedCommitment.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: updatedCommitment.status }),
        });
      } catch (err) {
        console.error("Falló al actualizar el compromiso:", updatedCommitment.id);
        // Podríamos añadir un manejo de error más visible aquí
      }
    }
  }

  // Actualizamos el estado local para que la UI se refleje inmediatamente
  setActas(prev => prev.map(a => a.id === updatedActa.id ? updatedActa : a));
  setSelectedActa(updatedActa);

    // Actualizamos el estado local para que la UI se refleje inmediatamente
    setActas((prev) =>
      prev.map((a) => (a.id === updatedActa.id ? updatedActa : a))
    );
    setSelectedActa(updatedActa);
  };

  const sendCommitmentReminderEmail = async (commitment: any, acta: Acta) => {};
  const addSignature = async (
    documentId: string,
    documentType: "acta",
    signer: User
  ) => {};

  if (!user) return null;

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
              {filteredActas.map((acta) => (
                <ActaCard
                  key={acta.id}
                  acta={acta}
                  onSelect={handleOpenDetail}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<ClipboardDocumentListIcon />}
              title="No se encontraron actas"
              message="No hay actas que coincidan con los filtros seleccionados o aún no se ha registrado ninguna. ¡Crea la primera!"
              actionButton={
                <Button onClick={handleOpenForm} leftIcon={<PlusIcon />}>
                  Registrar Primera Acta
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
          onSign={addSignature}
          currentUser={user}
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
