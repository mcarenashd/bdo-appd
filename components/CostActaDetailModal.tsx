
import React, { useState, useEffect } from 'react';
import { CostActa, CostActaStatus, Observation } from '../types';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Select from './ui/Select';
import CostActaStatusBadge from './CostActaStatusBadge';
import PaymentComplianceAlert from './PaymentComplianceAlert';
import AttachmentItem from './AttachmentItem';
import { MOCK_USER } from '../services/mockData';

interface CostActaDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  acta: CostActa;
  onUpdate: (updatedActa: CostActa) => void;
}

const DetailRow: React.FC<{ label: string; value: React.ReactNode; className?: string }> = ({ label, value, className }) => (
    <div className={className}>
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900">{value}</dd>
    </div>
);

const CostActaDetailModal: React.FC<CostActaDetailModalProps> = ({ isOpen, onClose, acta, onUpdate }) => {
    const [editedActa, setEditedActa] = useState<CostActa>(acta);

    useEffect(() => {
        setEditedActa(acta);
    }, [acta, isOpen]);

    const handleStatusChange = (newStatus: CostActaStatus) => {
        setEditedActa(prev => ({...prev, status: newStatus}));
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditedActa(prev => ({...prev, [name]: value}));
    }


    const handleSaveChanges = () => {
        onUpdate(editedActa);
        onClose();
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
    };

    return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Detalle Acta de Cobro - ${acta.number}`} size="2xl">
        <div className="space-y-6">
            <div className="pb-4 border-b">
                <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-gray-900">{acta.number}</h3>
                    <CostActaStatusBadge status={editedActa.status} />
                </div>
                <p className="text-sm text-gray-500 mt-1">Periodo: {acta.period}</p>
            </div>
            
            <PaymentComplianceAlert acta={acta} />

            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-6">
                <DetailRow label="Fecha de Radicación" value={new Date(acta.submissionDate).toLocaleDateString('es-CO')} />
                <DetailRow label="Fecha de Aprobación" value={acta.approvalDate ? new Date(acta.approvalDate).toLocaleDateString('es-CO') : 'N/A'} />
                <DetailRow label="Fecha Límite de Pago" value={acta.paymentDueDate ? new Date(acta.paymentDueDate).toLocaleDateString('es-CO') : 'N/A'} />
                <DetailRow label="Valor Facturado" value={<span className="font-semibold">{formatCurrency(acta.billedAmount)}</span>} />
                <DetailRow label="% del Contrato" value={`${((acta.billedAmount / acta.totalContractValue) * 100).toFixed(2)}%`} />
            </dl>
            
            <div>
                <label htmlFor="relatedProgress" className="block text-md font-semibold text-gray-800">Relación con Avance Físico</label>
                <textarea
                    id="relatedProgress"
                    name="relatedProgress"
                    rows={3}
                    className="mt-2 block w-full text-sm text-gray-700 whitespace-pre-wrap border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary p-2"
                    value={editedActa.relatedProgress || ''}
                    onChange={handleInputChange}
                />
            </div>

             {acta.attachments && acta.attachments.length > 0 && (
                <div>
                    <h4 className="text-md font-semibold text-gray-800">Archivos Adjuntos</h4>
                    <ul className="mt-2 space-y-2">
                        {acta.attachments.map(att => <AttachmentItem key={att.id} attachment={att} />)}
                    </ul>
                </div>
            )}

            {acta.observations.length > 0 && (
                <div>
                    <h4 className="text-md font-semibold text-gray-800">Observaciones</h4>
                    <div className="mt-2 space-y-4">
                        {acta.observations.map(obs => (
                            <div key={obs.id} className="flex items-start space-x-3 bg-yellow-50 p-3 rounded-md border border-yellow-200">
                                {/* Fix: Replaced `obs.author.name` with `obs.author.fullName`. */}
                                <img src={obs.author.avatarUrl} alt={obs.author.fullName} className="h-8 w-8 rounded-full object-cover"/>
                                <div className="flex-1">
                                    <div className="text-sm">
                                        {/* Fix: Replaced `obs.author.name` with `obs.author.fullName`. */}
                                        <span className="font-semibold text-gray-900">{obs.author.fullName}</span>
                                        <span className="text-gray-500 ml-2 text-xs">{new Date(obs.timestamp).toLocaleString('es-CO')}</span>
                                    </div>
                                    <p className="text-sm text-gray-700">{obs.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

             <div>
                <h4 className="text-md font-semibold text-gray-800 mb-2">Actualizar Estado</h4>
                 <Select 
                    id="status" 
                    value={editedActa.status} 
                    onChange={(e) => handleStatusChange(e.target.value as CostActaStatus)}
                 >
                    {Object.values(CostActaStatus).map(s => <option key={s} value={s}>{s}</option>)}
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

export default CostActaDetailModal;
