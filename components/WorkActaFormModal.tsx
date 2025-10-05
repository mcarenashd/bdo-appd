import React, { useState, useMemo, useEffect } from 'react';
import { WorkActa, WorkActaItem, ContractItem, WorkActaStatus } from '../types';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import { PlusIcon, XMarkIcon } from './icons/Icon';

interface WorkActaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (actaData: Omit<WorkActa, 'id'>) => void;
  contractItems: ContractItem[];
  suggestedNumber: string;
  itemsSummary: (ContractItem & { balance: number })[];
}

const months = [ "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre" ];

const WorkActaFormModal: React.FC<WorkActaFormModalProps> = ({ isOpen, onClose, onSave, contractItems, suggestedNumber, itemsSummary }) => {
  const [month, setMonth] = useState<string>(months[new Date().getMonth()]);
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [date, setDate] = useState('');
  const [items, setItems] = useState<WorkActaItem[]>([]);
  const [itemErrors, setItemErrors] = useState<Record<number, string>>({});

  useEffect(() => {
    if (isOpen) {
        const now = new Date();
        setMonth(months[now.getMonth()]);
        setYear(now.getFullYear().toString());
    }
  }, [isOpen]);

  const contractItemMap = useMemo(() => new Map(contractItems.map(item => [item.id, item])), [contractItems]);
  const itemsSummaryMap = useMemo(() => new Map(itemsSummary.map(item => [item.id, item])), [itemsSummary]);
  
  const availableItems = useMemo(() => {
    const selectedIds = new Set(items.map(i => i.contractItemId));
    return contractItems.filter(ci => !selectedIds.has(ci.id));
  }, [items, contractItems]);


  const handleAddItem = () => {
    if (availableItems.length > 0) {
      setItems([...items, { contractItemId: availableItems[0].id, quantity: 0 }]);
    }
  };

  const handleItemChange = (index: number, field: 'contractItemId' | 'quantity', value: string) => {
    const newItems = [...items];
    const newErrors = { ...itemErrors };
    
    if (field === 'quantity') {
      const quantity = parseFloat(value) || 0;
      newItems[index].quantity = quantity;
      const summaryItem = itemsSummaryMap.get(newItems[index].contractItemId);
      if (summaryItem && quantity > summaryItem.balance) {
         newErrors[index] = `La cantidad no puede exceder el saldo de ${summaryItem.balance.toLocaleString('es-CO')} ${summaryItem.unit}.`;
      } else {
         delete newErrors[index];
      }

    } else {
      newItems[index].contractItemId = value;
       // Re-validate quantity for the new item
      const quantity = newItems[index].quantity;
      const summaryItem = itemsSummaryMap.get(value);
      if (summaryItem && quantity > summaryItem.balance) {
         newErrors[index] = `La cantidad no puede exceder el saldo de ${summaryItem.balance.toLocaleString('es-CO')} ${summaryItem.unit}.`;
      } else {
         delete newErrors[index];
      }
    }
    setItems(newItems);
    setItemErrors(newErrors);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
    const newErrors = { ...itemErrors };
    delete newErrors[index];
    setItemErrors(newErrors);
  };
  
  const resetForm = () => {
    setDate('');
    setItems([]);
    setItemErrors({});
    const now = new Date();
    setMonth(months[now.getMonth()]);
    setYear(now.getFullYear().toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(itemErrors).length > 0) {
        alert("Hay errores en las cantidades de los ítems. Por favor, corríjalos.");
        return;
    }
    if (!date || items.length === 0) {
      alert("La fecha y al menos un ítem son obligatorios.");
      return;
    }

    onSave({
      number: suggestedNumber,
      period: `${month} ${year}`,
      date: new Date(date).toISOString(),
      status: WorkActaStatus.DRAFT,
      items,
    });
    
    resetForm();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 2 }).format(value);
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar Nueva Acta de Avance de Obra" size="2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input label="Número de Acta" id="number" value={suggestedNumber} readOnly />
          <div className="grid grid-cols-2 gap-2">
            <Select label="Mes" id="period-month" value={month} onChange={e => setMonth(e.target.value)}>
                {months.map(m => <option key={m} value={m}>{m}</option>)}
            </Select>
             <Select label="Año" id="period-year" value={year} onChange={e => setYear(e.target.value)}>
                {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
            </Select>
          </div>
          <Input label="Fecha del Acta" id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>

        <div>
          <h4 className="text-md font-semibold text-gray-800 mb-2">Ítems de Avance</h4>
          <div className="space-y-3">
            {items.map((item, index) => {
              const currentItemDetails = contractItemMap.get(item.contractItemId);
              const summaryItem = itemsSummaryMap.get(item.contractItemId);
              return (
                <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                  <div className="grid grid-cols-12 gap-x-3 items-end">
                    <div className="col-span-6">
                       <Select label={`Ítem #${index + 1}`} id={`item-${index}`} value={item.contractItemId} onChange={(e) => handleItemChange(index, 'contractItemId', e.target.value)}>
                          {currentItemDetails && <option value={currentItemDetails.id}>{currentItemDetails.itemCode} - {currentItemDetails.description}</option>}
                          {availableItems.map(ci => <option key={ci.id} value={ci.id}>{ci.itemCode} - {ci.description}</option>)}
                       </Select>
                    </div>
                    <div className="col-span-2">
                       <Input label="Cantidad" id={`qty-${index}`} type="number" step="any" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} />
                    </div>
                     <div className="col-span-3 text-sm text-gray-700">
                        <p className="text-xs text-gray-500">Subtotal</p>
                        <p className="font-semibold">{currentItemDetails ? formatCurrency(item.quantity * currentItemDetails.unitPrice) : formatCurrency(0)}</p>
                    </div>
                    <div className="col-span-1">
                      <Button type="button" variant="danger" size="sm" onClick={() => handleRemoveItem(index)} className="w-full !p-2">
                        <XMarkIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {itemErrors[index] && <p className="text-red-500 text-xs mt-1 px-1">{itemErrors[index]}</p>}
                   {summaryItem && <p className="text-xs text-gray-500 mt-1 px-1">Saldo: {summaryItem.balance.toLocaleString('es-CO')} {summaryItem.unit}</p>}
                </div>
              );
            })}
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={handleAddItem} leftIcon={<PlusIcon />} className="mt-3" disabled={availableItems.length === 0}>
            Añadir Ítem
          </Button>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit">Guardar Acta</Button>
        </div>
      </form>
    </Modal>
  );
};

export default WorkActaFormModal;