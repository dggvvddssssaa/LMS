import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

/**
 * ProtectedRoute — wraps routes that require authentication and optional role checks.
 * 
 * Usage:
 *   <Route element={<ProtectedRoute />}> ... child routes ... </Route>
 *   <Route element={<ProtectedRoute roles={['admin']} />}> ... </Route>
 */
const ProtectedRoute = ({ children, roles }) => {
    const { user } = useAuthStore();
    const location = useLocation();

    // Not logged in → redirect to login, preserve intended destination
    if (!user) {
        const redirectUrl = location.pathname + location.search;
        return <Navigate to={`/login?from=${encodeURIComponent(redirectUrl)}`} state={{ from: redirectUrl }} replace />;
    }

    // Role check (if roles array specified)
    if (roles && roles.length > 0) {
        const userRole = (user.role || '').toLowerCase();
        const allowed = roles.some(r => {
            const role = r.toLowerCase();
            // Handle teacher/instructor alias
            if (role === 'instructor' || role === 'teacher') {
                return userRole === 'instructor' || userRole === 'teacher';
            }
            return userRole === role;
        });

        if (!allowed) {
            return (
                <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
                    <div className="text-6xl mb-4">🚫</div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Không có quyền truy cập</h2>
                    <p className="text-slate-500 mb-6">Bạn không có quyền truy cập vào trang này.</p>
                    <Navigate to="/dashboard" replace />
                </div>
            );
        }
    }

    return children || <Navigate to="/dashboard" replace />;
};

export default ProtectedRoute;
