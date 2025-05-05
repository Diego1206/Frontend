import React, { useState } from 'react';
import './Login.css';

const Login = ({ onLoginSuccess }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
         e.preventDefault();
        setError(''); setSuccess(''); setLoading(true);

        if (isRegistering && password !== confirmPassword) {
            setError("Las contraseñas no coinciden."); setLoading(false); return;
        }

      
        const url = isRegistering ? 'https://chat-backend-y914.onrender.com/api/register' : 'https://chat-backend-y914.onrender.com/api/login';
        const body = { username, password };

        try {
            const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), credentials: 'include' });
            const data = await response.json();

            if (response.ok) {
                if (isRegistering) {
                    setSuccess("¡Registro exitoso! Ahora puedes iniciar sesión."); setIsRegistering(false);
                    setUsername(''); setPassword(''); setConfirmPassword('');
                } else {
                    setSuccess("¡Inicio de sesión exitoso!");
                    
                     setTimeout(() => {
                         if (typeof onLoginSuccess === 'function') { onLoginSuccess(); }
                         else { console.error('Login.jsx: onLoginSuccess no es una función'); }
                     }, 100);
                }
            } else {
                setError(data.error || `Error ${response.status}: ${response.statusText || 'Error desconocido'}`);
            }
        } catch (err) {
            console.error(`Login.jsx: Error en fetch ${isRegistering ? 'registro' : 'login'}:`, err);
            setError("Error de red o del servidor. Inténtalo de nuevo.");
        } finally { setLoading(false); }
    };

    return (
        <div className="login-animated-bg">
            <div className="w-full max-w-md p-8 space-y-6 bg-[var(--login-form-bg)] rounded-xl shadow-2xl backdrop-blur-md border border-[var(--login-form-border)]">
                 <h2 className="text-3xl font-bold text-center text-[var(--text-primary)]">
                    {isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}
                </h2>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="username" className="text-sm font-medium text-[var(--text-secondary)] block mb-2">
                            Usuario
                        </label>
                        <input
                            type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} required
                            className="w-full px-4 py-2 rounded-md border text-[var(--text-primary)] bg-[var(--bg-input)] border-[var(--border-input)] focus:outline-none focus:ring-1 focus:ring-[var(--border-input-focus)] placeholder:text-[var(--text-muted)]"
                            placeholder="tu_usuario" autoComplete='username'
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="text-sm font-medium text-[var(--text-secondary)] block mb-2">
                            Contraseña
                        </label>
                        <input
                            type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                            className="w-full px-4 py-2 rounded-md border text-[var(--text-primary)] bg-[var(--bg-input)] border-[var(--border-input)] focus:outline-none focus:ring-1 focus:ring-[var(--border-input-focus)] placeholder:text-[var(--text-muted)]"
                            placeholder="••••••••" autoComplete={isRegistering ? 'new-password' : 'current-password'}
                        />
                    </div>

                    {isRegistering && (
                        <div>
                            <label htmlFor="confirmPassword" className="text-sm font-medium text-[var(--text-secondary)] block mb-2">
                                Confirmar Contraseña
                            </label>
                            <input
                                type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                                className="w-full px-4 py-2 rounded-md border text-[var(--text-primary)] bg-[var(--bg-input)] border-[var(--border-input)] focus:outline-none focus:ring-1 focus:ring-[var(--border-input-focus)] placeholder:text-[var(--text-muted)]"
                                placeholder="••••••••" autoComplete='new-password'
                            />
                        </div>
                    )}

                    {error && <p className="px-3 py-2 text-sm rounded border bg-[var(--bg-error-notification)] text-[var(--text-error)] border-[var(--border-error-notification)]">{error}</p>}
                    {success && !error && <p className="px-3 py-2 text-sm rounded border bg-[var(--bg-success-notification)] text-[var(--text-success)] border-[var(--border-success)]">{success}</p>}

                    <div>
                        <button type="submit" disabled={loading}
                            className="w-full px-4 py-2 text-center rounded-md transition duration-150 ease-in-out bg-[var(--bg-button-primary)] text-[var(--text-button-primary)] hover:bg-[var(--bg-button-primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-surface)] focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">
                            {loading ? (
                                <div className="flex justify-center items-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[var(--text-button-primary)]"></div>
                                     <span className="ml-2">{isRegistering ? 'Registrando...' : 'Iniciando sesión...'}</span>
                                </div>
                            ) : (isRegistering ? 'Registrarse' : 'Entrar')}
                        </button>
                    </div>
                </form>

                <p className="text-sm text-center text-[var(--text-muted)]">
                    {isRegistering ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
                    <button
                        onClick={() => {
                            setIsRegistering(!isRegistering); setError(''); setSuccess('');
                            setUsername(''); setPassword(''); setConfirmPassword('');
                        }}
                        className="ml-1 font-medium text-[var(--text-accent)] hover:text-[var(--text-accent-hover)] focus:outline-none focus:underline">
                        {isRegistering ? 'Inicia sesión' : 'Regístrate'}
                    </button>
                </p>

                 <p className="mt-4 text-xs text-center text-[var(--text-muted)]">
                    Powered by <a href="https://united-its.com" target="_blank" rel="noopener noreferrer" className="text-[var(--text-link)] hover:underline">United ITS</a>
                 </p>
            </div>
        </div>
    );
};

export default Login;