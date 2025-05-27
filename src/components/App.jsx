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
        const temaAlmacenado = window.localStorage.getItem('theme');
        if (temaAlmacenado === 'dark' || temaAlmacenado === 'light') return temaAlmacenado;
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    }
    return 'light';
};

export const App = () => {
    const [tema, setTema] = useState(obtenerTemaInicial);
    const [estaAutenticado, setEstaAutenticado] = useState(false);
    const [usuarioActual, setUsuarioActual] = useState(null);
    const [estaCargandoAutenticacion, setEstaCargandoAutenticacion] = useState(true);

    const [conversacionesHistorial, setConversacionesHistorial] = useState([]);
    const [mensajesActivos, setMensajesActivos] = useState([]);
    const [archivosUsuario, setArchivosUsuario] = useState([]);
    const [nuevosArchivosPdf, setNuevosArchivosPdf] = useState([]);
    const [idConvActiva, setIdConvActiva] = useState(null);

    const [panelAbierto, setPanelAbierto] = useState(true);
    const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
    const [lecturaVozActivada, setLecturaVozActivada] = useState(false);

    const [temperatura, setTemperatura] = useState(() => {
      const valor = localStorage.getItem("ajustes_temperatura");
      return valor !== null ? parseFloat(valor) : TEMP_POR_DEFECTO;
    });
    const [topP, setTopP] = useState(() => {
      const valor = localStorage.getItem("ajustes_topP");
      return valor !== null ? parseFloat(valor) : TOPP_POR_DEFECTO;
    });
    const [idioma, setIdioma] = useState(() => localStorage.getItem("ajustes_idioma") || IDIOMA_POR_DEFECTO);

    useEffect(() => {
        document.documentElement.className = tema === 'dark' ? 'dark-mode' : 'light';
        localStorage.setItem('theme', tema);
    }, [tema]);

    const cambiarTemaCallback = useCallback(() => setTema(prev => prev === 'light' ? 'dark' : 'light'), []);
    const alternarMenuMovil = useCallback(() => setMenuMovilAbierto(prev => !prev), []);

    const limpiarDatosUsuario = useCallback(() => {
        console.log("[App] Limpiando TODOS los datos de sesión del usuario.");
        setConversacionesHistorial([]);
        setMensajesActivos([]);
        setArchivosUsuario([]);
        setNuevosArchivosPdf([]);
        setIdConvActiva(null);
    }, []);

    const gestionarLogout = useCallback(async () => {
        console.log("[App] Iniciando Logout...");
        try {
            await fetch(`${BACKEND_BASE_URL}/api/logout`, { method: 'POST', credentials: 'include' });
        } catch (error) { console.error("[Logout] Error fetch:", error); }
        finally {
            console.log("[App] Finalizando Logout: limpiando estado local.");
            setEstaAutenticado(false);
            setUsuarioActual(null);
            setMenuMovilAbierto(false);
        }
    }, []);

    const verificarAuthYActualizarUsuario = useCallback(async (forzarLimpieza = false) => {
        console.log(`[App Auth] Verificando autenticación. Forzar limpieza: ${forzarLimpieza}`);
        setEstaCargandoAutenticacion(true);
        const idUsuarioAnterior = usuarioActual?.id;

        if (forzarLimpieza) {
            limpiarDatosUsuario();
        }
        try {
            const respuesta = await fetch(`${BACKEND_BASE_URL}/api/verify-auth`, {
                method: 'GET', credentials: 'include', headers: { 'Accept': 'application/json' }
            });
            if (respuesta.ok) {
                const datos = await respuesta.json();
                console.log("[App Auth] Verificado, usuario:", datos.user.username);
                if (!usuarioActual || idUsuarioAnterior !== datos.user.id || forzarLimpieza) {
                    if (!forzarLimpieza && (!idUsuarioAnterior || idUsuarioAnterior !== datos.user.id) ) {
                        limpiarDatosUsuario();
                    }
                }
                setEstaAutenticado(true);
                setUsuarioActual(datos.user);
            } else {
                console.log("[App Auth] Verificación fallida o sin sesión.");
                if (estaAutenticado || usuarioActual) limpiarDatosUsuario();
                setEstaAutenticado(false);
                setUsuarioActual(null);
                if (respuesta.status === 401 || respuesta.status === 403) gestionarLogout();
            }
        } catch (error) {
            console.error("[App Auth] Error fetch:", error);
            if (estaAutenticado || usuarioActual) limpiarDatosUsuario();
            setEstaAutenticado(false);
            setUsuarioActual(null);
        } finally {
            setEstaCargandoAutenticacion(false);
        }
    }, [usuarioActual, limpiarDatosUsuario, estaAutenticado, gestionarLogout]);


    useEffect(() => {
        verificarAuthYActualizarUsuario();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const cargarConversaciones = useCallback(async () => {
        if (estaAutenticado && usuarioActual) {
            console.log(`[App Data] Recargando historial de conversaciones para ${usuarioActual.username}`);
            try {
                const respuestaConv = await fetch(`${BACKEND_BASE_URL}/api/conversations`, { credentials: 'include' });
                if (respuestaConv.ok) {
                    const nuevasConversaciones = await respuestaConv.json().then(d => Array.isArray(d) ? d.map(c => ({ id: c.id, titulo: c.titulo })) : []);
                    setConversacionesHistorial(nuevasConversaciones);
                    console.log("[App Data] Historial de conversaciones recargado.", nuevasConversaciones);
                } else {
                    console.error("[App Data] Error recargando conversaciones:", respuestaConv.status);
                    if(respuestaConv.status === 401 || respuestaConv.status === 403) gestionarLogout();
                }
            } catch (error) {
                console.error("[App Data] Excepción en fetch al recargar conversaciones:", error);
            }
        }
    }, [estaAutenticado, usuarioActual, gestionarLogout]);


    useEffect(() => {
        const cargarDatosDelUsuarioActual = async () => {
            if (estaAutenticado && usuarioActual) {
                console.log(`[App Data] Cargando datos iniciales para ${usuarioActual.username}`);
                try {
                    await cargarConversaciones();
                    
                    const respuestaArchivos = await fetch(`${BACKEND_BASE_URL}/api/files`, { credentials: 'include' });
                    if (respuestaArchivos.ok) {
                        setArchivosUsuario(await respuestaArchivos.json().then(d => Array.isArray(d) ? d.map(f=>({name:f.name, displayName:f.originalName, seleccionado:false, esNuevo:false})) : []));
                    } else {
                        console.error("[App Data] Error cargando archivos:", respuestaArchivos.status);
                        setArchivosUsuario([]);
                        if(respuestaArchivos.status === 401 || respuestaArchivos.status === 403) gestionarLogout();
                    }
                } catch (error) { console.error("[App Data] Excepción en fetch de datos iniciales:", error); }
            } else if (!estaAutenticado) {
                limpiarDatosUsuario();
            }
        };
        cargarDatosDelUsuarioActual();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [estaAutenticado, usuarioActual, limpiarDatosUsuario, cargarConversaciones]);

    const alIniciarSesionConExito = useCallback(() => {
        verificarAuthYActualizarUsuario(true);
    }, [verificarAuthYActualizarUsuario]);

    const seleccionarConvActiva = useCallback(async (convId) => {
        if (convId === null) { setMensajesActivos([]); setIdConvActiva(null); return; }
        if (!convId) return;
        console.log(`[App] Seleccionando conversación ${convId}`);
        try {
            const respuesta = await fetch(`${BACKEND_BASE_URL}/api/conversations/${convId}/messages`, { credentials: 'include' });
            if (!respuesta.ok) {
                const datosError = await respuesta.json().catch(() => ({ error: `Error ${respuesta.status}` }));
                setMensajesActivos([]);
                setIdConvActiva(convId);
                throw new Error(datosError.error || `Error ${respuesta.status} cargando mensajes`);
            }
            const mensajesApi = await respuesta.json();
            if (!Array.isArray(mensajesApi)) {
                console.error("[App] Formato de mensajes inválido", mensajesApi);
                setMensajesActivos([]);
                setIdConvActiva(convId);
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
            setMensajesActivos(mensajesFormateados);
            setIdConvActiva(convId);
        } catch (error) { console.error("[App] Error seleccionando conversación activa:", error); throw error; }
    }, []);

    const seleccionarArchivoUsuario = useCallback((nombreArchivoSeleccionado) => {
        setArchivosUsuario(prev => prev.map(a => a.name === nombreArchivoSeleccionado ? { ...a, seleccionado: !a.seleccionado } : a));
    }, []);

    const gestionarCambioInputArchivo = useCallback((evento) => {
        const files = Array.from(evento.target.files || []);
        if (files.length > 0) {
            const pdfs = files.filter(f => f.type === 'application/pdf');
            if (pdfs.length !== files.length) alert(idioma === 'es' ? "Solo se permiten archivos PDF." : "Only PDF files allowed.");
            setNuevosArchivosPdf(pdfs);
        } else setNuevosArchivosPdf([]);
        if (evento.target) evento.target.value = null;
    }, [idioma]);

    const actualizarArchivosUsuario = useCallback(async (preservarSelecciones = true) => {
        if (!estaAutenticado || !usuarioActual) return;
        const seleccionados = preservarSelecciones ? new Map(archivosUsuario.filter(f=>f.seleccionado && !f.esNuevo).map(f=>[f.name,true])) : new Map();
        try {
            const res = await fetch(`${BACKEND_BASE_URL}/api/files`, { credentials: 'include' });
            if (res.ok) {
                const datos = await res.json();
                setArchivosUsuario(Array.isArray(datos) ? datos.map(f=>({name:f.name, displayName:f.originalName, seleccionado: !!seleccionados.get(f.name), esNuevo:false})) : []);
            } else {
                if (res.status === 401 || res.status === 403) verificarAuthYActualizarUsuario(true);
                else console.error("[Refresh Files] Error:", res.status);
            }
        } catch (err) { console.error("[Refresh Files] Error fetch:", err); }
    }, [estaAutenticado, usuarioActual, archivosUsuario, verificarAuthYActualizarUsuario]);


    const limpiarNuevosPdfYActualizar = useCallback(async () => {
         setNuevosArchivosPdf([]);
         await actualizarArchivosUsuario(true);
     }, [actualizarArchivosUsuario]);


    const gestionarTeclaPulsada = useCallback((evento) => {
        if (!evento?.key) return;
        if (evento.key === 'Escape' && menuMovilAbierto) { alternarMenuMovil(); return; }
        if (evento.key.toLowerCase() === 'f' && !(document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement)) {
            evento.preventDefault(); setLecturaVozActivada(prev => !prev);
        }
    }, [menuMovilAbierto, alternarMenuMovil]);

     useEffect(() => {
        window.addEventListener('keydown', gestionarTeclaPulsada);
        return () => window.removeEventListener('keydown', gestionarTeclaPulsada);
    }, [gestionarTeclaPulsada]);

    useEffect(() => { localStorage.setItem("ajustes_temperatura", temperatura.toString()); }, [temperatura]);
    useEffect(() => { localStorage.setItem("ajustes_topP", topP.toString()); }, [topP]);
    useEffect(() => { localStorage.setItem("ajustes_idioma", idioma); }, [idioma]);

    useEffect(() => {
        const gestionarRedimension = () => { if (window.innerWidth >= 768) setMenuMovilAbierto(false); };
        window.addEventListener('resize', gestionarRedimension);
        return () => window.removeEventListener('resize', gestionarRedimension);
    }, []);

    if (estaCargandoAutenticacion && !usuarioActual && !estaAutenticado) {
        return <div className="flex justify-center items-center h-screen bg-base text-primary text-xl">Cargando...</div>;
    }

    if (!estaAutenticado) {
        return <Login onLoginSuccess={alIniciarSesionConExito} backendUrl={BACKEND_BASE_URL} />;
    }

    return (
        <div className="relative flex flex-col md:flex-row h-screen bg-base text-primary md:divide-x border-divider overflow-hidden">
            {menuMovilAbierto && ( <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden" onClick={alternarMenuMovil} aria-hidden="true" ></div> )}
            <Historial
                theme={tema} cambiarTema={cambiarTemaCallback}
                historial={conversacionesHistorial} establecerHistorial={setConversacionesHistorial}
                onSeleccionarConversacion={seleccionarConvActiva}
                idConversacionActiva={idConvActiva}
                establecerConversacionOriginal={setMensajesActivos}
                establecerIdConversacionActivaOriginal={setIdConvActiva}
                listaArchivosUsuario={archivosUsuario} setListaArchivosUsuario={setArchivosUsuario}
                manejarSeleccionArchivo={seleccionarArchivoUsuario} refrescarListaArchivos={actualizarArchivosUsuario}
                estaPanelLateralAbierto={panelAbierto} establecerEstaPanelLateralAbierto={setPanelAbierto}
                isMobileMenuOpen={menuMovilAbierto} toggleMobileMenu={alternarMenuMovil}
                temperatura={temperatura} establecerTemperatura={setTemperatura}
                topP={topP} establecerTopP={setTopP}
                idioma={idioma} establecerIdioma={setIdioma}
                manejarLogout={gestionarLogout} currentUser={usuarioActual}
                backendUrl={BACKEND_BASE_URL}
            />
            <Chat
                conversacion={mensajesActivos} establecerConversacion={setMensajesActivos}
                listaArchivosUsuario={archivosUsuario} archivosPdfNuevos={nuevosArchivosPdf}
                manejarCambioArchivoInput={gestionarCambioInputArchivo}
                limpiarArchivosPdfNuevosYRefrescar={limpiarNuevosPdfYActualizar}
                idConversacionActiva={idConvActiva} establecerIdConversacionActiva={setIdConvActiva}
                temperatura={temperatura} topP={topP} idioma={idioma}
                refrescarHistorial={cargarConversaciones}
                leerEnVozAltaActivado={lecturaVozActivada}
                toggleMobileMenu={alternarMenuMovil}
                backendUrl={BACKEND_BASE_URL}
            />
        </div>
    );
};
export default App;