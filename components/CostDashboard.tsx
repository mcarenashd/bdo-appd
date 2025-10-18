import React, { useState, useEffect } from "react"; // Añade useEffect
import { Project, CostActa, Attachment, CostActaStatus } from "../types"; // Importa CostActaStatus
import apiFetch from "../src/services/api"; // <-- Importa apiFetch
import Button from "./ui/Button";
import { PlusIcon, DocumentChartBarIcon } from "./icons/Icon";
import EmptyState from "./ui/EmptyState";
import Card from "./ui/Card";
import CostActaStatusBadge from "./CostActaStatusBadge";
import CostActaDetailModal from "./CostActaDetailModal";
import CostActaFormModal from "./CostActaFormModal";
// Importamos el valor del contrato mock, ya que aún no tenemos un endpoint para obtenerlo
import { MOCK_TOTAL_CONTRACT_VALUE } from "../src/services/mockData";
import { useAuth } from "../contexts/AuthContext"; // Importa useAuth si necesitas el usuario

interface CostDashboardProps {
  project: Project; // Mantenemos project por ahora
  // Se elimina la prop 'api'
}

const CostDashboard: React.FC<CostDashboardProps> = ({ project }) => {
  const { user } = useAuth(); // Obtén el usuario si es necesario para observaciones, etc.

  // --- Estado local para datos reales ---
  const [costActas, setCostActas] = useState<CostActa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // ------------------------------------

  const [selectedActa, setSelectedActa] = useState<CostActa | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  // --- useEffect para cargar datos ---
  useEffect(() => {
    const fetchCostActas = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await apiFetch('/cost-actas'); // Llama al nuevo endpoint GET
        setCostActas(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar las actas de costo.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCostActas();
  }, []); // Se ejecuta solo al montar
  // ---------------------------------

  const handleOpenDetail = (acta: CostActa) => {
    setSelectedActa(acta);
    setIsDetailModalOpen(true);
  };

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

  // --- Implementación de handleSaveActa con subida de archivos ---
  const handleSaveActa = async (
    newActaData: Omit<CostActa, "id" | "observations" | "attachments">,
    files: File[]
  ) => {
    if (!user) return; // Guarda de seguridad
    setIsLoading(true); // Opcional: mostrar un indicador mientras se guarda
    setError(null);

    try {
      // 1. Subir todos los archivos adjuntos en paralelo
      const uploadPromises = files.map(file => {
        const formData = new FormData();
        formData.append('file', file);
        // Usamos fetch directamente para la subida, ya que apiFetch asume JSON
        return fetch('http://localhost:4000/api/upload', {
          method: 'POST',
          body: formData,
        }).then(res => res.json());
      });

      const uploadResults = await Promise.all(uploadPromises);

      // Verificar si hubo errores en la subida
      const failedUploads = uploadResults.filter(result => result.error || !result.url);
      if (failedUploads.length > 0) {
        throw new Error(`Error al subir ${failedUploads.length} archivo(s).`);
      }

      // 2. Preparar los datos para crear el acta, incluyendo los IDs/URLs de los adjuntos
      const attachmentDataForPayload = uploadResults.map(result => ({
          id: result.id, // Suponiendo que el backend devuelve un ID o usamos la URL como ID temporal
          fileName: result.fileName,
          url: result.url,
          size: result.size,
          type: result.type,
      }));

      // Creamos el payload final para /api/cost-actas
      const actaPayload = {
          ...newActaData,
          attachments: attachmentDataForPayload // Enviamos la info de los archivos subidos
      };

      // 3. Crear el registro del acta de costo en la base de datos
      const createdActa = await apiFetch('/cost-actas', {
          method: 'POST',
          body: JSON.stringify(actaPayload)
      });

      // 4. Actualizar el estado local y cerrar el modal
      setCostActas(prev => [createdActa, ...prev]);
      handleCloseForm();

    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar el acta de costo.");
    } finally {
       setIsLoading(false); // Asegúrate de quitar el indicador de carga
    }
  };
  // -------------------------------------------------------------

  // --- Implementaremos esta después ---
const handleUpdateActa = async (updatedActa: CostActa) => {
    try {
        // Llamamos al endpoint PUT con el ID y los datos a actualizar
        const updatedActaFromServer = await apiFetch(`/cost-actas/${updatedActa.id}`, {
            method: 'PUT',
            body: JSON.stringify({
                status: updatedActa.status, // Enviamos el estado en formato frontend
                relatedProgress: updatedActa.relatedProgress // También actualizamos este campo
            }),
        });

        // Actualizamos el estado local
        setCostActas(prev =>
            prev.map(acta => acta.id === updatedActaFromServer.id ? updatedActaFromServer : acta)
        );
        // Actualizamos el modal si está abierto
        if (selectedActa && selectedActa.id === updatedActaFromServer.id) {
            setSelectedActa(updatedActaFromServer);
        }
        handleCloseDetail(); // Cerramos el modal
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al actualizar el acta de costo.');
    }
  };
  // ------------------------------------

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Seguimiento de Actas de Costos
          </h2>
          <p className="text-sm text-gray-500">
            Contrato de Interventoría: {project.contractId}
          </p>
        </div>
        <Button onClick={handleOpenForm} leftIcon={<PlusIcon />}>
          Registrar Acta de Cobro
        </Button>
      </div>

      {/* Indicadores de Carga y Error */}
      {isLoading && (
        <div className="text-center p-8">Cargando actas de costos...</div>
      )}
      {error && <div className="text-center p-8 text-red-500">{error}</div>}

      {/* Tabla o EmptyState */}
      {!isLoading && !error && (
        <Card className="overflow-x-auto">
          {costActas.length > 0 ? (
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3">N° Acta</th>
                  <th scope="col" className="px-6 py-3">Periodo</th>
                  <th scope="col" className="px-6 py-3">Fecha Radicación</th>
                  <th scope="col" className="px-6 py-3">Valor Facturado</th>
                  <th scope="col" className="px-6 py-3">% Contrato</th>
                  <th scope="col" className="px-6 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {costActas.map((acta) => (
                  <tr
                    key={acta.id}
                    className="bg-white border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleOpenDetail(acta)}
                  >
                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{acta.number}</th>
                    <td className="px-6 py-4">{acta.period}</td>
                    <td className="px-6 py-4">{new Date(acta.submissionDate).toLocaleDateString("es-CO")}</td>
                    <td className="px-6 py-4 font-semibold">{formatCurrency(acta.billedAmount)}</td>
                    <td className="px-6 py-4">
                      {((acta.billedAmount / acta.totalContractValue) * 100).toFixed(2)}%
                    </td>
                    <td className="px-6 py-4"><CostActaStatusBadge status={acta.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState
              icon={<DocumentChartBarIcon />}
              title="No hay actas de costos registradas"
              message="Registra la primera acta de cobro para iniciar el seguimiento financiero del contrato de interventoría."
              actionButton={
                <Button onClick={handleOpenForm} leftIcon={<PlusIcon />}>
                  Registrar Primera Acta
                </Button>
              }
            />
          )}
        </Card>
      )}

      {/* Modals */}
      {selectedActa && (
        <CostActaDetailModal
          isOpen={isDetailModalOpen}
          onClose={handleCloseDetail}
          acta={selectedActa}
          onUpdate={handleUpdateActa} // Función aún por implementar completamente
        />
      )}

      <CostActaFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseForm}
        onSave={handleSaveActa} // Conectado al backend con subida de archivos
        totalContractValue={MOCK_TOTAL_CONTRACT_VALUE} // Aún usamos el valor mock
      />
    </div>
  );
};

export default CostDashboard;