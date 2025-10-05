import React, { useMemo } from 'react';
import { ProjectDetails, ContractModification, ModificationType } from '../types';
import Card from './ui/Card';
import TimelineVisual from './TimelineVisual';

interface ProjectSummaryDashboardProps {
  project: ProjectDetails;
  contractModifications: ContractModification[];
}

const KPICard: React.FC<{ title: string; value: string | number; subValue?: string; className?: string }> = ({ title, value, subValue, className }) => (
    <Card className={`p-5 ${className}`}>
        <h3 className="text-sm font-medium text-gray-500 truncate">{title}</h3>
        <p className="mt-1 text-2xl lg:text-3xl font-bold text-gray-900 break-words">{value}</p>
        {subValue && <p className="text-sm text-gray-500 mt-1">{subValue}</p>}
    </Card>
);

const ProjectSummaryDashboard: React.FC<ProjectSummaryDashboardProps> = ({ project, contractModifications }) => {

  const {
    totalAdditionsValue,
    totalContractValue,
    initialDurationDays,
    totalExtensionDays,
    totalDurationDays,
    currentEndDate
  } = useMemo(() => {
    const totalAdditions = contractModifications
      .filter(mod => mod.type === ModificationType.ADDITION)
      .reduce((sum, mod) => sum + (mod.value || 0), 0);
    
    const totalExtensions = contractModifications
      .filter(mod => mod.type === ModificationType.TIME_EXTENSION)
      .reduce((sum, mod) => sum + (mod.days || 0), 0);

    const startDate = new Date(project.startDate);
    const initialEndDate = new Date(project.initialEndDate);

    const initialDuration = Math.ceil((initialEndDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const finalEndDate = new Date(initialEndDate);
    finalEndDate.setDate(finalEndDate.getDate() + totalExtensions);
    
    return {
      totalAdditionsValue: totalAdditions,
      totalContractValue: project.initialValue + totalAdditions,
      initialDurationDays: initialDuration,
      totalExtensionDays: totalExtensions,
      totalDurationDays: initialDuration + totalExtensions,
      currentEndDate: finalEndDate.toISOString()
    };
  }, [project, contractModifications]);

  const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">{project.name}</h2>
        <p className="text-md text-gray-500 mt-1">Contrato: {project.contractId}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Valor Inicial" value={formatCurrency(project.initialValue)} />
        <KPICard title="Valor Adiciones" value={formatCurrency(totalAdditionsValue)} />
        <KPICard title="Valor Total Contrato" value={formatCurrency(totalContractValue)} className="lg:col-span-2 bg-idu-blue/5 border-idu-blue/50" />
        
        <KPICard title="Plazo Inicial" value={`${initialDurationDays}`} subValue="días" />
        <KPICard title="Prórrogas" value={`${totalExtensionDays}`} subValue="días" />
        <KPICard title="Plazo Total Vigente" value={`${totalDurationDays}`} subValue="días" className="lg:col-span-2 bg-idu-cyan/5 border-idu-cyan/50" />
      </div>

      <Card>
        <div className="p-5">
            <h3 className="text-lg font-semibold text-gray-800">Línea de Tiempo del Contrato</h3>
            <div className="mt-4">
                <TimelineVisual 
                    startDate={project.startDate}
                    originalEndDate={project.initialEndDate}
                    currentEndDate={currentEndDate}
                />
            </div>
        </div>
      </Card>

      <Card>
        <div className="p-5">
          <h3 className="text-lg font-semibold text-gray-800">Objeto del Contrato</h3>
          <p className="mt-2 text-gray-700 leading-relaxed">{project.object}</p>
        </div>
        <div className="border-t bg-gray-50/70 p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <h4 className="font-semibold text-gray-800">Contratista</h4>
                <p className="text-gray-600">{project.contractorName}</p>
            </div>
            <div>
                <h4 className="font-semibold text-gray-800">Interventoría</h4>
                <p className="text-gray-600">{project.supervisorName}</p>
            </div>
        </div>
      </Card>

      <Card>
         <div className="p-5 border-b">
            <h3 className="text-lg font-semibold text-gray-800">Personal Clave</h3>
         </div>
         <div className="divide-y divide-gray-100">
            {project.keyPersonnel.map(person => (
                <div key={person.id} className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center hover:bg-gray-50">
                    <div className="md:col-span-4">
                        <p className="font-semibold text-gray-900">{person.name}</p>
                        <p className="text-sm text-gray-500">{person.role}</p>
                    </div>
                    <div className="md:col-span-2">
                         <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${person.company === 'Contratista' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                            {person.company}
                        </span>
                    </div>
                    <div className="md:col-span-3 text-sm text-gray-700">
                        <a href={`mailto:${person.email}`} className="hover:text-brand-primary">{person.email}</a>
                    </div>
                     <div className="md:col-span-3 text-sm text-gray-700">
                        <a href={`tel:${person.phone}`} className="hover:text-brand-primary">{person.phone}</a>
                    </div>
                </div>
            ))}
         </div>
      </Card>

    </div>
  );
};

export default ProjectSummaryDashboard;