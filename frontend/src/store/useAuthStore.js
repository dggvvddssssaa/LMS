import { create } from 'zustand';

const safeParseJSON = (str) => {
    try {
        return str ? JSON.parse(str) : null;
    } catch (e) {
        return null;
    }
};

const useAuthStore = create((set) => ({
    user: safeParseJSON(localStorage.getItem('user')),
    token: localStorage.getItem('token') || null,

    login: (userData, token) => {
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
