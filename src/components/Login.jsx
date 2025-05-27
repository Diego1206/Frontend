import React, { useState } from 'react';
import './Login.css'; 
const Login = ({ onLoginSuccess, backendUrl }) => { 
    const [registrando, setRegistrando] = useState(false);
    const [nombreUsuario, setNombreUsuario] = useState('');
    const [contrasena, setContrasena] = useState('');
    const [confirmarContrasena, setConfirmarContrasena] = useState('');
    const [mensajeError, setMensajeError] = useState('');
    const [mensajeExito, setMensajeExito] = useState('');
    const [cargando, setCargando] = useState(false);

    const gestionarEnvio = async (e) => {
        e.preventDefault();
        setMensajeError(''); setMensajeExito(''); setCargando(true);

        if (registrando && contrasena !== confirmarContrasena) {
            setMensajeError("Las contraseñas no coinciden."); setCargando(false); return;
        }

        const urlDestino = registrando ? `${backendUrl}/api/register` : `${backendUrl}/api/login`;
        const cuerpoPeticion = { username: nombreUsuario, password: contrasena }; // Use 'username' and 'password' for backend compatibility

        try {
            const response = await fetch(urlDestino, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpoPeticion), credentials: 'include' });
            const data = await response.json();

            if (response.ok) {
                if (registrando) {
                    setMensajeExito("¡Registro exitoso! Ahora puedes iniciar sesión."); setRegistrando(false);
                    setNombreUsuario(''); setContrasena(''); setConfirmarContrasena('');
                } else {
                    setMensajeExito("¡Inicio de sesión exitoso!");
                    setTimeout(() => {
                        if (typeof onLoginSuccess === 'function') { onLoginSuccess(); }
                        else { console.error('Login.jsx: onLoginSuccess no es una función'); }
                    }, 100);
                }
            } else {
                setMensajeError(data.error || `Error ${response.status}: ${response.statusText || 'Error desconocido'}`);
            }
        } catch (err) {
            console.error(`Login.jsx: Error en fetch ${registrando ? 'registro' : 'login'}:`, err);
            setMensajeError("Error de red o del servidor. Inténtalo de nuevo.");
        } finally { setCargando(false); }
    };

    return (
        <div className="login-animated-bg">
            <div className="w-full max-w-md p-8 space-y-6 bg-[var(--login-form-bg)] rounded-xl shadow-2xl backdrop-blur-md border border-[var(--login-form-border)]">
                 <h2 className="text-3xl font-bold text-center text-[var(--text-primary)]">
                    {registrando ? 'Crear Cuenta' : 'Iniciar Sesión'}
                </h2>

                <form className="space-y-6" onSubmit={gestionarEnvio}>
                    <div>
                        <label htmlFor="username-login" className="text-sm font-medium text-[var(--text-secondary)] block mb-2">
                            Usuario
                        </label>
                        <input
                            type="text" id="username-login" value={nombreUsuario} onChange={(e) => setNombreUsuario(e.target.value)} required
                            className="w-full px-4 py-2 rounded-md border text-[var(--text-primary)] bg-[var(--bg-input)] border-[var(--border-input)] focus:outline-none focus:ring-1 focus:ring-[var(--border-input-focus)] placeholder:text-[var(--text-muted)]"
                            placeholder="tu_usuario" autoComplete='username'
                        />
                    </div>

                    <div>
                        <label htmlFor="password-login" className="text-sm font-medium text-[var(--text-secondary)] block mb-2">
                            Contraseña
                        </label>
                        <input
                            type="password" id="password-login" value={contrasena} onChange={(e) => setContrasena(e.target.value)} required
                            className="w-full px-4 py-2 rounded-md border text-[var(--text-primary)] bg-[var(--bg-input)] border-[var(--border-input)] focus:outline-none focus:ring-1 focus:ring-[var(--border-input-focus)] placeholder:text-[var(--text-muted)]"
                            placeholder="••••••••" autoComplete={registrando ? 'new-password' : 'current-password'}
                        />
                    </div>

                    {registrando && (
                        <div>
                            <label htmlFor="confirmPassword-login" className="text-sm font-medium text-[var(--text-secondary)] block mb-2">
                                Confirmar Contraseña
                            </label>
                            <input
                                type="password" id="confirmPassword-login" value={confirmarContrasena} onChange={(e) => setConfirmarContrasena(e.target.value)} required
                                className="w-full px-4 py-2 rounded-md border text-[var(--text-primary)] bg-[var(--bg-input)] border-[var(--border-input)] focus:outline-none focus:ring-1 focus:ring-[var(--border-input-focus)] placeholder:text-[var(--text-muted)]"
                                placeholder="••••••••" autoComplete='new-password'
                            />
                        </div>
                    )}

                    {mensajeError && <p className="px-3 py-2 text-sm rounded border bg-[var(--bg-error-notification)] text-[var(--text-error)] border-[var(--border-error-notification)]">{mensajeError}</p>}
                    {mensajeExito && !mensajeError && <p className="px-3 py-2 text-sm rounded border bg-[var(--bg-success-notification)] text-[var(--text-success)] border-[var(--border-success)]">{mensajeExito}</p>}

                    <div>
                        <button type="submit" disabled={cargando}
                            className="w-full px-4 py-2 text-center rounded-md transition duration-150 ease-in-out bg-[var(--bg-button-primary)] text-[var(--text-button-primary)] hover:bg-[var(--bg-button-primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-surface)] focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">
                            {cargando ? (
                                <div className="flex justify-center items-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[var(--text-button-primary)]"></div>
                                     <span className="ml-2">{registrando ? 'Registrando...' : 'Iniciando sesión...'}</span>
                                </div>
                            ) : (registrando ? 'Registrarse' : 'Entrar')}
                        </button>
                    </div>
                </form>

                <p className="text-sm text-center text-[var(--text-muted)]">
                    {registrando ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
                    <button
                        onClick={() => {
                            setRegistrando(!registrando); setMensajeError(''); setMensajeExito('');
                            setNombreUsuario(''); setContrasena(''); setConfirmarContrasena('');
                        }}
                        className="ml-1 font-medium text-[var(--text-accent)] hover:text-[var(--text-accent-hover)] focus:outline-none focus:underline">
                        {registrando ? 'Inicia sesión' : 'Regístrate'}
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