import React, { useState } from "react";
import { Project, CostActa, Attachment } from "../types";
import { useMockApi } from "../hooks/useMockApi";
import Button from "./ui/Button";
import { PlusIcon, DocumentChartBarIcon } from "./icons/Icon";
import EmptyState from "./ui/EmptyState";
import Card from "./ui/Card";
import CostActaStatusBadge from "./CostActaStatusBadge";
import CostActaDetailModal from "./CostActaDetailModal";
import CostActaFormModal from "./CostActaFormModal";
import { MOCK_TOTAL_CONTRACT_VALUE } from "../src/services/mockData";

interface CostDashboardProps {
  project: Project;
  api: ReturnType<typeof useMockApi>;
}

const CostDashboard: React.FC<CostDashboardProps> = ({ project, api }) => {
  const { costActas, isLoading, error, addCostActa, updateCostActa } = api;
  const [selectedActa, setSelectedActa] = useState<CostActa | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

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

  const handleSaveActa = async (
    newActaData: Omit<CostActa, "id" | "observations" | "attachments">,
    files: File[]
  ) => {
    await addCostActa(newActaData, files);
    handleCloseForm();
  };

  const handleUpdateActa = async (updatedActa: CostActa) => {
    await updateCostActa(updatedActa);
    const refreshedActa = costActas.find((a) => a.id === updatedActa.id);
    setSelectedActa(refreshedActa || updatedActa);
  };

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

      {isLoading && (
        <div className="text-center p-8">Cargando actas de costos...</div>
      )}
      {error && <div className="text-center p-8 text-red-500">{error}</div>}

      {!isLoading && !error && (
        <Card className="overflow-x-auto">
          {costActas.length > 0 ? (
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3">
                    N° Acta
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Periodo
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Fecha Radicación
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Valor Facturado
                  </th>
                  <th scope="col" className="px-6 py-3">
                    % Contrato
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                {costActas.map((acta) => (
                  <tr
                    key={acta.id}
                    className="bg-white border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleOpenDetail(acta)}
                  >
                    <th
                      scope="row"
                      className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"
                    >
                      {acta.number}
                    </th>
                    <td className="px-6 py-4">{acta.period}</td>
                    <td className="px-6 py-4">
                      {new Date(acta.submissionDate).toLocaleDateString(
                        "es-CO"
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      {formatCurrency(acta.billedAmount)}
                    </td>
                    <td className="px-6 py-4">
                      {(
                        (acta.billedAmount / acta.totalContractValue) *
                        100
                      ).toFixed(2)}
                      %
                    </td>
                    <td className="px-6 py-4">
                      <CostActaStatusBadge status={acta.status} />
                    </td>
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

      {selectedActa && (
        <CostActaDetailModal
          isOpen={isDetailModalOpen}
          onClose={handleCloseDetail}
          acta={selectedActa}
          onUpdate={handleUpdateActa}
        />
      )}

      <CostActaFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseForm}
        onSave={handleSaveActa}
        totalContractValue={MOCK_TOTAL_CONTRACT_VALUE}
      />
    </div>
  );
};

export default CostDashboard;
