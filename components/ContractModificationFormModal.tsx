import React, { useState } from 'react';
import { ContractModification, ModificationType, Attachment } from '../types';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import { XMarkIcon } from './icons/Icon';

interface ContractModificationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<ContractModification, 'id'>) => void;
}

const ContractModificationFormModal: React.FC<ContractModificationFormModalProps> = ({ isOpen, onClose, onSave }) => {
  const [number, setNumber] = useState('');
  const [type, setType] = useState<ModificationType>(ModificationType.ADDITION);
  const [date, setDate] = useState('');
  const [value, setValue] = useState('');
  const [days, setDays] = useState('');
  const [justification, setJustification] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const resetForm = () => {
    setNumber('');
    setType(ModificationType.ADDITION);
    setDate('');
    setValue('');
    setDays('');
    setJustification('');
    setFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!number || !date || !justification) {
      alert("Número, fecha y justificación son obligatorios.");
      return;
    }
    if (type === ModificationType.ADDITION && (!value || parseFloat(value) <= 0)) {
        alert("Para una adición, el valor debe ser un número positivo.");
        return;
    }
     if (type === ModificationType.TIME_EXTENSION && (!days || parseInt(days) <= 0)) {
        alert("Para una prórroga, los días deben ser un número positivo.");
        return;
    }

    let attachment: Attachment | undefined = undefined;
    if (file) {
        attachment = {
            id: `att-mod-${Date.now()}`,
            fileName: file.name,
            size: file.size,
            type: file.type,
            url: '#', // Placeholder
        };
    }

    onSave({
      number,
      type,
      date: new Date(date).toISOString(),
      value: type === ModificationType.ADDITION ? parseFloat(value) : undefined,
      days: type === ModificationType.TIME_EXTENSION ? parseInt(days, 10) : undefined,
      justification,
      attachment,
    });
    
    resetForm();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar Modificación al Contrato" size="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Número Modificatorio" id="number" value={number} onChange={(e) => setNumber(e.target.value)} required placeholder="Ej: Otrosí No. 2" />
          <Input label="Fecha del Documento" id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Tipo de Modificación" id="type" value={type} onChange={(e) => setType(e.target.value as ModificationType)}>
            {Object.values(ModificationType).map(t => <option key={t} value={t}>{t}</option>)}
          </Select>
          {type === ModificationType.ADDITION && (
            <Input label="Valor de la Adición (COP)" id="value" type="number" value={value} onChange={(e) => setValue(e.target.value)} required placeholder="Ej: 500000000" />
          )}
          {type === ModificationType.TIME_EXTENSION && (
             <Input label="Días de Prórroga" id="days" type="number" value={days} onChange={(e) => setDays(e.target.value)} required placeholder="Ej: 30" />
          )}
        </div>
        <div>
          <label htmlFor="justification" className="block text-sm font-medium text-gray-700 mb-1">Justificación</label>
          <textarea id="justification" value={justification} onChange={(e) => setJustification(e.target.value)} rows={3} className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm p-2" required></textarea>
        </div>
        <div>
          <label htmlFor="file-upload-mod" className="block text-sm font-medium text-gray-700 mb-1">Adjuntar Soporte</label>
          {!file ? (
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="file-upload-mod" className="relative cursor-pointer bg-white rounded-md font-medium text-brand-primary hover:text-brand-secondary">
                    <span>Carga un archivo</span>
                    <input id="file-upload-mod" name="file-upload-mod" type="file" className="sr-only" onChange={handleFileChange} />
                  </label>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-2 p-2 border rounded-md bg-gray-50 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
              <button type="button" onClick={() => setFile(null)} className="text-red-500 hover:text-red-700">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit">Guardar Modificación</Button>
        </div>
      </form>
    </Modal>
  );
};

export default ContractModificationFormModal;