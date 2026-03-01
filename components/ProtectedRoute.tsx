
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { ROLE } from '../types';

interface ProtectedRouteProps {
    children: React.ReactElement;
    roles?: ROLE[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
    const { isAuthenticated, user } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    
    if (roles && user && !roles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;