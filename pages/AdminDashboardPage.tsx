
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AdminDashboardPage: React.FC = () => {
    const { user } = useAuth();

    const adminActions = [
        { name: 'Gerenciar Salas', description: 'Adicionar, editar ou remover salas.', link: '/admin/rooms' },
        { name: 'Gerenciar Reservas', description: 'Visualizar e gerenciar todas as reservas.', link: '/admin/bookings' },
        { name: 'Gerenciar Usuários', description: 'Administrar contas e perfis de usuários.', link: '/admin/users' },
        { name: 'Feriados e Bloqueios', description: 'Definir dias não úteis e bloquear horários.', link: '/admin/holidays-blackouts' },
        { name: 'Relatórios de Uso', description: 'Visualizar estatísticas e métricas de uso.', link: '/admin/reports' },
        { name: 'Gerenciar Problemas', description: 'Revisar e resolver problemas relatados nas salas.', link: '/admin/issues' },
        { name: 'Ver Logs de Auditoria', description: 'Acompanhar todas as ações críticas do sistema.', link: '/admin/audit-logs' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Painel do Administrador</h1>
                <p className="text-lg text-gray-600 mt-1">Bem-vindo(a), {user?.name}. Gerencie o sistema a partir daqui.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {adminActions.map(action => (
                     <Link to={action.link} key={action.name} className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all">
                         <div>
                            <h2 className="text-lg font-semibold text-gray-800">{action.name}</h2>
                            <p className="text-sm text-gray-500 mt-1">{action.description}</p>
                         </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default AdminDashboardPage;
