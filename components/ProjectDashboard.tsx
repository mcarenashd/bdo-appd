import React, { useState, useMemo, useEffect } from "react";
import { Project, LogEntry, User } from "../types";
import FilterBar from "./FilterBar";
import EntryCard from "./EntryCard";
import EntryDetailModal from "./EntryDetailModal";
import EntryFormModal from "./EntryFormModal";
import Button from "./ui/Button";
import EmptyState from "./ui/EmptyState";
import {
  PlusIcon,
  Squares2X2Icon,
  DocumentArrowDownIcon,
  ListBulletIcon,
  CalendarIcon,
} from "./icons/Icon";
import ExportModal from "./ExportModal";
import { MOCK_USERS, MOCK_PROJECT } from "../src/services/mockData";
import CalendarView from "./CalendarView";
import { useAuth } from "../contexts/AuthContext";

interface ProjectDashboardProps {
  initialItemToOpen: { type: string; id: string } | null;
  clearInitialItem: () => void;
}

const ProjectDashboard: React.FC<ProjectDashboardProps> = ({
  initialItemToOpen,
  clearInitialItem,
}) => {
  const { user } = useAuth();
  const project = MOCK_PROJECT;

  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedEntry, setSelectedEntry] = useState<LogEntry | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [newEntryDefaultDate, setNewEntryDefaultDate] = useState<string | null>(
    null
  );
  const [filters, setFilters] = useState({
    searchTerm: "",
    status: "all",
    type: "all",
    user: "all",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    const fetchLogEntries = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch("http://localhost:4000/api/log-entries");
        if (!response.ok) {
          throw new Error("La respuesta del servidor no fue exitosa.");
        }
        const data = await response.json();
        setLogEntries(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Ocurrió un error desconocido.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogEntries();
  }, []);

  const handleOpenDetail = (entry: LogEntry) => {
    setSelectedEntry(entry);
    setIsDetailModalOpen(true);
  };

  useEffect(() => {
    if (initialItemToOpen && initialItemToOpen.type === "logEntry") {
      const entryToOpen = logEntries.find((e) => e.id === initialItemToOpen.id);
      if (entryToOpen) {
        handleOpenDetail(entryToOpen);
      }
      clearInitialItem();
    }
  }, [initialItemToOpen, logEntries, clearInitialItem]);

  const filteredEntries = useMemo(() => {
    return logEntries.filter((entry) => {
      const searchTermMatch =
        entry.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        entry.description
          .toLowerCase()
          .includes(filters.searchTerm.toLowerCase()) ||
        String(entry.folioNumber).includes(filters.searchTerm);
      const statusMatch =
        filters.status === "all" || entry.status === filters.status;
      const typeMatch = filters.type === "all" || entry.type === filters.type;
      const userMatch =
        filters.user === "all" ||
        (entry.author && entry.author.id === filters.user);

      const createdAtDateOnly = entry.createdAt.substring(0, 10);
      const startDateMatch =
        !filters.startDate || createdAtDateOnly >= filters.startDate;
      const endDateMatch =
        !filters.endDate || createdAtDateOnly <= filters.endDate;

      return (
        searchTermMatch &&
        statusMatch &&
        typeMatch &&
        userMatch &&
        startDateMatch &&
        endDateMatch
      );
    });
  }, [logEntries, filters]);

  const handleCloseDetail = () => {
    setIsDetailModalOpen(false);
    setSelectedEntry(null);
  };

  const handleOpenForm = () => {
    setIsFormModalOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormModalOpen(false);
    setNewEntryDefaultDate(null);
  };

  const handleDateClickOnCalendar = (dateStr: string) => {
    setNewEntryDefaultDate(dateStr);
    setIsFormModalOpen(true);
  };

  const handleSaveEntry = async (
    newEntryData: Omit<
      LogEntry,
      | "id"
      | "folioNumber"
      | "createdAt"
      | "author"
      | "comments"
      | "history"
      | "updatedAt"
      | "attachments"
    >,
    files: File[]
  ) => {
    if (!user) {
      setError("No estás autenticado.");
      return;
    }

    const dataToSend = {
      ...newEntryData,
      authorId: user.id,
      projectId: project.id,
    };

    try {
      const response = await fetch("http://localhost:4000/api/log-entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        throw new Error("Falló la creación de la anotación.");
      }

      const createdEntry = await response.json();
      setLogEntries((prevEntries) => [createdEntry, ...prevEntries]);
      handleCloseForm();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocurrió un error al guardar la anotación.");
      }
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    try {
      const response = await fetch(
        `http://localhost:4000/api/log-entries/${entryId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Falló la eliminación de la anotación.");
      }

      setLogEntries((prevEntries) =>
        prevEntries.filter((entry) => entry.id !== entryId)
      );
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocurrió un error al eliminar la anotación.");
      }
    }
  };

  const handleAddComment = async (
    entryId: string,
    commentText: string,
    files: File[]
  ) => {
    if (!user) {
      setError("No estás autenticado para comentar.");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:4000/api/log-entries/${entryId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: commentText,
            authorId: user.id,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Falló la creación del comentario.");
      }

      const newComment = await response.json();

      setLogEntries((prevEntries) =>
        prevEntries.map((entry) => {
          if (entry.id === entryId) {
            return {
              ...entry,
              comments: [...(entry.comments || []), newComment],
            };
          }
          return entry;
        })
      );

      setSelectedEntry((prevSelected) => {
        if (prevSelected && prevSelected.id === entryId) {
          return {
            ...prevSelected,
            comments: [...(prevSelected.comments || []), newComment],
          };
        }
        return prevSelected;
      });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocurrió un error al añadir el comentario.");
      }
    }
  };

  const handleUpdateEntry = async (updatedEntryData: LogEntry) => {
    try {
      const response = await fetch(
        `http://localhost:4000/api/log-entries/${updatedEntryData.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedEntryData),
        }
      );

      if (!response.ok) {
        throw new Error("Falló la actualización de la anotación.");
      }

      const updatedEntryFromServer = await response.json();

      setLogEntries((prevEntries) =>
        prevEntries.map((entry) =>
          entry.id === updatedEntryFromServer.id
            ? updatedEntryFromServer
            : entry
        )
      );
      setSelectedEntry(updatedEntryFromServer);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocurrió un error al actualizar la anotación.");
      }
    }
  };

  const addSignature = async (
    documentId: string,
    documentType: "logEntry",
    signer: User,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(
        `http://localhost:4000/api/log-entries/${documentId}/signatures`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ signerId: signer.id, password }),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Falló el proceso de firma.");
      }

      // La respuesta del backend es la anotación actualizada, la usamos para refrescar el estado
      const updatedEntryFromServer = responseData;

      setLogEntries((prev) =>
        prev.map((entry) =>
          entry.id === updatedEntryFromServer.id
            ? updatedEntryFromServer
            : entry
        )
      );
      setSelectedEntry(updatedEntryFromServer);

      return { success: true };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Ocurrió un error inesperado.";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };
  const handleExportEntries = () => {
    const header = `Extracto de Bitácora Digital de Obra\nProyecto: ${
      project.name
    }\nContrato: ${
      project.contractId
    }\nFecha de Exportación: ${new Date().toLocaleString(
      "es-CO"
    )}\n\nFiltros Aplicados:\n- Término de Búsqueda: ${
      filters.searchTerm || "Ninguno"
    }\n- Estado: ${filters.status}\n- Tipo: ${filters.type}\n- Usuario: ${
      filters.user === "all"
        ? "Todos"
        : MOCK_USERS.find((u) => u.id === filters.user)?.fullName || "N/A"
    }\n- Fecha Desde: ${filters.startDate || "N/A"}\n- Fecha Hasta: ${
      filters.endDate || "N/A"
    }\n\nTotal de Anotaciones: ${
      filteredEntries.length
    }\n\n========================================\n\n`;

    const content = filteredEntries
      .map((entry) => {
        const comments = (entry.comments || [])
          .map(
            (c) =>
              `\t- [${new Date(c.timestamp).toLocaleString("es-CO")}] ${
                c.author.fullName
              }: ${c.content}`
          )
          .join("\n");
        const attachments = (entry.attachments || [])
          .map((a) => `\t- ${a.fileName} (${(a.size / 1024).toFixed(2)} KB)`)
          .join("\n");

        return `
    Folio: #${entry.folioNumber}
    Título: ${entry.title}
    Estado: ${entry.status}
    Tipo: ${entry.type}
    Autor: ${entry.author.fullName}
    Fecha de Creación: ${new Date(entry.createdAt).toLocaleString("es-CO")}
    Fecha de Actividad: ${new Date(entry.activityStartDate).toLocaleDateString(
      "es-CO"
    )} a ${new Date(entry.activityEndDate).toLocaleDateString("es-CO")}
    Asunto: ${entry.subject}
    Localización: ${entry.location}
    Confidencial: ${entry.isConfidential ? "Sí" : "No"}
    
    Descripción:
    ${entry.description}
    
    Comentarios (${(entry.comments || []).length}):
    ${comments || "\t(Sin comentarios)"}
    
    Adjuntos (${(entry.attachments || []).length}):
    ${attachments || "\t(Sin adjuntos)"}
    
    ----------------------------------------
            `;
      })
      .join("");

    const fullContent = header + content;

    const blob = new Blob([fullContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    link.download = `Bitacora_Export_${dateStr}.txt`;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsExportModalOpen(false);
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{project.name}</h2>
          <p className="text-sm text-gray-500">
            Contrato: {project.contractId}
          </p>
        </div>
        <div className="flex items-center flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="flex items-center bg-gray-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode("list")}
              title="Vista de Lista"
              className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors flex items-center gap-2 ${
                viewMode === "list"
                  ? "bg-white text-brand-primary shadow"
                  : "text-gray-600 hover:bg-gray-300/50"
              }`}
            >
              <ListBulletIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Lista</span>
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              title="Vista de Calendario"
              className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors flex items-center gap-2 ${
                viewMode === "calendar"
                  ? "bg-white text-brand-primary shadow"
                  : "text-gray-600 hover:bg-gray-300/50"
              }`}
            >
              <CalendarIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Calendario</span>
            </button>
          </div>
          <Button
            onClick={() => setIsExportModalOpen(true)}
            leftIcon={<DocumentArrowDownIcon />}
            variant="secondary"
            className="w-full sm:w-auto"
          >
            Exportar
          </Button>
          <Button
            onClick={handleOpenForm}
            leftIcon={<PlusIcon />}
            className="w-full sm:w-auto"
          >
            Nueva Anotación
          </Button>
        </div>
      </div>

      <FilterBar filters={filters} setFilters={setFilters} />

      {isLoading && (
        <div className="text-center p-8">Cargando anotaciones...</div>
      )}
      {error && <div className="text-center p-8 text-red-500">{error}</div>}

      {!isLoading && !error && (
        <>
          {viewMode === "list" && (
            <div className="space-y-4">
              {filteredEntries.length > 0 ? (
                filteredEntries.map((entry) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    onSelect={handleOpenDetail}
                  />
                ))
              ) : (
                <EmptyState
                  icon={<Squares2X2Icon />}
                  title="Aún no hay anotaciones"
                  message="Crea la primera anotación para iniciar el registro en la bitácora de obra. Puedes adjuntar archivos, fotos y más."
                  actionButton={
                    <Button onClick={handleOpenForm} leftIcon={<PlusIcon />}>
                      Crear Primera Anotación
                    </Button>
                  }
                />
              )}
            </div>
          )}
          {viewMode === "calendar" && (
            <CalendarView
              entries={filteredEntries}
              onEventClick={handleOpenDetail}
              onDateClick={handleDateClickOnCalendar}
            />
          )}
        </>
      )}

      {selectedEntry && (
        <EntryDetailModal
          isOpen={isDetailModalOpen}
          onClose={handleCloseDetail}
          entry={selectedEntry}
          onUpdate={handleUpdateEntry}
          onAddComment={handleAddComment}
          onSign={(docId, docType, signer, pass) =>
            addSignature(docId, docType, signer, pass)
          }
          onDelete={handleDeleteEntry}
          currentUser={user}
          allUsers={MOCK_USERS}
        />
      )}
      <EntryFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseForm}
        onSave={handleSaveEntry}
        initialDate={newEntryDefaultDate}
        allUsers={MOCK_USERS}
      />
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExportEntries}
        entryCount={filteredEntries.length}
        filters={filters}
      />
    </div>
  );
};

export default ProjectDashboard;
