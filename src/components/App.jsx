import React, { useState, useEffect, useCallback } from "react";
import Chat from "./Chat";
import Historial from "./Historial";
import Login from "./Login";

const TEMP_POR_DEFECTO = 0.7;
const TOPP_POR_DEFECTO = 0.9;
const IDIOMA_POR_DEFECTO = 'es';
const BACKEND_BASE_URL = "https://chat-backend-y914.onrender.com";

const obtenerTemaInicial = () => {
    if (typeof window !== 'undefined') {
        const storedTheme = window.localStorage.getItem('theme');
        if (storedTheme === 'dark' || storedTheme === 'light') return storedTheme;
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    }
    return 'light';
};

export const App = () => {
    const [theme, setTheme] = useState(obtenerTemaInicial);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);

    const [historialConversaciones, setHistorialConversaciones] = useState([]);
    const [mensajesConversacionActiva, setMensajesConversacionActiva] = useState([]);
    const [listaArchivosUsuario, setListaArchivosUsuario] = useState([]);
    const [archivosPdfNuevos, setArchivosPdfNuevos] = useState([]);
    const [idConversacionActiva, setIdConversacionActiva] = useState(null);

    const [panelLateralAbierto, setPanelLateralAbierto] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [leerEnVozAltaActivado, setLeerEnVozAltaActivado] = useState(false);

    const [temperatura, setTemperatura] = useState(() => {
      const val = localStorage.getItem("ajustes_temperatura");
      return val !== null ? parseFloat(val) : TEMP_POR_DEFECTO;
    });
    const [topP, setTopP] = useState(() => {
      const val = localStorage.getItem("ajustes_topP");
      return val !== null ? parseFloat(val) : TOPP_POR_DEFECTO;
    });
    const [idioma, setIdioma] = useState(() => localStorage.getItem("ajustes_idioma") || IDIOMA_POR_DEFECTO);

    useEffect(() => {
        document.documentElement.className = theme === 'dark' ? 'dark-mode' : 'light';
        localStorage.setItem('theme', theme);
    }, [theme]);

    const cambiarTema = useCallback(() => setTheme(prev => prev === 'light' ? 'dark' : 'light'), []);
    const toggleMobileMenu = useCallback(() => setIsMobileMenuOpen(prev => !prev), []);

    const limpiarTodosLosDatosDeUsuario = useCallback(() => {
        console.log("[App] Limpiando TODOS los datos de sesión del usuario.");
        setHistorialConversaciones([]);
        setMensajesConversacionActiva([]);
        setListaArchivosUsuario([]);
        setArchivosPdfNuevos([]);
        setIdConversacionActiva(null);
    }, []);

    const manejarLogout = useCallback(async () => {
        console.log("[App] Iniciando Logout...");
        try {
            await fetch(`${BACKEND_BASE_URL}/api/logout`, { method: 'POST', credentials: 'include' });
        } catch (error) { console.error("[Logout] Error fetch:", error); }
        finally {
            console.log("[App] Finalizando Logout: limpiando estado local.");
            setIsAuthenticated(false);
            setCurrentUser(null);
            setIsMobileMenuOpen(false);
        }
    }, []);

    const verificarAutenticacionYActualizarUsuario = useCallback(async (forzarLimpieza = false) => {
        console.log(`[App Auth] Verificando autenticación. Forzar limpieza: ${forzarLimpieza}`);
        setIsLoadingAuth(true);
        const previousUserId = currentUser?.id;

        if (forzarLimpieza) {
            limpiarTodosLosDatosDeUsuario();
        }
        try {
            const respuesta = await fetch(`${BACKEND_BASE_URL}/api/verify-auth`, {
                method: 'GET', credentials: 'include', headers: { 'Accept': 'application/json' }
            });
            if (respuesta.ok) {
                const datos = await respuesta.json();
                console.log("[App Auth] Verificado, usuario:", datos.user.username);
                if (!currentUser || previousUserId !== datos.user.id || forzarLimpieza) {
                    if (!forzarLimpieza && (!previousUserId || previousUserId !== datos.user.id) ) {
                        limpiarTodosLosDatosDeUsuario();
                    }
                }
                setIsAuthenticated(true);
                setCurrentUser(datos.user);
            } else {
                console.log("[App Auth] Verificación fallida o sin sesión.");
                if (isAuthenticated || currentUser) limpiarTodosLosDatosDeUsuario();
                setIsAuthenticated(false);
                setCurrentUser(null);
                if (respuesta.status === 401 || respuesta.status === 403) manejarLogout();
            }
        } catch (error) {
            console.error("[App Auth] Error fetch:", error);
            if (isAuthenticated || currentUser) limpiarTodosLosDatosDeUsuario();
            setIsAuthenticated(false);
            setCurrentUser(null);
        } finally {
            setIsLoadingAuth(false);
        }
    }, [currentUser, limpiarTodosLosDatosDeUsuario, isAuthenticated, manejarLogout]);


    useEffect(() => {
        verificarAutenticacionYActualizarUsuario();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const cargarHistorialConversaciones = useCallback(async () => {
        if (isAuthenticated && currentUser) {
            console.log(`[App Data] Recargando historial de conversaciones para ${currentUser.username}`);
            try {
                const convRes = await fetch(`${BACKEND_BASE_URL}/api/conversations`, { credentials: 'include' });
                if (convRes.ok) {
                    const nuevasConversaciones = await convRes.json().then(d => Array.isArray(d) ? d.map(c => ({ id: c.id, titulo: c.titulo })) : []);
                    setHistorialConversaciones(nuevasConversaciones);
                    console.log("[App Data] Historial de conversaciones recargado.", nuevasConversaciones);
                } else {
                    console.error("[App Data] Error recargando conversaciones:", convRes.status);
                    if(convRes.status === 401 || convRes.status === 403) manejarLogout();
                }
            } catch (error) {
                console.error("[App Data] Excepción en fetch al recargar conversaciones:", error);
            }
        }
    }, [isAuthenticated, currentUser, manejarLogout]);


    useEffect(() => {
        const cargarDatosDelUsuarioActual = async () => {
            if (isAuthenticated && currentUser) {
                console.log(`[App Data] Cargando datos iniciales para ${currentUser.username}`);
                try {
                    await cargarHistorialConversaciones(); 
                    
                    const filesRes = await fetch(`${BACKEND_BASE_URL}/api/files`, { credentials: 'include' });
                    if (filesRes.ok) {
                        setListaArchivosUsuario(await filesRes.json().then(d => Array.isArray(d) ? d.map(f=>({name:f.name, displayName:f.originalName, seleccionado:false, esNuevo:false})) : []));
                    } else {
                        console.error("[App Data] Error cargando archivos:", filesRes.status);
                        setListaArchivosUsuario([]);
                        if(filesRes.status === 401 || filesRes.status === 403) manejarLogout();
                    }
                } catch (error) { console.error("[App Data] Excepción en fetch de datos iniciales:", error); }
            } else if (!isAuthenticated) {
                limpiarTodosLosDatosDeUsuario();
            }
        };
        cargarDatosDelUsuarioActual();
    // eslint-disable-next-line react-hooks/exhaustive-deps 
    }, [isAuthenticated, currentUser, limpiarTodosLosDatosDeUsuario, cargarHistorialConversaciones]); // Se añade cargarHistorialConversaciones aquí
                                                                                                   // para que se ejecute si la función en sí misma cambia
                                                                                                   // (aunque es estable con useCallback, es una buena práctica).
                                                                                                   // No debería causar bucles infinitos si las dependencias de
                                                                                                   // cargarHistorialConversaciones están bien gestionadas.

    const handleLoginSuccess = useCallback(() => {
        verificarAutenticacionYActualizarUsuario(true);
    }, [verificarAutenticacionYActualizarUsuario]);

    const seleccionarConversacionActiva = useCallback(async (convId) => {
        if (convId === null) { setMensajesConversacionActiva([]); setIdConversacionActiva(null); return; }
        if (!convId) return;
        console.log(`[App] Seleccionando conversación ${convId}`);
        try {
            const respuesta = await fetch(`${BACKEND_BASE_URL}/api/conversations/${convId}/messages`, { credentials: 'include' });
            if (!respuesta.ok) { 
                const errorData = await respuesta.json().catch(() => ({ error: `Error ${respuesta.status}` })); 
                setMensajesConversacionActiva([]); 
                setIdConversacionActiva(convId); 
                throw new Error(errorData.error || `Error ${respuesta.status} cargando mensajes`); 
            }
            const mensajesApi = await respuesta.json();
            if (!Array.isArray(mensajesApi)) {
                console.error("[App] Formato de mensajes inválido", mensajesApi); 
                setMensajesConversacionActiva([]); 
                setIdConversacionActiva(convId);
                throw new Error("Formato de mensajes de la conversación inválido."); 
            }
            const mensajesFormateados = mensajesApi.map(msg => ({ 
                id: msg.id, 
                role: msg.rol === 'user' ? 'user' : 'model', 
                text: msg.tipo_mensaje === 'image' ? (msg.texto.includes('Error') || msg.texto === `${BACKEND_BASE_URL}${msg.texto}` ? '' : msg.texto.substring(msg.texto.lastIndexOf('/') + 1).replace(/[-_]/g, ' ').replace(/\.[^/.]+$/, "")) : msg.texto || '', 
                imageUrl: msg.tipo_mensaje === 'image' ? msg.texto : null, 
                fileName: msg.tipo_mensaje === 'image' ? (msg.texto.substring(msg.texto.lastIndexOf('/') + 1)) : null, 
                isImage: msg.tipo_mensaje === 'image', 
                date: msg.fecha_envio ? new Date(msg.fecha_envio) : new Date(), 
                esError: !!msg.es_error, 
            }));
            setMensajesConversacionActiva(mensajesFormateados);
            setIdConversacionActiva(convId);
        } catch (error) { console.error("[App] Error seleccionando conversación activa:", error); throw error; }
    }, []);

    const seleccionarArchivo = useCallback((nombreArchivoSeleccionado) => {
        setListaArchivosUsuario(prev => prev.map(a => a.name === nombreArchivoSeleccionado ? { ...a, seleccionado: !a.seleccionado } : a));
    }, []);

    const manejarCambioInputArchivo = useCallback((event) => {
        const files = Array.from(event.target.files || []);
        if (files.length > 0) {
            const pdfs = files.filter(f => f.type === 'application/pdf');
            if (pdfs.length !== files.length) alert(idioma === 'es' ? "Solo PDF." : "Only PDF files allowed.");
            setArchivosPdfNuevos(pdfs);
        } else setArchivosPdfNuevos([]);
        if (event.target) event.target.value = null;
    }, [idioma]);

    const refrescarArchivos = useCallback(async (preservarSelecciones = true) => {
        if (!isAuthenticated || !currentUser) return;
        const seleccionados = preservarSelecciones ? new Map(listaArchivosUsuario.filter(f=>f.seleccionado && !f.esNuevo).map(f=>[f.name,true])) : new Map();
        try {
            const res = await fetch(`${BACKEND_BASE_URL}/api/files`, { credentials: 'include' });
            if (res.ok) {
                const datos = await res.json();
                setListaArchivosUsuario(Array.isArray(datos) ? datos.map(f=>({name:f.name, displayName:f.originalName, seleccionado: !!seleccionados.get(f.name), esNuevo:false})) : []);
            } else { 
                if (res.status === 401 || res.status === 403) verificarAutenticacionYActualizarUsuario(true); 
                else console.error("[Refresh Files] Error:", res.status); 
            }
        } catch (err) { console.error("[Refresh Files] Error fetch:", err); }
    }, [isAuthenticated, currentUser, listaArchivosUsuario, verificarAutenticacionYActualizarUsuario]);


    const limpiarNuevosPdfsYRefrescar = useCallback(async () => {
         setArchivosPdfNuevos([]);
         await refrescarArchivos(true);
     }, [refrescarArchivos]);


    const handleKeyDown = useCallback((event) => {
        if (!event?.key) return;
        if (event.key === 'Escape' && isMobileMenuOpen) { toggleMobileMenu(); return; }
        if (event.key.toLowerCase() === 'f' && !(document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement)) {
            event.preventDefault(); setLeerEnVozAltaActivado(prev => !prev);
        }
    }, [isMobileMenuOpen, toggleMobileMenu]);

     useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    useEffect(() => { localStorage.setItem("ajustes_temperatura", temperatura.toString()); }, [temperatura]);
    useEffect(() => { localStorage.setItem("ajustes_topP", topP.toString()); }, [topP]);
    useEffect(() => { localStorage.setItem("ajustes_idioma", idioma); }, [idioma]);

    useEffect(() => {
        const handleResize = () => { if (window.innerWidth >= 768) setIsMobileMenuOpen(false); };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (isLoadingAuth && !currentUser && !isAuthenticated) {
        return <div className="flex justify-center items-center h-screen bg-base text-primary text-xl">Cargando...</div>;
    }

    if (!isAuthenticated) {
        return <Login onLoginSuccess={handleLoginSuccess} backendUrl={BACKEND_BASE_URL} />;
    }

    return (
        <div className="relative flex flex-col md:flex-row h-screen bg-base text-primary md:divide-x border-divider overflow-hidden">
            {isMobileMenuOpen && ( <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden" onClick={toggleMobileMenu} aria-hidden="true" ></div> )}
            <Historial
                theme={theme} cambiarTema={cambiarTema}
                historial={historialConversaciones} establecerHistorial={setHistorialConversaciones}
                onSeleccionarConversacion={seleccionarConversacionActiva}
                idConversacionActiva={idConversacionActiva}
                establecerConversacionOriginal={setMensajesConversacionActiva}
                establecerIdConversacionActivaOriginal={setIdConversacionActiva}
                listaArchivosUsuario={listaArchivosUsuario} setListaArchivosUsuario={setListaArchivosUsuario}
                manejarSeleccionArchivo={seleccionarArchivo} refrescarListaArchivos={refrescarArchivos}
                estaPanelLateralAbierto={panelLateralAbierto} establecerEstaPanelLateralAbierto={setPanelLateralAbierto}
                isMobileMenuOpen={isMobileMenuOpen} toggleMobileMenu={toggleMobileMenu}
                temperatura={temperatura} establecerTemperatura={setTemperatura}
                topP={topP} establecerTopP={setTopP}
                idioma={idioma} establecerIdioma={setIdioma}
                manejarLogout={manejarLogout} currentUser={currentUser}
                backendUrl={BACKEND_BASE_URL}
            />
            <Chat
                conversacion={mensajesConversacionActiva} establecerConversacion={setMensajesConversacionActiva}
                listaArchivosUsuario={listaArchivosUsuario} archivosPdfNuevos={archivosPdfNuevos}
                manejarCambioArchivoInput={manejarCambioInputArchivo}
                limpiarArchivosPdfNuevosYRefrescar={limpiarNuevosPdfsYRefrescar}
                idConversacionActiva={idConversacionActiva} establecerIdConversacionActiva={setIdConversacionActiva}
                temperatura={temperatura} topP={topP} idioma={idioma}
                refrescarHistorial={cargarHistorialConversaciones} // <--- SE PASA LA FUNCIÓN CORRECTA
                leerEnVozAltaActivado={leerEnVozAltaActivado}
                toggleMobileMenu={toggleMobileMenu}
                backendUrl={BACKEND_BASE_URL}
            />
        </div>
    );
};
export default App;