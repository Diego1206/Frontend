import React, { useState, useEffect, useCallback } from "react";
import Chat from "./Chat";
import Historial from "./Historial"; 
import Login from "./Login";

const TEMP_POR_DEFECTO = 0.7;
const TOPP_POR_DEFECTO = 0.9;
const IDIOMA_POR_DEFECTO = 'es';

const obtenerTemaInicial = () => {
    if (typeof window !== 'undefined') {
        const storedTheme = window.localStorage.getItem('theme');
        if (storedTheme === 'dark' || storedTheme === 'light') {
            return storedTheme;
        }
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
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
    const [panelLateralAbierto, setPanelLateralAbierto] = useState(true); // For Desktop
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // For Mobile
    const [leerEnVozAltaActivado, setLeerEnVozAltaActivado] = useState(false);

    const [temperatura, setTemperatura] = useState(() => {
        const guardado = localStorage.getItem("ajustes_temperatura");
        return guardado !== null ? parseFloat(guardado) : TEMP_POR_DEFECTO;
    });
    const [topP, setTopP] = useState(() => {
        const guardado = localStorage.getItem("ajustes_topP");
        return guardado !== null ? parseFloat(guardado) : TOPP_POR_DEFECTO;
    });
    const [idioma, setIdioma] = useState(() => {
        return localStorage.getItem("ajustes_idioma") || IDIOMA_POR_DEFECTO;
    });

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark-mode');
            root.classList.remove('light');
        } else {
            root.classList.remove('dark-mode');
            root.classList.add('light');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const cambiarTema = useCallback(() => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    }, []);

    const toggleMobileMenu = useCallback(() => {
        setIsMobileMenuOpen(prev => !prev);
    }, []);

    const verificarAutenticacion = useCallback(async () => {
         setIsLoadingAuth(true);
         try {
             const respuesta = await fetch("https://chat-backend-y914.onrender.com/api/verify-auth", {
                 method: 'GET', credentials: 'include', headers: { 'Accept': 'application/json' }
             });
             if (respuesta.ok) {
                 const datos = await respuesta.json();
                 setIsAuthenticated(true); setCurrentUser(datos.user);
             } else {
                 setIsAuthenticated(false); setCurrentUser(null);
                 setHistorialConversaciones([]);
                 setListaArchivosUsuario([]);
                 setMensajesConversacionActiva([]);
                 setIdConversacionActiva(null);
             }
         } catch (error) {
             console.error("[Auth Verify Frontend] Error en fetch de verificación:", error);
             setIsAuthenticated(false); setCurrentUser(null);
         } finally {
             setIsLoadingAuth(false);
         }
     }, []);

     useEffect(() => {
         verificarAutenticacion();
     }, [verificarAutenticacion]);

     useEffect(() => { localStorage.setItem("ajustes_temperatura", temperatura.toString()); }, [temperatura]);
     useEffect(() => { localStorage.setItem("ajustes_topP", topP.toString()); }, [topP]);
     useEffect(() => { localStorage.setItem("ajustes_idioma", idioma); }, [idioma]);

    const cargarDatosUsuario = useCallback(async () => {
        if (!isAuthenticated || !currentUser) {
            setHistorialConversaciones([]); setListaArchivosUsuario([]);
            setMensajesConversacionActiva([]); setIdConversacionActiva(null);
            return;
        };
        console.log("[App] Cargando datos de usuario..."); // Log for debugging
        let huboErrorCarga = false;
        try {
            const [respuestaConv, respuestaArchivos] = await Promise.all([
                 // --- MODIFIED: Use relative paths ---
                 fetch("https://chat-backend-y914.onrender.com/api/conversations", { credentials: 'include' }),
                 fetch("https://chat-backend-y914.onrender.com/api/files", { credentials: 'include' })
            ]);

            if (respuestaConv.ok) {
                const datosConv = await respuestaConv.json();
                console.log("[App] Conversaciones cargadas:", datosConv); // Log for debugging
                setHistorialConversaciones(Array.isArray(datosConv) ? datosConv.map(c => ({ id: c.id, titulo: c.titulo })) : []);
            } else {
                console.error("[Data Load] Error conv:", respuestaConv.status, respuestaConv.statusText);
                setHistorialConversaciones([]); huboErrorCarga = true;
                 if (respuestaConv.status === 401 || respuestaConv.status === 403) {
                     console.log("[Data Load] Auth error cargando conversaciones, reverificando...");
                     await verificarAutenticacion(); // Re-check auth if unauthorized
                 }
            }

            if (respuestaArchivos.ok) {
                  const datosArchivos = await respuestaArchivos.json();
                  console.log("[App] Archivos cargados:", datosArchivos); // Log for debugging
                  setListaArchivosUsuario(Array.isArray(datosArchivos) ? datosArchivos.map(f => ({ name: f.name, displayName: f.originalName, url: '', seleccionado: false, esNuevo: false })) : []);
            } else {
                  console.error("[Data Load] Error files:", respuestaArchivos.status, respuestaArchivos.statusText);
                  setListaArchivosUsuario([]); huboErrorCarga = true;
                  if (respuestaArchivos.status === 401 || respuestaArchivos.status === 403) {
                     console.log("[Data Load] Auth error cargando archivos, reverificando...");
                     await verificarAutenticacion(); // Re-check auth if unauthorized
                 }
            }
        } catch (error) {
            console.error("[Data Load] Error fetch carga datos:", error);
            setHistorialConversaciones([]); setListaArchivosUsuario([]);
            huboErrorCarga = true;
        }

       
        if (huboErrorCarga) {
            setMensajesConversacionActiva([]); setIdConversacionActiva(null);
        }
    }, [isAuthenticated, currentUser, verificarAutenticacion]); 

    useEffect(() => {
        if (isAuthenticated) {
             console.log("[App Effect] Usuario autenticado, llamando a cargarDatosUsuario");
             cargarDatosUsuario();
        } else {
             console.log("[App Effect] Usuario NO autenticado, limpiando datos");
          
            setHistorialConversaciones([]);
            setMensajesConversacionActiva([]);
            setListaArchivosUsuario([]);
            setArchivosPdfNuevos([]);
            setIdConversacionActiva(null);
            setCurrentUser(null); 
        }
        
    }, [isAuthenticated, cargarDatosUsuario]);

    const manejarLogout = useCallback(async () => {
        try {
           
            await fetch("https://chat-backend-y914.onrender.com/api/logout", { method: 'POST', credentials: 'include' });
        } catch (error) {
            console.error("[Logout] Error fetch:", error);
        } finally {
          
            setIsAuthenticated(false);
            setCurrentUser(null);
            setHistorialConversaciones([]);
            setMensajesConversacionActiva([]);
            setListaArchivosUsuario([]);
            setArchivosPdfNuevos([]);
            setIdConversacionActiva(null);
            setIsMobileMenuOpen(false);
            console.log("[Logout] User logged out, state cleared.");
        }
    }, []); // No dependencies needed here as it resets state

    const seleccionarArchivo = useCallback((nombreArchivoUnico) => {
        setListaArchivosUsuario(listaAnterior =>
            listaAnterior.map(archivo =>
                archivo.name === nombreArchivoUnico ? { ...archivo, seleccionado: !archivo.seleccionado } : archivo
            )
        );
    }, []);

    const manejarCambioInputArchivo = useCallback((evento) => {
        const nuevosArchivosArray = Array.from(evento.target.files || []);
        if (nuevosArchivosArray.length > 0) {
             const archivosPdfValidos = nuevosArchivosArray.filter(file => file.type === 'application/pdf');
              if (archivosPdfValidos.length !== nuevosArchivosArray.length) {
                   alert(idioma === 'en' ? "Only PDF files are allowed." : "Solo se permiten archivos PDF.");
              }
            setArchivosPdfNuevos(archivosPdfValidos);
        } else {
             setArchivosPdfNuevos([]);
        }
        if (evento.target) evento.target.value = null;
    }, [idioma]);

    const refrescarArchivos = useCallback(async (preservarSelecciones = true) => {
        if (!isAuthenticated) return;
         let seleccionadosPrev = new Map();
         if(preservarSelecciones && Array.isArray(listaArchivosUsuario)) {
             seleccionadosPrev = new Map(listaArchivosUsuario.filter(f => f && f.seleccionado && !f.esNuevo).map(f => [f.name, true]));
         }
        try {
           
            const respuesta = await fetch("https://chat-backend-y914.onrender.com/api/files", { credentials: 'include' });
            if (respuesta.ok) {
                const datos = await respuesta.json();
                setListaArchivosUsuario(Array.isArray(datos) ? datos.map(archivoServidor => ({ name: archivoServidor.name, displayName: archivoServidor.originalName, url: '', seleccionado: preservarSelecciones ? !!seleccionadosPrev.get(archivoServidor.name) : false, esNuevo: false })) : []);
            } else {
                 if (respuesta.status === 401 || respuesta.status === 403) {
                     console.log("[Refresh Files] Auth error, reverificando...");
                     await verificarAutenticacion();
                 }
                 else { console.error("[Refresh Files] Error:", respuesta.status, respuesta.statusText); }
            }
        } catch (error) { console.error("[Refresh Files] Error fetch:", error); }
    }, [isAuthenticated, listaArchivosUsuario, verificarAutenticacion]); 

     const limpiarNuevosPdfsYRefrescar = useCallback(async () => {
         setArchivosPdfNuevos([]);
         await refrescarArchivos(true);
     }, [refrescarArchivos]);
     useEffect(() => {
        const handleKeyDown = (event) => {
            // Primero: verificamos que event y event.key existan
            if (!event?.key) return;
    
            // Si presionan ESC y el menú móvil está abierto, lo cerramos
            if (event.key === 'Escape' && isMobileMenuOpen) {
                toggleMobileMenu();
                return;
            }
    
            // Si presionan la tecla "f" (fuera de inputs), activar lectura en voz alta
            if (event.key.toLowerCase() === 'f') {
                const activeElement = document.activeElement;
                const isInputFocused = activeElement && 
                    (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA');
                
                if (!isInputFocused) {
                    event.preventDefault(); // evitar efectos raros
                    setLeerEnVozAltaActivado(prev => !prev);
                }
            }
        };
    
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isMobileMenuOpen, toggleMobileMenu, setLeerEnVozAltaActivado]);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) { 
                setIsMobileMenuOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (isLoadingAuth) {
        return <div className="flex justify-center items-center h-screen bg-base text-primary text-xl">Cargando...</div>;
    }

    if (!isAuthenticated) {
        return <Login onLoginSuccess={verificarAutenticacion} />;
    }

    return (
        <div className="relative flex flex-col md:flex-row h-screen bg-base text-primary md:divide-x border-divider overflow-hidden">
          
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
                    onClick={toggleMobileMenu}
                    aria-hidden="true"
                ></div>
            )}

            <Historial
                theme={theme}
                cambiarTema={cambiarTema}
                historial={historialConversaciones}
                establecerHistorial={setHistorialConversaciones}
                establecerConversacion={setMensajesConversacionActiva}
                indiceHistorialActivo={idConversacionActiva}
                establecerIndiceHistorialActivo={setIdConversacionActiva}
                listaArchivosUsuario={listaArchivosUsuario}
                setListaArchivosUsuario={setListaArchivosUsuario} 
                manejarSeleccionArchivo={seleccionarArchivo}
                refrescarListaArchivos={refrescarArchivos}
                estaPanelLateralAbierto={panelLateralAbierto}
                establecerEstaPanelLateralAbierto={setPanelLateralAbierto}
                isMobileMenuOpen={isMobileMenuOpen}
                toggleMobileMenu={toggleMobileMenu}
                temperatura={temperatura}
                establecerTemperatura={setTemperatura}
                topP={topP}
                establecerTopP={setTopP}
                idioma={idioma}
                establecerIdioma={setIdioma}
                manejarLogout={manejarLogout}
                currentUser={currentUser}
            />
            <Chat
                conversacion={mensajesConversacionActiva}
                establecerConversacion={setMensajesConversacionActiva}
                listaArchivosUsuario={listaArchivosUsuario}
                archivosPdfNuevos={archivosPdfNuevos}
                manejarCambioArchivoInput={manejarCambioInputArchivo}
                limpiarArchivosPdfNuevosYRefrescar={limpiarNuevosPdfsYRefrescar}
                indiceHistorialActivo={idConversacionActiva}
                establecerIndiceHistorialActivo={setIdConversacionActiva}
                temperatura={temperatura}
                topP={topP}
                idioma={idioma}
                refrescarHistorial={cargarDatosUsuario} 
                leerEnVozAltaActivado={leerEnVozAltaActivado}
                toggleMobileMenu={toggleMobileMenu}
            />
        </div>
    );
};

export default App;