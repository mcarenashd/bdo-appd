import React, { useState, useEffect } from "react";
import { Acta, Commitment, CommitmentStatus, User } from "../types";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import AttachmentItem from "./AttachmentItem";
import ActaStatusBadge from "./ActaStatusBadge";
import { ClockIcon } from "./icons/Icon";
import ActaAreaBadge from "./ActaAreaBadge";
import SignatureBlock from "./SignatureBlock";
import SignatureModal from "./SignatureModal";

const EmailIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
    />
  </svg>
);

interface ActaDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  acta: Acta;
  onUpdate: (updatedActa: Acta) => void;
  onSendReminder: (commitment: Commitment, acta: Acta) => Promise<void>;
  onSign: (
    documentId: string,
    documentType: "acta",
    signer: User
  ) => Promise<Acta | any>;
  currentUser: User;
}

const getDueDateColor = (dueDateStr: string, status: CommitmentStatus) => {
  if (status === CommitmentStatus.COMPLETED) return "text-green-500";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(dueDateStr);
  const localDueDate = new Date(
    dueDate.valueOf() + dueDate.getTimezoneOffset() * 60 * 1000
  );
  localDueDate.setHours(0, 0, 0, 0);

  const timeLeft = localDueDate.getTime() - today.getTime();
  const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) return "text-red-500";
  if (daysLeft <= 3) return "text-yellow-600";
  return "text-gray-500";
};

const ActaDetailModal: React.FC<ActaDetailModalProps> = ({
  isOpen,
  onClose,
  acta,
  onUpdate,
  onSendReminder,
  onSign,
  currentUser,
}) => {
  const [editedActa, setEditedActa] = useState<Acta>(acta);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

  useEffect(() => {
    setEditedActa(acta);
  }, [acta, isOpen]);

  const handleCommitmentToggle = (commitmentId: string) => {
    setEditedActa((prevActa) => ({
      ...prevActa,
      commitments: prevActa.commitments.map((c) =>
        c.id === commitmentId
          ? {
              ...c,
              status:
                c.status === CommitmentStatus.PENDING
                  ? CommitmentStatus.COMPLETED
                  : CommitmentStatus.PENDING,
            }
          : c
      ),
    }));
  };

  const handleSendReminderClick = (commitment: Commitment) => {
    onSendReminder(commitment, acta);
    // Fix: Replaced `commitment.responsible.name` with `commitment.responsible.fullName`.
    alert(
      `Recordatorio enviado a ${commitment.responsible.fullName} (${commitment.responsible.email})`
    );
  };

  const handleConfirmSignature = async (
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    // Mock password check
    if (password !== "password123") {
      return { success: false, error: "Contraseña incorrecta." };
    }
    const updatedActa = await onSign(acta.id, "acta", currentUser);
    if (updatedActa) {
      setEditedActa(updatedActa);
      onUpdate(updatedActa); // also notify parent of the immediate change
    }
    setIsSignatureModalOpen(false);
    return { success: true };
  };

  const handleSaveChanges = () => {
    onUpdate(editedActa);
    onClose();
  };

  const {
    number,
    title,
    date,
    status,
    summary,
    area,
    commitments = [], // <-- Añade " = []"
    attachments = [], // <-- Añade " = []"
    requiredSignatories = [], // <-- Añade " = []"
    signatures = [], // <-- Añade " = []"
  } = editedActa;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Detalle de Acta - ${number}`}
        size="2xl"
      >
        <div className="space-y-6">
          <div className="pb-4 border-b">
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-bold text-gray-900">{title}</h3>
              <ActaStatusBadge status={status} />
            </div>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-sm text-gray-500">
                Fecha:{" "}
                {new Date(date).toLocaleDateString("es-CO", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <div className="flex items-center text-sm text-gray-500">
                <span className="mr-2">Área:</span>
                <ActaAreaBadge area={area} />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-md font-semibold text-gray-800">
              Resumen de la Reunión
            </h4>
            <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
              {summary}
            </p>
          </div>

          {commitments.length > 0 && (
            <div>
              <h4 className="text-md font-semibold text-gray-800">
                Compromisos Acordados
              </h4>
              <div className="mt-2 border border-gray-200 rounded-lg">
                <ul className="divide-y divide-gray-200">
                  {commitments.map((commitment: Commitment) => (
                    <li
                      key={commitment.id}
                      className="p-4 flex flex-col sm:flex-row justify-between sm:items-start gap-3"
                    >
                      <div className="flex-1 flex items-start">
                        <input
                          type="checkbox"
                          id={`commitment-${commitment.id}`}
                          className="h-5 w-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary mt-0.5"
                          checked={
                            commitment.status === CommitmentStatus.COMPLETED
                          }
                          onChange={() => handleCommitmentToggle(commitment.id)}
                        />
                        <label
                          htmlFor={`commitment-${commitment.id}`}
                          className="ml-3 flex-1"
                        >
                          <p
                            className={`text-sm text-gray-800 ${
                              commitment.status === CommitmentStatus.COMPLETED
                                ? "line-through text-gray-500"
                                : ""
                            }`}
                          >
                            {commitment.description}
                          </p>
                          <div className="flex items-center text-xs text-gray-500 mt-1.5">
                            {/* Fix: Replaced `commitment.responsible.name` with `commitment.responsible.fullName`. */}
                            <img
                              src={commitment.responsible.avatarUrl}
                              alt={commitment.responsible.fullName}
                              className="h-5 w-5 rounded-full mr-2"
                            />
                            {/* Fix: Replaced `commitment.responsible.name` with `commitment.responsible.fullName`. */}
                            <span>
                              Responsable: {commitment.responsible.fullName}
                            </span>
                          </div>
                        </label>
                      </div>
                      <div className="flex-shrink-0 flex items-center gap-4 pl-8 sm:pl-0">
                        {commitment.status === CommitmentStatus.PENDING && (
                          <button
                            onClick={() => handleSendReminderClick(commitment)}
                            title="Enviar recordatorio por email"
                            className="text-gray-400 hover:text-brand-primary"
                          >
                            <EmailIcon className="h-5 w-5" />
                          </button>
                        )}
                        <span
                          className={`text-sm font-semibold ${
                            commitment.status === CommitmentStatus.COMPLETED
                              ? "text-green-600"
                              : "text-yellow-600"
                          }`}
                        >
                          {commitment.status}
                        </span>
                        <div
                          className={`flex items-center text-xs font-medium ${getDueDateColor(
                            commitment.dueDate,
                            commitment.status
                          )}`}
                        >
                          <ClockIcon className="h-4 w-4 mr-1" />
                          <span>
                            Vence:{" "}
                            {new Date(commitment.dueDate).toLocaleDateString(
                              "es-CO"
                            )}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {attachments.length > 0 && (
            <div>
              <h4 className="text-md font-semibold text-gray-800">
                Archivos Adjuntos
              </h4>
              <ul className="mt-2 space-y-2">
                {attachments.map((att) => (
                  <AttachmentItem key={att.id} attachment={att} />
                ))}
              </ul>
            </div>
          )}

          <SignatureBlock
            requiredSignatories={requiredSignatories}
            signatures={signatures}
            currentUser={currentUser}
            onSignRequest={() => setIsSignatureModalOpen(true)}
            documentType="Acta"
          />
        </div>
        <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
          <Button variant="primary" onClick={handleSaveChanges}>
            Guardar Cambios
          </Button>
        </div>
      </Modal>
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onConfirm={handleConfirmSignature}
        userToSign={currentUser}
      />
    </>
  );
};

export default ActaDetailModal;
