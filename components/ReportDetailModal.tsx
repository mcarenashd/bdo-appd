import React, { useState, useEffect } from 'react';
import { Report, ReportStatus } from '../types';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Select from './ui/Select';
import ReportStatusBadge from './ReportStatusBadge';
import AttachmentItem from './AttachmentItem';

interface ReportDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: Report;
  onUpdate: (updatedReport: Report) => void;
}

const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div>
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900">{value}</dd>
    </div>
);

const ReportDetailModal: React.FC<ReportDetailModalProps> = ({ isOpen, onClose, report, onUpdate }) => {
    const [editedReport, setEditedReport] = useState<Report>(report);

    useEffect(() => {
        setEditedReport(report);
    }, [report, isOpen]);

    const handleStatusChange = (newStatus: ReportStatus) => {
        setEditedReport(prev => ({...prev, status: newStatus}));
    }

    const handleSaveChanges = () => {
        onUpdate(editedReport);
        onClose();
    };

    return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Detalle de Informe - ${report.number}`} size="2xl">
        <div className="space-y-6">
            <div className="pb-4 border-b">
                <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-gray-900">{report.number}</h3>
                    <ReportStatusBadge status={editedReport.status} />
                </div>
                <p className="text-sm text-gray-500 mt-1">Periodo: {report.period}</p>
            </div>
            
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                <DetailRow label="Fecha de Presentación" value={new Date(report.submissionDate).toLocaleDateString('es-CO', {dateStyle: 'long'})} />
                <DetailRow label="Autor del Informe" value={report.author.name} />
            </dl>
            
            <div>
                <h4 className="text-md font-semibold text-gray-800">Resumen Ejecutivo</h4>
                <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{report.summary || 'No hay resumen disponible.'}</p>
            </div>

            {report.attachments && report.attachments.length > 0 && (
                <div>
                    <h4 className="text-md font-semibold text-gray-800">Archivos Adjuntos</h4>
                    <ul className="mt-2 space-y-2">
                        {report.attachments.map(att => <AttachmentItem key={att.id} attachment={att} />)}
                    </ul>
                </div>
            )}

             <div>
                <h4 className="text-md font-semibold text-gray-800 mb-2">Actualizar Estado del Informe</h4>
                 <Select 
                    id="status" 
                    value={editedReport.status} 
                    onChange={(e) => handleStatusChange(e.target.value as ReportStatus)}
                 >
                    {Object.values(ReportStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
            </div>

        </div>
        <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-2">
             <Button variant="secondary" onClick={onClose}>Cancelar</Button>
             <Button variant="primary" onClick={handleSaveChanges}>Guardar Cambios</Button>
        </div>
    </Modal>
  );
};

export default ReportDetailModal;
