import React, { useState } from 'react';
import { ProjectDetails, WeeklyReport } from '../types';
import { useMockApi } from '../hooks/useMockApi';
import Button from './ui/Button';
import { PlusIcon, DocumentChartBarIcon } from './icons/Icon';
import EmptyState from './ui/EmptyState';
import WeeklyReportGenerator from './reports/WeeklyReportGenerator';
import Card from './ui/Card';

interface WeeklyReportsDashboardProps {
  project: ProjectDetails;
  api: ReturnType<typeof useMockApi>;
}

const WeeklyReportsDashboard: React.FC<WeeklyReportsDashboardProps> = ({ project, api }) => {
  const { weeklyReports, isLoading, error, addWeeklyReport } = api;
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);

  const handleSaveReport = async (reportData: Omit<WeeklyReport, 'id'>) => {
    await addWeeklyReport(reportData);
    setIsGeneratorOpen(false);
  };

  if (isGeneratorOpen) {
    return <WeeklyReportGenerator project={project} onSave={handleSaveReport} onCancel={() => setIsGeneratorOpen(false)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Informes Semanales de Interventoría</h2>
          <p className="text-sm text-gray-500">Proyecto: {project.name}</p>
        </div>
        <Button onClick={() => setIsGeneratorOpen(true)} leftIcon={<PlusIcon />}>
          Generar Nuevo Informe Semanal
        </Button>
      </div>

      {isLoading && <div className="text-center p-8">Cargando informes...</div>}
      {error && <div className="text-center p-8 text-red-500">{error}</div>}

      {!isLoading && !error && (
        <div>
          {weeklyReports.length > 0 ? (
            <div className="space-y-4">
              {weeklyReports.map(report => (
                <Card key={report.id} className="p-4">
                    <p>Informe Semana #{report.semana}</p>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<DocumentChartBarIcon />}
              title="No hay informes semanales"
              message="Genera el primer informe para consolidar el avance, personal, actividades y estado general del proyecto durante la semana."
              actionButton={
                <Button onClick={() => setIsGeneratorOpen(true)} leftIcon={<PlusIcon />}>
                  Generar Primer Informe
                </Button>
              }
            />
          )}
        </div>
      )}
    </div>
  );
};

export default WeeklyReportsDashboard;
