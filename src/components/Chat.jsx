

import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { IconoAltavozActivo, IconoAltavozInactivo, IconoMenu } from './Historial';

const IconoAltavoz = ({ className = "" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /> </svg> );
const IconoDetenerAltavoz = ({ className = "" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /> <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /> </svg> );
const IconoDescargar = ({className = ""}) => ( <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /> </svg> );


const MODELOS_DISPONIBLES = {
    "gemini-1.5-flash": "Gemini 1.5 Flash (Rápido)",
    "gemini-1.5-pro": "Gemini 1.5 Pro (Avanzado)",
    "gemini-2.0-flash": "Gemini 2.0 Flash (Experimental)",
    
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
    const [estaCargandoRespuesta, setEstaCargandoRespuesta] = useState(false);
    const [mensajeErrorChat, setMensajeErrorChat] = useState("");
    const [textoPrompt, setTextoPrompt] = useState("");
    const [modeloIaSeleccionado, setModeloIaSeleccionado] = useState(() => {
        if (typeof window !== 'undefined') {
            const modeloGuardado = localStorage.getItem('modeloSeleccionadoIA');
            if (modeloGuardado && MODELOS_DISPONIBLES[modeloGuardado]) return modeloGuardado;
        }
        return MODELO_POR_DEFECTO_FRONTEND;
    });
    const [idMensajeReproduciendo, setIdMensajeReproduciendo] = useState(null);
    const [sintesisVozDisponible, setSintesisVozDisponible] = useState(false);

    const refFinalMensajes = useRef(null);
    const refEntradaTexto = useRef(null);
    const refScrollMensajes = useRef(null);
    const refDeclaracionVoz = useRef(null);
    const refConvActualTTS = useRef(conversacion);

    useEffect(() => {
        refConvActualTTS.current = conversacion;
    }, [conversacion]);

    useEffect(() => {
      if (typeof window !== 'undefined') localStorage.setItem('modeloSeleccionadoIA', modeloIaSeleccionado);
    }, [modeloIaSeleccionado]);

    useEffect(() => {
        if ('speechSynthesis' in window) { setSintesisVozDisponible(true); }
        else { console.warn("Chat.jsx: API Web Speech no soportada."); }
        return () => {
             if (window.speechSynthesis && window.speechSynthesis.speaking) { window.speechSynthesis.cancel(); }
             refDeclaracionVoz.current = null; setIdMensajeReproduciendo(null);
        }
    }, []);

    const gestionarReproducirDetenerVoz = useCallback((texto, mensajeId) => {
        if (!sintesisVozDisponible || !texto) return;
        const synth = window.speechSynthesis;
        if (synth.speaking && idMensajeReproduciendo === mensajeId) {
            synth.cancel(); setIdMensajeReproduciendo(null); refDeclaracionVoz.current = null; return;
        }
        if (synth.speaking) { synth.cancel(); }

        const declaracion = new SpeechSynthesisUtterance(texto);
        refDeclaracionVoz.current = declaracion;
        declaracion.lang = idioma === 'es' ? 'es-ES' : 'en-US';
        declaracion.onend = () => { if (refDeclaracionVoz.current === declaracion) { setIdMensajeReproduciendo(null); refDeclaracionVoz.current = null; } };
        declaracion.onerror = (evento) => { console.error("Chat.jsx: Error SpeechSynthesis:", evento); if (refDeclaracionVoz.current === declaracion) { setIdMensajeReproduciendo(null); refDeclaracionVoz.current = null; } };
        setIdMensajeReproduciendo(mensajeId);
        synth.speak(declaracion);
    }, [sintesisVozDisponible, idioma, idMensajeReproduciendo]);

    useEffect(() => {
        if (!leerEnVozAltaActivado || !sintesisVozDisponible || !refConvActualTTS.current || refConvActualTTS.current.length === 0) return;

        const convActual = refConvActualTTS.current;
        const ultimoMensaje = convActual[convActual.length - 1];

        if (ultimoMensaje && ultimoMensaje.role === 'model' && !ultimoMensaje.esError && ultimoMensaje.text && !ultimoMensaje.isImage) {
            if (window.speechSynthesis.speaking) {
                if (refDeclaracionVoz.current && refDeclaracionVoz.current.text !== ultimoMensaje.text) {
                    window.speechSynthesis.cancel();
                } else { return; }
            }
            const temporizadorId = setTimeout(() => {
                 const convActualizadaParaTTS = refConvActualTTS.current;
                 if (convActualizadaParaTTS && convActualizadaParaTTS.length > 0 && convActualizadaParaTTS[convActualizadaParaTTS.length - 1] === ultimoMensaje) {
                     // console.log("[TTS Auto] Leyendo ID:", ultimoMensaje.id, ultimoMensaje.text.substring(0,30) + "...");
                     gestionarReproducirDetenerVoz(ultimoMensaje.text, ultimoMensaje.id);
                 }
            }, 150);
             return () => clearTimeout(temporizadorId);
        }
    }, [leerEnVozAltaActivado, sintesisVozDisponible, gestionarReproducirDetenerVoz, conversacion]);


    const irAFinalDeChat = useCallback(() => {
        requestAnimationFrame(() => {
          if (refScrollMensajes.current) {
              refScrollMensajes.current.scrollTop = refScrollMensajes.current.scrollHeight;
          }
        });
    }, []);

    const ajustarAlturaInputTexto = () => { 
        const areaTexto = refEntradaTexto.current; 
        if (areaTexto) { 
            areaTexto.style.height = 'auto'; 
            const scrollHeight = areaTexto.scrollHeight; 
            const maxHeight = 120; 
            areaTexto.style.height = `${Math.min(scrollHeight, maxHeight)}px`; 
        } 
    };

    useEffect(() => { irAFinalDeChat(); }, [conversacion, irAFinalDeChat]);
    useEffect(() => { ajustarAlturaInputTexto(); }, [textoPrompt]);

    useEffect(() => {
        if (idConversacionActiva === null) setTextoPrompt("");
        if (sintesisVozDisponible && window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel(); setIdMensajeReproduciendo(null); refDeclaracionVoz.current = null;
        }
    }, [idConversacionActiva, sintesisVozDisponible]);


    const gestionarDescargaImagen = async (imageUrl, fileName) => {
        if (!imageUrl) {
            console.error("gestionarDescargaImagen: imageUrl es indefinida o nula.");
            return;
        }
        try {
            const nombrePorDefecto = fileName || `imagen_generada_${Date.now()}.png`;
            const urlParaFetch = imageUrl;

            const response = await fetch(urlParaFetch);
            if (!response.ok) {
                console.error("Error al descargar imagen, respuesta no OK:", response.status, response.statusText);
                setMensajeErrorChat(idioma === 'es' ? `Error descargando imagen: ${response.status}` : `Error downloading image: ${response.status}`);
                return;
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
            console.error("Error en gestionarDescargaImagen:", error);
            setMensajeErrorChat(idioma === 'es' ? "Error al procesar descarga de imagen." : "Error processing image download.");
         }
    };

    const enviarPromptYObtenerRespuesta = async (e) => {
        if (e) e.preventDefault();
        if (estaCargandoRespuesta) return;

        const promptUsuarioActual = textoPrompt.trim();
        const archivosExistentesSeleccionados = listaArchivosUsuario.filter(f => f.seleccionado && !f.esNuevo).map(f => f.name);
        const nuevosArchivosParaSubir = archivosPdfNuevos;

        if (sintesisVozDisponible && window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            setIdMensajeReproduciendo(null);
            refDeclaracionVoz.current = null;
        }

        const esSolicitudImagen = promptUsuarioActual.toLowerCase().startsWith("/imagen ") || promptUsuarioActual.toLowerCase().startsWith("/image ");
        const promptLimpioParaBackend = esSolicitudImagen ? promptUsuarioActual.substring(promptUsuarioActual.indexOf(" ") + 1).trim() : promptUsuarioActual;
        
        let conversacionTemporalParaCatch; // Para tener la conversación actualizada en el catch

        if (esSolicitudImagen) {
            if (!promptLimpioParaBackend) {
                setMensajeErrorChat(idioma === 'es' ? "Por favor, proporciona una descripción para la imagen después de /imagen." : "Please provide a description for the image after /image.");
                if (refEntradaTexto.current) {
                    requestAnimationFrame(() => {
                        if (refEntradaTexto.current) {
                             console.log("[FOCO DEBUG] Intentando foco en 'esSolicitudImagen' SIN promptLimpioParaBackend");
                             refEntradaTexto.current.focus();
                             console.log("[FOCO DEBUG] Active element:", document.activeElement);
                        }
                    });
                }
                return;
            }

            setEstaCargandoRespuesta(true); 
            setMensajeErrorChat("");
            let idConvActualParaOperacion = idConversacionActiva;
            const mensajeComandoUsuario = { id: Date.now() + '_cmd', role: "user", text: promptUsuarioActual, date: new Date(), esError: false, isImage: false };
            
            // Actualizar estado de conversación inmediatamente para que el usuario vea su mensaje
            // Y guardar esta nueva conversación para el bloque catch si es necesario
            establecerConversacion(prev => {
                conversacionTemporalParaCatch = [...prev, mensajeComandoUsuario];
                return conversacionTemporalParaCatch;
            });

            try {
                if (!idConvActualParaOperacion) {
                    // ... (lógica de creación de nueva conversación para imagen) ...
                    console.log("[Chat] Creando nueva conversación para /imagen...");
                    const datosFormularioNuevaConv = new FormData();
                    datosFormularioNuevaConv.append("prompt", `Nueva conversación para imagen: ${promptLimpioParaBackend.substring(0, 30)}...`);
                    datosFormularioNuevaConv.append("modeloSeleccionado", modeloIaSeleccionado);
                    datosFormularioNuevaConv.append("temperatura", temperatura.toString());
                    datosFormularioNuevaConv.append("topP", topP.toString());
                    datosFormularioNuevaConv.append("idioma", idioma);
                    datosFormularioNuevaConv.append("archivosSeleccionados", JSON.stringify([]));
                     try { const zonaHorariaCliente = Intl.DateTimeFormat().resolvedOptions().timeZone; if (zonaHorariaCliente) datosFormularioNuevaConv.append("clientTimeZone", zonaHorariaCliente); } catch{console.warn("No se pudo obtener clientTimeZone para conv de imagen")}


                    const respuestaNuevaConv = await fetch(`${backendUrl}/api/generateText`, {
                        method: "POST", body: datosFormularioNuevaConv, credentials: 'include'
                    });
                    const datosRespuestaNuevaConv = await respuestaNuevaConv.json();

                    if (!respuestaNuevaConv.ok || !datosRespuestaNuevaConv.conversationId) {
                        throw new Error(datosRespuestaNuevaConv.error || 'Error creando conversación para la imagen.');
                    }
                    idConvActualParaOperacion = datosRespuestaNuevaConv.conversationId;
                    establecerIdConversacionActiva(idConvActualParaOperacion); // Esto actualiza idConversacionActiva
                    if (datosRespuestaNuevaConv.respuesta && datosRespuestaNuevaConv.respuesta.trim()) {
                        const mensajeResumenConv = { id: Date.now() + '_sum', role: "model", text: datosRespuestaNuevaConv.respuesta, date: new Date(), esError: false, isImage: false };
                        establecerConversacion(prev => [...prev, mensajeResumenConv]); // Añade el resumen
                    }
                    if (typeof refrescarHistorial === 'function') setTimeout(refrescarHistorial, 250);
                }

                console.log(`[Chat] Generando imagen con prompt "${promptLimpioParaBackend}" en Conv ID ${idConvActualParaOperacion}`);
                const respuestaServicioImagen = await fetch(`${backendUrl}/api/generateImage`, {
                    method: "POST", headers: { "Content-Type": "application/json" }, credentials: 'include',
                    body: JSON.stringify({ prompt: promptLimpioParaBackend, conversationId: idConvActualParaOperacion }),
                });
                const datosResultadoImagen = await respuestaServicioImagen.json();
                if (!respuestaServicioImagen.ok) throw new Error(datosResultadoImagen.error || `Error ${respuestaServicioImagen.status} generando imagen`);
                
                const mensajeConImagenGenerada = {
                    id: datosResultadoImagen.messageId || Date.now() + '_img',
                    role: "model",
                    text: datosResultadoImagen.message || (idioma === 'es' ? `Imagen generada` : `Image generated`),
                    imageUrl: datosResultadoImagen.imageUrl,
                    fileName: datosResultadoImagen.fileName,
                    isImage: true,
                    date: new Date(),
                    esError: !!datosResultadoImagen.errorDB,
                };
                establecerConversacion(prev => [...prev, mensajeConImagenGenerada]); // Añade la imagen

            } catch (err) {
                const detalleError = err.message || (idioma === 'es' ? 'Error al generar imagen.' : 'Error generating image.');
                const mensajeErrorImagen = { id: Date.now() + '_err_img', role: "model", text: detalleError, esError: true, date: new Date(), isImage: false };
                // Usar la conversacionTemporalParaCatch si está definida, si no, usar el 'prev' actual de establecerConversacion
                establecerConversacion(prev => [...(conversacionTemporalParaCatch || prev), mensajeErrorImagen]);
                setMensajeErrorChat(detalleError);
            } finally {
                setEstaCargandoRespuesta(false);
                setTextoPrompt(""); 
                if (refEntradaTexto.current) {
                    refEntradaTexto.current.style.height = 'auto';
                }
                irAFinalDeChat();
                if (refEntradaTexto.current) {
                    requestAnimationFrame(() => {
                        if (refEntradaTexto.current) {
                            console.log("[FOCO DEBUG] Intentando foco en finally 'esSolicitudImagen'");
                            refEntradaTexto.current.focus();
                            console.log("[FOCO DEBUG] Active element:", document.activeElement);
                        }
                    });
                }
            }
            return;
        }

        if ( !promptUsuarioActual && nuevosArchivosParaSubir.length === 0 && archivosExistentesSeleccionados.length === 0 ) {
            setMensajeErrorChat(idioma === 'es' ? "Por favor, escribe un mensaje o selecciona/sube al menos un archivo PDF." : "Please write a message or select/upload at least one PDF file.");
            if (refEntradaTexto.current) {
                requestAnimationFrame(() => {
                    if (refEntradaTexto.current) {
                        console.log("[FOCO DEBUG] Intentando foco en 'sin prompt ni archivos'");
                        refEntradaTexto.current.focus();
                        console.log("[FOCO DEBUG] Active element:", document.activeElement);
                    }
                });
            }
            return;
        }

        setEstaCargandoRespuesta(true); 
        setMensajeErrorChat("");
        const mensajeDeUsuario = { id: Date.now() + '_usr', role: "user", text: promptUsuarioActual, date: new Date(), esError: false, isImage: false };
        
        establecerConversacion(prev => {
            conversacionTemporalParaCatch = [...prev, mensajeDeUsuario];
            return conversacionTemporalParaCatch;
        });

        try {
            const datosFormulario = new FormData();
            datosFormulario.append("prompt", promptUsuarioActual);
            if (idConversacionActiva !== null) datosFormulario.append("conversationId", idConversacionActiva.toString());
            datosFormulario.append("modeloSeleccionado", modeloIaSeleccionado);
            datosFormulario.append("temperatura", temperatura.toString());
            datosFormulario.append("topP", topP.toString());
            datosFormulario.append("idioma", idioma);
            datosFormulario.append("archivosSeleccionados", JSON.stringify(archivosExistentesSeleccionados));
            nuevosArchivosParaSubir.forEach((file) => datosFormulario.append("archivosPdf", file, file.name));
            try {
                const zonaHorariaCliente = Intl.DateTimeFormat().resolvedOptions().timeZone;
                if (zonaHorariaCliente) datosFormulario.append("clientTimeZone", zonaHorariaCliente);
            } catch (errorZonaHoraria) { console.warn("[Chat] No se pudo obtener clientTimeZone:", errorZonaHoraria); }


            const respuestaServicioTexto = await fetch(`${backendUrl}/api/generateText`, {
                method: "POST", body: datosFormulario, credentials: 'include'
            });
            const datosRespuestaTexto = await respuestaServicioTexto.json();

            if (datosRespuestaTexto.uploadErrors && datosRespuestaTexto.uploadErrors.length > 0) {
                const mensajeErrorArchivos = idioma === 'es' ? "Algunos PDFs no pudieron ser procesados: " : "Some PDFs could not be processed: ";
                const cadenaErroresArchivos = datosRespuestaTexto.uploadErrors.map(err => `${err.originalName} (${err.error})`).join(', ');
                setMensajeErrorChat(mensajeErrorArchivos + cadenaErroresArchivos);
            }

            if (!respuestaServicioTexto.ok && !datosRespuestaTexto.respuesta) {
                throw new Error(datosRespuestaTexto.error || `Error ${respuestaServicioTexto.status} generando texto`);
            }
            
            const esRespuestaConErrorIA = (!datosRespuestaTexto.respuesta && !datosRespuestaTexto.error) ||
                                         (datosRespuestaTexto.respuesta && (datosRespuestaTexto.respuesta.toLowerCase().includes("lo siento") || datosRespuestaTexto.respuesta.toLowerCase().includes("i'm sorry"))) ||
                                         (datosRespuestaTexto.error);
                                         
            const textoAMostrar = datosRespuestaTexto.respuesta || datosRespuestaTexto.error || (idioma === 'es' ? "No se pudo obtener respuesta." : "Could not get a response.");

            const mensajeTextoGenerado = { 
                id: datosRespuestaTexto.messageId || Date.now() + '_model', 
                role: "model", 
                text: textoAMostrar, 
                date: new Date(), 
                esError: esRespuestaConErrorIA, 
                isImage: false 
            };
            establecerConversacion(prev => [...(conversacionTemporalParaCatch || prev), mensajeTextoGenerado]);


            if (datosRespuestaTexto.isNewConversation && datosRespuestaTexto.conversationId) {
                establecerIdConversacionActiva(datosRespuestaTexto.conversationId);
                if (typeof refrescarHistorial === 'function') setTimeout(refrescarHistorial, 250);
            }
            if (nuevosArchivosParaSubir.length > 0 && typeof limpiarArchivosPdfNuevosYRefrescar === 'function') {
                setTimeout(limpiarArchivosPdfNuevosYRefrescar, 150);
            }

        } catch (err) {
            const detalleError = err.message || (idioma === 'es' ? 'Error al generar respuesta.' : 'Error generating response.');
            const mensajeErrorTexto = { id: Date.now() + '_err_txt', role: "model", text: detalleError, esError: true, date: new Date(), isImage: false };
            establecerConversacion(prev => [...(conversacionTemporalParaCatch || prev), mensajeErrorTexto]);
            setMensajeErrorChat(detalleError);
        } finally {
            setEstaCargandoRespuesta(false);
            setTextoPrompt(""); 
            if (refEntradaTexto.current) {
                refEntradaTexto.current.style.height = 'auto';
            }
            irAFinalDeChat();
            if (refEntradaTexto.current) {
                requestAnimationFrame(() => {
                    if (refEntradaTexto.current) {
                        console.log("[FOCO DEBUG] Intentando foco en finally de texto normal");
                        refEntradaTexto.current.focus();
                        console.log("[FOCO DEBUG] Active element:", document.activeElement);
                    }
                });
            }
        }
    };

    const gestionarCambioModeloIA = (evento) => { setModeloIaSeleccionado(evento.target.value); };
    
    const gestionarTeclaEnter = (e) => {
         if (e.key === 'Enter' && !e.shiftKey && !estaCargandoRespuesta) {
             e.preventDefault();
              const promptUsuarioActualRecortado = textoPrompt.trim();
              const archivosExistentesSeleccionados = listaArchivosUsuario.filter(f => f.seleccionado && !f.esNuevo);
              const nuevosArchivosParaSubir = archivosPdfNuevos;
              if (promptUsuarioActualRecortado || (promptUsuarioActualRecortado.toLowerCase().startsWith("/imagen ") || promptUsuarioActualRecortado.toLowerCase().startsWith("/image ")) || nuevosArchivosParaSubir.length > 0 || archivosExistentesSeleccionados.length > 0) {
                 enviarPromptYObtenerRespuesta(null);
             } else {
                // Si no se envía nada, pero el usuario presiona Enter,
                // puede ser útil re-enfocar si el textarea perdió el foco por alguna razón
                if (refEntradaTexto.current && document.activeElement !== refEntradaTexto.current) {
                    requestAnimationFrame(() => {
                         if (refEntradaTexto.current) {
                            console.log("[FOCO DEBUG] Intentando foco en Enter sin envío");
                            refEntradaTexto.current.focus();
                            console.log("[FOCO DEBUG] Active element:", document.activeElement);
                        }
                    });
                }
             }
         }
    };
    const numArchivosAdjuntos = archivosPdfNuevos.length + (Array.isArray(listaArchivosUsuario) ? listaArchivosUsuario.filter(f => f?.seleccionado && !f.esNuevo).length : 0);

    return (
        <div className="flex flex-col flex-1 max-h-screen bg-surface text-primary">
            {/* Header del Chat */}
            <div className="relative flex items-center justify-between flex-shrink-0 p-3 border-b border-divider">
                <button onClick={toggleMobileMenu} className="p-1.5 rounded-md text-secondary hover:text-primary hover:bg-hover-item md:hidden" title={idioma === 'es' ? 'Abrir menú' : 'Open menu'} aria-label={idioma === 'es' ? 'Abrir menú' : 'Open menu'} > <IconoMenu /> </button>
                 <div className="flex flex-col items-center text-center flex-grow min-w-0 px-2">
                     <h1 className="text-lg font-semibold truncate text-primary w-full"> <a href="https://united-its.com/" target="_blank" rel="noopener noreferrer" className="transition-colors text-link hover:underline"> Asistencia United ITS </a> </h1>
                     <div className="mt-1">
                         <label htmlFor="selectorModelo" className="mr-2 text-xs align-middle text-muted">Modelo IA:</label>
                         <select id="selectorModelo" value={modeloIaSeleccionado} onChange={gestionarCambioModeloIA} disabled={estaCargandoRespuesta} className="p-1 text-xs align-middle rounded outline-none disabled:opacity-50 border bg-input text-primary border-input input-focus focus:ring-1 focus:ring-offset-0 focus:border-accent" > {Object.entries(MODELOS_DISPONIBLES).map(([clave, etiqueta]) => ( <option key={clave} value={clave}>{etiqueta}</option>))} </select>
                     </div>
                 </div>
                 <div className="flex items-center justify-end min-w-[40px] sm:min-w-[70px]">
                      <div className="flex items-center">
                         {sintesisVozDisponible && (
                             <>
                                 <div className="p-1 rounded-md text-secondary" title={leerEnVozAltaActivado ? (idioma === 'es' ? 'Lectura automática activada (Tecla F)' : 'Auto-read aloud active (F Key)') : (idioma === 'es' ? 'Lectura automática desactivada (Tecla F)' : 'Auto-read aloud inactive (F Key)')}> {leerEnVozAltaActivado ? <IconoAltavozActivo className="text-accent h-5 w-5" /> : <IconoAltavozInactivo className="text-muted h-5 w-5" /> } </div>
                                 <span className="ml-1 text-xs text-muted select-none hidden sm:inline"> (F) </span>
                             </>
                         )}
                     </div>
                 </div>
            </div>

            {/* Contenedor de Mensajes */}
             <div ref={refScrollMensajes} className="flex-1 p-4 overflow-y-auto sm:p-6 bg-base custom-scrollbar">
                 <div className="space-y-4">
                     {!Array.isArray(conversacion) || conversacion.length === 0 && !estaCargandoRespuesta ? (
                         <p className="pt-4 text-sm text-center text-muted">{idioma === 'es' ? 'Inicia la conversación...' : 'Start the conversation...'}</p>
                     ) : (
                         Array.isArray(conversacion) && conversacion.map((mensaje) => {
                            if (!mensaje || typeof mensaje.role === 'undefined' || typeof mensaje.id === 'undefined') {
                                console.warn("Mensaje inválido o sin ID:", mensaje);
                                return null;
                            }
                            
                            const esMensajeUsuario = mensaje.role === "user";
                            const esMensajeModelo = mensaje.role === "model";

                            return (
                                <div key={mensaje.id} className={`group flex items-start ${esMensajeUsuario ? "justify-end" : "justify-start"}`}>
                                    {esMensajeModelo && !mensaje.esError && !mensaje.isImage && ( <div className="pt-1 mr-2 text-xl flex-shrink-0 self-start text-accent">🤖</div> )}
                                    {esMensajeModelo && mensaje.isImage && !mensaje.esError && ( <div className="pt-1 mr-2 text-xl flex-shrink-0 self-start text-accent">🖼️</div> )}
                                    {esMensajeModelo && mensaje.esError && ( <div className="pt-1 mr-2 text-xl flex-shrink-0 self-start text-error">⚠️</div> )}
                                    
                                    <div className={`flex items-end ${esMensajeUsuario ? "flex-row-reverse" : "flex-row"}`}>
                                        {sintesisVozDisponible && mensaje.text && !mensaje.isImage && (
                                        <button onClick={() => gestionarReproducirDetenerVoz(mensaje.text, mensaje.id)} className={`p-1 rounded text-muted hover:text-primary hover:bg-hover-item opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity self-end mb-1 ${idMensajeReproduciendo === mensaje.id ? 'opacity-100' : ''} ${esMensajeUsuario ? 'ml-1' : 'mr-1'}`} aria-label={idMensajeReproduciendo === mensaje.id ? (idioma === 'es' ? 'Detener lectura' : 'Stop reading') : (idioma === 'es' ? 'Leer mensaje en voz alta' : 'Read message aloud')} title={idMensajeReproduciendo === mensaje.id ? (idioma === 'es' ? 'Detener lectura' : 'Stop reading') : (idioma === 'es' ? 'Leer mensaje en voz alta' : 'Read message aloud')}>
                                            {idMensajeReproduciendo === mensaje.id ? <IconoDetenerAltavoz /> : <IconoAltavoz />} </button>
                                        )}
                                        <div className={`p-3 rounded-lg max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl shadow break-words ${ mensaje.esError ? "bg-chat-error text-chat-error border border-chat-error" : esMensajeUsuario ? "bg-chat-user text-chat-user" : "bg-chat-model text-chat-model" } ${ esMensajeUsuario ? 'rounded-br-none' : 'rounded-bl-none' }`}>
                                            
                                            {esMensajeModelo && mensaje.isImage && mensaje.imageUrl ? (
                                                <div className="generated-image-container relative group max-w-xs sm:max-w-md md:max-w-lg">
                                                    {mensaje.text && mensaje.text.trim() && <p className="mb-1 text-xs italic text-muted">{mensaje.text}</p>}
                                                    <div className="relative">
                                                        <img
                                                            src={mensaje.imageUrl} 
                                                            alt={mensaje.fileName || (idioma === 'es' ? "Imagen generada" : "Generated image")}
                                                            className="max-w-full h-auto rounded-md block"
                                                            onLoad={irAFinalDeChat}
                                                            onError={(e) => {
                                                                console.error("CHAT.JSX - ERROR AL CARGAR IMAGEN DESDE SRC:", e.target.src, e);
                                                                e.target.onerror = null;
                                                             }}
                                                        />
                                                        <button onClick={() => gestionarDescargaImagen(mensaje.imageUrl, mensaje.fileName )} className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:bg-opacity-70" title={idioma === 'es' ? 'Descargar imagen' : 'Download image'} aria-label={idioma === 'es' ? 'Descargar imagen' : 'Download image'}>
                                                            <IconoDescargar /> </button>
                                                    </div>
                                                </div>
                                            ) : esMensajeModelo ? (
                                                <div className={`markdown-content ${mensaje.esError ? 'text-chat-error' : 'text-chat-model'}`}>
                                                    <ReactMarkdown 
                                                        rehypePlugins={[rehypeRaw]} 
                                                        remarkPlugins={[remarkGfm]} 
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
                     {estaCargandoRespuesta && ( <div className="flex items-center justify-center mt-4 space-x-2"> <div className="w-4 h-4 border-b-2 rounded-full animate-spin border-muted"></div> <p className="text-xs text-muted">{idioma === 'es' ? 'Pensando...' : 'Thinking...'}</p> </div> )}
                     {mensajeErrorChat && !estaCargandoRespuesta && ( <div className="px-4 py-2 mt-4 text-center border rounded bg-error-notification border-error-notification"> <p className="text-xs text-error">{mensajeErrorChat}</p> </div> )}
                    <div ref={refFinalMensajes} style={{ height: "1px" }} />
                 </div>
             </div>

            {/* Formulario de Envío */}
            <form onSubmit={enviarPromptYObtenerRespuesta} className="flex items-end flex-shrink-0 gap-2 p-3 border-t border-divider bg-surface">
                 <div className="flex-shrink-0 self-end">
                      <input type="file" accept=".pdf" multiple onChange={manejarCambioArchivoInput} disabled={estaCargandoRespuesta} className="hidden" id="inputArchivoPdf" />
                      <label htmlFor="inputArchivoPdf" title={numArchivosAdjuntos > 0 ? `${numArchivosAdjuntos} ${idioma === 'es' ? 'archivo(s) adjunto(s)' : 'file(s) attached'}` : (idioma === 'es' ? 'Seleccionar PDF' : 'Select PDF')} className={`relative cursor-pointer p-2.5 rounded-lg transition-all inline-block text-secondary ${ estaCargandoRespuesta ? 'bg-input opacity-50 cursor-not-allowed' : 'bg-button-secondary hover:bg-button-secondary-hover' }`} aria-disabled={estaCargandoRespuesta} >
                           📄
                           {numArchivosAdjuntos > 0 && ( <span className="absolute flex items-center justify-center w-5 h-5 text-[10px] font-semibold text-white bg-green-600 rounded-full shadow -top-1 -right-1"> {numArchivosAdjuntos} </span> )}
                      </label>
                  </div>
                 <textarea ref={refEntradaTexto} value={textoPrompt} onChange={(e) => setTextoPrompt(e.target.value)} placeholder={idioma === 'es' ? "Escribe /imagen <desc> o mensaje..." : "Type /image <desc> or message..."} disabled={estaCargandoRespuesta} className="flex-grow px-3 py-2.5 resize-none overflow-y-auto rounded-lg focus:outline-none disabled:opacity-50 border bg-input text-primary border-input focus:ring-1 focus:ring-offset-0 focus:border-accent custom-scrollbar placeholder:text-muted" rows={1} style={{ maxHeight: '120px', minHeight: '44px' }} onInput={ajustarAlturaInputTexto} onKeyDown={gestionarTeclaEnter} aria-label={idioma === 'es' ? 'Entrada de chat' : 'Chat input'} />
                  <button type="submit" disabled={estaCargandoRespuesta || (!textoPrompt.trim() && numArchivosAdjuntos === 0 && !(textoPrompt.trim().toLowerCase().startsWith("/imagen ") || textoPrompt.trim().toLowerCase().startsWith("/image ")))} className="self-end flex-shrink-0 px-5 py-2.5 font-semibold rounded-lg transition-all bg-button-primary text-button-primary button-disabled hover:bg-button-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-indigo-500" title={idioma === 'es' ? "Enviar" : "Send"} aria-label={idioma === 'es' ? "Enviar mensaje" : "Send message"}> {estaCargandoRespuesta ? "⏳" : <span className="text-lg leading-none">➤</span>} </button>
             </form>
        </div>
    );
};

export default Chat;