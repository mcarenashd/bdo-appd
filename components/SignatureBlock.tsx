
import React from 'react';
import { User, Signature } from '../types';
import Button from './ui/Button';
import { CheckCircleIcon, PencilSquareIcon } from './icons/Icon';

interface SignatureBlockProps {
  requiredSignatories: User[];
  signatures: Signature[];
  currentUser: User;
  onSignRequest: () => void;
  documentType: string;
}

const SignatureBlock: React.FC<SignatureBlockProps> = ({ requiredSignatories, signatures, currentUser, onSignRequest, documentType }) => {
  const signedUserIds = new Set(signatures.map(s => s.signer.id));
  const canCurrentUserSign = requiredSignatories.some(rs => rs.id === currentUser.id) && !signedUserIds.has(currentUser.id);

  if (requiredSignatories.length === 0) {
    return null; // Don't render if no signatures are required
  }

  return (
    <div className="pt-4">
      <h4 className="text-md font-semibold text-gray-800">Firmas del Documento</h4>
      <div className="mt-2 space-y-3 p-4 border rounded-lg bg-gray-50/70">
        {requiredSignatories.map(user => {
          const signature = signatures.find(s => s.signer.id === user.id);
          return (
            <div key={user.id} className="flex items-center justify-between">
              <div className="flex items-center">
                {/* Fix: Replaced `user.name` with `user.fullName`. */}
                <img src={user.avatarUrl} alt={user.fullName} className="h-9 w-9 rounded-full object-cover" />
                <div className="ml-3">
                  {/* Fix: Replaced `user.name` with `user.fullName`. */}
                  <p className="text-sm font-semibold text-gray-900">{user.fullName}</p>
                  {/* Fix: Replaced `user.role` with `user.projectRole`. */}
                  <p className="text-xs text-gray-500">{user.projectRole}</p>
                </div>
              </div>
              {signature ? (
                <div className="text-right">
                    <div className="flex items-center gap-1.5 text-green-600">
                        <CheckCircleIcon className="h-5 w-5" />
                        <span className="text-sm font-bold">Firmado</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(signature.signedAt).toLocaleString('es-CO')}
                    </p>
                </div>
              ) : (
                <p className="text-sm font-medium text-gray-500">Pendiente de Firma</p>
              )}
            </div>
          );
        })}
      </div>
      {canCurrentUserSign && (
        <div className="mt-4 flex justify-end">
          <Button onClick={onSignRequest} leftIcon={<PencilSquareIcon />}>
            Firmar {documentType}
          </Button>
        </div>
      )}
    </div>
  );
};

export default SignatureBlock;
