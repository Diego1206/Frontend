import React, { useRef, useEffect, useState } from 'react';
import classNames from 'classnames';


const IconoPapelera = ({ className = "" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /> </svg> );
const IconoMas = ({ className = "" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-1 md:mr-0 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /> </svg> );
const IconoChevronIzquierda = ({ className = "" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /> </svg> );
const IconoChevronDerecha = ({ className = "" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /> </svg> );
const IconoAjustes = ({ className = "" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /> <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /> </svg> );
const IconoChevronAbajo = ({ className = "" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /> </svg> );
const IconoChevronArriba = ({ className = "" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /> </svg> );
const IconoRefrescar = ({ className = "" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m-15.357-2A8.001 8.001 0 0019.418 15m0 0h-4.418" /> </svg> );
const IconoEditar = ({ className = "" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /> </svg> );
const IconoBuscar = ({ className = "" }) => ( <svg xmlns="http=http://www.w3.org/2000/svg" className={`h-5 w-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /> </svg> );
const IconoLogout = ({ className = "" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /> </svg> );
const IconoSol = ({ className = "" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /> </svg> );
const IconoLuna = ({ className = "" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /> </svg> );
export const IconoAltavozActivo = ({ className = "" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /> </svg> );
export const IconoAltavozInactivo = ({ className = "" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zm11.414-9l-9 9" /> </svg> );
export const IconoMenu = ({ className = "" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /> </svg> );
export const IconoCerrar = ({ className = "" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /> </svg> );


const Historial = ({
    historial, 
    establecerHistorial, 
    onSeleccionarConversacion, 
    establecerConversacionOriginal, 
    establecerIdConversacionActivaOriginal, 
    listaArchivosUsuario, 
    setListaArchivosUsuario, 
    manejarSeleccionArchivo, 
    idConversacionActiva,
    estaPanelLateralAbierto, 
    establecerEstaPanelLateralAbierto, 
    isMobileMenuOpen, 
    toggleMobileMenu, 
    refrescarListaArchivos, 
    temperatura, 
    establecerTemperatura, 
    topP, 
    establecerTopP, 
    idioma, 
    establecerIdioma,
    manejarLogout, 
    currentUser, 
    theme, 
    cambiarTema, 
    backendUrl
  }) => {

    const [mostrarConfiguracion, setMostrarConfiguracion] = useState(false);
    const [archivosAbiertos, setArchivosAbiertos] = useState(true);
    const [idConvEditandoTitulo, setIdConvEditandoTitulo] = useState(null);
    const [tituloEnEdicion, setTituloEnEdicion] = useState('');
    const refInputTitulo = useRef(null);
    const [textoBusqueda, setTextoBusqueda] = useState('');
    const [mostrarInputBusqueda, setMostrarInputBusqueda] = useState(false);
    const refInputBusqueda = useRef(null);
    const [cargandoMensajes, setCargandoMensajes] = useState(false);
    const [errorAlCargarMensajes, setErrorAlCargarMensajes] = useState('');

    const esCliente = typeof window !== 'undefined';

    useEffect(() => {
      if (idConvEditandoTitulo !== null && refInputTitulo.current) {
        refInputTitulo.current.focus();
        refInputTitulo.current.select();
      }
    }, [idConvEditandoTitulo]);

    useEffect(() => {
      if (mostrarInputBusqueda && refInputBusqueda.current) {
        refInputBusqueda.current.focus();
      }
    }, [mostrarInputBusqueda]);

    const conversacionesFiltradas = textoBusqueda && Array.isArray(historial)
      ? historial.filter(item => item && item.titulo && item.titulo.toLowerCase().includes(textoBusqueda.toLowerCase()))
      : historial;

    const gestionarClicConversacion = async (conversationId) => {
      if (typeof onSeleccionarConversacion !== 'function') {
        console.error("Historial.jsx: onSeleccionarConversacion no es una función!");
        setErrorAlCargarMensajes(idioma === 'es' ? 'Error interno (manejador ausente).' : 'Internal error (handler missing).');
        return;
      }
      setCargandoMensajes(true);
      setErrorAlCargarMensajes('');
      try {
        await onSeleccionarConversacion(conversationId);
      } catch (error) {
        console.error("[Historial] Error al llamar onSeleccionarConversacion para Conv ID", conversationId, ":", error);
        setErrorAlCargarMensajes(idioma === 'es' ? `Error al cargar: ${error.message}` : `Error loading: ${error.message}`);
      } finally {
        setCargandoMensajes(false);
      }
    };

    const gestionarClicConversacionWrapper = async (conversationId) => {
      if (esCliente && window.innerWidth < 768 && typeof toggleMobileMenu === 'function') {
        toggleMobileMenu();
      }
      await gestionarClicConversacion(conversationId);
    };

    const gestionarBorrarConversacion = async (idABorrar) => {
        if (idConvEditandoTitulo === idABorrar) setIdConvEditandoTitulo(null);
        const mensajeConfirmacion = idioma === 'es' ? "¿Estás seguro de que quieres borrar esta conversación del historial?" : "Are you sure you want to delete this conversation?";
        if (window.confirm(mensajeConfirmacion)) {
            try {
                const response = await fetch(`${backendUrl}/api/conversations/${idABorrar}`, { method: 'DELETE', credentials: 'include' });
                if (response.ok) {
                    establecerHistorial((historialPrevio) => Array.isArray(historialPrevio) ? historialPrevio.filter((conv) => conv && conv.id !== idABorrar) : []);
                    if (idABorrar === idConversacionActiva) {
                        if (typeof establecerConversacionOriginal === 'function') establecerConversacionOriginal([]);
                        if (typeof establecerIdConversacionActivaOriginal === 'function') establecerIdConversacionActivaOriginal(null);
                    }
                } else {
                    const datosError = await response.json().catch(() => ({ error: `Error ${response.status}` }));
                    alert((idioma === 'es' ? 'Error al borrar: ' : 'Failed to delete: ') + (datosError.error || 'Error desconocido'));
                }
            } catch (error) {
                 console.error("Error en fetch para borrar historial:", error);
                 alert(idioma === 'es' ? "Error de red al borrar." : "Network error during deletion.");
            }
        }
    };

    const gestionarNuevaConversacionVacia = () => {
        setIdConvEditandoTitulo(null);
        setTituloEnEdicion('');
        setTextoBusqueda('');
        setMostrarInputBusqueda(false);
        if (typeof setListaArchivosUsuario === 'function') {
            setListaArchivosUsuario(prev => Array.isArray(prev) ? prev.map(f => f.esNuevo ? f : {...f, seleccionado: false}) : []);
        }
        if (typeof establecerConversacionOriginal === 'function') establecerConversacionOriginal([]);
        if (typeof establecerIdConversacionActivaOriginal === 'function') establecerIdConversacionActivaOriginal(null);
        setErrorAlCargarMensajes('');
    };

    const gestionarNuevaConversacionVaciaWrapper = () => {
         if (esCliente && window.innerWidth < 768 && typeof toggleMobileMenu === 'function') {
            toggleMobileMenu();
         }
         gestionarNuevaConversacionVacia();
     };

    const iniciarEdicionTitulo = (conversationId, tituloActual) => {
        setIdConvEditandoTitulo(conversationId);
        setTituloEnEdicion(tituloActual || '');
    };

    const gestionarCambioTituloInput = (e) => { setTituloEnEdicion(e.target.value); };

    const guardarTituloEditado = async () => {
        const idAGuardar = idConvEditandoTitulo;
        if (idAGuardar === null || !Array.isArray(historial)) return;

        const nuevoTitulo = tituloEnEdicion.trim();
        const itemOriginal = historial.find(c => c && c.id === idAGuardar);
        const tituloOriginal = itemOriginal?.titulo;

        if (!nuevoTitulo || nuevoTitulo === tituloOriginal) {
            setIdConvEditandoTitulo(null); setTituloEnEdicion('');
            return;
        }
        const historialOriginal = historial.map(item => ({...item}));
        establecerHistorial(historialPrevio => historialPrevio.map(item => item && item.id === idAGuardar ? { ...item, titulo: nuevoTitulo } : item ));
        setIdConvEditandoTitulo(null);
        setTituloEnEdicion('');

        try {
            const response = await fetch(`${backendUrl}/api/conversations/${idAGuardar}/title`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nuevoTitulo }), credentials: 'include' });
            if (!response.ok) {
                 establecerHistorial(historialOriginal);
                 const datosError = await response.json().catch(() => ({ error: `Error ${response.status}` }));
                 alert((idioma === 'es' ? 'Error al guardar título: ' : 'Failed to save title: ') + (datosError.error || 'Error desconocido'));
            }
        } catch (error) {
            establecerHistorial(historialOriginal);
            console.error("Error en fetch para guardar título:", error);
            alert(idioma === 'es' ? "Error de red al guardar título." : "Network error saving title.");
        }
    };

    const cancelarEdicionTitulo = () => {
        setIdConvEditandoTitulo(null);
        setTituloEnEdicion('');
    };

    const gestionarTeclaEnInputTitulo = (e) => {
        if (e.key === 'Enter') { e.preventDefault(); guardarTituloEditado(); }
        else if (e.key === 'Escape') { cancelarEdicionTitulo(); }
    };

    const gestionarOcultarInputBusqueda = () => {
        setTimeout(() => { if (refInputBusqueda.current && document.activeElement !== refInputBusqueda.current) { setMostrarInputBusqueda(false); } }, 150);
    };

    const gestionarTeclaEnInputBusqueda = (e) => {
        if (e.key === 'Escape') {
            setTextoBusqueda('');
            setMostrarInputBusqueda(false);
            if(refInputBusqueda.current) refInputBusqueda.current.blur();
        }
    };

    const gestionarCambioTemperatura = (e) => { establecerTemperatura(parseFloat(e.target.value)); };
    const gestionarCambioTopP = (e) => { establecerTopP(parseFloat(e.target.value)); };
    const gestionarCambioIdioma = (e) => { establecerIdioma(e.target.value); };

    const gestionarBorrarArchivoUsuario = async (nombreArchivoUnico, nombreOriginalUsuario) => {
        const mensajeConfirmacion = idioma === 'es' ? `¿Estás seguro de que quieres borrar el archivo "${nombreOriginalUsuario}"? Esta acción no se puede deshacer.` : `Are you sure you want to delete the file "${nombreOriginalUsuario}"? This cannot be undone.`;
        if (window.confirm(mensajeConfirmacion)) {
            try {
                const response = await fetch(`${backendUrl}/api/files/${nombreArchivoUnico}`, { method: 'DELETE', credentials: 'include' });
                if (response.ok) {
                     if (typeof refrescarListaArchivos === 'function') await refrescarListaArchivos(false);
                } else {
                    const datosError = await response.json().catch(() => ({ error: `Error ${response.status}` }));
                    alert((idioma === 'es' ? `Error al borrar archivo: ` : `Failed to delete file: `) + (datosError.error || 'Error desconocido'));
                }
            } catch (error) {
                console.error("Error en fetch para borrar archivo:", error);
                alert(idioma === 'es' ? "Error de red al borrar archivo." : "Network error deleting file.");
            }
        }
    };


    const clasesPanelLateral = classNames(
        'flex', 'flex-col', 'flex-shrink-0', 'overflow-y-auto',
        'bg-sidebar', 'border-r', 'border-divider',
        'transition-transform', 'duration-300', 'ease-in-out', 'custom-scrollbar',
        'fixed', 'inset-y-0', 'left-0', 'z-40', 'w-72', 'p-4',
        { 'translate-x-0': isMobileMenuOpen, '-translate-x-full': !isMobileMenuOpen },
        'md:relative', 'md:inset-auto', 'md:translate-x-0', 'md:transition-all',
        { 'md:w-64 lg:w-72 md:p-4': estaPanelLateralAbierto, 'md:w-16 md:p-2 md:pt-4': !estaPanelLateralAbierto }
    );

    const esMovil = esCliente && window.innerWidth < 768;

    return (
        <aside
        id="historial-sidebar"
        className={classNames(clasesPanelLateral, 'z-[40]', { 'hidden md:block': mostrarConfiguracion })}
    >

            <div className={classNames( 'hidden md:flex items-center mb-4 relative', { 'justify-between space-x-2': estaPanelLateralAbierto, 'w-full justify-center': !estaPanelLateralAbierto } )}>
                 {estaPanelLateralAbierto && (
                      <div className="flex-grow min-w-0 mr-2">
                           {mostrarInputBusqueda ? (
                               <input ref={refInputBusqueda} type="search" placeholder={idioma === 'es' ? "Buscar historial..." : "Search history..."} value={textoBusqueda} onChange={(e) => setTextoBusqueda(e.target.value)} onKeyDown={gestionarTeclaEnInputBusqueda} onBlur={gestionarOcultarInputBusqueda} className="w-full px-2 py-1 rounded-md border text-sm outline-none transition-all bg-surface text-primary border-input input-focus placeholder:text-muted"/>
                           ) : (
                               <button onClick={() => setMostrarInputBusqueda(true)} className="p-1.5 rounded-md transition-colors text-secondary hover:text-primary hover:bg-hover-item cursor-pointer" title={idioma === 'es' ? "Buscar conversación" : "Search conversations"}> <IconoBuscar /> </button>
                           )}
                      </div>
                 )}
                 <button onClick={() => establecerEstaPanelLateralAbierto(!estaPanelLateralAbierto)} className="p-1.5 rounded-md transition-colors flex-shrink-0 bg-surface hover:bg-hover-item text-secondary hover:text-primary cursor-pointer" title={estaPanelLateralAbierto ? (idioma === 'es' ? "Cerrar panel" : "Collapse panel") : (idioma === 'es' ? "Abrir panel" : "Expand panel")}>
                     {estaPanelLateralAbierto ? <IconoChevronIzquierda /> : <IconoChevronDerecha />}
                 </button>
            </div>
             {mostrarConfiguracion && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-sm bg-modal-overlay">
                <div className="p-6 w-full max-w-md relative rounded-lg shadow-xl bg-surface border border-divider">
                    <h2 className="text-lg font-semibold mb-4 text-primary">
                        {idioma === 'es' ? 'Ajustes' : 'Settings'}
                    </h2>
                    <div className="mb-4">
                        <label htmlFor="temperatura" className="block text-sm font-medium text-secondary mb-1">
                            {idioma === 'es' ? 'Temperatura: ' : 'Temperature: '}
                            <span className="font-mono text-xs text-accent">{temperatura.toFixed(2)}</span>
                        </label>
                        <input
                            type="range"
                            id="temperatura"
                            min="0"
                            max="1"
                            step="0.05"
                            value={temperatura}
                            onChange={gestionarCambioTemperatura}
                            className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-input accent-blue-500"
                        />
                        <p className="text-xs text-muted mt-1">
                            {idioma === 'es' ? 'Controla la aleatoriedad: valores más altos significan más creatividad, más bajos más determinismo.' : 'Controls randomness: higher values mean more creativity, lower values more determinism.'}
                        </p>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="topP" className="block text-sm font-medium text-secondary mb-1">
                            Top-P: <span className="font-mono text-xs text-success">{topP.toFixed(2)}</span>
                        </label>
                        <input
                            type="range"
                            id="topP"
                            min="0"
                            max="1"
                            step="0.05"
                            value={topP}
                            onChange={gestionarCambioTopP}
                            className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-input accent-green-500"
                        />
                        <p className="text-xs text-muted mt-1">
                            {idioma === 'es' ? 'Controla la diversidad de las respuestas.' : 'Controls the diversity of the responses.'}
                        </p>
                    </div>
                    <div className="mb-5">
                        <label htmlFor="idioma" className="block text-sm font-medium text-secondary mb-1">
                            {idioma === 'es' ? 'Idioma' : 'Language'}
                        </label>
                        <select
                            id="idioma"
                            value={idioma}
                            onChange={gestionarCambioIdioma}
                            className="w-full p-2 rounded-md border text-sm bg-input text-primary border-input input-focus cursor-pointer"
                        >
                            <option value="es">Español</option>
                            <option value="en">English</option>
                        </select>
                    </div>
                    <div className="text-right mt-6">
                        <button
                            onClick={() => setMostrarConfiguracion(false)}
                            className="px-4 py-2 rounded-md text-sm transition-colors bg-button-primary text-button-primary cursor-pointer"
                        >
                            {idioma === 'es' ? 'Cerrar' : 'Close'}
                        </button>
                    </div>
                </div>
            </div>
        )}
            <div className={classNames('flex flex-col h-full', { 'md:items-center': !estaPanelLateralAbierto })}>
                 <div className={classNames('flex-shrink-0 relative', { 'mb-4 w-full px-1': estaPanelLateralAbierto, 'w-auto mb-4 md:w-full': !estaPanelLateralAbierto })}>
                     <button
                        onClick={gestionarNuevaConversacionVaciaWrapper}
                        className={classNames(
                            'p-2.5 font-medium rounded-lg transition-colors text-sm flex items-center shadow-sm cursor-pointer bg-button-primary text-button-primary',
                            { 'w-full justify-center': estaPanelLateralAbierto, 'justify-center': !estaPanelLateralAbierto }
                        )}
                        title={idioma === 'es' ? "Nueva conversación" : "New chat"}
                     >
                         <IconoMas className={classNames({'md:mr-0': !estaPanelLateralAbierto})} />
                         {(estaPanelLateralAbierto || esMovil) && <span className="ml-1">{idioma === 'es' ? 'Nueva Conversación' : 'New Conversation'}</span>}
                     </button>
                 </div>

                {(estaPanelLateralAbierto || esMovil) && <hr className="mb-4 flex-shrink-0 border-divider" />}

                <div className={classNames('flex flex-col flex-grow min-h-0 mb-6', { 'md:hidden': !estaPanelLateralAbierto && !esMovil })}>
                    <h2 className="text-xs font-semibold uppercase tracking-wider mb-2 px-1 flex-shrink-0 text-muted">{idioma === 'es' ? 'Historial' : 'History'}</h2>
                    {errorAlCargarMensajes && ( <p className="px-2 py-1 mb-2 text-xs rounded border bg-error-notification text-error border-error-notification"> {errorAlCargarMensajes} </p> )}
                    {Array.isArray(conversacionesFiltradas) && conversacionesFiltradas.length > 0 ? (
                        <div className="flex-grow overflow-y-auto pr-1 min-h-0 custom-scrollbar">
                            <ul className="space-y-1">
                                {conversacionesFiltradas.map((item) => {
                                    if (!item || typeof item.id === 'undefined') return null;
                                    const estaSeleccionado = item.id === idConversacionActiva;
                                    const estaEditando = idConvEditandoTitulo === item.id;
                                    return (
                                        <li key={item.id}>
                                            <div onClick={() => !estaEditando && gestionarClicConversacionWrapper(item.id)}
                                                className={classNames( 'w-full group flex justify-between items-center text-left p-2 rounded-md transition-colors text-sm relative', { 'cursor-pointer hover:bg-hover-item': !estaEditando, 'bg-active-item font-medium': estaSeleccionado && !estaEditando, 'bg-input': estaEditando, 'opacity-50 pointer-events-none': cargandoMensajes && idConversacionActiva === item.id, } )} title={item.titulo || ''} >
                                                {cargandoMensajes && idConversacionActiva === item.id && ( <div className="absolute inset-0 flex items-center justify-center rounded-md z-10 bg-sidebar bg-opacity-75"> <div className="w-4 h-4 border-b-2 rounded-full animate-spin border-secondary"></div> </div> )}
                                                {estaEditando ? ( <input ref={refInputTitulo} type="text" value={tituloEnEdicion} onChange={gestionarCambioTituloInput} onKeyDown={gestionarTeclaEnInputTitulo} onBlur={guardarTituloEditado} className="flex-1 px-1 py-0 mr-2 text-sm outline-none z-10 bg-transparent text-primary border-b border-accent" onClick={(e) => e.stopPropagation()} /> ) : ( <span className={classNames( 'flex-1 pr-2 truncate', { 'text-primary': estaSeleccionado, 'text-secondary group-hover:text-primary': !estaSeleccionado } )}> {item.titulo} </span> )}
                                                {!estaEditando && (
                                                     <div className={classNames( 'flex items-center flex-shrink-0 space-x-1 transition-opacity z-20', 'opacity-0 focus-within:opacity-100', { 'opacity-100': estaSeleccionado, 'md:group-hover:opacity-100': !estaSeleccionado } )}>
                                                         <button onClick={(e) => { e.stopPropagation(); iniciarEdicionTitulo(item.id, item.titulo); }} className="p-1 rounded-md text-muted hover:text-primary hover:bg-hover-item cursor-pointer" title={idioma === 'es' ? "Renombrar" : "Rename"}> <IconoEditar className="transition-colors duration-150 ease-in-out" /> </button>
                                                         <button onClick={(e) => { e.stopPropagation(); gestionarBorrarConversacion(item.id); }} className="p-1 rounded-md text-muted hover:bg-hover-item cursor-pointer" title={idioma === 'es' ? "Borrar" : "Delete"}> <IconoPapelera className="group-hover:stroke-error transition-colors duration-150 ease-in-out" /> </button>
                                                     </div>
                                                )}
                                             </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ) : ( <p className="px-1 text-sm flex-shrink-0 text-muted"> {textoBusqueda ? (idioma === 'es' ? 'No hay coincidencias.' : 'No matches found.') : (idioma === 'es' ? 'No hay conversaciones.' : 'No conversations yet.')} </p> )}
                </div>

                <div className={classNames('flex-shrink-0 pt-4 mt-auto border-t border-divider', { 'md:hidden': !estaPanelLateralAbierto && !esMovil })}>
                     <div className="flex items-center justify-between px-1 mb-2 transition-colors rounded cursor-pointer hover:bg-hover-item" onClick={() => setArchivosAbiertos(!archivosAbiertos)} title={archivosAbiertos ? (idioma === 'es' ? "Ocultar" : "Hide") : (idioma === 'es' ? "Mostrar" : "Show")}>
                         <h3 className="text-xs font-semibold tracking-wider uppercase text-muted">{idioma === 'es' ? 'Archivos Disponibles' : 'Available Files'}</h3>
                         <div className="flex items-center space-x-1">
                              <button onClick={(e) => { e.stopPropagation(); if(typeof refrescarListaArchivos === 'function') refrescarListaArchivos(false); }} className="p-1 transition-colors rounded-md text-muted hover:text-primary hover:bg-hover-item cursor-pointer" title={idioma === 'es' ? "Refrescar" : "Refresh"}> <IconoRefrescar /> </button>
                              <span className="p-1 text-muted">{archivosAbiertos ? <IconoChevronArriba /> : <IconoChevronAbajo />}</span>
                         </div>
                     </div>
                      {archivosAbiertos && (
                          <>
                             {Array.isArray(listaArchivosUsuario) && listaArchivosUsuario.filter(f => f && !f.esNuevo).length > 0 ? (
                                  <div className="pb-2 pr-1 space-y-1 overflow-y-auto max-h-40 custom-scrollbar">
                                      {listaArchivosUsuario.filter(f => f && !f.esNuevo).map((archivo) => {
                                          if (!archivo || typeof archivo.name === 'undefined' || typeof archivo.seleccionado === 'undefined') return null;
                                          const archivoSeleccionado = !!archivo.seleccionado;
                                          return (
                                              <div key={archivo.name} className={classNames( 'group flex items-center p-1.5 rounded-md transition-colors text-sm', { 'bg-active-item': archivoSeleccionado, 'hover:bg-hover-item': !archivoSeleccionado } )}>
                                                    <input type="checkbox" value={archivo.name} checked={archivoSeleccionado} onChange={() => manejarSeleccionArchivo(archivo.name)} className="w-4 h-4 mr-2 rounded cursor-pointer flex-shrink-0 form-checkbox bg-input border-input text-accent focus:ring-accent/50 focus:ring-1 focus:ring-offset-0" id={`file-checkbox-${archivo.name}`} />
                                                    <label htmlFor={`file-checkbox-${archivo.name}`} className={classNames( 'flex-1 truncate cursor-pointer', { 'text-accent': archivoSeleccionado, 'text-secondary group-hover:text-primary': !archivoSeleccionado } )} title={archivo.displayName || ''}> {archivo.displayName} </label>
                                                   <button onClick={(e) => { e.stopPropagation(); gestionarBorrarArchivoUsuario(archivo.name, archivo.displayName); }} className={classNames( 'flex-shrink-0 p-1 ml-auto rounded-md text-muted hover:bg-hover-item cursor-pointer', 'transition-opacity focus-within:opacity-100', 'opacity-0', { 'opacity-100': archivoSeleccionado, 'md:group-hover:opacity-100': !archivoSeleccionado } )} title={idioma === 'es' ? "Borrar archivo" : "Delete file"}> <IconoPapelera className="group-hover:stroke-error transition-colors duration-150 ease-in-out" /> </button>
                                              </div>
                                          );
                                      })}
                                  </div>
                              ) : ( <p className="px-1 pb-2 text-sm text-muted">{idioma === 'es' ? 'No hay archivos subidos.' : 'No files uploaded.'}</p> )}
                          </>
                      )}
                  </div>

                 <div className={classNames( 'mt-auto pt-4 border-t border-divider', { 'px-1 pb-2': estaPanelLateralAbierto, 'flex flex-col items-center space-y-4 pb-4': !estaPanelLateralAbierto } )}>
                     {(estaPanelLateralAbierto || esMovil) && currentUser && (
                        <div className="px-1 mb-2 text-xs truncate text-muted" title={currentUser.username || ''}>
                            {idioma === 'es' ? 'Usuario: ' : 'Logged in as: '}
                            <span className="font-medium text-secondary">{currentUser.username}</span>
                        </div>
                     )}
                     <div className={classNames( 'flex', { 'justify-between items-center space-x-2': estaPanelLateralAbierto, 'flex-col items-center space-y-4': !estaPanelLateralAbierto } )}>
                         <button onClick={cambiarTema} className={classNames('p-2 transition-colors rounded-md text-secondary hover:text-primary cursor-pointer', {'hover:bg-hover-item': estaPanelLateralAbierto})} title={theme === 'dark' ? (idioma === 'es' ? 'Modo Claro' : 'Light Mode') : (idioma === 'es' ? 'Modo Oscuro' : 'Dark Mode')} > {theme === 'dark' ? <IconoSol /> : <IconoLuna />} </button>
                         <button onClick={() => setMostrarConfiguracion(true)} className={classNames('p-2 transition-colors rounded-md text-secondary hover:text-primary cursor-pointer', {'hover:bg-hover-item': estaPanelLateralAbierto})} title={idioma==='es'?'Ajustes':'Settings'}> <IconoAjustes /> </button>
                        <button onClick={manejarLogout} className={classNames('group p-2 transition-colors rounded-md text-muted cursor-pointer', {'hover:bg-hover-item': estaPanelLateralAbierto})} title={idioma==='es'?'Cerrar Sesión':'Logout'}> <IconoLogout className="group-hover:stroke-error transition-colors duration-150 ease-in-out" /> </button>
                     </div>
                 </div>
            </div>
        </aside>
    );
};

export default Historial;