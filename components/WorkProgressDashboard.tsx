import React, { useState, useMemo } from "react";
import {
  Project,
  WorkActa,
  ContractItem,
  WorkActaStatus,
  ModificationType,
  ContractModification,
} from "../types";
import { useMockApi } from "../hooks/useMockApi";
import Button from "./ui/Button";
import { PlusIcon, CalculatorIcon } from "./icons/Icon";
import EmptyState from "./ui/EmptyState";
import Card from "./ui/Card";
import WorkActaStatusBadge from "./WorkActaStatusBadge";
import { MOCK_MAIN_CONTRACT_VALUE } from "../src/services/mockData";
import WorkActaDetailModal from "./WorkActaDetailModal";
import WorkActaFormModal from "./WorkActaFormModal";
import ContractItemsSummaryTable from "./ContractItemsSummaryTable";
import ContractModificationFormModal from "./ContractModificationFormModal";

interface WorkProgressDashboardProps {
  project: Project;
  api: ReturnType<typeof useMockApi>;
}

const KPICard: React.FC<{
  title: string;
  value: string;
  children?: React.ReactNode;
}> = ({ title, value, children }) => (
  <Card className="p-5">
    <h3 className="text-sm font-medium text-gray-500 truncate">{title}</h3>
    <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
    {children}
  </Card>
);

const WorkProgressDashboard: React.FC<WorkProgressDashboardProps> = ({
  project,
  api,
}) => {
  const {
    workActas,
    contractItems,
    contractModifications,
    isLoading,
    error,
    addWorkActa,
    updateWorkActa,
    addContractModification,
  } = api;

  // State for Work Actas
  const [selectedActa, setSelectedActa] = useState<WorkActa | null>(null);
  const [isActaDetailModalOpen, setIsActaDetailModalOpen] = useState(false);
  const [isActaFormModalOpen, setIsActaFormModalOpen] = useState(false);
  const [isModFormModalOpen, setIsModFormModalOpen] = useState(false);

  const contractItemMap = useMemo(() => {
    return new Map(contractItems.map((item) => [item.id, item]));
  }, [contractItems]);

  const financialSummary = useMemo(() => {
    const totalAdditions = contractModifications
      .filter((mod) => mod.type === ModificationType.ADDITION && mod.value)
      .reduce((sum, mod) => sum + (mod.value || 0), 0);

    const updatedContractValue = MOCK_MAIN_CONTRACT_VALUE + totalAdditions;

    const totalExecutedValue = workActas
      .filter((acta) => acta.status === WorkActaStatus.APPROVED)
      .reduce((total, acta) => {
        const actaTotal = acta.items.reduce((actaSum, item) => {
          const contractItem = contractItemMap.get(item.contractItemId);
          return (
            actaSum +
            (contractItem ? item.quantity * contractItem.unitPrice : 0)
          );
        }, 0);
        return total + actaTotal;
      }, 0);

    const contractBalance = updatedContractValue - totalExecutedValue;
    const executionPercentage =
      updatedContractValue > 0
        ? (totalExecutedValue / updatedContractValue) * 100
        : 0;

    return {
      totalExecutedValue,
      contractBalance,
      executionPercentage,
      updatedContractValue,
    };
  }, [workActas, contractItemMap, contractModifications]);

  const itemsSummaryData = useMemo(() => {
    const executedQuantities = new Map<string, number>();

    workActas
      .filter((acta) => acta.status === WorkActaStatus.APPROVED)
      .forEach((acta) => {
        acta.items.forEach((item) => {
          const currentQuantity =
            executedQuantities.get(item.contractItemId) || 0;
          executedQuantities.set(
            item.contractItemId,
            currentQuantity + item.quantity
          );
        });
      });

    return contractItems.map((item) => {
      const executedQuantity = executedQuantities.get(item.id) || 0;
      const balance = item.contractQuantity - executedQuantity;
      const executionPercentage =
        item.contractQuantity > 0
          ? (executedQuantity / item.contractQuantity) * 100
          : 0;
      return {
        ...item,
        executedQuantity,
        balance,
        executionPercentage,
      };
    });
  }, [workActas, contractItems]);

  const nextActaNumber = useMemo(() => {
    if (workActas.length === 0) {
      return "Acta de Avance de Obra No. 01";
    }
    const highestNumber = workActas.reduce((max, acta) => {
      const match = acta.number.match(/\d+$/);
      const num = match ? parseInt(match[0], 10) : 0;
      return Math.max(max, num);
    }, 0);
    return `Acta de Avance de Obra No. ${String(highestNumber + 1).padStart(
      2,
      "0"
    )}`;
  }, [workActas]);

  // Handlers for Work Actas
  const handleOpenDetail = (acta: WorkActa) => {
    setSelectedActa(acta);
    setIsActaDetailModalOpen(true);
  };

  const handleCloseDetail = () => {
    setSelectedActa(null);
    setIsActaDetailModalOpen(false);
  };

  const handleSaveActa = async (newActaData: Omit<WorkActa, "id">) => {
    await addWorkActa(newActaData);
    setIsActaFormModalOpen(false);
  };

  const handleUpdateActa = async (updatedActa: WorkActa) => {
    await updateWorkActa(updatedActa);
    const refreshedActa = workActas.find((a) => a.id === updatedActa.id);
    setSelectedActa(refreshedActa || updatedActa);
  };

  const handleSaveModification = async (
    newModData: Omit<ContractModification, "id">
  ) => {
    await addContractModification(newModData);
    setIsModFormModalOpen(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getActaTotalValue = (acta: WorkActa) => {
    return acta.items.reduce((sum, item) => {
      const contractItem = contractItemMap.get(item.contractItemId);
      return sum + (contractItem ? item.quantity * contractItem.unitPrice : 0);
    }, 0);
  };

  const getValueOrDays = (mod: ContractModification) => {
    if (mod.type === ModificationType.ADDITION) {
      return formatCurrency(mod.value || 0);
    }
    if (mod.type === ModificationType.TIME_EXTENSION) {
      return `${mod.days || 0} días`;
    }
    return "—"; // Return em-dash for other types
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Control de Avance de Obra
        </h2>
        <p className="text-sm text-gray-500">
          Contrato de Obra: {project.contractId}
        </p>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          title="Valor Total del Contrato"
          value={formatCurrency(financialSummary.updatedContractValue)}
        />
        <KPICard
          title="Valor Total Ejecutado"
          value={formatCurrency(financialSummary.totalExecutedValue)}
        >
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
            <div
              className="bg-idu-cyan h-2.5 rounded-full"
              style={{
                width: `${financialSummary.executionPercentage.toFixed(2)}%`,
              }}
            ></div>
          </div>
          <p className="text-xs text-right text-gray-500 mt-1">
            {financialSummary.executionPercentage.toFixed(2)}% Ejecutado
          </p>
        </KPICard>
        <KPICard
          title="Saldo del Contrato"
          value={formatCurrency(financialSummary.contractBalance)}
        />
      </div>

      {/* Contract Modifications History */}
      <Card>
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">
            Historial de Modificaciones al Contrato
          </h3>
          <Button
            onClick={() => setIsModFormModalOpen(true)}
            leftIcon={<PlusIcon />}
            size="sm"
            variant="secondary"
          >
            Registrar Modificación
          </Button>
        </div>
        <div className="overflow-x-auto">
          {contractModifications.length > 0 ? (
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3">
                    N° Modificatorio
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Tipo
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Fecha
                  </th>
                  <th scope="col" className="px-6 py-3 text-right">
                    Valor / Días
                  </th>
                </tr>
              </thead>
              <tbody>
                {contractModifications.map((mod) => (
                  <tr key={mod.id} className="bg-white border-b">
                    <th
                      scope="row"
                      className="px-6 py-4 font-medium text-gray-900"
                    >
                      {mod.number}
                    </th>
                    <td className="px-6 py-4">{mod.type}</td>
                    <td className="px-6 py-4">
                      {new Date(mod.date).toLocaleDateString("es-CO")}
                    </td>
                    <td className="px-6 py-4 font-semibold text-right">
                      {getValueOrDays(mod)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center text-gray-500">
              No se han registrado modificaciones al contrato.
            </div>
          )}
        </div>
      </Card>

      {/* Contract Items Summary Table */}
      <ContractItemsSummaryTable
        items={itemsSummaryData}
        isLoading={isLoading}
      />

      {/* Work Actas History */}
      <Card>
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-800">
            Historial de Actas de Avance
          </h3>
          <Button
            onClick={() => setIsActaFormModalOpen(true)}
            leftIcon={<PlusIcon />}
            size="sm"
            variant="secondary"
          >
            Nueva Acta de Avance
          </Button>
        </div>
        <div className="overflow-x-auto">
          {workActas.length > 0 ? (
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
                    Fecha
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Valor del Periodo
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                {workActas
                  .sort(
                    (a, b) =>
                      new Date(a.date).getTime() - new Date(b.date).getTime()
                  )
                  .map((acta) => (
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
                        {new Date(acta.date).toLocaleDateString("es-CO")}
                      </td>
                      <td className="px-6 py-4 font-semibold">
                        {formatCurrency(getActaTotalValue(acta))}
                      </td>
                      <td className="px-6 py-4">
                        <WorkActaStatusBadge status={acta.status} />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6">
              <EmptyState
                icon={<CalculatorIcon />}
                title="No hay actas de avance registradas"
                message="Registra la primera acta de avance para iniciar el seguimiento de cantidades y valores del contrato de obra."
                actionButton={
                  <Button
                    onClick={() => setIsActaFormModalOpen(true)}
                    leftIcon={<PlusIcon />}
                  >
                    Registrar Primera Acta
                  </Button>
                }
              />
            </div>
          )}
        </div>
      </Card>

      {selectedActa && (
        <WorkActaDetailModal
          isOpen={isActaDetailModalOpen}
          onClose={handleCloseDetail}
          acta={selectedActa}
          contractItems={contractItems}
          onUpdate={handleUpdateActa}
        />
      )}

      <WorkActaFormModal
        isOpen={isActaFormModalOpen}
        onClose={() => setIsActaFormModalOpen(false)}
        onSave={handleSaveActa}
        contractItems={contractItems}
        suggestedNumber={nextActaNumber}
        itemsSummary={itemsSummaryData}
      />

      <ContractModificationFormModal
        isOpen={isModFormModalOpen}
        onClose={() => setIsModFormModalOpen(false)}
        onSave={handleSaveModification}
      />
    </div>
  );
};

export default WorkProgressDashboard;
