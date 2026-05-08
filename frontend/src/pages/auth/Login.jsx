import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import { authService } from '../../services';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const login = useAuthStore(state => state.login);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const result = await authService.login({ email, password });
            const user = result?.data?.user;
            const token = result?.data?.token;

            if (!user || !token) {
                throw new Error(result?.message || 'Đăng nhập thất bại');
            }

            login(user, token);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Đăng nhập thất bại');
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
                <h2 className="text-2xl font-extrabold text-center mb-6 text-slate-800">Đăng nhập Hệ thống</h2>
                {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Địa chỉ Email</label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition bg-slate-50 focus:bg-white"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="VD: user@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mật khẩu</label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition bg-slate-50 focus:bg-white"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Nhập tối thiểu 6 ký tự"
                        />
                    </div>

                    <button type="submit" className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-blue-600 transition shadow-lg shadow-blue-500/30 active:scale-95">
                        Xác nhận Đăng nhập
                    </button>
                </form>

                <p className="mt-8 text-center text-sm text-slate-500">
                    Chưa có tài khoản? <Link to="/register" className="text-primary font-semibold hover:underline">Đăng ký ngay</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
