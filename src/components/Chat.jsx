import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { IconoAltavozActivo, IconoAltavozInactivo, IconoMenu } from './Historial'; // Asume que IconoMenu está exportado aquí

const IconoAltavoz = ({ className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
);
const IconoDetenerAltavoz = ({ className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
    </svg>
);
const IconoDescargar = ({className = ""}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);


const MODELOS_DISPONIBLES = {
    "gemini-1.5-flash": "Gemini 1.5 Flash (Rápido)",
    "gemini-1.5-pro": "Gemini 1.5 Pro (Avanzado)",
    "gemini-2.0-flash": "Gemini 2.0 Flash",
    "gemini-2.5-pro-preview-03-25": "Gemini 2.5 Pro (Preview)"
};
const MODELO_POR_DEFECTO_FRONTEND = "gemini-1.5-flash";


const Chat = ({
    conversacion,
    establecerConversacion,
    listaArchivosUsuario,
    archivosPdfNuevos,
    manejarCambioArchivoInput,
    limpiarArchivosPdfNuevosYRefrescar,
    idConversacionActiva,
    establecerIdConversacionActiva,
    temperatura,
    topP,
    idioma,
    refrescarHistorial,
    leerEnVozAltaActivado,
    toggleMobileMenu,
    backendUrl
}) => {
    const [cargando, establecerCargando] = useState(false);
    const [error, establecerError] = useState("");
    const [prompt, establecerPrompt] = useState("");
    const [modeloSeleccionado, establecerModeloSeleccionado] = useState(MODELO_POR_DEFECTO_FRONTEND);
    const [idMensajeHablando, setIdMensajeHablando] = useState(null);
    const [ttsDisponible, setTtsDisponible] = useState(false);

    const refFinMensajes = useRef(null);
    const refAreaTexto = useRef(null);
    const refContenedorScroll = useRef(null);
    const refUtterance = useRef(null);
    const refConversacionActualParaTTS = useRef(conversacion);

    useEffect(() => {
        refConversacionActualParaTTS.current = conversacion;
    }, [conversacion]);

    useEffect(() => {
        if ('speechSynthesis' in window) { setTtsDisponible(true); }
        else { console.warn("Chat.jsx: API Web Speech no soportada."); }
        return () => {
             if (window.speechSynthesis && window.speechSynthesis.speaking) { window.speechSynthesis.cancel(); }
             refUtterance.current = null; setIdMensajeHablando(null);
        }
    }, []);

    const manejarHablarDetener = useCallback((texto, indiceMensaje) => {
        if (!ttsDisponible || !texto) return;
        const synth = window.speechSynthesis;
        if (synth.speaking && idMensajeHablando === indiceMensaje) {
            synth.cancel(); setIdMensajeHablando(null); refUtterance.current = null; return;
        }
        if (synth.speaking) { synth.cancel(); }
        
        const utterance = new SpeechSynthesisUtterance(texto);
        refUtterance.current = utterance;
        utterance.lang = idioma === 'es' ? 'es-ES' : 'en-US';
        utterance.onend = () => { if (refUtterance.current === utterance) { setIdMensajeHablando(null); refUtterance.current = null; } };
        utterance.onerror = (event) => { console.error("Chat.jsx: Error SpeechSynthesis:", event); if (refUtterance.current === utterance) { setIdMensajeHablando(null); refUtterance.current = null; } };
        setIdMensajeHablando(indiceMensaje);
        synth.speak(utterance);
    }, [ttsDisponible, idioma, idMensajeHablando]);

    useEffect(() => {
        if (!leerEnVozAltaActivado || !ttsDisponible || refConversacionActualParaTTS.current.length === 0) return;
        
        const convActual = refConversacionActualParaTTS.current;
        const ultimoMensaje = convActual[convActual.length - 1];

        if (ultimoMensaje && ultimoMensaje.role === 'model' && !ultimoMensaje.esError && ultimoMensaje.text && !ultimoMensaje.isImage) {
            if (window.speechSynthesis.speaking) {
                if (refUtterance.current && refUtterance.current.text !== ultimoMensaje.text) {
                    window.speechSynthesis.cancel();
                } else {
                    return;
                }
            }
            
            const timerId = setTimeout(() => {
                const convParaHablar = refConversacionActualParaTTS.current;
                 if (convParaHablar.length > 0 && convParaHablar[convParaHablar.length - 1] === ultimoMensaje) {
                     console.log("[TTS Auto] Leyendo:", ultimoMensaje.text.substring(0,30) + "...");
                     manejarHablarDetener(ultimoMensaje.text, convParaHablar.length - 1);
                 }
            }, 150);
             return () => clearTimeout(timerId);
        }
    }, [leerEnVozAltaActivado, ttsDisponible, manejarHablarDetener, conversacion]);


    const desplazarHaciaAbajo = useCallback(() => {
        requestAnimationFrame(() => {
          if (refContenedorScroll.current) {
              refContenedorScroll.current.scrollTop = refContenedorScroll.current.scrollHeight;
          }
        });
    }, []);

    const ajustarAlturaAreaTexto = () => { const areaTexto = refAreaTexto.current; if (areaTexto) { areaTexto.style.height = 'auto'; const scrollHeight = areaTexto.scrollHeight; const maxHeight = 120; areaTexto.style.height = `${Math.min(scrollHeight, maxHeight)}px`; } };

    useEffect(() => { desplazarHaciaAbajo(); }, [conversacion, desplazarHaciaAbajo]);
    useEffect(() => { ajustarAlturaAreaTexto(); }, [prompt]);

    useEffect(() => {
        if (idConversacionActiva === null) establecerPrompt("");
        if (ttsDisponible && window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel(); setIdMensajeHablando(null); refUtterance.current = null;
        }
    }, [idConversacionActiva, ttsDisponible]);


    const manejarDescargaImagen = async (imageUrl, fileName) => {
        try {
            const nombrePorDefecto = fileName || `imagen_generada_${Date.now()}.png`;
            
            if (imageUrl.startsWith('data:')) {
                const link = document.createElement('a');
                link.href = imageUrl;
                link.download = nombrePorDefecto;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                return;
            }
            
            const urlCompletaParaFetch = imageUrl.startsWith('http') ? imageUrl : `${backendUrl}${imageUrl}`;

            const response = await fetch(urlCompletaParaFetch); 
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`No se pudo descargar la imagen. Estado: ${response.status}. Detalle: ${errorText.substring(0,100)}`);
            }
            const blob = await response.blob();
            const urlObjeto = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = urlObjeto;
            link.download = nombrePorDefecto;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(urlObjeto);

        } catch (error) {
            console.error("Error al descargar la imagen:", error);
            alert(idioma === 'es' ? `No se pudo descargar la imagen: ${error.message}` : `Could not download image: ${error.message}`);
        }
    };


    const enviarMensajeYGenerarRespuesta = async (e) => {
        if (e) e.preventDefault();
        if (cargando) return;

        const promptActual = prompt.trim();
        const archivosSeleccionadosActuales = listaArchivosUsuario.filter(f => f.seleccionado && !f.esNuevo).map(f => f.name);
        const archivosNuevosActuales = archivosPdfNuevos;

        if (ttsDisponible && window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel(); setIdMensajeHablando(null); refUtterance.current = null;
        }
        
        const esComandoImagen = promptActual.toLowerCase().startsWith("/imagen ") || promptActual.toLowerCase().startsWith("/image ");
        const promptParaImagenLocal = esComandoImagen ? promptActual.substring(promptActual.indexOf(" ") + 1).trim() : ""; // Renombrada para evitar conflicto en ámbitos

        if (esComandoImagen) {
            if (!promptParaImagenLocal) {
                establecerError(idioma === 'en' ? "Please provide a description for the image after /image." : "Por favor, proporciona una descripción para la imagen después de /imagen.");
                return;
            }
            establecerCargando(true); establecerError(""); establecerPrompt(""); 
            const mensajeUsuarioCmd = { role: "user", text: promptActual, date: new Date(), esError: false };
            const conversacionTemp = [...conversacion, mensajeUsuarioCmd];
            establecerConversacion(conversacionTemp);
            desplazarHaciaAbajo();

            try {
                const respuestaApiImagen = await fetch(`${backendUrl}/api/generateImage`, {
                    method: "POST", headers: { "Content-Type": "application/json" }, credentials: 'include',
                    body: JSON.stringify({ prompt: promptParaImagenLocal }),
                });
                const datosApiImagenResult = await respuestaApiImagen.json(); // Renombrada para evitar conflicto en ámbitos
                if (!respuestaApiImagen.ok) throw new Error(datosApiImagenResult.error || `Error ${respuestaApiImagen.status} generando imagen`);
                
                const mensajeBotConImagen = {
                    role: "model",
                    text: datosApiImagenResult.message || `Imagen generada para: "${promptParaImagenLocal}"`,
                    imageUrl: datosApiImagenResult.imageUrl, fileName: datosApiImagenResult.fileName,
                    isImage: true, date: new Date(), esError: false,
                };
                establecerConversacion([...conversacionTemp, mensajeBotConImagen]);
            } catch (err) {
                const errorMsg = err.message || (idioma === 'es' ? 'Error al generar imagen.' : 'Error generating image.');
                const mensajeErrorImg = { role: "model", text: errorMsg, esError: true, date: new Date() };
                establecerConversacion([...conversacionTemp, mensajeErrorImg]);
                establecerError(errorMsg);
            } finally {
                establecerCargando(false); desplazarHaciaAbajo();
            }
            return; 
        }

        if ( !promptActual && archivosNuevosActuales.length === 0 && archivosSeleccionadosActuales.length === 0 ) {
            establecerError(idioma === 'en' ? "Please write a message or select/upload at least one PDF file." : "Por favor, escribe un mensaje o selecciona/sube al menos un archivo PDF.");
            return;
        }
        
        establecerCargando(true); establecerError("");
        const mensajeUsuario = { role: "user", text: promptActual, date: new Date(), esError: false };
        const conversacionConUsuario = [...conversacion, mensajeUsuario];
        establecerConversacion(conversacionConUsuario);
        establecerPrompt(""); 
        requestAnimationFrame(() => { if (refAreaTexto.current) refAreaTexto.current.style.height = 'auto'; desplazarHaciaAbajo(); });

        try {
            const formData = new FormData();
            formData.append("prompt", promptActual);
            if (idConversacionActiva !== null) formData.append("conversationId", idConversacionActiva.toString());
            formData.append("modeloSeleccionado", modeloSeleccionado);
            formData.append("temperatura", temperatura.toString());
            formData.append("topP", topP.toString());
            formData.append("idioma", idioma);
            formData.append("archivosSeleccionados", JSON.stringify(archivosSeleccionadosActuales));
            archivosNuevosActuales.forEach((file) => formData.append("archivosPdf", file, file.name));

            const respuestaApiTexto = await fetch(`${backendUrl}/api/generateText`, {
                method: "POST", body: formData, credentials: 'include'
            });
            const datosApiTexto = await respuestaApiTexto.json();
            if (!respuestaApiTexto.ok) throw new Error(datosApiTexto.error || `Error ${respuestaApiTexto.status} generando texto`);
            
            const esErrorIa = !datosApiTexto.respuesta || 
                              datosApiTexto.respuesta.toLowerCase().includes("lo siento") || 
                              datosApiTexto.respuesta.toLowerCase().includes("i'm sorry") ||
                              datosApiTexto.respuesta.toLowerCase().includes("error");

            const mensajeBotTexto = { role: "model", text: datosApiTexto.respuesta, date: new Date(), esError: esErrorIa };
            establecerConversacion([...conversacionConUsuario, mensajeBotTexto]);

            if (datosApiTexto.isNewConversation && datosApiTexto.conversationId) {
                establecerIdConversacionActiva(datosApiTexto.conversationId);
                if (typeof refrescarHistorial === 'function') setTimeout(() => refrescarHistorial(), 150);
            }
            if (archivosNuevosActuales.length > 0 && typeof limpiarArchivosPdfNuevosYRefrescar === 'function') {
                setTimeout(() => limpiarArchivosPdfNuevosYRefrescar(), 150); // No es necesario pasar datosApiTexto.archivosSubidosNuevos con la corrección en App.jsx
            }
        } catch (err) {
            const errorMsg = err.message || (idioma === 'es' ? 'Error al generar respuesta.' : 'Error generating response.');
            const mensajeErrorTexto = { role: "model", text: errorMsg, esError: true, date: new Date() };
            establecerConversacion([...conversacionConUsuario, mensajeErrorTexto]);
            establecerError(errorMsg);
        } finally {
            establecerCargando(false); desplazarHaciaAbajo();
        }
    };

    const manejarCambioModelo = (evento) => { establecerModeloSeleccionado(evento.target.value); };
    const manejarTeclaAbajo = (e) => {
         if (e.key === 'Enter' && !e.shiftKey && !cargando) {
             e.preventDefault();
              const promptActual = prompt.trim();
              const esComandoImagen = promptActual.toLowerCase().startsWith("/imagen ") || promptActual.toLowerCase().startsWith("/image ");
              const archivosSeleccionadosActuales = listaArchivosUsuario.filter(f => f.seleccionado && !f.esNuevo);
              const archivosNuevosActuales = archivosPdfNuevos;
              if (promptActual || esComandoImagen || archivosNuevosActuales.length > 0 || archivosSeleccionadosActuales.length > 0) {
                 enviarMensajeYGenerarRespuesta(null);
             }
         }
    };
    const obtenerConteoArchivosMostrados = () => (archivosPdfNuevos.length + (Array.isArray(listaArchivosUsuario) ? listaArchivosUsuario.filter(f => f?.seleccionado && !f.esNuevo).length : 0));
    const conteoArchivosMostrados = obtenerConteoArchivosMostrados();

    return (
        <div className="flex flex-col flex-1 max-h-screen bg-surface text-primary">
            <div className="relative flex items-center justify-between flex-shrink-0 p-3 border-b border-divider">
                <button onClick={toggleMobileMenu} className="p-1.5 rounded-md text-secondary hover:text-primary hover:bg-hover-item md:hidden" title={idioma === 'en' ? 'Open menu' : 'Abrir menú'} aria-label={idioma === 'en' ? 'Open menu' : 'Abrir menú'} > <IconoMenu /> </button>
                 <div className="flex flex-col items-center text-center flex-grow min-w-0 px-2">
                     <h1 className="text-lg font-semibold truncate text-primary w-full"> <a href="https://united-its.com/" target="_blank" rel="noopener noreferrer" className="transition-colors text-link hover:underline"> Asistencia United ITS </a> </h1>
                     <div className="mt-1">
                         <label htmlFor="selectorModelo" className="mr-2 text-xs align-middle text-muted">Modelo IA:</label>
                         <select id="selectorModelo" value={modeloSeleccionado} onChange={manejarCambioModelo} disabled={cargando} className="p-1 text-xs align-middle rounded outline-none disabled:opacity-50 border bg-input text-primary border-input input-focus focus:ring-1 focus:ring-offset-0 focus:border-accent" > {Object.entries(MODELOS_DISPONIBLES).map(([clave, etiqueta]) => ( <option key={clave} value={clave}>{etiqueta}</option>))} </select>
                     </div>
                 </div>
                 <div className="flex items-center justify-end min-w-[40px] sm:min-w-[70px]">
                      <div className="flex items-center">
                         {ttsDisponible && (
                             <>
                                 <div className="p-1 rounded-md text-secondary" title={leerEnVozAltaActivado ? (idioma === 'es' ? 'Lectura automática activada (Tecla F)' : 'Auto-read aloud active (F Key)') : (idioma === 'es' ? 'Lectura automática desactivada (Tecla F)' : 'Auto-read aloud inactive (F Key)')}> {leerEnVozAltaActivado ? <IconoAltavozActivo className="text-accent h-5 w-5" /> : <IconoAltavozInactivo className="text-muted h-5 w-5" /> } </div>
                                 <span className="ml-1 text-xs text-muted select-none hidden sm:inline"> {idioma === 'es' ? '(F)' : '(F)'} </span>
                             </>
                         )}
                     </div>
                 </div>
            </div>

             <div ref={refContenedorScroll} className="flex-1 p-4 overflow-y-auto sm:p-6 bg-base custom-scrollbar">
                 <div className="space-y-4">
                     {!Array.isArray(conversacion) || conversacion.length === 0 && !cargando ? (
                         <p className="pt-4 text-sm text-center text-muted">{idioma === 'en' ? 'Start the conversation...' : 'Inicia la conversación...'}</p>
                     ) : (
                         Array.isArray(conversacion) && conversacion.map((mensaje, index) => {
                            if (!mensaje || typeof mensaje.role === 'undefined') return null;
                            const esMensajeUsuario = mensaje.role === "user";
                            const esMensajeModelo = mensaje.role === "model";

                            return (
                                <div key={index} className={`group flex items-start ${esMensajeUsuario ? "justify-end" : "justify-start"}`}>
                                    {esMensajeModelo && !mensaje.esError && !mensaje.isImage && ( <div className="pt-1 mr-2 text-xl flex-shrink-0 self-start text-accent">🤖</div> )}
                                    {esMensajeModelo && mensaje.isImage && !mensaje.esError && ( <div className="pt-1 mr-2 text-xl flex-shrink-0 self-start text-accent">🖼️</div> )}
                                    {esMensajeModelo && mensaje.esError && ( <div className="pt-1 mr-2 text-xl flex-shrink-0 self-start text-error">⚠️</div> )}
                                    
                                    <div className={`flex items-end ${esMensajeUsuario ? "flex-row-reverse" : "flex-row"}`}>
                                        {ttsDisponible && mensaje.text && !mensaje.isImage && (
                                        <button onClick={() => manejarHablarDetener(mensaje.text, index)} className={`p-1 rounded text-muted hover:text-primary hover:bg-hover-item opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity self-end mb-1 ${idMensajeHablando === index ? 'opacity-100' : ''} ${esMensajeUsuario ? 'ml-1' : 'mr-1'}`} aria-label={idMensajeHablando === index ? (idioma === 'es' ? 'Detener lectura' : 'Stop reading') : (idioma === 'es' ? 'Leer mensaje en voz alta' : 'Read message aloud')} title={idMensajeHablando === index ? (idioma === 'es' ? 'Detener lectura' : 'Stop reading') : (idioma === 'es' ? 'Leer mensaje en voz alta' : 'Read message aloud')}>
                                            {idMensajeHablando === index ? <IconoDetenerAltavoz /> : <IconoAltavoz />} </button>
                                        )}
                                        <div className={`p-3 rounded-lg max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl shadow break-words ${ mensaje.esError ? "bg-chat-error text-chat-error border border-chat-error" : esMensajeUsuario ? "bg-chat-user text-chat-user" : "bg-chat-model text-chat-model" } ${ esMensajeUsuario ? 'rounded-br-none' : 'rounded-bl-none' }`}>
                                            
                                            {esMensajeModelo && mensaje.isImage && mensaje.imageUrl ? (
                                                <div className="generated-image-container relative group max-w-xs sm:max-w-md md:max-w-lg">
                                                    {/* Mostrar mensaje.text si existe y no es el mensaje genérico del backend para la imagen */}
                                                    {mensaje.text && <p className="mb-1 text-xs italic text-muted">{mensaje.text}</p>}
                                                    <div className="relative">
                                                        <img
                                                            src={mensaje.imageUrl.startsWith('data:') ? mensaje.imageUrl : (mensaje.imageUrl.startsWith('http') ? mensaje.imageUrl : `${backendUrl}${mensaje.imageUrl}`)}
                                                            alt={mensaje.fileName || "Imagen generada"}
                                                            className="max-w-full h-auto rounded-md block"
                                                            onLoad={desplazarHaciaAbajo}
                                                            onError={(e) => { 
                                                                e.target.alt = "Error al cargar imagen"; 
                                                                const parent = e.target.parentNode;
                                                                if (parent && !parent.querySelector('.error-placeholder-img')) {
                                                                    const errorTextNode = document.createElement('p');
                                                                    errorTextNode.className = 'text-xs text-error p-2 bg-error-notification rounded-md error-placeholder-img';
                                                                    errorTextNode.innerText = idioma === 'es' ? 'Error al cargar la imagen.' : 'Error loading image.';
                                                                    parent.insertBefore(errorTextNode, e.target);
                                                                    e.target.style.display='none';
                                                                }
                                                            }}
                                                        />
                                                        <button onClick={() => manejarDescargaImagen( mensaje.imageUrl.startsWith('data:') ? mensaje.imageUrl : (mensaje.imageUrl.startsWith('http') ? mensaje.imageUrl : `${backendUrl}${mensaje.imageUrl}`), mensaje.fileName )} className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:bg-opacity-70" title={idioma === 'es' ? 'Descargar imagen' : 'Download image'} aria-label={idioma === 'es' ? 'Descargar imagen' : 'Download image'}>
                                                            <IconoDescargar /> </button>
                                                    </div>
                                                </div>
                                            ) : esMensajeModelo ? (
                                                <div className={`markdown-content ${mensaje.esError ? 'text-chat-error' : 'text-chat-model'}`}>
                                                    <ReactMarkdown 
                                                        rehypePlugins={[rehypeRaw]} 
                                                        remarkPlugins={[remarkGfm]} 
                                                        components={{ 
                                                            p: ({ ...props}) => <p className="mb-2 last:mb-0" {...props} />, 
                                                            a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-link hover:underline"/>, 
                                                            code: ({inline, className, children, ...props}) => !inline ? (<pre className="p-2 my-2 overflow-x-auto text-xs rounded bg-code-block text-[var(--text-primary)] custom-scrollbar"><code className={className} {...props}>{children}</code></pre>) : (<code className="px-1 py-0.5 text-xs rounded bg-code-inline text-[var(--text-primary)]" {...props}>{children}</code>), 
                                                            table: (props) => <div className="my-2 overflow-x-auto"><table className="text-xs border-collapse border border-[var(--border-base)]" {...props} /></div>, 
                                                            th: (props) => <th className="px-2 py-1 font-semibold border border-[var(--border-base)] bg-[var(--bg-input)]" {...props} />, 
                                                            td: (props) => <td className="px-2 py-1 border border-[var(--border-base)]" {...props} />, 
                                                            ul: (props) => <ul className="pl-5 mb-2 list-disc list-outside" {...props} />, 
                                                            ol: (props) => <ol className="pl-5 mb-2 list-decimal list-outside" {...props} />, 
                                                            li: (props) => <li className="mb-1" {...props} /> 
                                                        }} 
                                                    >
                                                        {mensaje.text || ""}
                                                    </ReactMarkdown>
                                                </div>
                                            ) : ( <p className="text-sm whitespace-pre-wrap">{mensaje.text}</p> )}
                                        </div>
                                    </div>
                                    {esMensajeUsuario && ( <div className="pt-1 ml-2 text-xl flex-shrink-0 self-start text-accent">👤</div> )}
                                </div>
                            );
                        })
                     )}
                     {cargando && ( <div className="flex items-center justify-center mt-4 space-x-2"> <div className="w-4 h-4 border-b-2 rounded-full animate-spin border-muted"></div> <p className="text-xs text-muted">{idioma === 'en' ? 'Thinking...' : 'Pensando...'}</p> </div> )}
                     {error && !cargando && ( <div className="px-4 py-2 mt-4 text-center border rounded bg-error-notification border-error-notification"> <p className="text-xs text-error">{error}</p> </div> )}
                    <div ref={refFinMensajes} style={{ height: "1px" }} />
                 </div>
             </div>

            {/* Formulario de Envío */}
             <form onSubmit={enviarMensajeYGenerarRespuesta} className="flex items-end flex-shrink-0 gap-2 p-3 border-t border-divider bg-surface">
                 <div className="flex-shrink-0 self-end">
                      <input type="file" accept=".pdf" multiple onChange={manejarCambioArchivoInput} disabled={cargando} className="hidden" id="inputArchivoPdf" />
                      <label htmlFor="inputArchivoPdf" title={conteoArchivosMostrados > 0 ? `${conteoArchivosMostrados} ${idioma === 'es' ? 'archivo(s)' : 'file(s)'}` : (idioma === 'es' ? 'Seleccionar PDF' : 'Select PDF')} className={`relative cursor-pointer p-2.5 rounded-lg transition-all inline-block text-secondary ${ cargando ? 'bg-input opacity-50 cursor-not-allowed' : 'bg-button-secondary hover:bg-button-secondary-hover' }`} aria-disabled={cargando} >
                           📄
                           {conteoArchivosMostrados > 0 && ( <span className="absolute flex items-center justify-center w-5 h-5 text-[10px] font-semibold text-white bg-green-600 rounded-full shadow -top-1 -right-1"> {conteoArchivosMostrados} </span> )}
                      </label>
                  </div>
                 <textarea ref={refAreaTexto} value={prompt} onChange={(e) => establecerPrompt(e.target.value)} placeholder={idioma === 'en' ? "Type /image <desc> or message..." : "Escribe /imagen <desc> o mensaje..."} disabled={cargando} className="flex-grow px-3 py-2.5 resize-none overflow-y-auto rounded-lg focus:outline-none disabled:opacity-50 border bg-input text-primary border-input focus:ring-1 focus:ring-offset-0 focus:border-accent custom-scrollbar placeholder:text-muted" rows={1} style={{ maxHeight: '120px', minHeight: '44px' }} onInput={ajustarAlturaAreaTexto} onKeyDown={manejarTeclaAbajo} aria-label={idioma === 'en' ? 'Chat input' : 'Entrada de chat'} />
                  <button type="submit" disabled={cargando || (!prompt.trim() && conteoArchivosMostrados === 0 && !(prompt.trim().toLowerCase().startsWith("/imagen ") || prompt.trim().toLowerCase().startsWith("/image ")))} className="self-end flex-shrink-0 px-5 py-2.5 font-semibold rounded-lg transition-all bg-button-primary text-button-primary button-disabled hover:bg-button-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-indigo-500" title={idioma === 'en' ? "Send" : "Enviar"} aria-label={idioma === 'en' ? "Send message" : "Enviar mensaje"}> {cargando ? "⏳" : <span className="text-lg leading-none">➤</span>} </button>
             </form>
        </div>
    );
};

export default Chat;