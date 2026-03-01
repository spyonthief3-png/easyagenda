
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { AuditLog } from '../../types';
import { Link } from 'react-router-dom';

const AuditLogPage: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchLogs = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await api.getAuditLogs();
            setLogs(data);
        } catch (error) {
            console.error("Failed to fetch audit logs:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link to="/admin" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </Link>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Logs de Auditoria</h1>
            </div>
            
             {isLoading ? (
                <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div></div>
             ) : (
                <>
                    {/* MOBILE LIST */}
                    <div className="md:hidden space-y-3">
                        {logs.length > 0 ? logs.map(log => (
                            <div key={log.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">{log.entity}: {log.entityId}</span>
                                    <span className="text-[10px] text-gray-400">{new Date(log.createdAt).toLocaleString('pt-BR')}</span>
                                </div>
                                <h3 className="font-bold text-gray-900 text-sm mb-1">{log.actor.name}</h3>
                                <div className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded font-mono text-[10px] uppercase">
                                    {log.action}
                                </div>
                            </div>
                        )) : (
                            <p className="text-center py-10 text-gray-400">Nenhum log encontrado.</p>
                        )}
                    </div>

                    {/* DESKTOP TABLE */}
                    <div className="hidden md:block bg-white shadow-md rounded-xl overflow-hidden border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Data</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Ator</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Ação</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Entidade</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {logs.map(log => (
                                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-medium">
                                            {new Date(log.createdAt).toLocaleString('pt-BR')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{log.actor.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                             <span className="font-mono text-[10px] bg-gray-100 px-2 py-1 rounded text-gray-600 uppercase font-bold">{log.action}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400 font-medium">
                                            {log.entity} <span className="text-gray-300 mx-1">/</span> {log.entityId}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

export default AuditLogPage;
