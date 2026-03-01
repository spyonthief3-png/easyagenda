
import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROLE } from '../types';

const Header: React.FC = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);

    const handleLogout = () => {
        logout();
        setIsProfileMenuOpen(false);
        setIsMobileMenuOpen(false);
        navigate('/login');
    };
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setIsProfileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const activeLinkClass = "bg-gray-700 text-white";
    const inactiveLinkClass = "text-gray-300 hover:bg-gray-700 hover:text-white";
    const linkClasses = `px-3 py-2 rounded-md text-sm font-medium transition-colors`;
    const mobileLinkClasses = `block px-3 py-2 rounded-md text-base font-medium`;

    const navLinks = (
        <>
            <NavLink to="/" end className={({isActive}) => `${linkClasses} ${isActive ? activeLinkClass : inactiveLinkClass}`} onClick={() => setIsMobileMenuOpen(false)}>
                Agendar Sala
            </NavLink>
            <NavLink to="/find-slot" className={({isActive}) => `${linkClasses} ${isActive ? activeLinkClass : inactiveLinkClass}`} onClick={() => setIsMobileMenuOpen(false)}>
                Encontrar Horário
            </NavLink>
            <NavLink to="/my-bookings" className={({isActive}) => `${linkClasses} ${isActive ? activeLinkClass : inactiveLinkClass}`} onClick={() => setIsMobileMenuOpen(false)}>
                Minhas Reservas
            </NavLink>
            {user?.role === ROLE.ADMIN && (
                <NavLink to="/admin" className={({isActive}) => `${linkClasses} ${isActive ? activeLinkClass : inactiveLinkClass}`} onClick={() => setIsMobileMenuOpen(false)}>
                    Admin
                </NavLink>
            )}
        </>
    );
    
    const mobileNavLinks = (
        <>
            <NavLink to="/" end className={({isActive}) => `${mobileLinkClasses} ${isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`} onClick={() => setIsMobileMenuOpen(false)}>
                Agendar Sala
            </NavLink>
            <NavLink to="/find-slot" className={({isActive}) => `${mobileLinkClasses} ${isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`} onClick={() => setIsMobileMenuOpen(false)}>
                Encontrar Horário
            </NavLink>
            <NavLink to="/my-bookings" className={({isActive}) => `${mobileLinkClasses} ${isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`} onClick={() => setIsMobileMenuOpen(false)}>
                Minhas Reservas
            </NavLink>
            {user?.role === ROLE.ADMIN && (
                <NavLink to="/admin" className={({isActive}) => `${mobileLinkClasses} ${isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`} onClick={() => setIsMobileMenuOpen(false)}>
                    Admin
                </NavLink>
            )}
        </>
    );

    const maintenanceNavLinks = (
        <>
            <NavLink to="/maintenance/issues" className={({isActive}) => `${linkClasses} ${isActive ? activeLinkClass : inactiveLinkClass}`} onClick={() => setIsMobileMenuOpen(false)}>
                Chamados
            </NavLink>
            <NavLink to="/maintenance/blocks" className={({isActive}) => `${linkClasses} ${isActive ? activeLinkClass : inactiveLinkClass}`} onClick={() => setIsMobileMenuOpen(false)}>
                Bloquear Salas
            </NavLink>
        </>
    );

    const maintenanceMobileNavLinks = (
        <>
            <NavLink to="/maintenance/issues" className={({isActive}) => `${mobileLinkClasses} ${isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`} onClick={() => setIsMobileMenuOpen(false)}>
                Chamados
            </NavLink>
            <NavLink to="/maintenance/blocks" className={({isActive}) => `${mobileLinkClasses} ${isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`} onClick={() => setIsMobileMenuOpen(false)}>
                Bloquear Salas
            </NavLink>
        </>
    );

    const getNavLinks = (isMobile: boolean) => {
        if (user?.role === ROLE.MAINTENANCE) {
            return isMobile ? maintenanceMobileNavLinks : maintenanceNavLinks;
        }
        return isMobile ? mobileNavLinks : navLinks;
    };

    return (
        <header className="bg-gray-800 shadow-md sticky top-0 z-30">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <Link to="/" className="flex items-center gap-3" onClick={() => setIsMobileMenuOpen(false)}>
                        <img src="https://raw.githubusercontent.com/StackBlitz/stackblitz-images/main/easyagenda-logo.png" alt="EasyAgenda" className="h-10 w-auto object-contain brightness-0 invert" />
                        <span className="text-white text-xl font-bold tracking-tight hidden sm:block">
                            EasyAgenda
                        </span>
                    </Link>
                    
                    <nav className="hidden md:flex items-center space-x-2 lg:space-x-4">
                        {isAuthenticated && user && (
                            <>
                                {getNavLinks(false)}
                                <div className="relative ml-4" ref={profileMenuRef}>
                                    <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors bg-gray-700/50 p-1.5 rounded-lg border border-gray-600">
                                        <img src={user.photoUrl} alt="User avatar" className="w-7 h-7 rounded-full border border-gray-500" />
                                        <span className="text-xs font-semibold hidden lg:block">{user.name}</span>
                                        <svg className={`w-4 h-4 transition-transform ${isProfileMenuOpen ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </button>
                                    {isProfileMenuOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 animate-fade-in-up">
                                            <Link to="/profile" onClick={() => setIsProfileMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Meu Perfil</Link>
                                            <div className="border-t border-gray-100 my-1"></div>
                                            <button
                                                onClick={handleLogout}
                                                className="block w-full text-left px-4 py-2 text-sm text-red-600 font-bold hover:bg-red-50"
                                            >
                                                Sair do Sistema
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </nav>
                    
                    <div className="md:hidden">
                        {isAuthenticated && (
                            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-300 hover:text-white focus:outline-none focus:text-white p-2 rounded-lg hover:bg-gray-700 transition-colors" aria-label="Abrir menu">
                                <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                    {isMobileMenuOpen ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                                    )}
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {isMobileMenuOpen && isAuthenticated && user && (
                <div className="md:hidden bg-gray-800 border-t border-gray-700 animate-fade-in-up">
                    <div className="px-2 pt-2 pb-3 space-y-1">
                        {getNavLinks(true)}
                    </div>
                    <div className="pt-4 pb-3 border-t border-gray-700">
                        <div className="flex items-center px-5">
                            <img src={user.photoUrl} alt="User avatar" className="w-10 h-10 rounded-full border border-gray-600" />
                            <div className="ml-3">
                                <p className="text-base font-bold text-white leading-none mb-1">{user.name}</p>
                                <p className="text-sm font-medium text-gray-400">{user.email}</p>
                            </div>
                        </div>
                        <div className="mt-3 px-2 space-y-1">
                            {/* Fixed truncated mobile menu links */}
                            <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className={`${mobileLinkClasses} text-gray-300 hover:bg-gray-700 hover:text-white`}>
                                Meu Perfil
                            </Link>
                            <button
                                onClick={handleLogout}
                                className={`${mobileLinkClasses} w-full text-left text-red-400 hover:bg-gray-700 hover:text-red-300`}
                            >
                                Sair do Sistema
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

// Fixed missing default export
export default Header;
