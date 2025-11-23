'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CupSoda, Loader2, Eye, EyeOff } from 'lucide-react';
import { authenticate } from './actions';

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        setError('');

        const result = await authenticate(undefined, formData);

        if (result === 'success') {
            router.push('/pos');
            router.refresh();
        } else {
            setError(result || 'Nama pengguna atau kata sandi salah');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-primary-500 to-secondary-700 p-4 relative overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-300/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary-400/20 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
            </div>

            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md p-8 sm:p-10 space-y-8 border border-white/20 relative z-10">
                <div className="text-center space-y-3">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-linear-to-br from-primary-400 to-primary-600 text-white mb-4 shadow-lg shadow-primary-500/30">
                        <img src="/esteh.png" alt="Teh Barudak Indonesia" className="w-12 h-12 object-contain" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-secondary-900 tracking-tight">Teh Barudak</h1>
                    <p className="text-secondary-500 text-sm">Masuk ke akun Anda</p>
                </div>

                <form action={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-secondary-700 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-primary-500 rounded-full"></span>
                            Nama Pengguna
                        </label>
                        <input
                            name="username"
                            type="text"
                            required
                            className="w-full px-4 py-3.5 rounded-xl border-2 border-secondary-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all bg-white hover:border-secondary-300"
                            placeholder="Masukkan nama pengguna"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-secondary-700 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-primary-500 rounded-full"></span>
                            Kata Sandi
                        </label>
                        <div className="relative">
                            <input
                                name="password"
                                type={showPassword ? "text" : "password"}
                                required
                                className="w-full px-4 py-3.5 pr-12 rounded-xl border-2 border-secondary-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all bg-white hover:border-secondary-300"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-secondary-400 hover:text-secondary-600 transition-colors rounded-lg hover:bg-secondary-50"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm text-center font-medium animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center justify-center gap-2">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                                {error}
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 rounded-xl bg-linear-to-r from-primary-500 to-primary-600 text-white font-bold shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base relative overflow-hidden"
                    >
                        {loading && (
                            <div className="absolute inset-0 bg-primary-600 flex items-center justify-center">
                                <Loader2 className="animate-spin" size={24} />
                            </div>
                        )}
                        <span className={loading ? 'invisible' : ''}>Masuk</span>
                        {!loading && <span className="text-lg">→</span>}
                    </button>
                </form>

                <div className="text-center text-xs text-secondary-400 pt-6">
                    &copy; 2025 Teh Barudak Indonesia. All rights reserved.
                </div>
            </div>
        </div>
    );
}
