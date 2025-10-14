
import { useState, useEffect } from 'react';
import { LogEntry, Communication, CommunicationStatus, Acta, CostActa, CostActaStatus, Attachment, WorkActa, ContractItem, WorkActaStatus, Change, Comment, User, ControlPoint, PhotoEntry, ProjectTask, ContractModification, ProjectDetails, Report, ReportStatus, Commitment, EntryStatus, ActaStatus, Drawing, DrawingDiscipline, DrawingStatus, DrawingVersion } from '../types';
import { MOCK_LOG_ENTRIES, MOCK_COMMUNICATIONS, MOCK_ACTAS, MOCK_COST_ACTAS, MOCK_USER, MOCK_WORK_ACTAS, MOCK_CONTRACT_ITEMS, MOCK_PROJECT, MOCK_CONTROL_POINTS, MOCK_PROJECT_TASKS, MOCK_CONTRACT_MODIFICATIONS, MOCK_PROJECT_DETAILS, MOCK_REPORTS, MOCK_USERS, MOCK_DRAWINGS } from '../services/mockData';

const API_DELAY = 500; // 500ms delay to simulate network latency

const sendAssignmentEmail = async (user: User, entry: LogEntry) => {
    if (!user.email) {
        console.warn(`El usuario ${user.fullName} no tiene un email configurado para recibir notificaciones.`);
        return;
    }
    console.log(`SIMULACIÓN: Enviando email de asignación a ${user.email} para el folio #${entry.folioNumber}`);
    // En una aplicación real, aquí iría la llamada fetch a un endpoint de backend.
    // await fetch('/api/send-email', { ... });
    return Promise.resolve();
};

const sendCommitmentReminderEmail = async (commitment: Commitment, acta: Acta) => {
    const user = commitment.responsible;
    if (!user.email) {
        console.warn(`El usuario ${user.fullName} no tiene un email configurado para recibir recordatorios.`);
        return;
    }
     console.log(`SIMULACIÓN: Enviando email de recordatorio de compromiso a ${user.email}`);
     console.log(`   - Proyecto: ${MOCK_PROJECT.name}`);
     console.log(`   - Acta: ${acta.number} - ${acta.title}`);
     console.log(`   - Compromiso: "${commitment.description}"`);
     console.log(`   - Fecha Límite: ${new Date(commitment.dueDate).toLocaleDateString('es-CO')}`);
    // En una aplicación real, aquí iría la llamada fetch a un endpoint de backend.
    return Promise.resolve();
};


export const useMockApi = () => {
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [actas, setActas] = useState<Acta[]>([]);
  const [costActas, setCostActas] = useState<CostActa[]>([]);
  const [workActas, setWorkActas] = useState<WorkActa[]>([]);
  const [contractItems, setContractItems] = useState<ContractItem[]>([]);
  const [controlPoints, setControlPoints] = useState<ControlPoint[]>([]);
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([]);
  const [contractModifications, setContractModifications] = useState<ContractModification[]>([]);
  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = () => {
      setIsLoading(true);
      setTimeout(() => {
        try {
          setLogEntries(MOCK_LOG_ENTRIES);
          setCommunications(MOCK_COMMUNICATIONS);
          setActas(MOCK_ACTAS);
          setCostActas(MOCK_COST_ACTAS);
          setWorkActas(MOCK_WORK_ACTAS);
          setContractItems(MOCK_CONTRACT_ITEMS);
          setControlPoints(MOCK_CONTROL_POINTS);
          setProjectTasks(MOCK_PROJECT_TASKS);
          setContractModifications(MOCK_CONTRACT_MODIFICATIONS);
          setProjectDetails(MOCK_PROJECT_DETAILS);
          setReports(MOCK_REPORTS);
          setDrawings(MOCK_DRAWINGS);
          setError(null);
        } catch (e) {
          setError('Failed to fetch mock data.');
          console.error(e);
        } finally {
          setIsLoading(false);
        }
      }, API_DELAY);
    };
    fetchData();
  }, []);
  
  const login = async (email: string, password: string): Promise<{ user: User, token: string } | { error: string }> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const user = MOCK_USERS.find(u => u.email === email);

            if (!user || user.password !== password) {
                resolve({ error: 'Correo o contraseña inválidos.' });
                return;
            }
            
            if (user.status === 'inactive') {
                resolve({ error: 'Esta cuenta de usuario ha sido desactivada.' });
                return;
            }

            // In a real app, the backend would generate a secure JWT.
            // Here, we simulate it with a simple base64 encoded string.
            const fakeToken = btoa(JSON.stringify({ userId: user.id, role: user.appRole, timestamp: Date.now() }));
            
            const { password: _, ...userWithoutPassword } = user;

            resolve({ user: userWithoutPassword, token: fakeToken });

        }, API_DELAY * 2);
    });
  };
  
  const addEntry = async (newEntryData: Omit<LogEntry, 'id' | 'folioNumber' | 'createdAt' | 'author' | 'comments' | 'history' | 'updatedAt' | 'attachments'>, files: File[], author: User): Promise<void> => {
     return new Promise((resolve) => {
        setTimeout(() => {
            const now = new Date().toISOString();
            const newFolio = logEntries.length > 0 ? Math.max(...logEntries.map(e => e.folioNumber)) + 1 : 1001;
            
            const newAttachments: Attachment[] = files.map((file, index) => ({
                id: `att-${Date.now()}-${index}`,
                fileName: file.name,
                size: file.size,
                type: file.type,
                url: URL.createObjectURL(file), // Mock URL
            }));

            const newEntry: LogEntry = {
                ...newEntryData,
                id: `entry-${Date.now()}`,
                attachments: newAttachments,
                folioNumber: newFolio,
                createdAt: now,
                updatedAt: now,
                author: author,
                comments: [],
                history: [],
            };
            setLogEntries(prev => [newEntry, ...prev]);
            
            // Send email notifications for new assignments
            if (newEntry.assignees && newEntry.assignees.length > 0) {
                newEntry.assignees.forEach(assignee => {
                    sendAssignmentEmail(assignee, newEntry);
                });
            }

            resolve();
        }, API_DELAY);
     });
  };
  
  const updateEntry = async (updatedEntryData: LogEntry, currentUser: User): Promise<LogEntry | undefined> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            let resultEntry: LogEntry | undefined;
            setLogEntries(prev => {
                const originalEntry = prev.find(e => e.id === updatedEntryData.id);
                if (!originalEntry) {
                    resolve(undefined);
                    return prev;
                }
                
                const changes: Change[] = [];
                const fieldDisplayNames: { [key in keyof Omit<LogEntry, 'assignees'>]?: string } = {
                  title: 'Título',
                  description: 'Descripción',
                  type: 'Tipo',
                  subject: 'Asunto',
                  location: 'Localización',
                  activityStartDate: 'Inicio de Actividad',
                  activityEndDate: 'Fin de Actividad',
                  isConfidential: 'Confidencial',
                  status: 'Estado',
                  createdAt: 'Fecha de Creación',
                };

                (Object.keys(fieldDisplayNames) as Array<keyof typeof fieldDisplayNames>).forEach(field => {
                    const oldValue = (originalEntry as any)[field];
                    const newValue = (updatedEntryData as any)[field];
                    
                    if (String(oldValue) !== String(newValue)) {
                         let formattedOldValue = String(oldValue);
                         let formattedNewValue = String(newValue);

                         if (field === 'activityStartDate' || field === 'activityEndDate' || field === 'createdAt') {
                             formattedOldValue = new Date(oldValue).toLocaleString('es-CO');
                             formattedNewValue = new Date(newValue).toLocaleString('es-CO');
                         }
                         if (field === 'isConfidential') {
                             formattedOldValue = oldValue ? 'Sí' : 'No';
                             formattedNewValue = newValue ? 'Sí' : 'No';
                         }

                         changes.push({
                            id: `change-${Date.now()}-${field}`,
                            user: currentUser,
                            timestamp: new Date().toISOString(),
                            fieldName: fieldDisplayNames[field]!,
                            oldValue: formattedOldValue,
                            newValue: formattedNewValue,
                        });
                    }
                });

                // Compare attachments
                const originalAttachments = originalEntry.attachments || [];
                const updatedAttachments = updatedEntryData.attachments || [];

                const originalAttachmentIds = new Set(originalAttachments.map(a => a.id));
                const updatedAttachmentIds = new Set(updatedAttachments.map(a => a.id));

                updatedAttachments.forEach(att => {
                    if (!originalAttachmentIds.has(att.id)) {
                        changes.push({
                            id: `change-${Date.now()}-add-att-${att.id}`,
                            user: currentUser,
                            timestamp: new Date().toISOString(),
                            fieldName: 'Adjunto Añadido',
                            oldValue: '',
                            newValue: att.fileName,
                        });
                    }
                });

                originalAttachments.forEach(att => {
                    if (!updatedAttachmentIds.has(att.id)) {
                        changes.push({
                            id: `change-${Date.now()}-del-att-${att.id}`,
                            user: currentUser,
                            timestamp: new Date().toISOString(),
                            fieldName: 'Adjunto Eliminado',
                            oldValue: att.fileName,
                            newValue: '',
                        });
                    }
                });

                // Compare assignees
                const originalAssignees = originalEntry.assignees || [];
                const updatedAssignees = updatedEntryData.assignees || [];

                const originalAssigneeIds = new Set(originalAssignees.map(a => a.id));
                
                updatedAssignees.forEach(user => {
                    if (!originalAssigneeIds.has(user.id)) {
                        // This is a new assignee, send email notification
                        sendAssignmentEmail(user, { ...updatedEntryData, folioNumber: originalEntry.folioNumber });
                        changes.push({
                            id: `change-${Date.now()}-add-assignee-${user.id}`,
                            user: currentUser,
                            timestamp: new Date().toISOString(),
                            fieldName: 'Asignado Añadido',
                            oldValue: '',
                            newValue: user.fullName,
                        });
                    }
                });

                const updatedAssigneeIds = new Set(updatedAssignees.map(a => a.id));
                originalAssignees.forEach(user => {
                    if (!updatedAssigneeIds.has(user.id)) {
                        changes.push({
                            id: `change-${Date.now()}-del-assignee-${user.id}`,
                            user: currentUser,
                            timestamp: new Date().toISOString(),
                            fieldName: 'Asignado Eliminado',
                            oldValue: user.fullName,
                            newValue: '',
                        });
                    }
                });


                if (changes.length === 0) {
                    resultEntry = originalEntry;
                    return prev;
                }

                const newHistory = [...(originalEntry.history || []), ...changes];

                const finalEntry: LogEntry = {
                    ...updatedEntryData,
                    updatedAt: new Date().toISOString(),
                    history: newHistory,
                };

                resultEntry = finalEntry;
                return prev.map(e => e.id === finalEntry.id ? finalEntry : e);
            });
            resolve(resultEntry);
        }, API_DELAY);
    });
  };

  const addCommentToEntry = async (entryId: string, commentText: string, files: File[], author: User): Promise<LogEntry | undefined> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            let resultEntry: LogEntry | undefined;
            setLogEntries(prev => {
                const entryIndex = prev.findIndex(e => e.id === entryId);
                if (entryIndex === -1) {
                    resolve(undefined);
                    return prev;
                }
                
                const originalEntry = prev[entryIndex];

                const newAttachments: Attachment[] = files.map((file, index) => ({
                    id: `comment-att-${Date.now()}-${index}`,
                    fileName: file.name,
                    size: file.size,
                    type: file.type,
                    url: URL.createObjectURL(file),
                }));

                const newComment: Comment = {
                    id: `comment-${Date.now()}`,
                    user: author,
                    content: commentText,
                    timestamp: new Date().toISOString(),
                    attachments: newAttachments,
                };

                const updatedEntry: LogEntry = {
                    ...originalEntry,
                    comments: [...originalEntry.comments, newComment],
                    updatedAt: new Date().toISOString(),
                };

                resultEntry = updatedEntry;
                const newEntries = [...prev];
                newEntries[entryIndex] = updatedEntry;
                return newEntries;
            });
            resolve(resultEntry);
        }, API_DELAY);
    });
  };

  const addCommunication = async (newCommData: Omit<Communication, 'id' | 'uploader' | 'attachments' | 'status' | 'statusHistory'>, author: User): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const newComm: Communication = {
                ...newCommData,
                id: `comm-${Date.now()}`,
                uploader: author,
                attachments: [],
                status: CommunicationStatus.PENDIENTE,
                statusHistory: [{ status: CommunicationStatus.PENDIENTE, user: author, timestamp: new Date().toISOString() }],
            };
            setCommunications(prev => [newComm, ...prev]);
            resolve();
        }, API_DELAY);
    });
  };

  const addActa = async (newActaData: Omit<Acta, 'id'>): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const newActa: Acta = {
                ...newActaData,
                id: `acta-${Date.now()}`,
            };
            setActas(prev => [newActa, ...prev]);
            resolve();
        }, API_DELAY);
    });
  };

  const updateActa = async (updatedActa: Acta): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            setActas(prev => prev.map(acta => acta.id === updatedActa.id ? updatedActa : acta));
            resolve();
        }, API_DELAY);
    });
  };

  const addCostActa = async (newCostActaData: Omit<CostActa, 'id' | 'observations' | 'attachments'>, files: File[]): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const newAttachments: Attachment[] = files.map((file, index) => ({
                id: `att-cost-${Date.now()}-${index}`,
                fileName: file.name,
                size: file.size,
                type: file.type,
                url: '#', // Mock URL
            }));

            const newCostActa: CostActa = {
                ...newCostActaData,
                id: `cost-acta-${Date.now()}`,
                observations: [],
                attachments: newAttachments,
            };
            setCostActas(prev => [newCostActa, ...prev]);
            resolve();
        }, API_DELAY);
    });
  };

  const updateCostActa = async (updatedCostActa: CostActa): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            let finalActa = { ...updatedCostActa };
            // If status is changed to approved, set approval date and calculate payment due date
            if (finalActa.status === CostActaStatus.APPROVED && !finalActa.approvalDate) {
                const approvalDate = new Date();
                finalActa.approvalDate = approvalDate.toISOString();
                const paymentDueDate = new Date(approvalDate);
                paymentDueDate.setDate(paymentDueDate.getDate() + 30); // Add 30 calendar days
                finalActa.paymentDueDate = paymentDueDate.toISOString();
            }
            setCostActas(prev => prev.map(acta => acta.id === finalActa.id ? finalActa : acta));
            resolve();
        }, API_DELAY);
    });
  };

  const updateCommunicationStatus = async (commId: string, newStatus: CommunicationStatus, author: User): Promise<void> => {
     return new Promise((resolve) => {
        setTimeout(() => {
            setCommunications(prev => prev.map(comm => {
                if (comm.id === commId) {
                    const newHistoryEntry = { status: newStatus, user: author, timestamp: new Date().toISOString() };
                    return { ...comm, status: newStatus, statusHistory: [...comm.statusHistory, newHistoryEntry] };
                }
                return comm;
            }));
            resolve();
        }, API_DELAY);
     });
  };

  const addWorkActa = async (newActaData: Omit<WorkActa, 'id'>): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const newActa: WorkActa = {
                ...newActaData,
                id: `work-acta-${Date.now()}`,
            };
            setWorkActas(prev => [newActa, ...prev]);
            resolve();
        }, API_DELAY);
    });
  };

  const updateWorkActa = async (updatedActa: WorkActa): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            setWorkActas(prev => prev.map(acta => acta.id === updatedActa.id ? updatedActa : acta));
            resolve();
        }, API_DELAY);
    });
  };

  const addContractModification = async (newModData: Omit<ContractModification, 'id'>): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const newMod: ContractModification = {
                ...newModData,
                id: `mod-${Date.now()}`,
            };
            setContractModifications(prev => [newMod, ...prev]);
            resolve();
        }, API_DELAY);
    });
};


  const addControlPoint = async (newPointData: Omit<ControlPoint, 'id' | 'photos'>): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newPoint: ControlPoint = {
          ...newPointData,
          id: `cp-${Date.now()}`,
          photos: [],
        };
        setControlPoints(prev => [newPoint, ...prev]);
        resolve();
      }, API_DELAY);
    });
  };
  
  const addPhotoToControlPoint = async (pointId: string, photoData: Omit<PhotoEntry, 'id' | 'author' | 'date'>, file: File, author: User): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newPhoto: PhotoEntry = {
          id: `photo-${Date.now()}`,
          url: URL.createObjectURL(file), // Create a temporary local URL for display
          date: new Date().toISOString(),
          notes: photoData.notes,
          author: author,
        };
        setControlPoints(prev =>
          prev.map(point =>
            point.id === pointId
              ? { ...point, photos: [...point.photos, newPhoto].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()) }
              : point
          )
        );
        resolve();
      }, API_DELAY);
    });
  };

  const addReport = async (newReportData: Omit<Report, 'id' | 'author' | 'status' | 'attachments'>, files: File[], author: User): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const newAttachments: Attachment[] = files.map((file, index) => ({
                id: `att-rep-${Date.now()}-${index}`,
                fileName: file.name,
                size: file.size,
                type: file.type,
                url: '#', // Mock URL
            }));

            const newReport: Report = {
                ...newReportData,
                id: `report-${Date.now()}`,
                author: author,
                status: ReportStatus.SUBMITTED,
                attachments: newAttachments,
            };
            setReports(prev => [newReport, ...prev].sort((a,b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime()));
            resolve();
        }, API_DELAY);
    });
  };

  const updateReport = async (updatedReport: Report): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            setReports(prev => prev.map(rep => rep.id === updatedReport.id ? updatedReport : rep));
            resolve();
        }, API_DELAY);
    });
  };

  const addSignature = async (documentId: string, documentType: 'logEntry' | 'acta' | 'report', signer: User): Promise<LogEntry | Acta | Report | undefined> => {
      return new Promise((resolve) => {
          setTimeout(() => {
              const newSignature = { signer, signedAt: new Date().toISOString() };
              let updatedDocument: LogEntry | Acta | Report | undefined;

              switch (documentType) {
                  case 'logEntry':
                      setLogEntries(prev => {
                          const newEntries = prev.map(entry => {
                              if (entry.id === documentId) {
                                  const updatedSignatures = [...entry.signatures, newSignature];
                                  let newStatus = entry.status;
                                  if (entry.requiredSignatories.length > 0 && updatedSignatures.length >= entry.requiredSignatories.length) {
                                      newStatus = EntryStatus.APPROVED;
                                  }
                                  updatedDocument = { ...entry, signatures: updatedSignatures, status: newStatus, updatedAt: new Date().toISOString() };
                                  return updatedDocument;
                              }
                              return entry;
                          });
                          return newEntries;
                      });
                      break;
                  case 'acta':
                      setActas(prev => {
                           const newActas = prev.map(acta => {
                              if (acta.id === documentId) {
                                  const updatedSignatures = [...acta.signatures, newSignature];
                                  let newStatus = acta.status;
                                   if (acta.status === ActaStatus.FOR_SIGNATURES && acta.requiredSignatories.length > 0 && updatedSignatures.length >= acta.requiredSignatories.length) {
                                      newStatus = ActaStatus.SIGNED;
                                  }
                                  updatedDocument = { ...acta, signatures: updatedSignatures, status: newStatus };
                                  return updatedDocument;
                              }
                              return acta;
                          });
                          return newActas;
                      });
                      break;
                  case 'report':
                       setReports(prev => {
                           const newReports = prev.map(report => {
                              if (report.id === documentId) {
                                  const updatedSignatures = [...report.signatures, newSignature];
                                  let newStatus = report.status;
                                  if (report.status === ReportStatus.SUBMITTED && report.requiredSignatories.length > 0 && updatedSignatures.length >= report.requiredSignatories.length) {
                                      newStatus = ReportStatus.APPROVED;
                                  }
                                  updatedDocument = { ...report, signatures: updatedSignatures, status: newStatus };
                                  return updatedDocument;
                              }
                              return report;
                          });
                          return newReports;
                       });
                      break;
              }
              resolve(updatedDocument);
          }, API_DELAY);
      });
  };

  // --- DRAWINGS API ---

  const addDrawing = async (data: Omit<Drawing, 'id' | 'status' | 'versions' | 'comments'>, file: File, uploader: User): Promise<void> => {
     return new Promise((resolve) => {
        setTimeout(() => {
            const newVersion: DrawingVersion = {
                id: `ver-${Date.now()}`,
                versionNumber: 1,
                fileName: file.name,
                url: URL.createObjectURL(file), // Mock URL
                size: file.size,
                uploadDate: new Date().toISOString(),
                uploader: uploader,
            };
            const newDrawing: Drawing = {
                ...data,
                id: `drawing-${Date.now()}`,
                status: DrawingStatus.VIGENTE,
                versions: [newVersion],
                comments: [],
            };
            setDrawings(prev => [newDrawing, ...prev]);
            resolve();
        }, API_DELAY);
     });
  };
  
  const addDrawingVersion = async (drawingId: string, file: File, uploader: User): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            setDrawings(prev => prev.map(d => {
                if (d.id === drawingId) {
                    const latestVersionNumber = d.versions[0]?.versionNumber || 0;
                    const newVersion: DrawingVersion = {
                        id: `ver-${Date.now()}`,
                        versionNumber: latestVersionNumber + 1,
                        fileName: file.name,
                        url: URL.createObjectURL(file), // Mock URL
                        size: file.size,
                        uploadDate: new Date().toISOString(),
                        uploader: uploader,
                    };
                    return {
                        ...d,
                        status: DrawingStatus.VIGENTE,
                        versions: [newVersion, ...d.versions], // Add to the front
                    };
                }
                return d;
            }));
            resolve();
        }, API_DELAY);
    });
  };
  
  const addCommentToDrawing = async (drawingId: string, commentText: string, author: User): Promise<Drawing | undefined> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            let resultDrawing: Drawing | undefined;
            setDrawings(prev => {
                const drawingIndex = prev.findIndex(d => d.id === drawingId);
                if (drawingIndex === -1) {
                    resolve(undefined);
                    return prev;
                }
                
                const originalDrawing = prev[drawingIndex];

                const newComment: Comment = {
                    id: `comment-draw-${Date.now()}`,
                    user: author,
                    content: commentText,
                    timestamp: new Date().toISOString(),
                };

                const updatedDrawing: Drawing = {
                    ...originalDrawing,
                    comments: [...originalDrawing.comments, newComment],
                };

                resultDrawing = updatedDrawing;
                const newDrawings = [...prev];
                newDrawings[drawingIndex] = updatedDrawing;
                return newDrawings;
            });
            resolve(resultDrawing);
        }, API_DELAY);
    });
  };

  return { login, logEntries, communications, actas, costActas, workActas, contractItems, controlPoints, projectTasks, contractModifications, projectDetails, reports, drawings, isLoading, error, addEntry, updateEntry, addCommentToEntry, addCommunication, addActa, updateCommunicationStatus, updateActa, addCostActa, updateCostActa, setLogEntries, addWorkActa, updateWorkActa, addControlPoint, addPhotoToControlPoint, addContractModification, addReport, updateReport, sendCommitmentReminderEmail, addSignature, addDrawing, addDrawingVersion, addCommentToDrawing };
};
