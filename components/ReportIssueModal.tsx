import React, { useState, useEffect } from 'react';
import { IssueCategory } from '../types';
import Modal from './Modal';

interface ReportIssueModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { category: IssueCategory; description: string; patrimonyNumber?: string; photoUrl?: string; }) => void;
    roomName: string;
    isLoading: boolean;
}

const ReportIssueModal: React.FC<ReportIssueModalProps> = ({ isOpen, onClose, onSubmit, roomName, isLoading }) => {
    const [category, setCategory] = useState<IssueCategory>(IssueCategory.EQUIPMENT_MALFUNCTION);
    const [description, setDescription] = useState('');
    const [patrimonyNumber, setPatrimonyNumber] = useState('');
    const [photoUrl, setPhotoUrl] = useState('');
    
    useEffect(() => {
        if (!isOpen) {
            setCategory(IssueCategory.EQUIPMENT_MALFUNCTION);
            setDescription('');
            setPatrimonyNumber('');
            setPhotoUrl('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (description.trim()) {
            onSubmit({
                category,
                description,
                patrimonyNumber: patrimonyNumber || undefined,
                photoUrl: photoUrl || undefined,
            });
        }
    };

    const categoryLabels: Record<IssueCategory, string> = {
        [IssueCategory.CLEANLINESS]: 'Limpeza',
        [IssueCategory.EQUIPMENT_MALFUNCTION]: 'Equipamento com Defeito',
        [IssueCategory.DAMAGED_PROPERTY]: 'Patrimônio Danificado',
        [IssueCategory.OTHER]: 'Outro',
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Reportar Problema">
            <p className="mb-6 text-gray-600">Você está reportando um problema para a sala: <span className="font-semibold">{roomName}</span></p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                    <select
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value as IssueCategory)}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                        {Object.entries(categoryLabels).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                </div>
                 <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Descrição do Problema</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                        placeholder="Descreva o problema em detalhes. Ex: A lâmpada sobre a mesa principal está piscando."
                    />
                </div>
                 <div>
                    <label htmlFor="patrimonyNumber" className="block text-sm font-medium text-gray-700 mb-1">Nº de Patrimônio (Opcional)</label>
                    <input
                        type="text"
                        id="patrimonyNumber"
                        value={patrimonyNumber}
                        onChange={(e) => setPatrimonyNumber(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Se aplicável, informe o número de patrimônio do item."
                    />
                </div>
                <div>
                    <label htmlFor="photoUrl" className="block text-sm font-medium text-gray-700 mb-1">URL da Foto (Opcional)</label>
                    <input
                        type="url"
                        id="photoUrl"
                        value={photoUrl}
                        onChange={(e) => setPhotoUrl(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Cole um link para uma imagem do problema."
                    />
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors">Cancelar</button>
                    <button type="submit" disabled={isLoading || !description.trim()} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed flex items-center justify-center transition-colors min-w-[150px]">
                        {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : 'Enviar Relato'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ReportIssueModal;