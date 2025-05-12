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

// --- Constantes (sin cambios) ---
const MODELOS_DISPONIBLES = {
    "gemini-1.5-flash": "Gemini 1.5 Flash (Rápido)",
    "gemini-1.5-pro": "Gemini 1.5 Pro (Avanzado)",
    "gemini-2.0-flash": "Gemini 2.0 Flash",
    "gemini-2.5-pro-preview-03-25": "Gemini 2.5 Pro (Preview)"
};
const MODELO_POR_DEFECTO_FRONTEND = "gemini-1.5-flash";

// --- Función para generar imagen desde el frontend (ACTUALIZADA) ---
const generarImagenDesdePrompt = async (prompt) => {
  try {
    const respuesta = await fetch("https://chat-backend-y914.onrender.com/api/generateImage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
      credentials: "include", // Mantener si tu ruta de backend requiere autenticación
    });

    const datos = await respuesta.json(); // Leer JSON siempre

    if (!respuesta.ok) {
      // El backend ya debería devolver un objeto { error: "mensaje" }
      throw new Error(datos.error || "Error desconocido al generar la imagen desde el backend.");
    }

    // Ahora esperamos un objeto con 'imageUrl' y 'fileName'
    if (!datos.imageUrl) {
        throw new Error("El backend no devolvió una URL de imagen válida.");
    }
    console.log("[Frontend] Imagen generada con Clipdrop, URL:", datos.imageUrl);
    return datos.imageUrl; // Devolver la URL directamente
  } catch (error) {
    console.error("[Frontend] ❌ Error en generarImagenDesdePrompt:", error.message);
    throw error; // Re-lanzar para que lo maneje el componente
  }
};


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
    // --- Estados y Refs (sin cambios) ---
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

    // --- useEffects para TTS, scroll, textarea (sin cambios) ---
    useEffect(() => { /* ... TTS setup ... */
        if ('speechSynthesis' in window) { setTtsDisponible(true); }
        else { console.warn("Chat.jsx: API Web Speech no soportada."); }
        return () => { if (window.speechSynthesis && window.speechSynthesis.speaking) { window.speechSynthesis.cancel(); } refUtterance.current = null; setIdMensajeHablando(null); }
    }, []);

    const manejarHablarDetener = useCallback((texto, indiceMensaje) => { /* ... TTS logic ... */
        if (!ttsDisponible) return;
        const synth = window.speechSynthesis;
        if (synth.speaking && idMensajeHablando === indiceMensaje) { synth.cancel(); setIdMensajeHablando(null); refUtterance.current = null; return; }
        if (synth.speaking) { synth.cancel(); }
        const utterance = new SpeechSynthesisUtterance(texto); refUtterance.current = utterance; utterance.lang = idioma === 'es' ? 'es-ES' : 'en-US';
        utterance.onend = () => { if (refUtterance.current === utterance) { setIdMensajeHablando(null); refUtterance.current = null; } };
        utterance.onerror = (event) => { console.error("Chat.jsx: Error SpeechSynthesis:", event); if (refUtterance.current === utterance) { setIdMensajeHablando(null); refUtterance.current = null; } };
        setIdMensajeHablando(indiceMensaje); synth.speak(utterance);
    }, [ttsDisponible, idioma, idMensajeHablando]);

    useEffect(() => { /* ... Auto TTS on new message ... */
        if (!leerEnVozAltaActivado || !ttsDisponible || conversacion.length === 0 || conversacion.length === refConversacionAnterior.current.length) { refConversacionAnterior.current = conversacion; return; }
        const ultimoMensaje = conversacion[conversacion.length - 1];
        if (ultimoMensaje && ultimoMensaje.role === 'model' && !ultimoMensaje.esError && ultimoMensaje.text) {
            if (window.speechSynthesis.speaking) { window.speechSynthesis.cancel(); if (refUtterance.current) {refUtterance.current.onend=null; refUtterance.current.onerror=null;} refUtterance.current=null; setIdMensajeHablando(null); }
            const timerId = setTimeout(() => { const currentLastMsg = refConversacionAnterior.current[refConversacionAnterior.current.length -1]; if (currentLastMsg === ultimoMensaje) { manejarHablarDetener(ultimoMensaje.text, conversacion.length - 1); } }, 100);
             return () => clearTimeout(timerId);
        }
        refConversacionAnterior.current = conversacion;
    }, [conversacion, leerEnVozAltaActivado, ttsDisponible, manejarHablarDetener]);

    const desplazarHaciaAbajo = useCallback(() => { /* ... Scroll logic ... */
        requestAnimationFrame(() => { if (refContenedorScroll.current) { refContenedorScroll.current.scrollTop = refContenedorScroll.current.scrollHeight; } });
    }, []);

    const ajustarAlturaAreaTexto = () => { /* ... Textarea height adjust ... */
        const areaTexto = refAreaTexto.current; if (areaTexto) { areaTexto.style.height = 'auto'; const scrollHeight = areaTexto.scrollHeight; const maxHeight = 120; areaTexto.style.height = `${Math.min(scrollHeight, maxHeight)}px`; }
    };

    useEffect(() => { desplazarHaciaAbajo(); }, [conversacion, desplazarHaciaAbajo]);
    useEffect(() => { ajustarAlturaAreaTexto(); }, [prompt]);
    useEffect(() => { /* ... Clear prompt and TTS on new conversation ... */
        if (indiceHistorialActivo === null) { establecerPrompt(""); }
        if (ttsDisponible && window.speechSynthesis.speaking) { window.speechSynthesis.cancel(); setIdMensajeHablando(null); refUtterance.current = null; }
        refConversacionAnterior.current = [];
    }, [indiceHistorialActivo, ttsDisponible]);


    // --- Función principal enviarMensajeYGenerarRespuesta (ACTUALIZADA para mostrar imagen desde URL) ---
    const enviarMensajeYGenerarRespuesta = async (e) => {
        if (e) e.preventDefault();
        if (cargando) return;

        const promptActual = prompt.trim();
        // ... (lógica de archivos sin cambios)
        const archivosSeleccionadosActuales = listaArchivosUsuario.filter(f => f.seleccionado && !f.esNuevo).map(f => f.name);
        const archivosNuevosActuales = archivosPdfNuevos;
        const tieneArchivosSeleccionados = archivosSeleccionadosActuales.length > 0;
        const tieneArchivosNuevos = archivosNuevosActuales.length > 0;


        // ... (validaciones iniciales sin cambios)
        if ( indiceHistorialActivo === null && !promptActual && archivosNuevosActuales.length === 0 && archivosSeleccionadosActuales.length === 0) {
            establecerError(idioma === 'en' ? 'Start or select a conversation.' : 'Inicia o selecciona una conversación.'); return;
        }
        if (ttsDisponible && window.speechSynthesis.speaking) { window.speechSynthesis.cancel(); setIdMensajeHablando(null); refUtterance.current = null; }
        if (!promptActual && !tieneArchivosNuevos && !tieneArchivosSeleccionados) {
            establecerError(idioma === 'en' ? "Write message or select/upload PDF." : "Escribe mensaje o selecciona/sube PDF."); return;
        }

        // Limpiar prompt del input
        establecerPrompt("");
        requestAnimationFrame(() => { if (refAreaTexto.current) refAreaTexto.current.style.height = 'auto'; });


        // --- Manejo del comando /imagen ---
        if (promptActual.toLowerCase().startsWith("/imagen ")) {
            const promptParaImagen = promptActual.substring(8).trim(); // "/imagen ".length es 8

            if (!promptParaImagen) {
                establecerError(idioma === 'en' ? "Provide image description." : "Proporciona descripción para imagen.");
                return;
            }

            // Añadir mensaje del usuario al chat ANTES de generar imagen
            const mensajeUsuarioCmd = { role: "user", text: promptActual, date: new Date(), esError: false };
            establecerConversacion(prev => [...prev, mensajeUsuarioCmd]);
            refConversacionAnterior.current = [...refConversacionAnterior.current, mensajeUsuarioCmd]; // Actualizar ref

            establecerCargando(true);
            establecerError("");
            desplazarHaciaAbajo(); // Scroll después de añadir mensaje usuario

            try {
                console.log(`[Frontend /imagen] Solicitando imagen para: "${promptParaImagen}"`);
                const imageUrlRecibida = await generarImagenDesdePrompt(promptParaImagen); // Ya es la URL completa

                // Para que la URL funcione, el backend debe servirla correctamente.
                // Asumimos que la URL es algo como 'https://chat-backend-y914.onrender.com/generated_images/nombre.png'
                // Si es una URL relativa del backend '/generated_images/nombre.png', hay que completarla.
                // El backend devuelve una URL relativa, así que la completamos
                const fullImageUrl = `https://chat-backend-y914.onrender.com${imageUrlRecibida}`;


                const mensajeBotImagen = {
                    role: "model",
                    text: `Aquí tienes una imagen para "${promptParaImagen}":\n\n![Imagen generada](${fullImageUrl})`, // Usar la URL
                    date: new Date(),
                    esError: false,
                };

                establecerConversacion(prev => [...prev, mensajeBotImagen]); // Añadir a la conversación existente
                refConversacionAnterior.current = [...refConversacionAnterior.current, mensajeBotImagen];


            } catch (error) {
                console.error("[Frontend /imagen] Error generando imagen:", error.message);
                const mensajeErrorImg = {
                    role: "model",
                    text: `${idioma === 'en' ? 'Error generating image' : 'Error generando imagen'}: ${error.message}`,
                    esError: true, date: new Date()
                };
                establecerConversacion(prev => [...prev, mensajeErrorImg]);
                refConversacionAnterior.current = [...refConversacionAnterior.current, mensajeErrorImg];
            } finally {
                establecerCargando(false);
                desplazarHaciaAbajo();
            }
            return; // Fin del manejo de /imagen
        }

        // --- Manejo de mensajes de texto/PDF normales (sin cambios mayores) ---
        establecerCargando(true);
        establecerError("");

        const mensajeUsuario = { role: "user", text: promptActual, date: new Date(), esError: false };
        const conversacionConUsuario = [...conversacion, mensajeUsuario];
        establecerConversacion(conversacionConUsuario);
        refConversacionAnterior.current = conversacionConUsuario;
        // prompt ya se limpió arriba

        desplazarHaciaAbajo(); // Scroll después de añadir mensaje de usuario

        try {
            const formData = new FormData();
            formData.append("prompt", promptActual);
            if (indiceHistorialActivo !== null) { formData.append("conversationId", indiceHistorialActivo.toString()); }
            formData.append("modeloSeleccionado", modeloSeleccionado);
            formData.append("temperatura", temperatura.toString());
            formData.append("topP", topP.toString());
            formData.append("idioma", idioma);
            formData.append("archivosSeleccionados", JSON.stringify(archivosSeleccionadosActuales));
            archivosNuevosActuales.forEach((file) => { formData.append("archivosPdf", file, file.name); });

            const respuesta = await fetch("https://chat-backend-y914.onrender.com/api/generateText", {
                method: "POST", body: formData, credentials: 'include'
            });
            const datos = await respuesta.json();

            if (!respuesta.ok) {
                let errMsg = datos.error || `Error ${respuesta.status}`;
                // ... (manejo de errores de generateText sin cambios) ...
                if (respuesta.status === 401 || respuesta.status === 403) errMsg = idioma === 'en' ? 'Auth error. Login again.' : 'Error de autenticación. Inicia sesión.';
                else if (respuesta.status === 413) errMsg = idioma === 'en' ? 'File too large.' : 'Archivo grande.';
                else if (datos.errors) errMsg = Object.values(datos.errors).flat().join(' ');
                throw new Error(errMsg);
            }

            const esErrorIA = datos.respuesta?.toLowerCase().includes("lo siento") || !datos.respuesta;
            const mensajeBot = {
                role: "model",
                text: datos.respuesta || (idioma === 'en' ? "(Empty response)" : "(Respuesta vacía)"),
                date: new Date(), esError: esErrorIA
            };
            const conversacionFinal = [...conversacionConUsuario, mensajeBot];
            establecerConversacion(conversacionFinal);
            refConversacionAnterior.current = conversacionFinal;

            if (datos.isNewConversation && datos.conversationId) {
                establecerIndiceHistorialActivo(datos.conversationId);
                if (typeof refrescarHistorial === 'function') setTimeout(() => refrescarHistorial(), 150);
            }
            if (tieneArchivosNuevos && typeof limpiarArchivosPdfNuevosYRefrescar === 'function') {
                setTimeout(() => limpiarArchivosPdfNuevosYRefrescar(), 150);
            }

        } catch (errorCapturado) {
            console.error("Error en enviarMensajeYGenerarRespuesta (texto):", errorCapturado);
            const textoErrorFinal = errorCapturado.message || (idioma === 'en' ? "Unexpected error." : "Error inesperado.");
            establecerError(textoErrorFinal); // Mostrar en UI si hay espacio
            const mensajeErrorChat = {
                role: "model", text: `${idioma === 'en' ? 'Error' : 'Error'}: ${textoErrorFinal}`,
                esError: true, date: new Date()
            };
            establecerConversacion(prev => [...prev.filter(m => m.role !== 'user' || m.text !== promptActual), mensajeUsuario, mensajeErrorChat]); // Re-añadir mensaje user + error
            refConversacionAnterior.current = [...refConversacionAnterior.current.filter(m => m.role !== 'user' || m.text !== promptActual), mensajeUsuario, mensajeErrorChat];
        } finally {
            establecerCargando(false);
            desplazarHaciaAbajo();
        }
    };

    // --- Otros manejadores (sin cambios) ---
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
    const obtenerConteoArchivosMostrados = () => { /* ... (sin cambios) ... */ return archivosPdfNuevos.length + (Array.isArray(listaArchivosUsuario) ? listaArchivosUsuario.filter(f => f && f.seleccionado && !f.esNuevo).length : 0);};
    const conteoArchivosMostrados = obtenerConteoArchivosMostrados();


    return (
        // --- JSX del Chat (sin cambios significativos en la estructura, solo en cómo se podría renderizar un <img>) ---
        <div className="flex flex-col flex-1 max-h-screen bg-surface text-primary">
            {/* Cabecera */}
            <div className="relative flex items-center justify-between flex-shrink-0 p-3 border-b border-divider">
                <button onClick={toggleMobileMenu} className="p-1.5 md:hidden"> <IconoMenu /> </button>
                 <div className="flex flex-col items-center text-center flex-grow">
                     <h1 className="text-lg font-semibold truncate">
                         <a href="https://united-its.com/" target="_blank" rel="noopener noreferrer" className="text-link hover:underline">
                             Asistencia United ITS
                         </a>
                     </h1>
                     <div className="mt-1">
                         <label htmlFor="selectorModelo" className="mr-2 text-xs text-muted">Modelo IA:</label>
                         <select id="selectorModelo" value={modeloSeleccionado} onChange={manejarCambioModelo} disabled={cargando}
                             className="p-1 text-xs rounded outline-none disabled:opacity-50 bg-input">
                             {Object.entries(MODELOS_DISPONIBLES).map(([clave, etiqueta]) => (
                                 <option key={clave} value={clave}>{etiqueta}</option>
                             ))}
                         </select>
                     </div>
                 </div>
                 <div className="flex items-center justify-end min-w-[40px] sm:min-w-[70px]">
                      {ttsDisponible && (
                             <>
                                 <div className="p-1 rounded-md" title={leerEnVozAltaActivado ? 'Lectura auto ON (F)' : 'Lectura auto OFF (F)'}>
                                     {leerEnVozAltaActivado ? <IconoAltavozActivo className="text-accent h-5 w-5" /> : <IconoAltavozInactivo className="text-muted h-5 w-5" />}
                                 </div>
                                 <span className="ml-1 text-xs text-muted select-none hidden sm:inline">(F)</span>
                             </>
                      )}
                 </div>
            </div>

             {/* Área de Mensajes */}
             <div ref={refContenedorScroll} className="flex-1 p-4 overflow-y-auto sm:p-6 bg-base custom-scrollbar">
                 <div className="space-y-4">
                     {(!Array.isArray(conversacion) || conversacion.length === 0) && !cargando ? (
                         <p className="pt-4 text-sm text-center text-muted">{idioma === 'en' ? 'Start the conversation...' : 'Inicia la conversación...'}</p>
                     ) : (
                         Array.isArray(conversacion) && conversacion.map((mensaje, index) => {
                            if (!mensaje || typeof mensaje.role === 'undefined') return null;
                            return (
                                <div key={index} className={`group flex items-start ${mensaje.role === "user" ? "justify-end" : "justify-start"}`}>
                                    {/* ... (iconos de rol) ... */}
                                    {mensaje.role === "model" && !mensaje.esError && ( <div className="pt-1 mr-2 text-xl flex-shrink-0 self-start text-accent">🤖</div> )}
                                    {mensaje.role === "model" && mensaje.esError && ( <div className="pt-1 mr-2 text-xl flex-shrink-0 self-start text-error">⚠️</div> )}
                                    <div className={`flex items-end ${mensaje.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                                        {/* ... (botón TTS) ... */}
                                        {ttsDisponible && mensaje.text && (
                                        <button onClick={() => manejarHablarDetener(mensaje.text, index)}
                                            className={`p-1 rounded text-muted hover:text-primary opacity-0 group-hover:opacity-100 focus:opacity-100 ${idMensajeHablando === index ? 'opacity-100' : ''} ${mensaje.role === 'user' ? 'ml-1' : 'mr-1'}`} >
                                            {idMensajeHablando === index ? <IconoDetenerAltavoz /> : <IconoAltavoz />}
                                        </button>
                                        )}
                                        <div className={`p-3 rounded-lg max-w-xs sm:max-w-md lg:max-w-xl shadow break-words ${ mensaje.esError ? "bg-chat-error text-chat-error" : mensaje.role === "user" ? "bg-chat-user text-chat-user" : "bg-chat-model text-chat-model" } ${ mensaje.role === "user" ? 'rounded-br-none' : 'rounded-bl-none' }`}>
                                            {mensaje.role === "model" ? ( // ReactMarkdown para el modelo
                                                <div className="markdown-content">
                                                    <ReactMarkdown rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]}
                                                        components={{
                                                            p: ({ ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                                                            a: ({ ...props}) => <a className="text-link hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                                                            img: ({src, alt, ...props}) => {
                                                                // Si es una URL de nuestras imágenes generadas, aseguramos que sea completa
                                                                const imgSrc = src?.startsWith('/generated_images/')
                                                                    ? `https://chat-backend-y914.onrender.com${src}`
                                                                    : src;
                                                                return <img src={imgSrc} alt={alt || "imagen"} className="my-2 rounded-md max-w-full h-auto" {...props} />;
                                                            },
                                                            // ... otros componentes de Markdown
                                                        }}
                                                    >
                                                        {mensaje.text || ""}
                                                    </ReactMarkdown>
                                                </div>
                                            ) : ( <p className="text-sm whitespace-pre-wrap">{mensaje.text}</p> )} {/* Texto plano para usuario */}
                                        </div>
                                    </div>
                                    {mensaje.role === "user" && ( <div className="pt-1 ml-2 text-xl flex-shrink-0 self-start text-accent">👤</div> )}
                                </div>
                            );
                        })
                     )}
                     {cargando && ( /* ... Indicador de carga ... */ <div className="flex items-center justify-center mt-4"><div className="w-4 h-4 border-b-2 rounded-full animate-spin border-muted"></div><p className="ml-2 text-xs text-muted">{idioma === 'en' ? 'Thinking...' : 'Pensando...'}</p></div>)}
                     {error && !cargando && ( /* ... Mensaje de error ... */ <div className="px-4 py-2 mt-4 text-center border rounded bg-error-notification"><p className="text-xs text-error">{error}</p></div>)}
                     <div ref={refFinMensajes} style={{ height: "1px" }} />
                 </div>
             </div>

            {/* Formulario de Envío (sin cambios) */}
            <form onSubmit={enviarMensajeYGenerarRespuesta} className="flex items-end flex-shrink-0 gap-2 p-3 border-t bg-surface">
                {/* ... Botón de adjuntar PDF ... */}
                <div className="flex-shrink-0 self-end">
                     <input type="file" accept=".pdf" multiple onChange={manejarCambioArchivoInput} disabled={cargando} className="hidden" id="inputArchivoPdf" />
                     <label htmlFor="inputArchivoPdf" title={conteoArchivosMostrados > 0 ? `${conteoArchivosMostrados} archivo(s)` : (idioma === 'es' ? 'Adjuntar PDF' : 'Attach PDF')}
                           className={`relative cursor-pointer p-2.5 rounded-lg ${ cargando ? 'opacity-50' : 'hover:bg-hover-item' }`}>
                           📄
                           {conteoArchivosMostrados > 0 && ( <span className="absolute flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-accent rounded-full shadow -top-1 -right-1"> {conteoArchivosMostrados} </span> )}
                      </label>
                </div>
                <textarea ref={refAreaTexto} value={prompt} onChange={(e) => establecerPrompt(e.target.value)} placeholder={idioma === 'en' ? "Message or /imagen..." : "Mensaje o /imagen..."} disabled={cargando}
                     className="flex-grow px-3 py-2.5 resize-none rounded-lg outline-none disabled:opacity-50 bg-input custom-scrollbar"
                     rows={1} style={{ maxHeight: '120px', minHeight: '44px' }} onInput={ajustarAlturaAreaTexto} onKeyDown={manejarTeclaAbajo} />
                 <button type="submit" disabled={cargando || (!prompt.trim() && conteoArchivosMostrados === 0)}
                     className="self-end flex-shrink-0 px-5 py-2.5 font-semibold rounded-lg bg-button-primary text-button-primary button-disabled hover:bg-button-primary-hover">
                     {cargando ? "⏳" : <span className="text-lg leading-none">➤</span>}
                 </button>
            </form>
        </div>
    );
};

export default Chat;