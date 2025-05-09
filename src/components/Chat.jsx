// --- START OF FILE Chat.jsx ---

import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { FaVolumeUp, FaVolumeMute, FaBars, FaPlayCircle, FaStopCircle } from 'react-icons/fa';

const MODELOS_DISPONIBLES = {
    "gemini-1.5-flash": "Gemini 1.5 Flash (Rápido)",
    "gemini-1.5-pro": "Gemini 1.5 Pro (Avanzado)",
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
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);

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
        if (!ttsDisponible || !texto) return;
        const synth = window.speechSynthesis;
        if (synth.speaking && idMensajeHablando === indiceMensaje) {
            synth.cancel(); setIdMensajeHablando(null); refUtterance.current = null; return;
        }
        if (synth.speaking) { synth.cancel(); }
        try {
            const utterance = new SpeechSynthesisUtterance(texto);
            refUtterance.current = utterance;
            utterance.lang = idioma === 'es' ? 'es-ES' : 'en-US';
            utterance.onend = () => { if (refUtterance.current === utterance) { setIdMensajeHablando(null); refUtterance.current = null; } };
            utterance.onerror = (event) => { console.error("Chat.jsx: Error SpeechSynthesis:", event.error); if (refUtterance.current === utterance) { setIdMensajeHablando(null); refUtterance.current = null; } };
            setIdMensajeHablando(indiceMensaje);
            synth.speak(utterance);
        } catch (e) {
            console.error("Error inicializando SpeechSynthesisUtterance:", e);
            setIdMensajeHablando(null);
        }
    }, [ttsDisponible, idioma, idMensajeHablando]);

    useEffect(() => {
        const currentConvLength = conversacion.length;
        const prevConvLength = refConversacionAnterior.current.length;
    
        if (!leerEnVozAltaActivado || !ttsDisponible || currentConvLength === 0 || currentConvLength === prevConvLength) {
            refConversacionAnterior.current = [...conversacion];
            return;
        }
    
        const ultimoMensaje = conversacion[currentConvLength - 1];
    
        if (ultimoMensaje && ultimoMensaje.role === 'model' && !ultimoMensaje.esError && ultimoMensaje.text && !ultimoMensaje.isImage) {
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
                if (refUtterance.current) {
                    refUtterance.current.onend = null;
                    refUtterance.current.onerror = null;
                }
                refUtterance.current = null;
                setIdMensajeHablando(null);
            }
            
            const timerId = setTimeout(() => {
                // Re-evaluar el último mensaje aquí por si la conversación cambió muy rápido
                const latestConversation = conversacion; // O pasarlo como dependencia si es más seguro
                if (latestConversation.length > 0) {
                    const potentiallyNewLastMessage = latestConversation[latestConversation.length - 1];
                    if (ultimoMensaje.text === potentiallyNewLastMessage.text && ultimoMensaje.date === potentiallyNewLastMessage.date) {
                        const indexToSpeak = latestConversation.indexOf(ultimoMensaje);
                        if (indexToSpeak !== -1) { // Asegurarse que el mensaje todavía existe
                           manejarHablarDetener(ultimoMensaje.text, indexToSpeak);
                        }
                    }
                }
            }, 150); // Un pequeño delay
    
            refConversacionAnterior.current = [...conversacion];
            return () => clearTimeout(timerId);
        }
        refConversacionAnterior.current = [...conversacion];
    }, [conversacion, leerEnVozAltaActivado, ttsDisponible, manejarHablarDetener]);
    

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
        if (indiceHistorialActivo === null) establecerPrompt("");
        if (ttsDisponible && window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            setIdMensajeHablando(null);
            refUtterance.current = null;
        }
        refConversacionAnterior.current = [];
    }, [indiceHistorialActivo, ttsDisponible]);

    const handleGenerateImage = async (imagePromptText) => {
        setIsGeneratingImage(true);
        establecerError(''); 

        try {
            const response = await fetch("https://chat-backend-y914.onrender.com/api/generate-image", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: imagePromptText, idioma: idioma }),
                credentials: 'include'
            });

            const data = await response.json();

            if (response.ok && data.imageUrl) {
                const mensajeImagenBot = {
                    role: "model",
                    imageUrl: data.imageUrl,
                    text: data.originalPrompt || imagePromptText,
                    date: new Date(),
                    esError: false,
                    isImage: true
                };
                establecerConversacion(prev => [...prev, mensajeImagenBot]);
            } else {
                const errorMsg = data.error || (idioma === 'es' ? 'No se pudo generar la imagen o la respuesta fue inválida.' : 'Could not generate image or response was invalid.');
                const mensajeErrorBot = {
                    role: "model",
                    text: `${idioma === 'es' ? 'Error generando imagen' : 'Error generating image'}: ${errorMsg}`,
                    date: new Date(),
                    esError: true
                };
                establecerConversacion(prev => [...prev, mensajeErrorBot]);
            }
        } catch (error) {
            console.error("Error al solicitar generación de imagen (catch):", error);
            let errorTextToShow = idioma === 'es' ? 'Error de red o del servidor al generar imagen.' : 'Network or server error while generating image.';
            if(error instanceof SyntaxError){
                errorTextToShow = idioma === 'es' ? 'Respuesta inesperada del servidor al generar imagen.' : 'Unexpected server response when generating image.';
            }
            const mensajeErrorRed = {
                role: "model",
                text: errorTextToShow,
                date: new Date(),
                esError: true
            };
            establecerConversacion(prev => [...prev, mensajeErrorRed]);
        } finally {
            setIsGeneratingImage(false);
            desplazarHaciaAbajo();
        }
    };

    const enviarMensajeYGenerarRespuesta = async (e) => {
        if (e) e.preventDefault();
        if (cargando || isGeneratingImage) return;

        const promptActual = prompt.trim();
        const archivosSeleccionadosActuales = listaArchivosUsuario.filter(f => f.seleccionado && !f.esNuevo).map(f => f.name);
        const archivosNuevosActuales = archivosPdfNuevos;

        if (!promptActual && archivosNuevosActuales.length === 0 && archivosSeleccionadosActuales.length === 0) {
            establecerError(idioma === 'en' ? "Please write a message, or select/upload files." : "Por favor, escribe un mensaje o selecciona/sube archivos.");
            return;
        }
        if (ttsDisponible && window.speechSynthesis.speaking) { window.speechSynthesis.cancel(); setIdMensajeHablando(null); if(refUtterance.current) {refUtterance.current.onend=null; refUtterance.current.onerror=null;} refUtterance.current = null; }
        
        establecerError("");

        const mensajeUsuario = { role: "user", text: promptActual, date: new Date(), esError: false };
        establecerConversacion(prev => [...prev, mensajeUsuario]);
        // Actualizar refConversacionAnterior aquí para que handleGenerateImage tenga la versión más reciente si es necesario
        refConversacionAnterior.current = [...conversacion, mensajeUsuario]; 
        
        establecerPrompt("");
        ajustarAlturaAreaTexto();
        // No llamar a desplazarHaciaAbajo aquí, se hará en el finally o después de la respuesta

        if (promptActual.toLowerCase().startsWith("/imagen ") || promptActual.toLowerCase().startsWith("/image ")) {
            const imageCommand = promptActual.toLowerCase().startsWith("/imagen ") ? "/imagen " : "/image ";
            const imagePromptText = promptActual.substring(imageCommand.length).trim();
            if (!imagePromptText) {
                const errorMsg = idioma === 'es' ? "Por favor, escribe un prompt después de /imagen." : "Please write a prompt after /image.";
                const mensajeErrorCmd = { role: "model", text: errorMsg, date: new Date(), esError: true };
                establecerConversacion(prev => [...prev, mensajeErrorCmd]); // Añadir al estado global de conversación
                desplazarHaciaAbajo();
                return;
            }
            await handleGenerateImage(imagePromptText);
            return;
        }

        establecerCargando(true);
        try {
            const formData = new FormData();
            formData.append("prompt", promptActual || (idioma === 'es' ? "Analiza los archivos adjuntos." : "Analyze the attached files."));
            if (indiceHistorialActivo !== null) formData.append("conversationId", indiceHistorialActivo.toString());
            formData.append("modeloSeleccionado", modeloSeleccionado);
            formData.append("temperatura", temperatura.toString());
            formData.append("topP", topP.toString());
            formData.append("idioma", idioma);
            formData.append("archivosSeleccionados", JSON.stringify(archivosSeleccionadosActuales));
            archivosNuevosActuales.forEach((file) => formData.append("archivosPdf", file, file.name));

            const respuesta = await fetch("https://chat-backend-y914.onrender.com/api/generateText", {
                method: "POST", body: formData, credentials: 'include'
            });
            const datos = await respuesta.json();

            if (!respuesta.ok) {
                let mensajeError = datos.error || `Error ${respuesta.status}`;
                throw new Error(mensajeError);
            }

            const esRespuestaError = !datos.respuesta || datos.respuesta.toLowerCase().includes("lo siento") || datos.respuesta.toLowerCase().includes("i'm sorry") || datos.respuesta.toLowerCase().includes("error");
            const mensajeBot = { role: "model", text: datos.respuesta || (idioma === 'es' ? "(Respuesta vacía o error del asistente)" : "(Empty response or assistant error)"), date: new Date(), esError: esRespuestaError };
            establecerConversacion(prev => [...prev, mensajeBot]);

            if (datos.isNewConversation && datos.conversationId) {
                establecerIndiceHistorialActivo(datos.conversationId);
                if (typeof refrescarHistorial === 'function') setTimeout(() => refrescarHistorial(), 100);
            }
            if (archivosNuevosActuales.length > 0 && typeof limpiarArchivosPdfNuevosYRefrescar === 'function') {
                setTimeout(() => limpiarArchivosPdfNuevosYRefrescar(), 100);
            }
        } catch (errorCapturado) {
            console.error("Error en enviarMensajeYGenerarRespuesta (texto):", errorCapturado);
            const textoError = errorCapturado.message || (idioma === 'en' ? "An unexpected error occurred." : "Ocurrió un error inesperado.");
            const mensajeErrorParaChat = { role: "model", text: `${idioma === 'en' ? 'Error' : 'Error'}: ${textoError}`, esError: true, date: new Date() };
            establecerConversacion(prev => [...prev, mensajeErrorParaChat]);
        } finally {
            establecerCargando(false);
            desplazarHaciaAbajo();
        }
    };

    const manejarCambioModelo = (evento) => { establecerModeloSeleccionado(evento.target.value); };
    const manejarTeclaAbajo = (e) => {
         if (e.key === 'Enter' && !e.shiftKey && !(cargando || isGeneratingImage) ) {
             e.preventDefault();
             enviarMensajeYGenerarRespuesta(null);
         }
    };
    const obtenerConteoArchivosMostrados = () => {
        const newFileCount = archivosPdfNuevos.length;
        const selectedExistingCount = Array.isArray(listaArchivosUsuario) ? listaArchivosUsuario.filter(f => f && f.seleccionado && !f.esNuevo).length : 0;
        return newFileCount + selectedExistingCount;
    };
    const conteoArchivosMostrados = obtenerConteoArchivosMostrados();

    return (
        <div className="flex flex-col flex-1 max-h-screen bg-surface text-primary">
            <div className="relative flex items-center justify-between flex-shrink-0 p-3 border-b border-divider">
                <button onClick={toggleMobileMenu} className="p-1.5 rounded-md text-secondary hover:text-primary hover:bg-hover-item md:hidden" title={idioma === 'en' ? 'Open menu' : 'Abrir menú'}>
                    <FaBars className="h-6 w-6" />
                </button>
                <div className="flex flex-col items-center text-center flex-grow min-w-0 px-2">
                     <h1 className="text-lg font-semibold truncate text-primary w-full">
                         <a href="https://united-its.com/" target="_blank" rel="noopener noreferrer" className="transition-colors text-link hover:underline">Asistencia United ITS</a>
                     </h1>
                     <div className="mt-1">
                         <label htmlFor="selectorModelo" className="mr-2 text-xs align-middle text-muted">Modelo IA:</label>
                         <select id="selectorModelo" value={modeloSeleccionado} onChange={manejarCambioModelo} disabled={cargando || isGeneratingImage} className="p-1 text-xs align-middle rounded outline-none disabled:opacity-50 border bg-input text-primary border-input input-focus focus:ring-1 focus:ring-offset-0 focus:border-accent">
                             {Object.entries(MODELOS_DISPONIBLES).map(([clave, etiqueta]) => ( <option key={clave} value={clave}>{etiqueta}</option> ))}
                         </select>
                     </div>
                 </div>
                 <div className="flex items-center justify-end min-w-[40px] sm:min-w-[70px]">
                      <div className="flex items-center">
                         {ttsDisponible && (
                             <>
                                 <div className="p-1 rounded-md text-secondary" title={leerEnVozAltaActivado ? (idioma === 'es' ? 'Lectura automática activada (F)' : 'Auto-read aloud active (F)') : (idioma === 'es' ? 'Lectura automática desactivada (F)' : 'Auto-read aloud inactive (F)')}>
                                     {leerEnVozAltaActivado ? <FaVolumeUp className="text-accent h-5 w-5" /> : <FaVolumeMute className="text-muted h-5 w-5" />}
                                 </div>
                                 <span className="ml-1 text-xs text-muted select-none hidden sm:inline">{idioma === 'es' ? '(F)' : '(F)'}</span>
                             </>
                         )}
                     </div>
                 </div>
            </div>

             <div ref={refContenedorScroll} className="flex-1 p-4 overflow-y-auto sm:p-6 bg-base custom-scrollbar">
                 <div className="space-y-4">
                     {conversacion.length === 0 && !cargando && !isGeneratingImage ? (
                         <p className="pt-4 text-sm text-center text-muted">{idioma === 'en' ? 'Start the conversation... (Try /image your_prompt)' : 'Inicia la conversación... (Prueba /imagen tu_prompt)'}</p>
                     ) : (
                         conversacion.map((mensaje, index) => {
                            if (!mensaje || typeof mensaje.role === 'undefined') return <li key={`empty-${index}-${Math.random()}`}></li>;

                            if (mensaje.isImage && mensaje.imageUrl) {
                                return (
                                    <div key={`${index}-img`} className={`group flex items-start justify-start`}>
                                        <div className="pt-1 mr-2 text-xl flex-shrink-0 self-start text-accent">🖼️</div>
                                        <div className={`p-3 rounded-lg max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl shadow break-words bg-chat-model text-chat-model rounded-bl-none`}>
                                            <img src={mensaje.imageUrl} alt={mensaje.text || (idioma === 'es' ? "Imagen generada" : "Generated image")} className="max-w-full h-auto rounded-md mb-1" />
                                            {mensaje.text && <p className="text-xs text-muted italic">{idioma === 'es' ? 'Prompt: ' : 'Prompt: '}{mensaje.text}</p>}
                                        </div>
                                    </div>
                                );
                            }
                            
                            return (
                                <div key={`${index}-txt`} className={`group flex items-start ${mensaje.role === "user" ? "justify-end" : "justify-start"}`}>
                                    {mensaje.role === "model" && !mensaje.esError && ( <div className="pt-1 mr-2 text-xl flex-shrink-0 self-start text-accent">🤖</div> )}
                                    {mensaje.role === "model" && mensaje.esError && ( <div className="pt-1 mr-2 text-xl flex-shrink-0 self-start text-error">⚠️</div> )}
                                    <div className={`flex items-end ${mensaje.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                                        {ttsDisponible && mensaje.text && !mensaje.isImage && (
                                        <button onClick={() => manejarHablarDetener(mensaje.text, index)} className={`p-1 rounded text-muted hover:text-primary hover:bg-hover-item opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity self-end mb-1 ${idMensajeHablando === index ? 'opacity-100' : ''} ${mensaje.role === 'user' ? 'ml-1' : 'mr-1'}`} title={idMensajeHablando === index ? (idioma === 'es' ? 'Detener lectura' : 'Stop reading') : (idioma === 'es' ? 'Leer mensaje' : 'Read message')}>
                                            {idMensajeHablando === index ? <FaStopCircle className="h-4 w-4" /> : <FaPlayCircle className="h-4 w-4" />}
                                        </button>
                                        )}
                                        <div className={`p-3 rounded-lg max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl shadow break-words ${ mensaje.esError ? "bg-chat-error text-chat-error border border-chat-error" : mensaje.role === "user" ? "bg-chat-user text-chat-user" : "bg-chat-model text-chat-model" } ${ mensaje.role === "user" ? 'rounded-br-none' : 'rounded-bl-none' }`}>
                                            {mensaje.role === "model" ? (
                                                <div className={`markdown-content ${mensaje.esError ? 'text-chat-error' : 'text-chat-model'}`}>
                                                    <ReactMarkdown rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]} components={{
                                                        p: (props) => <p className="mb-2 last:mb-0" {...props} />,
                                                        a: props => <a {...props} target="_blank" rel="noopener noreferrer" className="text-link hover:underline"/>,
                                                        code: ({ inline, className, children, ...props}) => !inline ? (<pre className="p-2 my-2 overflow-x-auto text-xs rounded bg-code-block text-[var(--text-primary)] custom-scrollbar"><code className={className} {...props}>{children}</code></pre>) : (<code className="px-1 py-0.5 text-xs rounded bg-code-inline text-[var(--text-primary)]" {...props}>{children}</code>),
                                                        table: props => <div className="my-2 overflow-x-auto"><table className="text-xs border-collapse border border-[var(--border-base)]" {...props} /></div>,
                                                        th: props => <th className="px-2 py-1 font-semibold border border-[var(--border-base)] bg-[var(--bg-input)]" {...props} />,
                                                        td: props => <td className="px-2 py-1 border border-[var(--border-base)]" {...props} />,
                                                        ul: props => <ul className="pl-5 mb-2 list-disc list-outside" {...props} />,
                                                        ol: props => <ol className="pl-5 mb-2 list-decimal list-outside" {...props} />,
                                                        li: props => <li className="mb-1" {...props} />
                                                    }}>
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
                    {isGeneratingImage && (
                        <div className="flex items-center justify-center mt-4 space-x-2">
                            <div className="w-4 h-4 border-b-2 rounded-full animate-spin border-accent"></div>
                            <p className="text-xs text-muted">{idioma === 'en' ? 'Generating image...' : 'Generando imagen...'}</p>
                        </div>
                    )}
                    {error && !cargando && !isGeneratingImage && (
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
                      <input type="file" accept=".pdf" multiple onChange={manejarCambioArchivoInput} disabled={cargando || isGeneratingImage} className="hidden" id="inputArchivoPdf" />
                      <label htmlFor="inputArchivoPdf" title={conteoArchivosMostrados > 0 ? `${conteoArchivosMostrados} ${idioma === 'es' ? 'archivo(s)' : 'file(s)'}` : (idioma === 'es' ? 'Seleccionar PDF' : 'Select PDF')} className={`relative cursor-pointer p-2.5 rounded-lg transition-all inline-block text-secondary ${ (cargando || isGeneratingImage) ? 'bg-input opacity-50 cursor-not-allowed' : 'bg-button-secondary hover:bg-button-secondary-hover' }`} aria-disabled={cargando || isGeneratingImage}>
                           📄
                           {conteoArchivosMostrados > 0 && ( <span className="absolute flex items-center justify-center w-5 h-5 text-[10px] font-semibold text-white bg-green-600 rounded-full shadow -top-1 -right-1"> {conteoArchivosMostrados} </span> )}
                      </label>
                  </div>
                 <textarea
                     ref={refAreaTexto} value={prompt} onChange={(e) => establecerPrompt(e.target.value)} placeholder={idioma === 'en' ? "Type message or /image prompt..." : "Escribe mensaje o /imagen prompt..."} disabled={cargando || isGeneratingImage}
                     className="flex-grow px-3 py-2.5 resize-none overflow-y-auto rounded-lg focus:outline-none disabled:opacity-50 border bg-input text-primary border-input focus:ring-1 focus:ring-offset-0 focus:border-accent custom-scrollbar placeholder:text-muted"
                     rows={1} style={{ maxHeight: '120px', minHeight: '44px' }} onInput={ajustarAlturaAreaTexto} onKeyDown={manejarTeclaAbajo}
                     aria-label={idioma === 'en' ? 'Chat input' : 'Entrada de chat'}
                 />
                  <button type="submit" disabled={cargando || isGeneratingImage || (!prompt.trim() && conteoArchivosMostrados === 0)} className="self-end flex-shrink-0 px-5 py-2.5 font-semibold rounded-lg transition-all bg-button-primary text-button-primary button-disabled hover:bg-button-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-indigo-500" title={idioma === 'en' ? "Send" : "Enviar"}>
                     {(cargando || isGeneratingImage) ? "⏳" : <span className="text-lg leading-none">➤</span>}
                  </button>
             </form>
        </div>
    );
};

export default Chat;
// --- END OF FILE Chat.jsx ---