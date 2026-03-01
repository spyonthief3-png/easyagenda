import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { IssueReport, IssueStatus, IssueCategory } from '../types';
import { useAuth } from '../hooks/useAuth';
import { formatDate } from '../utils/date';
import UpdateIssueModal from './UpdateIssueModal';

const statusColors: Record<IssueStatus, string> = {
    [IssueStatus.OPEN]: 'bg-red-100 text-red-800 border-red-200',
    [IssueStatus.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    [IssueStatus.RESOLVED]: 'bg-green-100 text-green-800 border-green-200',
};

const statusLabels: Record<IssueStatus, string> = {
    [IssueStatus.OPEN]: 'Aberto',
    [IssueStatus.IN_PROGRESS]: 'Em Andamento',
    [IssueStatus.RESOLVED]: 'Resolvido',
};

const categoryLabels: Record<IssueCategory, string> = {
    [IssueCategory.CLEANLINESS]: 'Limpeza',
    [IssueCategory.EQUIPMENT_MALFUNCTION]: 'Equipamento',
    [IssueCategory.DAMAGED_PROPERTY]: 'Patrimônio',
    [IssueCategory.OTHER]: 'Outro',
};

interface IssueManagementProps {
    pageTitle: string;
}

const IssueManagement: React.FC<IssueManagementProps> = ({ pageTitle }) => {
    const { user } = useAuth();
    const [issues, setIssues] = useState<IssueReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('');

    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState<IssueReport | null>(null);

    const fetchIssues = useCallback(async (currentFilter: string) => {
        setIsLoading(true);
        try {
            const data = await api.getIssueReports({ status: currentFilter as IssueStatus });
            setIssues(data);
        } catch (error) {
            console.error("Failed to fetch issues:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchIssues(filter);
    }, [filter, fetchIssues]);

    const handleOpenUpdateModal = (issue: IssueReport) => {
        setSelectedIssue(issue);
        setIsUpdateModalOpen(true);
    };
    
    const handleCloseUpdateModal = () => {
        setSelectedIssue(null);
        setIsUpdateModalOpen(false);
    };

    const handleSaveUpdate = async (issueId: string, data: { status: IssueStatus; resolutionNotes?: string }) => {
        if (!user) return;
        setIsSubmitting(true);
        try {
            await api.updateIssueReport(issueId, data, user.id);
            handleCloseUpdateModal();
            fetchIssues(filter); 
        } catch (error) {
            console.error("Failed to update issue:", error);
            alert("Erro ao atualizar o relato.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{pageTitle}</h1>
                <div className="flex items-center gap-2">
                    <label htmlFor="statusFilter" className="font-medium text-xs sm:text-sm text-gray-600 uppercase tracking-wider">Status:</label>
                    <select id="statusFilter" value={filter} onChange={e => setFilter(e.target.value)} className="p-2 text-sm border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white">
                        <option value="">Todos os Status</option>
                        <option value={IssueStatus.OPEN}>Aberto</option>
                        <option value={IssueStatus.IN_PROGRESS}>Em Andamento</option>
                        <option value={IssueStatus.RESOLVED}>Resolvido</option>
                    </select>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                </div>
            ) : (
                <>
                    {/* MOBILE LIST */}
                    <div className="md:hidden space-y-4">
                        {issues.length > 0 ? issues.map(issue => (
                            <div key={issue.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${statusColors[issue.status]}`}>
                                        {statusLabels[issue.status]}
                                    </span>
                                    <span className="text-xs text-gray-400 font-medium">{formatDate(new Date(issue.createdAt))}</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">{issue.room.name}</h3>
                                    <p className="text-xs font-semibold text-indigo-600 uppercase tracking-tight">{categoryLabels[issue.category]}</p>
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">{issue.description}</p>
                                <div className="flex items-center justify-between pt-2">
                                    <span className="text-xs text-gray-500">Por: <span className="font-semibold">{issue.user.name}</span></span>
                                    <button 
                                        onClick={() => handleOpenUpdateModal(issue)}
                                        className="bg-indigo-50 text-indigo-700 font-bold py-2 px-4 rounded-lg text-sm border border-indigo-100 hover:bg-indigo-100 transition-colors"
                                    >
                                        Atualizar
                                    </button>
                                </div>
                                {issue.resolutionNotes && (
                                    <div className="mt-2 text-xs p-2 bg-green-50 text-green-800 rounded border border-green-100">
                                        <strong>Resolução:</strong> {issue.resolutionNotes}
                                    </div>
                                )}
                            </div>
                        )) : (
                            <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-gray-400">Nenhum relato encontrado.</div>
                        )}
                    </div>

                    {/* DESKTOP TABLE */}
                    <div className="hidden md:block bg-white shadow-md rounded-xl overflow-hidden border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Data</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Sala</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Descrição</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-widest">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {issues.length > 0 ? issues.map(issue => (
                                    <tr key={issue.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">{formatDate(new Date(issue.createdAt))}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-gray-900">{issue.room.name}</div>
                                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{categoryLabels[issue.category]}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                                            <p className="truncate font-medium">{issue.description}</p>
                                            <span className="text-[10px] text-gray-400">Relatado por: {issue.user.name}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${statusColors[issue.status]}`}>
                                                {statusLabels[issue.status]}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right">
                                            <button onClick={() => handleOpenUpdateModal(issue)} className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">Atualizar</button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={5} className="text-center py-12 text-gray-400 font-medium">Nenhum registro encontrado.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            <UpdateIssueModal 
                isOpen={isUpdateModalOpen}
                issue={selectedIssue}
                onClose={handleCloseUpdateModal}
                onSave={handleSaveUpdate}
                isLoading={isSubmitting}
            />
        </div>
    );
};

export default IssueManagement;