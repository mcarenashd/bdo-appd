import React, { useState } from 'react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import ProjectDashboard from './components/ProjectDashboard';
import CommunicationsDashboard from './components/CommunicationsDashboard';
import MinutesDashboard from './components/MinutesDashboard';
import CostDashboard from './components/CostDashboard';
import WorkProgressDashboard from './components/WorkProgressDashboard';
import PhotographicProgressDashboard from './components/PhotographicProgressDashboard';
import PlanningDashboard from './components/PlanningDashboard';
import { MOCK_PROJECT } from './services/mockData';
import ProjectSummaryDashboard from './components/ProjectSummaryDashboard';
import { useMockApi } from './hooks/useMockApi';
import WeeklyReportsDashboard from './components/WeeklyReportsDashboard';
import MonthlyReportsDashboard from './components/MonthlyReportsDashboard';
import PendingTasksDashboard from './components/PendingTasksDashboard';
import ExportDashboard from './components/ExportDashboard';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginScreen from './components/auth/LoginScreen';
import { ReportScope } from './types';

type InitialItemToOpen = { type: 'acta' | 'logEntry'; id: string };

const MainApp = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState('summary');
  const [initialItemToOpen, setInitialItemToOpen] = useState<InitialItemToOpen | null>(null);
  
  const api = useMockApi();
  const { projectDetails, contractModifications, isLoading } = api;

  const handleNavigateAndOpen = (view: string, item: InitialItemToOpen) => {
    setInitialItemToOpen(item);
    setCurrentView(view);
  };

  const clearInitialItem = () => {
    setInitialItemToOpen(null);
  };

  const renderContent = () => {
    if (isLoading || !projectDetails) {
        return <div className="text-center p-8">Cargando datos del proyecto...</div>;
    }

    switch (currentView) {
      case 'summary':
        return <ProjectSummaryDashboard project={projectDetails} contractModifications={contractModifications} />;
      case 'pending_tasks':
        return <PendingTasksDashboard api={api} onNavigate={handleNavigateAndOpen} />;
      case 'logbook':
        return <ProjectDashboard project={MOCK_PROJECT} api={api} initialItemToOpen={initialItemToOpen} clearInitialItem={clearInitialItem} />;
      case 'work_progress':
        return <WorkProgressDashboard project={MOCK_PROJECT} api={api} />;
      case 'photographic_progress':
        return <PhotographicProgressDashboard project={MOCK_PROJECT} api={api} />;
      case 'planning':
        return <PlanningDashboard project={MOCK_PROJECT} api={api} />;
      case 'communications':
        return <CommunicationsDashboard project={MOCK_PROJECT} api={api} />;
      case 'minutes':
        return <MinutesDashboard project={MOCK_PROJECT} api={api} initialItemToOpen={initialItemToOpen} clearInitialItem={clearInitialItem} />;
      case 'costs':
        return <CostDashboard project={MOCK_PROJECT} api={api} />;
      case 'weekly_reports_obra':
        return <WeeklyReportsDashboard project={MOCK_PROJECT} api={api} reportScope={ReportScope.OBRA} />;
      case 'weekly_reports_interventoria':
        return <WeeklyReportsDashboard project={MOCK_PROJECT} api={api} reportScope={ReportScope.INTERVENTORIA} />;
      case 'monthly_reports_obra':
        return <MonthlyReportsDashboard project={MOCK_PROJECT} api={api} reportScope={ReportScope.OBRA} />;
      case 'monthly_reports_interventoria':
        return <MonthlyReportsDashboard project={MOCK_PROJECT} api={api} reportScope={ReportScope.INTERVENTORIA} />;
      case 'export_project':
        return <ExportDashboard project={projectDetails} api={api} />;
      default:
        return <ProjectSummaryDashboard project={projectDetails} contractModifications={contractModifications} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        currentView={currentView}
        setCurrentView={setCurrentView}
      />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        <Header setIsSidebarOpen={setIsSidebarOpen} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className="container mx-auto px-6 py-8">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

const AppContent = () => {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl font-semibold">Cargando...</div>
      </div>
    );
  }

  if (!token) {
    return <LoginScreen />;
  }

  return <MainApp />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;