import React, { useState, useMemo, forwardRef } from 'react';
import { ProjectTask } from '../types';
import Card from './ui/Card';
import { ChevronDownIcon } from './icons/Icon';

// --- Type Extension ---
export interface ProcessedProjectTask extends ProjectTask {
    plannedProgress: number;
    variance: number;
    children: ProcessedProjectTask[];
}


const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });

// --- Configuration ---
const TASK_COL_WIDTH = 320;
const PROGRESS_COL_WIDTH = 90;
const DAY_COL_WIDTH = 30;
const ROW_HEIGHT = 32;

// --- Helper Components ---
const TaskCell: React.FC<{ task: ProcessedProjectTask; onToggle: () => void; isExpanded: boolean }> = ({ task, onToggle, isExpanded }) => (
  <div className="flex items-center h-full" style={{ paddingLeft: `${(task.outlineLevel - 1) * 1.5}rem` }}>
    {task.children.length > 0 ? (
      <button onClick={onToggle} className="mr-1 p-0.5 rounded hover:bg-gray-200">
        <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
      </button>
    ) : (
      <span className="w-5 mr-1"></span> // Placeholder for alignment
    )}
    <span className={`truncate ${task.isSummary ? 'font-bold' : ''}`}>{task.name}</span>
  </div>
);

const getBarColor = (variance: number): string => {
    if (variance < -10) return 'bg-status-red'; // Significantly behind
    if (variance < 0) return 'bg-status-yellow text-gray-800'; // Slightly behind
    return 'bg-brand-primary'; // On track or ahead
};


const GanttBar: React.FC<{ task: ProcessedProjectTask; dayOffset: number; onHover: (e: React.MouseEvent, task: ProcessedProjectTask) => void; onLeave: () => void; }> = ({ task, dayOffset, onHover, onLeave }) => (
    <div 
        className="h-full py-1"
        style={{
            gridColumn: `${dayOffset} / span ${task.duration}`,
            gridRow: 1,
        }}
        onMouseEnter={(e) => onHover(e, task)}
        onMouseLeave={onLeave}
    >
        <div className={`relative h-full rounded flex items-center ${task.isSummary ? 'bg-gray-700' : getBarColor(task.variance)} text-white text-xs overflow-hidden`}>
            <div 
                className={`h-full opacity-40 ${task.isSummary ? 'bg-gray-500' : 'bg-brand-accent'}`} 
                style={{ width: `${task.progress}%` }}
            ></div>
            <span className="absolute left-2 right-2 truncate" title={`${task.progress}%`}>{task.progress}%</span>
        </div>
    </div>
);

const Tooltip: React.FC<{ task: ProcessedProjectTask; position: { top: number; left: number } }> = ({ task, position }) => (
    <div 
        className="fixed z-30 p-3 bg-white rounded-lg shadow-xl border text-sm text-gray-800 max-w-xs"
        style={{ top: position.top, left: position.left, transform: 'translateY(10px)' }}
    >
        <p className="font-bold">{task.name}</p>
        <p><strong>Inicio:</strong> {formatDate(task.startDate)}</p>
        <p><strong>Fin:</strong> {formatDate(task.endDate)}</p>
        <p><strong>Duración:</strong> {task.duration} días</p>
        <p><strong>Avance Planificado:</strong> {task.plannedProgress.toFixed(1)}%</p>
        <p><strong>Avance Real:</strong> {task.progress.toFixed(1)}%</p>
        <p><strong>Variación:</strong> <span className={task.variance < 0 ? 'text-red-500' : 'text-green-600'}>{task.variance.toFixed(1)}%</span></p>
    </div>
);

// --- Main Component ---
const GanttChart = forwardRef<HTMLDivElement, { tasks: ProcessedProjectTask[] }>(({ tasks }, ref) => {
    const [expandedTasks, setExpandedTasks] = useState<Set<string>>(() => {
        const initialExpanded = new Set<string>();
        const expandAll = (taskList: ProcessedProjectTask[]) => {
            taskList.forEach(t => {
                if (t.isSummary && t.children.length > 0) {
                    initialExpanded.add(t.id);
                    expandAll(t.children);
                }
            });
        };
        expandAll(tasks);
        return initialExpanded;
    });

    const [hoveredTask, setHoveredTask] = useState<{ task: ProcessedProjectTask; position: { top: number; left: number } } | null>(null);

    const toggleExpand = (taskId: string) => {
        setExpandedTasks(prev => {
            const newSet = new Set(prev);
            if (newSet.has(taskId)) newSet.delete(taskId);
            else newSet.add(taskId);
            return newSet;
        });
    };

    const visibleTasks = useMemo(() => {
        const result: ProcessedProjectTask[] = [];
        const addTasks = (taskList: ProcessedProjectTask[]) => {
            taskList.forEach(task => {
                result.push(task);
                if (expandedTasks.has(task.id)) {
                    addTasks(task.children);
                }
            });
        };
        addTasks(tasks);
        return result;
    }, [tasks, expandedTasks]);

    const { minDate, totalDays } = useMemo(() => {
        if (!tasks || tasks.length === 0) return { minDate: new Date(), totalDays: 30 };

        let allDates: Date[] = [];
        const collectDates = (taskList: ProjectTask[]) => {
            taskList.forEach(t => {
                allDates.push(new Date(t.startDate));
                allDates.push(new Date(t.endDate));
                collectDates(t.children);
            });
        };
        collectDates(tasks);

        if (allDates.length === 0) return { minDate: new Date(), totalDays: 30 };

        let min = new Date(Math.min(...allDates.map(d => d.getTime())));
        let max = new Date(Math.max(...allDates.map(d => d.getTime())));

        min.setDate(min.getDate() - 7); // Add padding
        max.setDate(max.getDate() + 14); // Add padding

        const duration = (max.getTime() - min.getTime()) / (1000 * 3600 * 24);
        
        return { minDate: min, totalDays: Math.ceil(duration) };
    }, [tasks]);
    
    const todayOffset = useMemo(() => {
        const today = new Date();
        today.setHours(0,0,0,0);
        return Math.floor((today.getTime() - minDate.getTime()) / (1000 * 3600 * 24)) + 1;
    }, [minDate]);


    const getDayOffset = (dateStr: string) => Math.floor((new Date(dateStr).getTime() - minDate.getTime()) / (1000 * 3600 * 24)) + 1;

    const handleMouseEnter = (e: React.MouseEvent, task: ProcessedProjectTask) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setHoveredTask({ task, position: { top: rect.bottom, left: rect.left } });
    };

    const handleMouseLeave = () => setHoveredTask(null);
    
    const gridTemplateColumns = `${TASK_COL_WIDTH}px repeat(3, ${PROGRESS_COL_WIDTH}px) repeat(${totalDays}, ${DAY_COL_WIDTH}px)`;

    return (
        <Card>
            <div className="p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800">Cronograma de Obra (Gantt)</h3>
            </div>
            <div className="overflow-auto" style={{ maxHeight: '70vh' }}>
                <div ref={ref} style={{ display: 'grid', gridTemplateColumns, minWidth: `${TASK_COL_WIDTH + (PROGRESS_COL_WIDTH * 3) + (totalDays * DAY_COL_WIDTH)}px`, background: 'white' }}>
                    {/* --- HEADERS --- */}
                    <div className="font-semibold text-sm p-2 bg-gray-100 border-b-2 border-r border-gray-300 sticky top-0 z-20" style={{ left: 0 }}>Nombre Tarea</div>
                    <div className="font-semibold text-sm p-2 bg-gray-100 border-b-2 border-r border-gray-300 sticky top-0 z-20" style={{ left: `${TASK_COL_WIDTH}px` }}>Avance Plan. (%)</div>
                    <div className="font-semibold text-sm p-2 bg-gray-100 border-b-2 border-r border-gray-300 sticky top-0 z-20" style={{ left: `${TASK_COL_WIDTH + PROGRESS_COL_WIDTH}px` }}>Avance Real (%)</div>
                    <div className="font-semibold text-sm p-2 bg-gray-100 border-b-2 border-r border-gray-300 sticky top-0 z-20" style={{ left: `${TASK_COL_WIDTH + PROGRESS_COL_WIDTH * 2}px` }}>Variación (%)</div>
                    
                    {/* Day Markers */}
                    {Array.from({ length: totalDays }).map((_, i) => {
                        const date = new Date(minDate);
                        date.setDate(date.getDate() + i);
                        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                        return (
                            <div key={i} className={`text-center text-xs p-1 bg-gray-100 border-b-2 border-r border-gray-300 sticky top-0 z-10 ${isWeekend ? 'font-semibold text-gray-400' : 'text-gray-600'}`}>{date.getDate()}</div>
                        );
                    })}
                    
                    {/* --- BODY --- */}
                    {visibleTasks.map((task, index) => {
                        const row = index + 2;
                        return (
                           <React.Fragment key={task.id}>
                                {/* Sticky Cells */}
                                <div className="text-sm p-1 bg-white border-b border-r border-gray-200 sticky z-10" style={{ left: 0, gridRow: row }}><TaskCell task={task} onToggle={() => toggleExpand(task.id)} isExpanded={expandedTasks.has(task.id)} /></div>
                                <div className="text-sm p-1 bg-white border-b border-r border-gray-200 sticky z-10 flex items-center justify-center" style={{ left: `${TASK_COL_WIDTH}px`, gridRow: row }}>{task.plannedProgress.toFixed(1)}%</div>
                                <div className="text-sm p-1 bg-white border-b border-r border-gray-200 sticky z-10 flex items-center justify-center font-bold" style={{ left: `${TASK_COL_WIDTH + PROGRESS_COL_WIDTH}px`, gridRow: row }}>{task.progress.toFixed(1)}%</div>
                                <div className={`text-sm p-1 bg-white border-b border-r border-gray-200 sticky z-10 flex items-center justify-center font-bold ${task.variance < 0 ? 'text-red-500' : 'text-green-600'}`} style={{ left: `${TASK_COL_WIDTH + PROGRESS_COL_WIDTH * 2}px`, gridRow: row }}>{task.variance.toFixed(1)}%</div>
                                
                                {/* Timeline Area for the row */}
                                <div style={{ gridColumn: `5 / span ${totalDays}`, gridRow: row, display: 'grid', gridTemplateColumns: `repeat(${totalDays}, ${DAY_COL_WIDTH}px)` }}>
                                    {/* Background cells for weekend shading and grid lines */}
                                    {Array.from({ length: totalDays }).map((_, i) => {
                                        const date = new Date(minDate);
                                        date.setDate(date.getDate() + i);
                                        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                        return <div key={`bg-${i}`} className={`h-full ${isWeekend ? 'bg-gray-100/70' : ''} border-r border-b border-gray-200`}></div>;
                                    })}
                                    {/* Gantt Bar */}
                                    <GanttBar task={task} dayOffset={getDayOffset(task.startDate)} onHover={handleMouseEnter} onLeave={handleMouseLeave}/>
                                </div>
                           </React.Fragment>
                        );
                    })}

                    {/* Today Marker */}
                    {todayOffset > 0 && todayOffset <= totalDays && (
                        <div 
                            className="absolute top-0 h-full border-r-2 border-red-500 border-dashed z-20 pointer-events-none"
                            style={{ 
                                left: `${TASK_COL_WIDTH + (PROGRESS_COL_WIDTH * 3) + (todayOffset * DAY_COL_WIDTH)}px`,
                                top: '40px', // Below the day headers
                                height: `${(visibleTasks.length * ROW_HEIGHT) + 24}px`
                             }}
                             title={`Hoy: ${new Date().toLocaleDateString('es-CO')}`}
                        ></div>
                    )}
                </div>
            </div>
            {hoveredTask && <Tooltip task={hoveredTask.task} position={hoveredTask.position} />}
        </Card>
    );
});

export default GanttChart;