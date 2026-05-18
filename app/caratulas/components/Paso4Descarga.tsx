import React, { useState } from "react";
import { Categoria, FormData, CATEGORY_LOGOS, ESTRUCTURA_CATEGORIAS } from "../data/diccionarios";
import { DOCUMENTOS_COMPLEMENTARIOS, DocumentoComplementario } from "../data/documentosComplementarios";
import { enviarCaratulaCompleta, blobToFile } from "../data/apiIntegration";

interface Paso4DescargaProps {
  C: any;
  themeMode: "light" | "dark" | "engineering";
  cat: Categoria;
  formData: FormData;
  downloadPDF: (format: "letter" | "a4") => void;
  generatePDFBlob?: (format: "letter" | "a4") => Promise<Blob>;
  documentQRUrl?: string;
  documentSHA256?: string;
  mainCat?: string;
  filesMemoria: File[];
  filesPlanos: File[];
  filesPlanosArq: File[];
  resetForm: () => void;
}

export default function Paso4Descarga({
  C, themeMode, cat, formData, downloadPDF, generatePDFBlob,
  documentQRUrl, documentSHA256, mainCat,
  filesMemoria, filesPlanos, filesPlanosArq,
  resetForm
}: Paso4DescargaProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [errorModal, setErrorModal] = useState<{
    code: string;
    error: string;
    details?: string[];
    invalidFiles?: { nombre: string; errores: string[]; sugerencias: string[] }[];
    suggestions?: string[];
    registroId?: number;
    codHash?: string;
  } | null>(null);
  const [modalInfo, setModalInfo] = useState<{
    title: string;
    message: string;
    details?: string[];
  } | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{
    type: "success" | "error" | "info" | null;
    message: string;
  }>({ type: null, message: "" });

  // ── Documentos disponibles para esta categoría ──
  const docsDisponibles = DOCUMENTOS_COMPLEMENTARIOS.filter(
    d => d.archivo !== null && d.categorias.includes(cat.code)
  );
  const archivos = docsDisponibles.filter(d => d.tipo === "archivo");
  const guias    = docsDisponibles.filter(d => d.tipo === "guia");

  // ── Descargar un archivo individual ──
  const descargarArchivo = (doc: DocumentoComplementario) => {
  if (!doc.archivo) return;
  const extension = doc.archivo.split(".").pop() || "pdf";
  const a = document.createElement("a");
  a.href = `/${doc.archivo}`;
  a.download = doc.nombre + "." + extension;
  a.click();
};

  // ── Descargar todos los complementos ──
  const descargarTodos = () => {
    docsDisponibles.forEach((doc, i) => {
      setTimeout(() => descargarArchivo(doc), i * 400);
    });
  };

  // ── Enviar a base de datos ──
  const handleEnviarABD = async () => {
    console.log("🔍 DEBUG Paso4Descarga:", {
      documentSHA256: documentSHA256,
      documentSHA256_length: documentSHA256?.length,
      documentSHA256_type: typeof documentSHA256,
      generatePDFBlob: !!generatePDFBlob,
      documentQRUrl: !!documentQRUrl,
      mainCat: mainCat,
    });
    if (!generatePDFBlob || !documentQRUrl || !documentSHA256 || !mainCat) {
      setUploadStatus({
        type: "error",
        message: "Error: faltan datos necesarios para enviar. Intenta recargar la página.",
      });
      return;
    }

    setIsUploading(true);
    setUploadStatus({ type: "info", message: "📤 Generando PDF y enviando..." });

    try {
      // Generar PDF como Blob
      const pdfBlob = await generatePDFBlob("letter");
      const pdfFile = blobToFile(pdfBlob, `${cat.code}_${documentSHA256}.pdf`);

      // DEBUG
      console.log("📤 Enviando con documentSHA256:", documentSHA256);
      console.log("📤 Archivos complementarios a enviar:", {
        memorias: filesMemoria.length,
        planos: filesPlanos.length,
        planosArq: filesPlanosArq.length,
      });

      const allFiles = [pdfFile, ...filesMemoria, ...filesPlanos, ...filesPlanosArq];
      const MAX_FILES = 20;
      const MAX_SINGLE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
      const MAX_TOTAL_SIZE_BYTES = 300 * 1024 * 1024; // 300MB
      const ALLOWED_EXTENSIONS = new Set(["pdf", "png", "jpg", "jpeg", "webp", "docx", "xlsx", "zip", "rar"]);
      const INVALID_CHARS_REGEX = /[<>:"\/\\|?*\x00-\x1F\x7F]/;

      // ── VALIDACIÓN 1: Cantidad máxima de archivos ──
      if (allFiles.length > MAX_FILES) {
        setErrorModal({
          code: "MAX_FILE_COUNT_EXCEEDED",
          error: `Excede la cantidad máxima de archivos permitidos por carga (Límite: ${MAX_FILES}, enviado: ${allFiles.length}).`,
          details: [`Tienes ${allFiles.length} archivos en tu envío. Por favor, compáctalos en un archivo .zip o .rar.`],
        });
        setIsUploading(false);
        setUploadStatus({ type: "error", message: "❌ Límite de archivos excedido." });
        return;
      }

      // ── VALIDACIÓN 2: Tamaño individual, total, formatos, caracteres ──
      let totalSize = 0;
      const oversizedFiles: string[] = [];
      const invalidFormatFiles: string[] = [];
      const invalidCharFiles: string[] = [];

      for (const file of allFiles) {
        totalSize += file.size;

        if (file.size > MAX_SINGLE_SIZE_BYTES) {
          oversizedFiles.push(`${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
        }

        const parts = file.name.split(".");
        const ext = parts.length > 1 ? parts.pop()?.toLowerCase() : "";
        if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
          invalidFormatFiles.push(`${file.name} (.${ext || "sin extensión"})`);
        }

        if (INVALID_CHARS_REGEX.test(file.name)) {
          invalidCharFiles.push(file.name);
        }
      }

      if (totalSize > MAX_TOTAL_SIZE_BYTES) {
        setErrorModal({
          code: "MAX_TOTAL_SIZE_EXCEEDED",
          error: `El tamaño total combinado de la carga excede el límite de 300 MB.`,
          details: [`Peso total del envío: ${(totalSize / 1024 / 1024).toFixed(2)} MB.`],
        });
        setIsUploading(false);
        setUploadStatus({ type: "error", message: "❌ Límite de peso excedido." });
        return;
      }

      if (oversizedFiles.length > 0) {
        setErrorModal({
          code: "MAX_SINGLE_SIZE_EXCEEDED",
          error: `Uno o varios archivos exceden el tamaño máximo individual de 50 MB.`,
          details: oversizedFiles,
        });
        setIsUploading(false);
        setUploadStatus({ type: "error", message: "❌ Archivo demasiado grande." });
        return;
      }

      if (invalidFormatFiles.length > 0) {
        setErrorModal({
          code: "INVALID_FILE_FORMAT",
          error: `Formato de archivo no permitido. Los formatos autorizados son: pdf, png, jpg, jpeg, webp, docx, xlsx, zip, rar.`,
          details: invalidFormatFiles,
        });
        setIsUploading(false);
        setUploadStatus({ type: "error", message: "❌ Formato no compatible." });
        return;
      }

      if (invalidCharFiles.length > 0) {
        setErrorModal({
          code: "INVALID_FILENAME_CHARS",
          error: `Los nombres de archivo contienen caracteres especiales inválidos (< > : " / \\ | ? *).`,
          details: invalidCharFiles,
        });
        setIsUploading(false);
        setUploadStatus({ type: "error", message: "❌ Nombre de archivo inválido." });
        return;
      }

      // ── VALIDACIÓN 3: Nombres de archivo duplicados en la carga ──
      const fileNames = allFiles.map((f) => f.name);
      const duplicates = fileNames.filter((name, idx) => fileNames.indexOf(name) !== idx);
      if (duplicates.length > 0) {
        setErrorModal({
          code: "DUPLICATE_FILES_IN_BATCH",
          error: "Se detectaron nombres de archivo duplicados en el mismo envío.",
          details: Array.from(new Set(duplicates)),
        });
        setIsUploading(false);
        setUploadStatus({ type: "error", message: "❌ Nombres duplicados." });
        return;
      }

      // Enviar todo a las APIs (con SHA256)
      const result = await enviarCaratulaCompleta(
        formData,
        cat,
        documentSHA256,
        pdfFile,
        [...filesMemoria, ...filesPlanos, ...filesPlanosArq]
      );

      if (result.success) {
        const displayCode = documentSHA256 || result.data?.cod_hash || "";
        console.log("✅ Mostrar hash real en UI:", displayCode);
        setUploadStatus({
          type: "success",
          message: `✅ ¡Caratula enviada exitosamente! Código: ${displayCode}`,
        });
        setTimeout(() => {
          setUploadStatus({ type: null, message: "" });
        }, 4000);
      } else {
        // Mostrar modal premium con detalles de error de la API
        setErrorModal({
          code: result.code || "API_ERROR",
          error: result.error || "Ocurrió un error al procesar tu carga en el servidor de visados.",
          details: result.details,
          registroId: result.data?.registro_id,
          codHash: result.data?.cod_hash
        });

        setUploadStatus({
          type: "error",
          message: `❌ Error: ${result.error}`,
        });
      }
    } catch (error) {
      console.error("Error al enviar:", error);
      setErrorModal({
        code: "UNEXPECTED_ERROR",
        error: `Ocurrió un error inesperado al procesar la carátula.`,
        details: [error instanceof Error ? error.message : String(error)]
      });
      setUploadStatus({
        type: "error",
        message: `❌ Error inesperado: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setIsUploading(false);
    }
  };

  // ── Logo de categoría ──
  const mainCatKey = Object.keys(ESTRUCTURA_CATEGORIAS).find(k =>
    ESTRUCTURA_CATEGORIAS[k].includes(cat.disciplina as any)
  ) ?? null;
  const logoData = mainCatKey ? CATEGORY_LOGOS[mainCatKey] : null;

  // ── Estilos ──
  const card: React.CSSProperties = {
    background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 20,
    padding: "clamp(20px, 5vw, 40px)", boxShadow: C.glow, backdropFilter: "blur(12px)",
  };
  const btnPrimary: React.CSSProperties = {
    background: C.accent, color: themeMode === "light" ? "#fff" : C.deepGreen,
    border: "none", borderRadius: 10, padding: "14px 32px",
    fontWeight: 700, fontSize: "1em", cursor: "pointer",
    boxShadow: `0 4px 14px ${C.accent}60`, transition: "all 0.2s",
  };
  const btnSecondary: React.CSSProperties = {
    background: C.btnSecBg, border: `1px solid ${C.border}`, borderRadius: 10,
    padding: "14px 32px", color: C.textMain, fontSize: "1em",
    cursor: "pointer", fontWeight: 600, transition: "all 0.2s",
  };
  const docBtn: React.CSSProperties = {
    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
    gap: 12, background: C.inputBg, border: `1px solid ${C.border}`,
    borderRadius: 12, padding: "14px 18px", cursor: "pointer",
    transition: "all 0.2s", textAlign: "left",
  };
  const secLabel: React.CSSProperties = {
    fontSize: "0.8em", textTransform: "uppercase", letterSpacing: 2,
    color: C.accent, fontWeight: 800, marginBottom: 14,
    display: "flex", alignItems: "center", gap: 10,
  };

  const statusBox: React.CSSProperties = {
    padding: "16px 20px",
    borderRadius: 12,
    border: `1px solid ${
      uploadStatus.type === "success" ? "#22c55e" :
      uploadStatus.type === "error" ? "#ef4444" : C.accent
    }`,
    background: {
      "success": "#22c55e20",
      "error": "#ef444420",
      "info": `${C.accent}20`,
    }[uploadStatus.type || "info"],
    color: {
      "success": "#16a34a",
      "error": "#dc2626",
      "info": C.accent,
    }[uploadStatus.type || "info"],
    fontSize: "0.9em",
    fontWeight: 600,
    marginBottom: 20,
    display: uploadStatus.type ? "block" : "none",
  };

  return (
    <div style={card}>

      {/* ── Modal de Errores Premium de la API ── */}
      {errorModal && (() => {
        const errorConfig: Record<string, { icon: string; title: string; desc: string; color: string; bg: string; action: string }> = {
          RATE_LIMIT_EXCEEDED: {
            icon: "⏳",
            title: "Límite de Peticiones Alcanzado",
            desc: "El servidor de visados restringe la frecuencia de envíos para mantener la estabilidad del sistema.",
            color: "#f59e0b",
            bg: "rgba(245, 158, 11, 0.15)",
            action: "Por favor, espera a que el servidor de visados se libere antes de volver a presionar el botón de carga."
          },
          MAX_FILE_COUNT_EXCEEDED: {
            icon: "🗂️",
            title: "Cantidad de Archivos Excedida",
            desc: "Has seleccionado demasiados archivos para subir de una sola vez.",
            color: "#ef4444",
            bg: "rgba(239, 68, 68, 0.15)",
            action: "El límite del servidor de visados es de 20 archivos por carga. Considera unir tus documentos en PDFs continuos o comprimir múltiples planos en un único .zip o .rar."
          },
          MAX_SINGLE_SIZE_EXCEEDED: {
            icon: "⚖️",
            title: "Archivo Individual Demasiado Grande",
            desc: "Uno o varios archivos seleccionados sobrepasan el tamaño individual permitido por la plataforma.",
            color: "#ef4444",
            bg: "rgba(239, 68, 68, 0.15)",
            action: "El tamaño máximo por archivo es de 50 MB. Intenta exportar tus planos en una resolución más óptima o utiliza una herramienta de compresión de PDF."
          },
          MAX_TOTAL_SIZE_EXCEEDED: {
            icon: "📦",
            title: "Tamaño Total de Carga Excedido",
            desc: "El peso total combinado de todos tus archivos es demasiado elevado para ser procesado por el servidor.",
            color: "#ef4444",
            bg: "rgba(239, 68, 68, 0.15)",
            action: "El límite total combinado es de 300 MB. Remueve archivos complementarios innecesarios o reduce su resolución para poder subirlos todos juntos."
          },
          INVALID_FILE_FORMAT: {
            icon: "🚫",
            title: "Formato de Archivo No Permitido",
            desc: "Has intentado subir archivos en extensiones no autorizadas por el departamento de visados.",
            color: "#ef4444",
            bg: "rgba(239, 68, 68, 0.15)",
            action: "Los únicos formatos válidos son: pdf, png, jpg, jpeg, webp, docx, xlsx, zip, rar. Si tienes planos de AutoCAD (.dwg), expórtalos a PDF o empaquétalos dentro de un archivo .zip antes de subir."
          },
          DUPLICATE_FILES_IN_BATCH: {
            icon: "📋",
            title: "Nombres de Archivo Duplicados",
            desc: "Se detectó que hay múltiples archivos con exactamente el mismo nombre dentro de tu carga.",
            color: "#f59e0b",
            bg: "rgba(245, 158, 11, 0.15)",
            action: "Cada archivo debe tener un nombre único para registrarse adecuadamente. Cambia el nombre de los archivos repetidos en tu computadora e inténtalo de nuevo."
          },
          FILE_NAME_CLASH: {
            icon: "🔀",
            title: "Conflicto con Archivos Registrados",
            desc: "Uno o varios nombres de archivo coinciden de forma exacta con archivos que ya fueron subidos a este registro con anterioridad.",
            color: "#ef4444",
            bg: "rgba(239, 68, 68, 0.15)",
            action: "Para evitar sobrescribir información importante, el sistema bloquea nombres duplicados. Por favor, renombra tus nuevos archivos agregando un sufijo distintivo (por ejemplo: memoria_calculo_v2.pdf)."
          },
          INVALID_FILENAME_CHARS: {
            icon: "⚠️",
            title: "Caracteres Especiales Prohibidos",
            desc: "Los nombres de algunos archivos contienen caracteres reservados que pueden corromper el almacenamiento.",
            color: "#f59e0b",
            bg: "rgba(245, 158, 11, 0.15)",
            action: "Renombra los archivos en tu computadora eliminando caracteres como: < > : \" / \\ | ? *. Te recomendamos usar letras simples, números, guiones (-) o guiones bajos (_)."
          },
          REGISTRO_NOT_FOUND: {
            icon: "🔍",
            title: "Registro de Visado No Encontrado",
            desc: "El identificador del registro enviado no concuerda con ningún registro activo en el departamento.",
            color: "#ef4444",
            bg: "rgba(239, 68, 68, 0.15)",
            action: "Esto puede deberse a una desincronización de tu sesión o un error temporal. Por favor presiona 'Crear nueva carátula' para iniciar un proceso limpio."
          },
          PAYLOAD_TOO_LARGE: {
            icon: "🚀",
            title: "Carga Demasiado Pesada (Vercel Limit)",
            desc: "El tamaño total de este lote superó el límite estricto de la plataforma (4.5MB).",
            color: "#ef4444",
            bg: "rgba(239, 68, 68, 0.15)",
            action: "El sistema intentó procesar lotes pequeños, pero algún archivo individual excede los límites. Comprime los archivos e intenta nuevamente."
          }
        };

        const config = errorConfig[errorModal.code] || {
          icon: "❌",
          title: "Error al Procesar Solicitud",
          desc: errorModal.error || "Ocurrió un error inesperado al procesar tu carga de documentos.",
          color: "#ef4444",
          bg: "rgba(239, 68, 68, 0.15)",
          action: "Revisa la conexión de tu red e inténtalo de nuevo. Si el problema persiste, reporta este error con el reporte técnico adjunto."
        };

        const isLight = themeMode === "light";

        // Helper to highlight invalid filename characters visually
        const highlightFilename = (filename: string) => {
          const INVALID_CHARS_REGEX = /[<>:"\/\\|?*\x00-\x1F\x7F]/;
          const chars = filename.split("");
          return (
            <span style={{ fontFamily: "monospace", fontSize: "0.9em", wordBreak: "break-all", color: isLight ? "#374151" : "#d1d5db" }}>
              {chars.map((char, index) => {
                if (INVALID_CHARS_REGEX.test(char)) {
                  return (
                    <span
                      key={index}
                      style={{
                        color: "#ef4444",
                        fontWeight: 900,
                        backgroundColor: "rgba(239, 68, 68, 0.18)",
                        border: "1px solid rgba(239, 68, 68, 0.4)",
                        padding: "1px 3px",
                        borderRadius: 4,
                        margin: "0 1px",
                        boxShadow: "0 0 6px rgba(239, 68, 68, 0.2)",
                        display: "inline-block"
                      }}
                    >
                      {char === " " ? "␣ (Espacio)" : char}
                    </span>
                  );
                }
                return <span key={index}>{char}</span>;
              })}
            </span>
          );
        };

        const copiarReporteTecnico = () => {
          const reportText = `[REPORTE TÉCNICO DE ERRORES - VISADOS SIB]
Fecha: ${new Date().toLocaleString()}
Código de Error: ${errorModal.code}
Descripción: ${errorModal.error}
Registro ID Asociado: ${errorModal.registroId || "Ninguno"}
Código Referencia (cod_hash): ${errorModal.codHash || "Ninguno"}
Detalles específicos:
${errorModal.details ? errorModal.details.map((d: string) => `- ${d}`).join("\n") : "Ninguno"}
Recomendación sugerida: ${config.action}`;
          
          navigator.clipboard.writeText(reportText).then(() => {
            alert("📋 ¡Reporte técnico copiado al portapapeles con éxito!");
          }).catch(e => {
            console.error("No se pudo copiar el reporte:", e);
          });
        };

        return (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: isLight ? "rgba(15, 23, 42, 0.55)" : "rgba(8, 12, 10, 0.78)",
              backdropFilter: "blur(12px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100000,
              padding: 20,
            }}
            onClick={() => setErrorModal(null)}
          >
            <div
              style={{
                background: isLight 
                  ? "linear-gradient(135deg, #ffffff, #fff5f5)" 
                  : "linear-gradient(135deg, #180d0d, #0a0505)",
                color: C.textMain,
                border: `1px solid ${config.color}50`,
                borderRadius: 24,
                padding: "clamp(20px, 5vw, 36px)",
                width: "min(640px, 94vw)",
                maxHeight: "88vh",
                overflowY: "auto",
                boxShadow: isLight
                  ? `0 25px 50px -12px ${config.color}25`
                  : `0 25px 60px rgba(0, 0, 0, 0.75), 0 0 35px ${config.color}15`,
                backdropFilter: "blur(20px)",
                position: "relative"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Title with Logo/Badge */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 20 }}>
                <span style={{
                  fontSize: "2.4em",
                  background: config.bg,
                  padding: "10px 14px",
                  borderRadius: 16,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1px solid ${config.color}35`,
                  boxShadow: `0 0 15px ${config.color}10`
                }}>
                  {config.icon}
                </span>
                <div>
                  <h3 style={{
                    fontSize: "clamp(1.15em, 4vw, 1.45em)",
                    fontWeight: 900,
                    color: C.textMain,
                    margin: 0,
                    letterSpacing: "-0.02em",
                    lineHeight: "1.25em"
                  }}>
                    {config.title}
                  </h3>
                  <span style={{
                    fontSize: "0.72em",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: 2,
                    color: config.color,
                    marginTop: 4,
                    display: "inline-block"
                  }}>
                    Error Code: {errorModal.code}
                  </span>
                </div>
              </div>

              {/* Registro Creado Exitosamente Banner */}
              {errorModal.registroId && (
                <div style={{
                  background: isLight ? "#f0fdf4" : "rgba(16, 185, 129, 0.08)",
                  border: isLight ? "1px solid #bbf7d0" : "1px solid rgba(16, 185, 129, 0.25)",
                  borderRadius: 16,
                  padding: "16px 20px",
                  marginBottom: 20,
                  boxShadow: `0 0 15px rgba(16, 185, 129, 0.05)`
                }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", color: isLight ? "#15803d" : "#10b981", fontWeight: 800, fontSize: "0.85em", textTransform: "uppercase", letterSpacing: 1 }}>
                    <span>✅ Carátula Creada con Éxito</span>
                  </div>
                  <div style={{ fontSize: "0.88em", color: C.textMain, marginTop: 6, lineHeight: "1.4em" }}>
                    ¡Tu trámite fue registrado en el sistema! Código de Referencia: 
                    <strong style={{
                      display: "inline-block", 
                      background: isLight ? "#dcfce7" : "rgba(16, 185, 129, 0.15)",
                      padding: "2px 8px", 
                      borderRadius: 6, 
                      marginLeft: 6,
                      color: isLight ? "#166534" : "#34d399",
                      fontFamily: "monospace",
                      fontWeight: 700
                    }}>
                      {errorModal.codHash || "VIS-XXXXXX"}
                    </strong>.
                  </div>
                  <div style={{ fontSize: "0.8em", color: C.textMuted, marginTop: 6 }}>
                    Los archivos fallaron al subirse, pero puedes renombrarlos o corregirlos y enviarlos a este mismo registro.
                  </div>
                </div>
              )}

              {/* Error Message Details Section */}
              <div style={{
                background: C.inputBg,
                border: `1px solid ${C.border}`,
                borderRadius: 16,
                padding: 20,
                marginBottom: 20,
                fontSize: "0.92em",
                lineHeight: "1.5em"
              }}>
                <div style={{ fontWeight: 700, marginBottom: 8, color: C.textMain }}>
                  Detalle del problema:
                </div>
                <div style={{ color: C.textMuted, marginBottom: 12 }}>
                  {config.desc}
                </div>

                {/* Specific Offending Files List */}
                {errorModal.invalidFiles && errorModal.invalidFiles.length > 0 ? (
                  <div style={{
                    marginTop: 14,
                    borderTop: `1px solid ${C.border}`,
                    paddingTop: 14
                  }}>
                    <div style={{ fontSize: "0.82em", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, color: config.color, marginBottom: 10 }}>
                      Archivos Rechazados ({errorModal.invalidFiles.length}):
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 220, overflowY: "auto", paddingRight: 6 }}>
                      {errorModal.invalidFiles.map((item, idx) => (
                        <div key={idx} style={{
                          background: isLight ? "#fbfbfb" : "rgba(255, 255, 255, 0.02)",
                          padding: "12px 14px",
                          borderRadius: 10,
                          border: `1px solid ${C.border}`
                        }}>
                          <div style={{ fontWeight: 800, marginBottom: 4, wordBreak: "break-all" }}>
                            {errorModal.code === "INVALID_FILENAME_CHARS" ? highlightFilename(item.nombre) : (
                              <span style={{ fontFamily: "monospace", fontSize: "0.95em" }}>{item.nombre}</span>
                            )}
                          </div>
                          {item.errores && item.errores.length > 0 && (
                            <ul style={{ color: "#ef4444", paddingLeft: 18, margin: "4px 0", fontSize: "0.9em" }}>
                              {item.errores.map((err: string, i: number) => <li key={i}>{err}</li>)}
                            </ul>
                          )}
                          {item.sugerencias && item.sugerencias.length > 0 && (
                            <ul style={{ color: "#10b981", paddingLeft: 18, margin: "4px 0", fontSize: "0.9em" }}>
                              {item.sugerencias.map((sug: string, i: number) => <li key={i}>{sug}</li>)}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : errorModal.details && errorModal.details.length > 0 && (
                  <div style={{
                    marginTop: 14,
                    borderTop: `1px solid ${C.border}`,
                    paddingTop: 14
                  }}>
                    <div style={{ fontSize: "0.82em", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, color: config.color, marginBottom: 10 }}>
                      Elementos Rechazados ({errorModal.details.length}):
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 180, overflowY: "auto", paddingRight: 6 }}>
                      {errorModal.details.map((item: string, idx: number) => (
                        <div key={idx} style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          background: isLight ? "#fbfbfb" : "rgba(255, 255, 255, 0.02)",
                          padding: "10px 14px",
                          borderRadius: 10,
                          border: `1px solid ${C.border}`
                        }}>
                          <span style={{ fontSize: "1.1em", flexShrink: 0 }}>
                            {errorModal.code === "INVALID_FILE_FORMAT" ? "📄" : 
                             errorModal.code === "INVALID_FILENAME_CHARS" ? "⚠️" : "❌"}
                          </span>
                          <span style={{ flexGrow: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
                            {errorModal.code === "INVALID_FILENAME_CHARS" ? highlightFilename(item) : (
                              <span style={{ fontFamily: "monospace", fontSize: "0.9em" }}>{item}</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actionable Solution Recommendations Card */}
              <div style={{
                background: `${config.color}08`,
                border: `1px dashed ${config.color}35`,
                borderRadius: 16,
                padding: 20,
                marginBottom: 28,
              }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", color: config.color, fontWeight: 800, fontSize: "0.82em", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                  💡 Solución Recomendada
                </div>
                {errorModal.suggestions && errorModal.suggestions.length > 0 ? (
                  <ul style={{ fontSize: "0.88em", color: C.textMain, lineHeight: "1.45em", paddingLeft: 18, margin: 0 }}>
                    {errorModal.suggestions.map((sug: string, i: number) => (
                      <li key={i} style={{ marginBottom: 4 }}>{sug}</li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ fontSize: "0.88em", color: C.textMain, lineHeight: "1.45em" }}>
                    {config.action}
                  </div>
                )}
              </div>

              {/* Interactive buttons row */}
              <div style={{ display: "flex", flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
                <button
                  onClick={copiarReporteTecnico}
                  style={{
                    flexGrow: 1,
                    background: C.btnSecBg,
                    border: `1px solid ${C.border}`,
                    borderRadius: 12,
                    padding: "14px 20px",
                    color: C.textMain,
                    fontWeight: 700,
                    fontSize: "0.92em",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8
                  }}
                  onMouseOver={e => e.currentTarget.style.background = C.btnSecHover}
                  onMouseOut={e => e.currentTarget.style.background = C.btnSecBg}
                >
                  📋 Copiar Reporte
                </button>
                <button
                  onClick={() => setErrorModal(null)}
                  style={{
                    flexGrow: 2,
                    background: config.color,
                    color: isLight ? "#fff" : "#0d1f14",
                    border: "none",
                    borderRadius: 12,
                    padding: "14px 24px",
                    fontWeight: 800,
                    fontSize: "0.92em",
                    cursor: "pointer",
                    boxShadow: `0 4px 14px ${config.color}45`,
                    transition: "all 0.2s"
                  }}
                  onMouseOver={e => e.currentTarget.style.transform = "translateY(-1px)"}
                  onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Modal de advertencias ── */}
      {modalInfo && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 20,
          }}
          onClick={() => setModalInfo(null)}
        >
          <div
            style={{
              background: C.cardBg,
              color: C.textMain,
              border: `1px solid ${C.border}`,
              borderRadius: 16,
              padding: 24,
              width: "min(560px, 92vw)",
              boxShadow: C.glow,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: "1.1em", fontWeight: 800, marginBottom: 8 }}>
              {modalInfo.title}
            </div>
            <div style={{ color: C.textMuted, marginBottom: 12 }}>
              {modalInfo.message}
            </div>
            {modalInfo.details && modalInfo.details.length > 0 && (
              <div style={{ fontSize: "0.9em", marginBottom: 16 }}>
                {modalInfo.details.map((item) => (
                  <div key={item} style={{ marginBottom: 6 }}>
                    • {item}
                  </div>
                ))}
              </div>
            )}
            <button
              style={{
                ...btnPrimary,
                width: "100%",
                padding: "12px 16px",
                fontSize: "0.95em",
              }}
              onClick={() => setModalInfo(null)}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
        {logoData && (
          <img
            src={themeMode === "light" ? logoData.light : logoData.dark}
            alt={mainCatKey ?? ""}
            style={{ height: 40, width: "auto", objectFit: "contain", opacity: 0.9 }}
          />
        )}
        <div style={{ fontSize: "clamp(1.4em, 5vw, 2em)", color: C.textMain, fontWeight: 900 }}>
          ¡Documento <span style={{ color: C.accent }}>Listo</span>!
        </div>
      </div>
      <div style={{ fontSize: "1em", color: C.textMuted, marginBottom: 36 }}>
        El PDF oficial ha sido procesado y codificado correctamente.
      </div>

      {/* ── Nombre del archivo ── */}
      <div style={{
        background: C.boxBg, display: "inline-flex", alignItems: "center", gap: 10,
        padding: "12px 24px", borderRadius: 12, border: `1px solid ${C.border}`, marginBottom: 36,
      }}>
        <span style={{ fontSize: "1.3em" }}>📄</span>
        <span style={{ fontSize: "0.95em", color: C.textSec, fontWeight: 700 }}>
          {cat.code}_{(formData.titulo || "caratula").replace(/\s+/g, "_")}.pdf
        </span>
      </div>

      {/* ── Botón carátula ── */}
      <div style={{ marginBottom: 40 }}>
        <div style={secLabel}>📋 Carátula Oficial</div>
        <button
          onClick={() => downloadPDF("letter")}
          style={{ ...btnPrimary, width: "100%", padding: "16px 32px", fontSize: "1.05em" }}
          onMouseOver={e => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}
        >
          ⬇️ Descargar Carátula (Carta)
        </button>
      </div>

      {/* ── Botón enviar al departamento de visados ── */}
      <div style={{ marginBottom: 40 }}>
        <div style={secLabel}>🏛️ Enviar al Departamento de Visados</div>
        <button
          onClick={handleEnviarABD}
          disabled={isUploading}
          style={{
            ...btnPrimary,
            width: "100%",
            padding: "16px 32px",
            fontSize: "1.05em",
            opacity: isUploading ? 0.6 : 1,
            cursor: isUploading ? "not-allowed" : "pointer",
          }}
          onMouseOver={e => !isUploading && (e.currentTarget.style.transform = "translateY(-2px)")}
          onMouseOut={e => (e.currentTarget.style.transform = "translateY(0)")}
        >
          {isUploading ? "⏳ Enviando..." : "📤 Enviar al Departamento de Visados"}
        </button>
      </div>

      {/* ── Mensaje de estado ── */}
      {uploadStatus.type && (
        <div style={statusBox}>
          {uploadStatus.message}
        </div>
      )}

      {/* ── Archivos complementarios ── */}
      {archivos.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={secLabel}>📁 Archivos Complementarios</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {archivos.map(doc => (
              <button
                key={doc.id}
                onClick={() => descargarArchivo(doc)}
                style={docBtn}
                onMouseOver={e => {
                  e.currentTarget.style.borderColor = C.accent;
                  e.currentTarget.style.background = C.accentLight;
                }}
                onMouseOut={e => {
                  e.currentTarget.style.borderColor = C.border;
                  e.currentTarget.style.background = C.inputBg;
                }}
              >
                <span style={{ color: C.textMain, fontWeight: 600, fontSize: "0.9em" }}>
                  📄 {doc.nombre}
                </span>
                <span style={{
                  color: C.accent, fontWeight: 800, fontSize: "0.8em",
                  flexShrink: 0, background: C.accentLight,
                  padding: "4px 12px", borderRadius: 6,
                }}>
                  ⬇ Descargar
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Guías ── */}
      {guias.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={secLabel}>📖 Guías de Llenado</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {guias.map(doc => (
              <button
                key={doc.id}
                onClick={() => descargarArchivo(doc)}
                style={{ ...docBtn, borderColor: `${C.accent}40` }}
                onMouseOver={e => {
                  e.currentTarget.style.borderColor = C.accent;
                  e.currentTarget.style.background = C.accentLight;
                }}
                onMouseOut={e => {
                  e.currentTarget.style.borderColor = `${C.accent}40`;
                  e.currentTarget.style.background = C.inputBg;
                }}
              >
                <span style={{ color: C.textMain, fontWeight: 600, fontSize: "0.9em" }}>
                  📖 {doc.nombre}
                </span>
                <span style={{
                  color: C.accent, fontWeight: 800, fontSize: "0.8em",
                  flexShrink: 0, background: C.accentLight,
                  padding: "4px 12px", borderRadius: 6,
                }}>
                  ⬇ Descargar
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Descargar todo ── */}
      {docsDisponibles.length > 1 && (
        <div style={{ marginBottom: 40 }}>
          <button
            onClick={descargarTodos}
            style={{ ...btnPrimary, width: "100%", background: C.boxBg, color: C.accent, border: `1px solid ${C.accent}` }}
            onMouseOver={e => e.currentTarget.style.background = C.accentLight}
            onMouseOut={e => e.currentTarget.style.background = C.boxBg}
          >
            📦 Descargar Todos los Complementos
          </button>
        </div>
      )}

      {/* ── Aviso si no hay complementos ── */}
      {docsDisponibles.length === 0 && (
        <div style={{
          background: C.boxBg, border: `1px dashed ${C.border}`,
          borderRadius: 12, padding: "24px", textAlign: "center",
          color: C.textMuted, fontSize: "0.9em", marginBottom: 40,
        }}>
          No hay documentos complementarios disponibles para esta categoría aún.
        </div>
      )}

      {/* ── Nueva carátula ── */}
      <div style={{ textAlign: "center", marginTop: 16 }}>
        <button
          onClick={resetForm}
          style={btnSecondary}
          onMouseOver={e => e.currentTarget.style.background = C.btnSecHover}
          onMouseOut={e => e.currentTarget.style.background = C.btnSecBg}
        >
          + Crear nueva carátula
        </button>
      </div>

    </div>
  );
}