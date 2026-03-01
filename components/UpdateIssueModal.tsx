import React, { useState } from 'react';
import { IssueReport, IssueStatus } from '../types';
import Modal from './Modal';

interface UpdateIssueModalProps {
    isOpen: boolean;
    issue: IssueReport | null;
    onClose: () => void;
    onSave: (issueId: string, data: { status: IssueStatus; resolutionNotes?: string }) => void;
    isLoading: boolean;
}

const UpdateIssueModal: React.FC<UpdateIssueModalProps> = ({ isOpen, issue, onClose, onSave, isLoading }) => {
    const [status, setStatus] = useState<IssueStatus>(issue?.status || IssueStatus.OPEN);
    const [notes, setNotes] = useState(issue?.resolutionNotes || '');

    React.useEffect(() => {
        if (issue) {
            setStatus(issue.status);
            setNotes(issue.resolutionNotes || '');
        }
    }, [issue]);

    if (!isOpen || !issue) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(issue.id, { status, resolutionNotes: notes });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Atualizar Relato de Problema">
            <div className="space-y-4">
                <p><span className="font-semibold">Sala:</span> {issue.room.name}</p>
                <p><span className="font-semibold">Problema:</span> {issue.description}</p>
                
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Novo Status</label>
                        <select id="status" value={status} onChange={e => setStatus(e.target.value as IssueStatus)} className="w-full p-2 border rounded-md bg-white border-gray-300 focus:ring-indigo-500 focus:border-indigo-500">
                            <option value={IssueStatus.OPEN}>Aberto</option>
                            <option value={IssueStatus.IN_PROGRESS}>Em Andamento</option>
                            <option value={IssueStatus.RESOLVED}>Resolvido</option>
                        </select>
                    </div>
                     <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notas da Manutenção / Resolução</label>
                        <textarea 
                            id="notes" 
                            value={notes} 
                            onChange={e => setNotes(e.target.value)} 
                            rows={3} 
                            className="w-full p-2 border rounded-md bg-white border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" 
                            required={status === IssueStatus.RESOLVED}
                            placeholder="Ex: Peça substituída, limpeza realizada..."
                        />
                         {status === IssueStatus.RESOLVED && !notes.trim() && <p className="text-xs text-red-500 mt-1">Notas são obrigatórias ao resolver um chamado.</p>}
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Cancelar</button>
                        <button type="submit" disabled={isLoading || (status === IssueStatus.RESOLVED && !notes.trim())} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 flex items-center justify-center min-w-[120px]">
                           {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : 'Salvar'}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default UpdateIssueModal;