import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { IconoAltavozActivo, IconoAltavozInactivo, IconoMenu } from './Historial'; 


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
    indiceHistorialActivo,
    establecerIndiceHistorialActivo,
    temperatura,
    topP,
    idioma,
    refrescarHistorial,
    leerEnVozAltaActivado,
    toggleMobileMenu,
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
    const refConversacionAnterior = useRef([]);

    
    useEffect(() => {
        if ('speechSynthesis' in window) { setTtsDisponible(true); }
        else { console.warn("Chat.jsx: API Web Speech no soportada."); }
        return () => {
             if (window.speechSynthesis && window.speechSynthesis.speaking) { window.speechSynthesis.cancel(); }
             refUtterance.current = null; setIdMensajeHablando(null);
        }
    }, []);

    const manejarHablarDetener = useCallback((texto, indiceMensaje) => {
        if (!ttsDisponible) return;
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
        if (!leerEnVozAltaActivado || !ttsDisponible || conversacion.length === 0 || conversacion.length === refConversacionAnterior.current.length) {
            refConversacionAnterior.current = conversacion; return;
        }
        const ultimoMensaje = conversacion[conversacion.length - 1];
        if (ultimoMensaje && ultimoMensaje.role === 'model' && !ultimoMensaje.esError && ultimoMensaje.text) {
            if (window.speechSynthesis.speaking) { console.log("[TTS Auto] Cancelando habla previa."); window.speechSynthesis.cancel(); if (refUtterance.current) { refUtterance.current.onend = null; refUtterance.current.onerror = null; } refUtterance.current = null; setIdMensajeHablando(null); }
            console.log("[TTS Auto] Programando lectura.");
            const timerId = setTimeout(() => {
                 const currentLastMsg = refConversacionAnterior.current[refConversacionAnterior.current.length -1];
                 if (currentLastMsg === ultimoMensaje) {
                     manejarHablarDetener(ultimoMensaje.text, conversacion.length - 1);
                 } else {
                     console.log("[TTS Auto] Lectura cancelada, mensaje cambió.");
                 }
            }, 100);
             return () => clearTimeout(timerId);
        }
        refConversacionAnterior.current = conversacion;
    }, [conversacion, conversacion.length, leerEnVozAltaActivado, ttsDisponible, manejarHablarDetener]);

    const desplazarHaciaAbajo = useCallback(() => {
        requestAnimationFrame(() => {
          if (refContenedorScroll.current) {
              refContenedorScroll.current.scrollTop = refContenedorScroll.current.scrollHeight;
          }
        });
    }, []);

    const ajustarAlturaAreaTexto = () => { const areaTexto = refAreaTexto.current; if (areaTexto) { areaTexto.style.height = 'auto'; const scrollHeight = areaTexto.scrollHeight; const maxHeight = 120; areaTexto.style.height = `${Math.min(scrollHeight, maxHeight)}px`; } };

    useEffect(() => {
        desplazarHaciaAbajo();
    }, [conversacion, desplazarHaciaAbajo]);

    useEffect(() => { ajustarAlturaAreaTexto(); }, [prompt]);

    useEffect(() => {
        if (indiceHistorialActivo === null) {
            establecerPrompt("");
        }
        if (ttsDisponible && window.speechSynthesis.speaking) {
            console.log("[Chat Switch/New] Cancelando habla.");
            window.speechSynthesis.cancel();
            setIdMensajeHablando(null);
            refUtterance.current = null;
        }
        refConversacionAnterior.current = [];
    }, [indiceHistorialActivo, ttsDisponible]);

    const enviarMensajeYGenerarRespuesta = async (e) => {
        if (e) e.preventDefault();
        if (cargando) return;
    
        const promptActual = prompt.trim();
        const archivosSeleccionadosActuales = listaArchivosUsuario.filter(f => f.seleccionado && !f.esNuevo).map(f => f.name);
        const archivosNuevosActuales = archivosPdfNuevos;
        const tieneArchivosSeleccionados = archivosSeleccionadosActuales.length > 0;
        const tieneArchivosNuevos = archivosNuevosActuales.length > 0;
    
        if (
            indiceHistorialActivo === null &&
            !promptActual &&
            archivosNuevosActuales.length === 0 &&
            archivosSeleccionadosActuales.length === 0
        ) {
            establecerError(idioma === 'en'
                ? 'Start or select a conversation first.'
                : 'Inicia o selecciona una conversación primero.');
            return;
        }
    
        if (ttsDisponible && window.speechSynthesis.speaking) {
            console.log("[Send Msg] Cancelando habla.");
            window.speechSynthesis.cancel();
            setIdMensajeHablando(null);
            refUtterance.current = null;
        }
    
        if (!promptActual && !tieneArchivosNuevos && !tieneArchivosSeleccionados) {
            const errorMsg = idioma === 'en'
                ? "Please write a message or select/upload at least one PDF file."
                : "Por favor, escribe un mensaje o selecciona/sube al menos un archivo PDF.";
            establecerError(errorMsg);
            return;
        }
    
        establecerCargando(true);
        establecerError("");
    
        const mensajeUsuario = {
            role: "user",
            text: promptActual,
            date: new Date(),
            esError: false
        };
    
        const conversacionConUsuario = [...conversacion, mensajeUsuario];
        establecerConversacion(conversacionConUsuario);
        refConversacionAnterior.current = conversacionConUsuario;
        establecerPrompt("");
    
        requestAnimationFrame(() => {
            if (refAreaTexto.current) refAreaTexto.current.style.height = 'auto';
            desplazarHaciaAbajo();
        });
    
        try {
            const formData = new FormData();
            formData.append("prompt", promptActual);
            if (indiceHistorialActivo !== null) {
                formData.append("conversationId", indiceHistorialActivo.toString());
            }
            formData.append("modeloSeleccionado", modeloSeleccionado);
            formData.append("temperatura", temperatura.toString());
            formData.append("topP", topP.toString());
            formData.append("idioma", idioma);
            formData.append("archivosSeleccionados", JSON.stringify(archivosSeleccionadosActuales));
    
            archivosNuevosActuales.forEach((archivoFileObject) => {
                formData.append("archivosPdf", archivoFileObject, archivoFileObject.name);
            });
            
    
            const respuesta = await fetch("https://chat-backend-y914.onrender.com/api/generateText", {
                method: "POST",
                body: formData,
                credentials: 'include'
            });
    
            const datos = await respuesta.json();
    
            if (!respuesta.ok) {
                let mensajeError = datos.error || `Error ${respuesta.status}: ${respuesta.statusText || 'Error desconocido'}`;
                if (respuesta.status === 401 || respuesta.status === 403) {
                    mensajeError = idioma === 'en'
                        ? 'Authentication error. Please log in again.'
                        : 'Error de autenticación. Por favor, inicia sesión de nuevo.';
                } else if (respuesta.status === 413) {
                    mensajeError = idioma === 'en'
                        ? 'File too large.'
                        : 'Archivo demasiado grande.';
                } else if (respuesta.status === 400) {
                    mensajeError = datos.error || (idioma === 'en' ? 'Invalid request.' : 'Petición inválida.');
                } else if (datos.errors) {
                    mensajeError = Object.values(datos.errors).flat().join(' ');
                }
                throw new Error(mensajeError);
            }
    
            const esRespuestaError = datos.respuesta?.toLowerCase().includes("lo siento") ||
                                     datos.respuesta?.toLowerCase().includes("i'm sorry") ||
                                     datos.respuesta?.toLowerCase().includes("error") ||
                                     !datos.respuesta;
    
            const mensajeBot = {
                role: "model",
                text: datos.respuesta || (idioma === 'en'
                    ? "(Received empty response from assistant)"
                    : "(Respuesta vacía recibida del asistente)"),
                date: new Date(),
                esError: esRespuestaError
            };
    
            const conversacionFinal = [...conversacionConUsuario, mensajeBot];
            establecerConversacion(conversacionFinal);
            refConversacionAnterior.current = conversacionFinal;
    
            if (datos.isNewConversation && datos.conversationId) {
                establecerIndiceHistorialActivo(datos.conversationId);
                if (typeof refrescarHistorial === 'function') {
                    setTimeout(() => refrescarHistorial(), 100);
                }
            }
    
            if (tieneArchivosNuevos && typeof limpiarArchivosPdfNuevosYRefrescar === 'function') {
                setTimeout(() => limpiarArchivosPdfNuevosYRefrescar(), 100);
            }
    
            desplazarHaciaAbajo();
    
        } catch (errorCapturado) {
            console.error("Error en enviarMensajeYGenerarRespuesta:", errorCapturado);
            const textoError = errorCapturado.message || (
                idioma === 'en'
                    ? "An unexpected error occurred."
                    : "Ocurrió un error inesperado."
            );
            establecerError(textoError);
    
            const mensajeErrorParaChat = {
                role: "model",
                text: `${idioma === 'en' ? 'Error' : 'Error'}: ${textoError}`,
                esError: true,
                date: new Date()
            };
    
            const conversacionConError = [...conversacionConUsuario, mensajeErrorParaChat];
            establecerConversacion(conversacionConError);
            refConversacionAnterior.current = conversacionConError;
    
            desplazarHaciaAbajo();
        } finally {
            establecerCargando(false);
        }
    };
    

    const manejarCambioModelo = (evento) => { establecerModeloSeleccionado(evento.target.value); };

    const manejarTeclaAbajo = (e) => {
         if (e.key === 'Enter' && !e.shiftKey && !cargando) {
             e.preventDefault();
              const promptActual = prompt.trim();
              const archivosSeleccionadosActuales = listaArchivosUsuario.filter(f => f.seleccionado && !f.esNuevo);
              const archivosNuevosActuales = archivosPdfNuevos;
              if (promptActual || archivosNuevosActuales.length > 0 || archivosSeleccionadosActuales.length > 0) {
                 enviarMensajeYGenerarRespuesta(null);
             }
         }
    };

    const obtenerConteoArchivosMostrados = () => {
        const newFileCount = archivosPdfNuevos.length;
        const selectedExistingCount = Array.isArray(listaArchivosUsuario)
            ? listaArchivosUsuario.filter(f => f && f.seleccionado && !f.esNuevo).length
            : 0;
        return newFileCount + selectedExistingCount;
    };
    const conteoArchivosMostrados = obtenerConteoArchivosMostrados();


    return (
        <div className="flex flex-col flex-1 max-h-screen bg-surface text-primary">

            {/* Cabecera */}
            <div className="relative flex items-center justify-between flex-shrink-0 p-3 border-b border-divider">
                
                <button
                    onClick={toggleMobileMenu}
                    className="p-1.5 rounded-md text-secondary hover:text-primary hover:bg-hover-item md:hidden" // Only show on mobile
                    title={idioma === 'en' ? 'Open menu' : 'Abrir menú'}
                    aria-label={idioma === 'en' ? 'Open menu' : 'Abrir menú'}
                >
                    <IconoMenu />
                </button>

                
                 <div className="flex flex-col items-center text-center flex-grow min-w-0 px-2">
                     <h1 className="text-lg font-semibold truncate text-primary w-full">
                         <a href="https://united-its.com/" target="_blank" rel="noopener noreferrer" className="transition-colors text-link hover:underline">
                             Asistencia United ITS
                         </a>
                     </h1>
                     <div className="mt-1">
                         <label htmlFor="selectorModelo" className="mr-2 text-xs align-middle text-muted">Modelo IA:</label>
                         <select
                             id="selectorModelo" value={modeloSeleccionado} onChange={manejarCambioModelo} disabled={cargando}
                             className="p-1 text-xs align-middle rounded outline-none disabled:opacity-50 border bg-input text-primary border-input input-focus focus:ring-1 focus:ring-offset-0 focus:border-accent"
                         >
                             {Object.entries(MODELOS_DISPONIBLES).map(([clave, etiqueta]) => (
                                 <option key={clave} value={clave}>{etiqueta}</option>
                             ))}
                         </select>
                     </div>
                 </div>

               
                 <div className="flex items-center justify-end min-w-[40px] sm:min-w-[70px]">
                      <div className="flex items-center">
                         {ttsDisponible && (
                             <>
                                 <div className="p-1 rounded-md text-secondary" title={leerEnVozAltaActivado ? (idioma === 'es' ? 'Lectura automática activada (Tecla F)' : 'Auto-read aloud active (F Key)') : (idioma === 'es' ? 'Lectura automática desactivada (Tecla F)' : 'Auto-read aloud inactive (F Key)')}>
                                     {leerEnVozAltaActivado
                                         ? <IconoAltavozActivo className="text-accent h-5 w-5" />
                                         : <IconoAltavozInactivo className="text-muted h-5 w-5" />
                                     }
                                 </div>
                                 <span className="ml-1 text-xs text-muted select-none hidden sm:inline">
                                     {idioma === 'es' ? '(F)' : '(F)'}
                                 </span>
                             </>
                         )}
                     </div>
                 </div>
            </div>

             {/* Área de Mensajes */}
             <div ref={refContenedorScroll} className="flex-1 p-4 overflow-y-auto sm:p-6 bg-base custom-scrollbar">
                 <div className="space-y-4">
                    
                     {!Array.isArray(conversacion) || conversacion.length === 0 && !cargando ? (
                         <p className="pt-4 text-sm text-center text-muted">{idioma === 'en' ? 'Start the conversation...' : 'Inicia la conversación...'}</p>
                     ) : (
                         Array.isArray(conversacion) && conversacion.map((mensaje, index) => {
                            
                            if (!mensaje || typeof mensaje.role === 'undefined') return null;

                            return (
                                <div key={index} className={`group flex items-start ${mensaje.role === "user" ? "justify-end" : "justify-start"}`}>
                                    {mensaje.role === "model" && !mensaje.esError && ( <div className="pt-1 mr-2 text-xl flex-shrink-0 self-start text-accent">🤖</div> )}
                                    {mensaje.role === "model" && mensaje.esError && ( <div className="pt-1 mr-2 text-xl flex-shrink-0 self-start text-error">⚠️</div> )}
                                    <div className={`flex items-end ${mensaje.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                                        {ttsDisponible && mensaje.text && (
                                        <button
                                            onClick={() => manejarHablarDetener(mensaje.text, index)}
                                            className={`p-1 rounded text-muted hover:text-primary hover:bg-hover-item opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity self-end mb-1 ${idMensajeHablando === index ? 'opacity-100' : ''} ${mensaje.role === 'user' ? 'ml-1' : 'mr-1'}`}
                                            aria-label={idMensajeHablando === index ? (idioma === 'es' ? 'Detener lectura' : 'Stop reading') : (idioma === 'es' ? 'Leer mensaje en voz alta' : 'Read message aloud')}
                                            title={idMensajeHablando === index ? (idioma === 'es' ? 'Detener lectura' : 'Stop reading') : (idioma === 'es' ? 'Leer mensaje en voz alta' : 'Read message aloud')}>
                                            {idMensajeHablando === index ? <IconoDetenerAltavoz /> : <IconoAltavoz />}
                                        </button>
                                        )}
                                        <div className={`p-3 rounded-lg max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl shadow break-words ${ mensaje.esError ? "bg-chat-error text-chat-error border border-chat-error" : mensaje.role === "user" ? "bg-chat-user text-chat-user" : "bg-chat-model text-chat-model" } ${ mensaje.role === "user" ? 'rounded-br-none' : 'rounded-bl-none' }`}>
                                            {mensaje.role === "model" ? (
                                                <div className={`markdown-content ${mensaje.esError ? 'text-chat-error' : 'text-chat-model'}`}>
                                                    <ReactMarkdown
                                                        rehypePlugins={[rehypeRaw]}
                                                        remarkPlugins={[remarkGfm]}
                                                        components={{
                                                            p: ({ children, ...props }) => <p className="mb-2 last:mb-0" {...props}>{children}</p>,
                                                            a: ({ ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-link hover:underline"/>,
                                                            code: ({ inline, className, children, ...props}) => {
                                                                return !inline ? (
                                                                    <pre className="p-2 my-2 overflow-x-auto text-xs rounded bg-code-block text-[var(--text-primary)] custom-scrollbar"><code className={className} {...props}>{children}</code></pre>
                                                                ) : (
                                                                    <code className="px-1 py-0.5 text-xs rounded bg-code-inline text-[var(--text-primary)]" {...props}>{children}</code>
                                                                );
                                                            },
                                                            table: ({ ...props}) => <div className="my-2 overflow-x-auto"><table className="text-xs border-collapse border border-[var(--border-base)]" {...props} /></div>,
                                                            th: ({ ...props}) => <th className="px-2 py-1 font-semibold border border-[var(--border-base)] bg-[var(--bg-input)]" {...props} />,
                                                            td: ({ ...props}) => <td className="px-2 py-1 border border-[var(--border-base)]" {...props} />,
                                                            ul: ({ ...props}) => <ul className="pl-5 mb-2 list-disc list-outside" {...props} />,
                                                            ol: ({ ...props}) => <ol className="pl-5 mb-2 list-decimal list-outside" {...props} />,
                                                            li: ({ ...props}) => <li className="mb-1" {...props} />
                                                        }}
                                                    >
                                                        {mensaje.text || ""}
                                                    </ReactMarkdown>
                                                </div>
                                            ) : ( <p className="text-sm whitespace-pre-wrap">{mensaje.text}</p> )}
                                        </div>
                                    </div>
                                    {mensaje.role === "user" && ( <div className="pt-1 ml-2 text-xl flex-shrink-0 self-start text-accent">👤</div> )}
                                </div>
                            );
                        })
                     )}
                   
                     {cargando && (
                        <div className="flex items-center justify-center mt-4 space-x-2">
                            <div className="w-4 h-4 border-b-2 rounded-full animate-spin border-muted"></div>
                            <p className="text-xs text-muted">{idioma === 'en' ? 'Thinking...' : 'Pensando...'}</p>
                        </div>
                    )}
                  
                    {error && !cargando && (
                       <div className="px-4 py-2 mt-4 text-center border rounded bg-error-notification border-error-notification">
                          <p className="text-xs text-error">{error}</p>
                       </div>
                    )}
                   
                    <div ref={refFinMensajes} style={{ height: "1px" }} />
                 </div>
             </div>

            {/* Formulario de Envío */}
             <form onSubmit={enviarMensajeYGenerarRespuesta} className="flex items-end flex-shrink-0 gap-2 p-3 border-t border-divider bg-surface">
                 <div className="flex-shrink-0 self-end">
                      <input type="file" accept=".pdf" multiple onChange={manejarCambioArchivoInput} disabled={cargando} className="hidden" id="inputArchivoPdf" />
                      <label htmlFor="inputArchivoPdf" title={conteoArchivosMostrados > 0 ? `${conteoArchivosMostrados} ${idioma === 'es' ? 'archivo(s)' : 'file(s)'}` : (idioma === 'es' ? 'Seleccionar PDF' : 'Select PDF')}
                           className={`relative cursor-pointer p-2.5 rounded-lg transition-all inline-block text-secondary ${ cargando ? 'bg-input opacity-50 cursor-not-allowed' : 'bg-button-secondary hover:bg-button-secondary-hover' }`}
                           aria-disabled={cargando}
                       >
                           📄
                           {conteoArchivosMostrados > 0 && ( <span className="absolute flex items-center justify-center w-5 h-5 text-[10px] font-semibold text-white bg-green-600 rounded-full shadow -top-1 -right-1"> {conteoArchivosMostrados} </span> )}
                      </label>
                  </div>
                 <textarea
                     ref={refAreaTexto} value={prompt} onChange={(e) => establecerPrompt(e.target.value)} placeholder={idioma === 'en' ? "Type message or drop files..." : "Escribe mensaje o suelta archivos..."} disabled={cargando}
                     className="flex-grow px-3 py-2.5 resize-none overflow-y-auto rounded-lg focus:outline-none disabled:opacity-50 border bg-input text-primary border-input focus:ring-1 focus:ring-offset-0 focus:border-accent custom-scrollbar placeholder:text-muted"
                     rows={1} style={{ maxHeight: '120px', minHeight: '44px' }} onInput={ajustarAlturaAreaTexto} onKeyDown={manejarTeclaAbajo}
                     aria-label={idioma === 'en' ? 'Chat input' : 'Entrada de chat'}
                 />
                  <button type="submit" disabled={cargando || (!prompt.trim() && conteoArchivosMostrados === 0)}
                     className="self-end flex-shrink-0 px-5 py-2.5 font-semibold rounded-lg transition-all bg-button-primary text-button-primary button-disabled hover:bg-button-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-indigo-500"
                     title={idioma === 'en' ? "Send" : "Enviar"}
                     aria-label={idioma === 'en' ? "Send message" : "Enviar mensaje"}>
                     {cargando ? "⏳" : <span className="text-lg leading-none">➤</span>}
                  </button>
             </form>
        </div>
    );
};

export default Chat;