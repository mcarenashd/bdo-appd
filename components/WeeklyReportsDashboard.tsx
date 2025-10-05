import React, { useState, useMemo } from 'react';
import { Project, Report, ReportScope } from '../types';
import { useMockApi } from '../hooks/useMockApi';
import Button from './ui/Button';
import { PlusIcon, ListBulletIcon } from './icons/Icon';
import EmptyState from './ui/EmptyState';
import ReportCard from './ReportCard';
import ReportDetailModal from './ReportDetailModal';
import ReportFormModal from './ReportFormModal';
import { useAuth } from '../contexts/AuthContext';

interface WeeklyReportsDashboardProps {
  project: Project;
  api: ReturnType<typeof useMockApi>;
  reportScope: ReportScope;
}

const WeeklyReportsDashboard: React.FC<WeeklyReportsDashboardProps> = ({ project, api, reportScope }) => {
  const { user } = useAuth();
  const { reports, isLoading, error, addReport, updateReport, addSignature } = api;
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  const weeklyReports = useMemo(() => {
    return reports.filter(r => r.type === 'Weekly' && r.reportScope === reportScope);
  }, [reports, reportScope]);
  
  const title = `Informes Semanales (${reportScope})`;

  const handleOpenDetail = (report: Report) => {
    setSelectedReport(report);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailModalOpen(false);
    setSelectedReport(null);
  };

  const handleOpenForm = () => {
    setIsFormModalOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormModalOpen(false);
  };

  const handleSaveReport = async (reportData: Omit<Report, 'id' | 'author' | 'status' | 'attachments'>, files: File[]) => {
    if (!user) return;
    await addReport(reportData, files, user);
    handleCloseForm();
  };
  
  const handleUpdateReport = async (updatedReport: Report) => {
    await updateReport(updatedReport);
    setSelectedReport(updatedReport);
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500">Proyecto: {project.name}</p>
        </div>
        <Button onClick={handleOpenForm} leftIcon={<PlusIcon />}>
          Registrar Informe Semanal
        </Button>
      </div>

      {isLoading && <div className="text-center p-8">Cargando informes...</div>}
      {error && <div className="text-center p-8 text-red-500">{error}</div>}

      {!isLoading && !error && (
        <div>
          {weeklyReports.length > 0 ? (
            <div className="space-y-4">
              {weeklyReports.map(report => (
                <ReportCard key={report.id} report={report} onSelect={handleOpenDetail} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<ListBulletIcon />}
              title="No hay informes semanales"
              message="Registra el primer informe para llevar un control periódico del avance y las actividades de la obra."
              actionButton={
                <Button onClick={handleOpenForm} leftIcon={<PlusIcon />}>
                  Crear Primer Informe
                </Button>
              }
            />
          )}
        </div>
      )}

      {selectedReport && (
        <ReportDetailModal
          isOpen={isDetailModalOpen}
          onClose={handleCloseDetail}
          report={selectedReport}
          onUpdate={handleUpdateReport}
          onSign={addSignature}
          currentUser={user}
        />
      )}

      <ReportFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseForm}
        onSave={handleSaveReport}
        reportType="Weekly"
        reportScope={reportScope}
      />
    </div>
  );
};

export default WeeklyReportsDashboard;