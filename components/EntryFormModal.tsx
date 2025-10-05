
import React, { useState, useEffect } from 'react';
// Fix: Corrected import path for types
import { LogEntry, EntryType, EntryStatus, User } from '../types';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';

interface EntryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entryData: Omit<LogEntry, 'id' | 'folioNumber' | 'createdAt' | 'author' | 'comments' | 'history' | 'updatedAt'>) => void;
  initialDate?: string | null;
  allUsers: User[];
}

const EntryFormModal: React.FC<EntryFormModalProps> = ({ isOpen, onClose, onSave, initialDate, allUsers }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<EntryType>(EntryType.GENERAL);
  const [subject, setSubject] = useState('');
  const [location, setLocation] = useState('');
  const [activityStartDate, setActivityStartDate] = useState('');
  const [activityEndDate, setActivityEndDate] = useState('');
  const [isConfidential, setIsConfidential] = useState(false);
  const [assignees, setAssignees] = useState<User[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setType(EntryType.GENERAL);
    setSubject('');
    setLocation('');
    setActivityStartDate('');
    setActivityEndDate('');
    setIsConfidential(false);
    setAssignees([]);
    setValidationError(null);
  };

  useEffect(() => {
    if (isOpen) {
      if (initialDate) {
        // `initialDate` is YYYY-MM-DD. `datetime-local` input needs YYYY-MM-DDTHH:mm
        setActivityStartDate(`${initialDate}T08:00`);
        setActivityEndDate(`${initialDate}T17:00`);
      }
    } else {
      // Small delay to prevent form clearing during closing animation
      const timer = setTimeout(() => {
        resetForm();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialDate]);

  const handleAssigneeChange = (user: User, isChecked: boolean) => {
    setAssignees(prev => {
        if (isChecked) {
            if (!prev.some(a => a.id === user.id)) {
                return [...prev, user];
            }
        } else {
            return prev.filter(a => a.id !== user.id);
        }
        return prev;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!title || !description) {
        setValidationError("El título y la descripción son obligatorios.");
        return;
    }

    if (activityStartDate && activityEndDate) {
        const start = new Date(activityStartDate);
        const end = new Date(activityEndDate);
        if (end < start) {
            setValidationError("La fecha de fin de actividad no puede ser anterior a la fecha de inicio.");
            return;
        }
    }

    onSave({
      title,
      description,
      type,
      subject,
      location,
      activityStartDate,
      activityEndDate,
      isConfidential,
      status: EntryStatus.SUBMITTED,
      attachments: [], // File upload would be implemented here
      assignees,
      // Fix: Add missing properties to satisfy the LogEntry type
      requiredSignatories: [],
      signatures: [],
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Crear Nueva Anotación" size="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Título de la Anotación" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Descripción Detallada</label>
            <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required rows={4} className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm p-2"></textarea>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Tipo de Anotación" id="type" value={type} onChange={(e) => setType(e.target.value as EntryType)}>
                {Object.values(EntryType).map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
            <Input label="Asunto / Etiqueta" id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Fecha y Hora de Inicio Actividad" id="activityStartDate" type="datetime-local" value={activityStartDate} onChange={(e) => setActivityStartDate(e.target.value)} />
            <Input label="Fecha y Hora de Fin Actividad" id="activityEndDate" type="datetime-local" value={activityEndDate} onChange={(e) => setActivityEndDate(e.target.value)} />
        </div>
        <Input label="Localización / Ubicación" id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Asignar a (Opcional)</label>
            <div className="mt-1 p-3 border rounded-lg bg-gray-50/70 max-h-40 overflow-y-auto">
                <fieldset>
                    <legend className="sr-only">Usuarios para asignar</legend>
                    <div className="space-y-2">
                        {allUsers.map(user => (
                            <div key={user.id} className="relative flex items-start">
                                <div className="flex items-center h-5">
                                    <input
                                        id={`assign-user-${user.id}`}
                                        name="assignees"
                                        type="checkbox"
                                        className="focus:ring-brand-primary h-4 w-4 text-brand-primary border-gray-300 rounded"
                                        checked={assignees.some(a => a.id === user.id)}
                                        onChange={(e) => handleAssigneeChange(user, e.target.checked)}
                                    />
                                </div>
                                <div className="ml-3 text-sm flex items-center">
                                    <label htmlFor={`assign-user-${user.id}`} className="font-medium text-gray-700 flex items-center cursor-pointer">
                                        <img src={user.avatarUrl} alt={user.name} className="h-6 w-6 rounded-full mr-2" />
                                        {user.name}
                                    </label>
                                    <span className="ml-2 text-gray-500">({user.role})</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </fieldset>
            </div>
        </div>
        <div>
          <label htmlFor="attachments" className="block text-sm font-medium text-gray-700 mb-1">Adjuntar Archivos</label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <div className="flex text-sm text-gray-600"><p className="pl-1">o arrastra y suelta</p></div>
              <p className="text-xs text-gray-500">PNG, JPG, PDF hasta 10MB</p>
            </div>
          </div>
        </div>
        <div className="flex items-start">
            <div className="flex items-center h-5">
                <input id="isConfidential" name="isConfidential" type="checkbox" checked={isConfidential} onChange={(e) => setIsConfidential(e.target.checked)} className="focus:ring-brand-primary h-4 w-4 text-brand-primary border-gray-300 rounded" />
            </div>
            <div className="ml-3 text-sm">
                <label htmlFor="isConfidential" className="font-medium text-gray-700">Marcar como confidencial</label>
                <p className="text-gray-500">Solo usuarios autorizados podrán ver esta anotación.</p>
            </div>
        </div>
        
        {validationError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
                {validationError}
            </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Guardar Anotación</Button>
        </div>
      </form>
    </Modal>
  );
};

export default EntryFormModal;
