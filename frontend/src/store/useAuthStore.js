import { create } from 'zustand';

const safeParseJSON = (str) => {
    try {
        return str ? JSON.parse(str) : null;
    } catch {
        return null;
    }
};

const isValidUser = (user) => {
    return Boolean(user && typeof user === 'object' && user.id && user.name && user.role);
};

const getStoredAuth = () => {
    const user = safeParseJSON(localStorage.getItem('user'));
    const token = localStorage.getItem('token') || null;

    if (!isValidUser(user) || !token || token === 'undefined' || token === 'null') {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        return { user: null, token: null };
    }

    return { user, token };
};

const initialAuth = getStoredAuth();

const useAuthStore = create((set) => ({
    user: initialAuth.user,
    token: initialAuth.token,

    login: (userData, token) => {
        if (!isValidUser(userData) || !token) {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            set({ user: null, token: null });
            return;
        }

        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);
        set({ user: userData, token });
    },

    logout: () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        set({ user: null, token: null });
    },
}));

export default useAuthStore;
