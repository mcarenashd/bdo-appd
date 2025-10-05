import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Project, ProjectTask } from '../types';
import { useMockApi } from '../hooks/useMockApi';
import FileUpload from './FileUpload';
import GanttChart, { ProcessedProjectTask } from './GanttChart';
import Card from './ui/Card';
import Button from './ui/Button';
import { DocumentArrowDownIcon } from './icons/Icon';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


// Helper function to build the task tree from a flat list with outline levels
const buildTaskTree = (tasks: Omit<ProjectTask, 'children'>[]): ProjectTask[] => {
  const tasksWithChildren: ProjectTask[] = tasks.map(t => ({ ...t, children: [] }));
  const tree: ProjectTask[] = [];
  const parentStack: ProjectTask[] = [];

  tasksWithChildren.forEach(task => {
    while (parentStack.length > 0 && parentStack[parentStack.length - 1].outlineLevel >= task.outlineLevel) {
      parentStack.pop();
    }

    if (parentStack.length === 0) {
      tree.push(task);
    } else {
      parentStack[parentStack.length - 1].children.push(task);
    }
    
    parentStack.push(task);
  });

  return tree;
};

const KPICard: React.FC<{ title: string; value: string; progress?: number; variance?: number }> = ({ title, value, progress, variance }) => {
    let varianceColor = 'text-gray-900';
    if (variance !== undefined) {
        if (variance < -5) varianceColor = 'text-status-red';
        else if (variance < 0) varianceColor = 'text-status-yellow';
        else varianceColor = 'text-status-green';
    }


    return (
        <Card className="p-5">
            <h3 className="text-sm font-medium text-gray-500 truncate">{title}</h3>
            <p className={`mt-1 text-2xl lg:text-3xl font-bold ${variance !== undefined ? varianceColor : 'text-gray-900'}`}>{value}</p>
            {progress !== undefined && (
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-brand-primary h-2 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
            )}
        </Card>
    );
};


const PlanningDashboard: React.FC<{ project: Project; api: ReturnType<typeof useMockApi> }> = ({ project, api }) => {
  const { projectTasks: flatMockTasks, isLoading } = api;
  const [flatTasks, setFlatTasks] = useState<Omit<ProjectTask, 'children'>[]>([]);
  const [hierarchicalTasks, setHierarchicalTasks] = useState<ProjectTask[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const ganttChartRef = useRef<HTMLDivElement>(null);


  // Initial processing for mock data
  useEffect(() => {
    if (flatMockTasks.length > 0) {
      setFlatTasks(flatMockTasks);
    }
  }, [flatMockTasks]);
  
  useEffect(() => {
      setHierarchicalTasks(buildTaskTree(flatTasks));
  }, [flatTasks]);

  const handleUpdateGanttTasks = (taskId: string, newDates: { startDate: Date; endDate: Date }) => {
    setFlatTasks(prevTasks => {
        const taskIndex = prevTasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return prevTasks;
        
        const updatedTask = {
            ...prevTasks[taskIndex],
            startDate: newDates.startDate.toISOString(),
            endDate: newDates.endDate.toISOString(),
            duration: Math.ceil((newDates.endDate.getTime() - newDates.startDate.getTime()) / (1000 * 3600 * 24)) + 1
        };
        
        const newTasks = [...prevTasks];
        newTasks[taskIndex] = updatedTask;
        return newTasks;
    });
  };
  
  const processedHierarchicalTasks = useMemo((): ProcessedProjectTask[] => {
        const statusDate = new Date();
        statusDate.setHours(0,0,0,0);
        const statusTime = statusDate.getTime();

        const processTask = (task: ProjectTask): ProcessedProjectTask => {
            const startDate = new Date(task.startDate);
            const endDate = new Date(task.endDate);
            const startTime = startDate.getTime();
            const endTime = endDate.getTime();

            let plannedProgress = 0;
            if (task.duration > 0) {
                if (statusTime >= endTime) {
                    plannedProgress = 100;
                } else if (statusTime > startTime) {
                    const elapsedDuration = statusTime - startTime;
                    const totalDuration = endTime - startTime;
                    plannedProgress = Math.min(100, (elapsedDuration / totalDuration) * 100);
                }
            } else if (statusTime >= endTime) {
                plannedProgress = 100;
            }

            let processedChildren: ProcessedProjectTask[] = [];
            if (task.children && task.children.length > 0) {
                 processedChildren = task.children.map(processTask);
            }

            let actualProgress = task.progress;
            // For summary tasks, calculate weighted average progress
            if (task.isSummary && processedChildren.length > 0) {
                const totalDuration = processedChildren.reduce((sum, child) => sum + child.duration, 0);
                if (totalDuration > 0) {
                    const weightedProgress = processedChildren.reduce((sum, child) => sum + child.progress * child.duration, 0);
                    actualProgress = weightedProgress / totalDuration;

                    const weightedPlannedProgress = processedChildren.reduce((sum, child) => sum + child.plannedProgress * child.duration, 0);
                    plannedProgress = weightedPlannedProgress / totalDuration;
                } else {
                     actualProgress = processedChildren.length > 0 ? processedChildren.reduce((sum, child) => sum + child.progress, 0) / processedChildren.length : 0;
                     plannedProgress = processedChildren.length > 0 ? processedChildren.reduce((sum, child) => sum + child.plannedProgress, 0) / processedChildren.length : 0;
                }
            }


            const variance = actualProgress - plannedProgress;

            return {
                ...task,
                children: processedChildren,
                plannedProgress,
                variance,
                progress: actualProgress,
            };
        };

        return hierarchicalTasks.map(processTask);
    }, [hierarchicalTasks]);
    
    const projectSummary = useMemo(() => {
        if (processedHierarchicalTasks.length === 0) {
            return { planned: 0, executed: 0, variance: 0 };
        }
        
        const topLevelTasks = processedHierarchicalTasks;
        const totalDuration = topLevelTasks.reduce((sum, task) => sum + task.duration, 0);

        if (totalDuration === 0) {
            const planned = topLevelTasks.length > 0 ? topLevelTasks.reduce((sum, task) => sum + task.plannedProgress, 0) / topLevelTasks.length : 0;
            const executed = topLevelTasks.length > 0 ? topLevelTasks.reduce((sum, task) => sum + task.progress, 0) / topLevelTasks.length : 0;
            return { planned, executed, variance: executed - planned };
        }

        const weightedPlanned = topLevelTasks.reduce((sum, task) => sum + task.plannedProgress * task.duration, 0) / totalDuration;
        const weightedExecuted = topLevelTasks.reduce((sum, task) => sum + task.progress * task.duration, 0) / totalDuration;

        return {
            planned: weightedPlanned,
            executed: weightedExecuted,
            variance: weightedExecuted - weightedPlanned,
        };
    }, [processedHierarchicalTasks]);


  const handleFileUpload = (file: File) => {
    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const fileContent = event.target?.result as string;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(fileContent, "application/xml");

        const errorNode = xmlDoc.querySelector('parsererror');
        if (errorNode) {
          throw new Error("Error al analizar el archivo XML. Verifique que el formato sea correcto.");
        }

        const tasksNodeList = xmlDoc.querySelectorAll('Task');
        if (tasksNodeList.length === 0) {
            throw new Error("No se encontraron tareas (<Task>) en el archivo XML.");
        }
        
        const loadedFlatTasks: (Omit<ProjectTask, 'children'> | null)[] = Array.from(tasksNodeList).map((taskNode): Omit<ProjectTask, 'children'> | null => {
          const getTagContent = (tagName: string): string | undefined => taskNode.querySelector(tagName)?.textContent || undefined;
          
          const startDateStr = getTagContent('Start');
          const endDateStr = getTagContent('Finish');

          if (!startDateStr || !endDateStr) {
            return null;
          }
          
          const startDate = new Date(startDateStr);
          const endDate = new Date(endDateStr);
          const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;

          const dependenciesNodes = taskNode.querySelectorAll('PredecessorLink');
          const dependencies = Array.from(dependenciesNodes).map(depNode => depNode.querySelector('PredecessorUID')?.textContent || '').filter(Boolean);

          return {
            id: getTagContent('UID') || `task-${Math.random()}`,
            name: getTagContent('Name') || 'Tarea sin nombre',
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            progress: parseInt(getTagContent('PercentComplete') || '0', 10),
            duration: duration,
            isSummary: getTagContent('Summary') === '1',
            dependencies: dependencies,
            outlineLevel: parseInt(getTagContent('OutlineLevel') || '1', 10),
          };
        });
        
        const validTasks = loadedFlatTasks.filter((task): task is Omit<ProjectTask, 'children'> => task !== null);

        if (validTasks.length === 0) {
            throw new Error("El archivo XML no contiene tareas válidas con fechas de inicio y fin.");
        }
        
        setFlatTasks(validTasks);

      } catch (e: any) {
         console.error("Error al procesar el archivo XML:", e);
         setError(e.message || "No se pudo procesar el archivo XML. Verifique el formato y que contenga las etiquetas esperadas (Task, UID, Name, Start, Finish, etc.).");
         setFlatTasks(flatMockTasks); // Revert on error
      }
    };
    reader.onerror = () => {
        setError("Error al leer el archivo.");
        setFlatTasks(flatMockTasks); // Revert on error
    }
    reader.readAsText(file);
  };

  const handleDownloadPdf = async () => {
    if (!ganttChartRef.current) return;
    setIsGeneratingPdf(true);
    setError(null);

    const ganttElement = ganttChartRef.current;
    // The scrollable container is the parent of the ref'd element
    const scrollContainer = ganttElement.parentElement;

    if (!scrollContainer) {
        setError("No se encontró el contenedor del cronograma para exportar.");
        setIsGeneratingPdf(false);
        return;
    }

    // Store original styles to restore them later
    const originalStyles = scrollContainer.style.cssText;
    
    // Temporarily modify styles to make the entire content visible for capture
    scrollContainer.style.overflow = 'visible';
    scrollContainer.style.height = 'auto';
    scrollContainer.style.maxHeight = 'none';

    try {
        const canvas = await html2canvas(ganttElement, {
            scale: 2, // Use a higher scale for better resolution
            useCORS: true,
            allowTaint: true,
        });
        
        const imgData = canvas.toDataURL('image/png');
        
        // Use pixels as units for jsPDF for a 1:1 mapping with the canvas
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            // Create a custom page size based on the captured canvas dimensions, adding some padding
            format: [canvas.width + 40, canvas.height + 80],
        });
        
        // Add a title to the PDF
        pdf.setFontSize(24);
        pdf.text(`Cronograma de Obra: ${project.name}`, 20, 40);

        // Add the captured image to the PDF, positioned with margins
        pdf.addImage(imgData, 'PNG', 20, 60, canvas.width, canvas.height);
        
        const safeFileName = project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        pdf.save(`Cronograma_${safeFileName}.pdf`);

    } catch (error) {
        console.error("Error generating PDF:", error);
        setError("No se pudo generar el PDF. Por favor, inténtalo de nuevo.");
    } finally {
        // IMPORTANT: Always restore the original styles
        scrollContainer.style.cssText = originalStyles;
        setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Planificación y Cronograma</h2>
        <p className="text-sm text-gray-500">Proyecto: {project.name}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard title="Avance Programado a la Fecha" value={`${projectSummary.planned.toFixed(1)}%`} />
        <KPICard title="Avance Ejecutado a la Fecha" value={`${projectSummary.executed.toFixed(1)}%`} progress={projectSummary.executed} />
        <KPICard title="Estado (Variación)" value={`${projectSummary.variance > 0 ? '+' : ''}${projectSummary.variance.toFixed(1)}%`} variance={projectSummary.variance} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-800">Cargar Cronograma de Obra</h3>
              <p className="text-sm text-gray-500 mt-1">
                Sube tu cronograma directamente desde MS Project en formato <strong>XML (.xml)</strong>.
              </p>
              <FileUpload onFileUpload={handleFileUpload} />
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-800">Exportar Cronograma</h3>
              <p className="text-sm text-gray-500 mt-1">
                Descarga una vista completa y de alta calidad del cronograma actual en formato PDF para tus informes.
              </p>
              <div className="mt-4">
                  <Button 
                    onClick={handleDownloadPdf}
                    leftIcon={<DocumentArrowDownIcon />}
                    disabled={isGeneratingPdf || hierarchicalTasks.length === 0}
                    className="w-full"
                  >
                    {isGeneratingPdf ? 'Generando PDF...' : 'Descargar Cronograma en PDF'}
                  </Button>
              </div>
            </div>
          </Card>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
            <p className="text-sm text-red-700 font-semibold">Error</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
        </Card>
      )}
      
      {isLoading && hierarchicalTasks.length === 0 && (
        <Card>
          <div className="p-6 text-center text-gray-500">Cargando cronograma...</div>
        </Card>
      )}

      {processedHierarchicalTasks.length > 0 && !isLoading && (
        <GanttChart 
            tasks={processedHierarchicalTasks} 
            ref={ganttChartRef}
            onTasksUpdate={handleUpdateGanttTasks} 
        />
      )}
    </div>
  );
};

export default PlanningDashboard;