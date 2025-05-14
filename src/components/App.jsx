// --- START OF FILE App.jsx ---

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
        const guardado = localStorage.getItem("ajustes_temperatura");
        return guardado !== null ? parseFloat(guardado) : TEMP_POR_DEFECTO;
    });
    const [topP, setTopP] = useState(() => {
        const guardado = localStorage.getItem("ajustes_topP");
        return guardado !== null ? parseFloat(guardado) : TOPP_POR_DEFECTO;
    });
    const [idioma, setIdioma] = useState(() => localStorage.getItem("ajustes_idioma") || IDIOMA_POR_DEFECTO);

    useEffect(() => {
        const root = document.documentElement;
        root.classList.remove(theme === 'dark' ? 'light' : 'dark-mode');
        root.classList.add(theme === 'dark' ? 'dark-mode' : 'light');
        localStorage.setItem('theme', theme);
    }, [theme]);

    const cambiarTema = useCallback(() => setTheme(prev => prev === 'light' ? 'dark' : 'light'), []);
    const toggleMobileMenu = useCallback(() => setIsMobileMenuOpen(prev => !prev), []);

    const verificarAutenticacion = useCallback(async () => {
         setIsLoadingAuth(true);
         try {
             const respuesta = await fetch(`${BACKEND_BASE_URL}/api/verify-auth`, {
                 method: 'GET', credentials: 'include', headers: { 'Accept': 'application/json' }
             });
             if (respuesta.ok) {
                 const datos = await respuesta.json();
                 setIsAuthenticated(true); setCurrentUser(datos.user);
             } else {
                 setIsAuthenticated(false); setCurrentUser(null);
                 setHistorialConversaciones([]); setListaArchivosUsuario([]);
                 setMensajesConversacionActiva([]); setIdConversacionActiva(null);
             }
         } catch (error) {
             console.error("[Auth Verify] Error fetch:", error);
             setIsAuthenticated(false); setCurrentUser(null);
         } finally { setIsLoadingAuth(false); }
     }, []);

     useEffect(() => { verificarAutenticacion(); }, [verificarAutenticacion]);
     useEffect(() => { localStorage.setItem("ajustes_temperatura", temperatura.toString()); }, [temperatura]);
     useEffect(() => { localStorage.setItem("ajustes_topP", topP.toString()); }, [topP]);
     useEffect(() => { localStorage.setItem("ajustes_idioma", idioma); }, [idioma]);

    const cargarDatosUsuario = useCallback(async (forzarReverificacion = false) => {
        if (!isAuthenticated || !currentUser) {
            if(forzarReverificacion) await verificarAutenticacion();
            else {
                setHistorialConversaciones([]); setListaArchivosUsuario([]);
                setMensajesConversacionActiva([]); setIdConversacionActiva(null);
            }
            return;
        }
        console.log("[App] Cargando datos de usuario...");
        try {
            const [convRes, filesRes] = await Promise.all([
                 fetch(`${BACKEND_BASE_URL}/api/conversations`, { credentials: 'include' }),
                 fetch(`${BACKEND_BASE_URL}/api/files`, { credentials: 'include' })
            ]);
            if (convRes.ok) setHistorialConversaciones(await convRes.json().then(d => Array.isArray(d) ? d.map(c=>({id:c.id, titulo:c.titulo})) : []));
            else { console.error("[Data Load] Error conv:", convRes.status, await convRes.text().catch(()=>"")); if(convRes.status === 401 || convRes.status === 403) await verificarAutenticacion(); }
            if (filesRes.ok) setListaArchivosUsuario(await filesRes.json().then(d => Array.isArray(d) ? d.map(f=>({name:f.name, displayName:f.originalName, seleccionado:false, esNuevo:false})) : []));
            else { console.error("[Data Load] Error files:", filesRes.status, await filesRes.text().catch(()=>"")); if(filesRes.status === 401 || filesRes.status === 403) await verificarAutenticacion(); }
        } catch (error) {
            console.error("[Data Load] Error fetch carga datos:", error);
            // No limpiar conversación activa si falla una recarga de fondo
        }
    }, [isAuthenticated, currentUser, verificarAutenticacion]);

    useEffect(() => {
        if (isAuthenticated) cargarDatosUsuario();
    }, [isAuthenticated, cargarDatosUsuario]);

    const manejarLogout = useCallback(async () => {
        try { await fetch(`${BACKEND_BASE_URL}/api/logout`, { method: 'POST', credentials: 'include' }); }
        catch (error) { console.error("[Logout] Error fetch:", error); }
        finally { setIsAuthenticated(false); setIsMobileMenuOpen(false); }
    }, []);

    // **** MODIFICACIÓN CLAVE AQUÍ ****
    // Lógica centralizada para cargar/seleccionar una conversación.
    // `convId` puede ser `null` para limpiar la conversación activa.
    const seleccionarConversacionActiva = useCallback(async (convId) => {
        if (convId === null) {
            setMensajesConversacionActiva([]);
            setIdConversacionActiva(null);
            return; // Simplemente limpia si convId es null
        }
        if (!convId) return; // No hacer nada si es undefined o vacío

        console.log(`[App] Seleccionando conversación ${convId}`);
        try {
            const respuesta = await fetch(`${BACKEND_BASE_URL}/api/conversations/${convId}/messages`, {
                credentials: 'include',
            });

            if (!respuesta.ok) {
                const errorData = await respuesta.json().catch(() => ({ error: `Error ${respuesta.status}` }));
                console.error("[App] Error API cargando mensajes:", errorData.error);
                // Podrías tener un estado de error global para mostrar al usuario
                setMensajesConversacionActiva([]);
                setIdConversacionActiva(convId); // Mantener el ID para saber qué falló
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
                id: msg.id, // Importante para el `key` en React y manejo de TTS
                role: msg.rol === 'user' ? 'user' : 'model',
                text: msg.tipo_mensaje === 'image'
                    ? (msg.texto.includes('Error') || (msg.texto === `${BACKEND_BASE_URL}${msg.texto}`) ? '' : msg.texto.substring(msg.texto.lastIndexOf('/') + 1).replace(/[-_]/g, ' ').replace(/\.[^/.]+$/, "")) // Título simple de la imagen o vacío
                    : msg.texto || '',
                imageUrl: msg.tipo_mensaje === 'image' ? msg.texto : null,
                fileName: msg.tipo_mensaje === 'image' ? (msg.texto.substring(msg.texto.lastIndexOf('/') + 1)) : null,
                isImage: msg.tipo_mensaje === 'image',
                date: msg.fecha_envio ? new Date(msg.fecha_envio) : new Date(), // Asegurar objeto Date
                esError: !!msg.es_error,
            }));

            setMensajesConversacionActiva(mensajesFormateados);
            setIdConversacionActiva(convId);

        } catch (error) {
            console.error("[App] Error seleccionando conversación activa:", error);
            // Propagar el error para que Historial.jsx pueda mostrarlo si es necesario
            throw error;
        }
        
    }, []);
    // **** FIN DE MODIFICACIÓN CLAVE ****

    const seleccionarArchivo = useCallback((nombre) => {
        setListaArchivosUsuario(prev => prev.map(a => a.name === nombre ? { ...a, seleccionado: !a.seleccionado } : a));
    }, []);

    const manejarCambioInputArchivo = useCallback((e) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            const pdfs = files.filter(f => f.type === 'application/pdf');
            if (pdfs.length !== files.length) alert(idioma === 'en' ? "Only PDF files allowed." : "Solo PDF.");
            setArchivosPdfNuevos(pdfs);
        } else setArchivosPdfNuevos([]);
        if (e.target) e.target.value = null;
    }, [idioma]);

    const refrescarArchivos = useCallback(async (preservarSelecciones = true) => {
        if (!isAuthenticated) return;
        const seleccionados = preservarSelecciones ? new Map(listaArchivosUsuario.filter(f=>f.seleccionado && !f.esNuevo).map(f=>[f.name,true])) : new Map();
        try {
            const res = await fetch(`${BACKEND_BASE_URL}/api/files`, { credentials: 'include' });
            if (res.ok) {
                const datos = await res.json();
                setListaArchivosUsuario(Array.isArray(datos) ? datos.map(f=>({name:f.name, displayName:f.originalName, seleccionado: !!seleccionados.get(f.name), esNuevo:false})) : []);
            } else { if (res.status === 401 || res.status === 403) await verificarAutenticacion(); else console.error("[Refresh Files] Error:", res.status); }
        } catch (err) { console.error("[Refresh Files] Error fetch:", err); }
    }, [isAuthenticated, listaArchivosUsuario, verificarAutenticacion]);

    const limpiarNuevosPdfsYRefrescar = useCallback(async () => {
         setArchivosPdfNuevos([]);
         await refrescarArchivos(true);
     }, [refrescarArchivos]);

     useEffect(() => {
        const handleKeyDown = (e) => {
            if (!e?.key) return;
            if (e.key === 'Escape' && isMobileMenuOpen) { toggleMobileMenu(); return; }
            if (e.key.toLowerCase() === 'f' && !(document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement)) {
                e.preventDefault(); setLeerEnVozAltaActivado(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isMobileMenuOpen, toggleMobileMenu]);

    useEffect(() => {
        const handleResize = () => { if (window.innerWidth >= 768) setIsMobileMenuOpen(false); };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (isLoadingAuth) {
        return <div className="flex justify-center items-center h-screen bg-base text-primary text-xl">Cargando...</div>;
    }

    if (!isAuthenticated) {
        return <Login onLoginSuccess={verificarAutenticacion} backendUrl={BACKEND_BASE_URL} />;
    }

    return (
        <div className="relative flex flex-col md:flex-row h-screen bg-base text-primary md:divide-x border-divider overflow-hidden">
            {isMobileMenuOpen && ( <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden" onClick={toggleMobileMenu} aria-hidden="true" ></div> )}
            <Historial
                theme={theme} cambiarTema={cambiarTema}
                historial={historialConversaciones} establecerHistorial={setHistorialConversaciones}
                // **** MODIFICACIÓN CLAVE AQUÍ: Pasar la función centralizada ****
                onSeleccionarConversacion={seleccionarConversacionActiva}
                // Mantener `idConversacionActiva` para resaltado y lógica local en Historial
                idConversacionActiva={idConversacionActiva}
                establecerConversacionOriginal={setMensajesConversacionActiva} // Renombrar para claridad
                establecerIdConversacionActivaOriginal={setIdConversacionActiva} // Renombrar para claridad
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
                refrescarHistorial={cargarDatosUsuario}
                leerEnVozAltaActivado={leerEnVozAltaActivado}
                toggleMobileMenu={toggleMobileMenu}
                backendUrl={BACKEND_BASE_URL}
            />
        </div>
    );
};
export default App;
// --- END OF FILE App.jsx ---