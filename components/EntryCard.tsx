import React from 'react';
// Fix: Corrected import path for types
import { LogEntry } from '../types';
import Card from './ui/Card';
import Badge from './ui/Badge';
// Fix: Corrected import path for icons
import { PaperClipIcon, ClockIcon, CalendarIcon, UserCircleIcon, LockClosedIcon } from './icons/Icon';

interface EntryCardProps {
  entry: LogEntry;
  onSelect: (entry: LogEntry) => void;
}

const EntryCard: React.FC<EntryCardProps> = ({ entry, onSelect }) => {
  const creationDate = new Date(entry.createdAt).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
  
  // A real app would have a more complex logic, e.g. checking user permissions.
  const isLocked = entry.isConfidential;

  return (
    <Card className={`transition-shadow duration-200 ${isLocked ? 'bg-gray-50 opacity-70' : 'hover:shadow-lg hover:border-brand-primary/50'}`}>
      <div 
        onClick={isLocked ? undefined : () => onSelect(entry)} 
        className={`p-4 ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-brand-primary">Folio #{entry.folioNumber}</p>
                    {/* The lock icon is now more prominent for locked entries */}
                    {/* Fix: Wrapped icon in a span with a title attribute to fix typing error. */}
                    {isLocked && <span title="Confidencial"><LockClosedIcon className="h-5 w-5 text-gray-600" /></span>}
                </div>
                <h3 className="text-lg font-bold text-gray-800 mt-1">{entry.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{entry.type}</p>
            </div>
            <div className="flex-shrink-0 pt-1">
                <Badge status={entry.status} />
            </div>
        </div>
        
        {isLocked ? (
           <div className="mt-3 text-sm text-gray-600 italic bg-gray-100 p-3 rounded-md flex items-center gap-2 border">
             <LockClosedIcon className="h-4 w-4 text-gray-500"/>
             <span>El contenido de esta anotación es confidencial.</span>
           </div>
        ) : (
           <p className="mt-3 text-sm text-gray-600 line-clamp-2">{entry.description}</p>
        )}
        
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
                <div className="flex items-center">
                    <UserCircleIcon className="mr-1.5 text-gray-400" />
                    <span>{entry.author.fullName}</span>
                </div>
                 <div className="flex items-center">
                    <CalendarIcon className="mr-1.5 text-gray-400" />
                    <span>Creado: {creationDate}</span>
                </div>
                {!isLocked && (
                  <>
                    <div className="flex items-center">
                        <ClockIcon className="mr-1.5 text-gray-400" />
                        <span>Actividad: {new Date(entry.activityStartDate).toLocaleDateString('es-CO')}</span>
                    </div>
                    {entry.attachments.length > 0 && (
                        <div className="flex items-center font-medium">
                            <PaperClipIcon className="mr-1.5 text-gray-400" />
                            <span>{entry.attachments.length} Adjunto(s)</span>
                        </div>
                    )}
                  </>
                )}
            </div>
            {entry.assignees && entry.assignees.length > 0 && (
                <div className="flex-shrink-0" title={`Asignado a: ${entry.assignees.map(a => a.fullName).join(', ')}`}>
                    <div className="flex -space-x-2 overflow-hidden">
                        {entry.assignees.slice(0,3).map(assignee => (
                            <img
                                key={assignee.id}
                                className="inline-block h-7 w-7 rounded-full ring-2 ring-white"
                                src={assignee.avatarUrl}
                                alt={assignee.fullName}
                            />
                        ))}
                    </div>
                     {entry.assignees.length > 3 && (
                      <span className="text-xs font-semibold z-10 bg-gray-200 rounded-full px-1.5 py-0.5 -ml-2">+{entry.assignees.length - 3}</span>
                    )}
                </div>
            )}
        </div>
      </div>
    </Card>
  );
};

export default EntryCard;