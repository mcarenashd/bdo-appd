import React, { useState, useEffect } from "react";
import Header from "./components/layout/Header";
import Sidebar from "./components/layout/Sidebar";
import ProjectDashboard from "./components/ProjectDashboard";
import CommunicationsDashboard from "./components/CommunicationsDashboard";
import MinutesDashboard from "./components/MinutesDashboard";
import CostDashboard from "./components/CostDashboard";
import WorkProgressDashboard from "./components/WorkProgressDashboard"; // <-- Se usa este componente
import PhotographicProgressDashboard from "./components/PhotographicProgressDashboard";
import PlanningDashboard from "./components/PlanningDashboard";
import { MOCK_PROJECT } from "./src/services/mockData";
import ProjectSummaryDashboard from "./components/ProjectSummaryDashboard";
import { useMockApi } from "./hooks/useMockApi"; // <-- Todavía se usa para otros módulos
import WeeklyReportsDashboard from "./components/WeeklyReportsDashboard";
import MonthlyReportsDashboard from "./components/MonthlyReportsDashboard";
import PendingTasksDashboard from "./components/PendingTasksDashboard";
import ExportDashboard from "./components/ExportDashboard";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import LoginScreen from "./components/auth/LoginScreen";
import { ReportScope, Notification, CommitmentStatus, User } from "./types";
import AdminDashboard from "./components/admin/AdminDashboard";
import DrawingsDashboard from "./components/DrawingsDashboard";

type InitialItemToOpen = { type: "acta" | "logEntry"; id: string };

const MainApp = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState("summary");
  const [initialItemToOpen, setInitialItemToOpen] =
    useState<InitialItemToOpen | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // useMockApi todavía se usa aquí porque otros componentes aún lo necesitan
  const api = useMockApi();
  const { user } = useAuth();
  const {
    projectDetails,
    contractModifications,
    isLoading,
    actas: apiActas, // Obtenemos las actas del mock para las notificaciones (temporal)
  } = api;

  useEffect(() => {
    // Lógica de notificaciones (se mantiene igual por ahora)
    if (!apiActas || !user) return;
    const generatedNotifications: Notification[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    apiActas.forEach((acta) => {
      acta.commitments.forEach((commitment) => {
        if (
          commitment.responsible.id === user.id &&
          commitment.status === CommitmentStatus.PENDING
        ) {
          const dueDate = new Date(commitment.dueDate);
          const localDueDate = new Date(
            dueDate.valueOf() + dueDate.getTimezoneOffset() * 60 * 1000
          );
          localDueDate.setHours(0, 0, 0, 0);
          const timeDiff = localDueDate.getTime() - today.getTime();
          const daysUntilDue = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
          let notification: Notification | null = null;
          if (daysUntilDue < 0) {
            notification = {
              /* ... */
            };
          } else if (daysUntilDue <= 3) {
            notification = {
              /* ... */
            };
          }
          if (notification) generatedNotifications.push(notification);
        }
      });
    });
    setNotifications(generatedNotifications);
  }, [apiActas, user]);

  const handleNavigateAndOpen = (view: string, item: InitialItemToOpen) => {
    setInitialItemToOpen(item);
    setCurrentView(view);
  };

  const clearInitialItem = () => {
    setInitialItemToOpen(null);
  };

  const renderContent = () => {
    if (isLoading || !projectDetails) {
      return (
        <div className="text-center p-8">Cargando datos del proyecto...</div>
      );
    }

    if (currentView === "admin" && user?.appRole !== "admin") {
      console.warn("Acceso no autorizado a la vista de administrador.");
      setCurrentView("summary");
      return (
        <ProjectSummaryDashboard
          project={projectDetails}
          contractModifications={contractModifications}
        />
      );
    }

    switch (currentView) {
      case "summary":
        return (
          <ProjectSummaryDashboard
            project={projectDetails}
            contractModifications={contractModifications}
          />
        );
      case "pending_tasks":
        return (
          <PendingTasksDashboard api={api} onNavigate={handleNavigateAndOpen} />
        );
      case "logbook": // Ya está conectado
        return (
          <ProjectDashboard
            initialItemToOpen={initialItemToOpen}
            clearInitialItem={clearInitialItem}
          />
        );
      case "drawings": // Ya está conectado
        return <DrawingsDashboard project={MOCK_PROJECT} />;
      case "work_progress": // <-- ¡MODIFICADO AQUÍ! Ya no pasamos 'api'
        return <WorkProgressDashboard project={MOCK_PROJECT} />;
      case "photographic_progress": // Aún usa mock
        return (
          <PhotographicProgressDashboard project={MOCK_PROJECT} api={api} />
        );
      case "planning": // Aún usa mock
        return <PlanningDashboard project={MOCK_PROJECT} />; // <-- MODIFICA ESTA LÍNEA
      case "communications": // Ya está conectado
        return <CommunicationsDashboard project={MOCK_PROJECT} />;
      case "minutes": // Ya está conectado
        return (
          <MinutesDashboard
            initialItemToOpen={initialItemToOpen}
            clearInitialItem={clearInitialItem}
          />
        );
      case "costs": // Aún usa mock
        return <CostDashboard project={MOCK_PROJECT} api={api} />;
      case "weekly_reports":
        // Asigna el scope correcto aquí (Obra o Interventoría)
        // Usaremos projectDetails que viene del mockApi (eventualmente vendrá del backend)
        return (
          <WeeklyReportsDashboard
            project={projectDetails}
            reportScope={ReportScope.INTERVENTORIA}
          />
        ); // O ReportScope.OBRA
      case "monthly_reports_obra":
        return (
          <MonthlyReportsDashboard
            project={MOCK_PROJECT} // Puedes usar projectDetails si lo necesitas aquí
            reportScope={ReportScope.OBRA} // Pasamos el scope correcto
          />
        );

  case "monthly_reports_interventoria":
    return (
      <MonthlyReportsDashboard
        project={MOCK_PROJECT} // Puedes usar projectDetails si lo necesitas
        reportScope={ReportScope.INTERVENTORIA} // Pasamos el scope correcto
      />
    );
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
        <Header
          setIsSidebarOpen={setIsSidebarOpen}
          notifications={notifications}
          setNotifications={setNotifications}
          onNotificationClick={(notification: Notification) =>
            handleNavigateAndOpen(notification.relatedView, {
              type: notification.relatedItemType,
              id: notification.relatedItemId,
            })
          }
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className="container mx-auto px-6 py-8">{renderContent()}</div>
        </main>
      </div>
    </div>
  );
};

// --- AppContent y App se quedan igual ---
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
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
