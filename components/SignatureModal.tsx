import React, { useState, useEffect } from 'react';
import { User } from '../types';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<{ success: boolean; error?: string }>;
  userToSign: User;
}

const SignatureModal: React.FC<SignatureModalProps> = ({ isOpen, onClose, onConfirm, userToSign }) => {
  const [password, setPassword] = useState('');
  const [isAgreed, setIsAgreed] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setPassword('');
        setIsAgreed(false);
        setError(null);
        setIsSigning(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    setError(null);
    setIsSigning(true);
    const result = await onConfirm(password);
    if (!result.success) {
      setError(result.error || 'Ocurrió un error inesperado.');
      setIsSigning(false);
    }
  };

  const canSign = password.trim() !== '' && isAgreed;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirmación de Firma Electrónica" size="md">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Yo, <strong className="font-semibold text-gray-800">{userToSign.name}</strong>, confirmo que he revisado este documento y estoy de acuerdo con su contenido. Entiendo que esta acción es legalmente vinculante y equivale a mi firma manuscrita.
        </p>

        <Input
          label="Confirma tu contraseña para firmar"
          id="signature-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="agreement"
              name="agreement"
              type="checkbox"
              className="focus:ring-brand-primary h-4 w-4 text-brand-primary border-gray-300 rounded"
              checked={isAgreed}
              onChange={(e) => setIsAgreed(e.target.checked)}
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="agreement" className="font-medium text-gray-700 cursor-pointer">
              Acepto y firmo electrónicamente este documento.
            </label>
          </div>
        </div>

        {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
                {error}
            </div>
        )}
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={isSigning}>
          Cancelar
        </Button>
        <Button onClick={handleConfirm} disabled={!canSign || isSigning}>
          {isSigning ? 'Firmando...' : 'Firmar y Aceptar'}
        </Button>
      </div>
    </Modal>
  );
};

export default SignatureModal;