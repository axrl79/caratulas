import React, { useState } from "react";
import { Categoria, FormData } from "../data/diccionarios";
import { enviarCaratulaCompleta } from "../data/apiIntegration";

interface Paso4EnvioProps {
  C: any;
  themeMode: string;
  cat: Categoria;
  formData: FormData;
  documentSHA256: string;
  mainCat: string;
  filesMemoria: File[];
  filesPlanos: File[];
  filesPlanosArq: File[];
  generatePDFBlob: (format?: "letter" | "a4") => Promise<Blob>;
  onSuccess: (registroId: number, codHash: string) => void;
  goBack: () => void;
}

export default function Paso4Envio({
  C, themeMode, cat, formData, documentSHA256, mainCat,
  filesMemoria, filesPlanos, filesPlanosArq,
  generatePDFBlob, onSuccess, goBack
}: Paso4EnvioProps) {
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

  const [uploadStatus, setUploadStatus] = useState<{
    type: "success" | "error" | "info" | "warning" | null;
    message: string;
  }>({ type: null, message: "" });

  const [createdRegistroId, setCreatedRegistroId] = useState<number | null>(null);
  const [createdCodHash, setCreatedCodHash] = useState<string | null>(null);
  const [successFileNames, setSuccessFileNames] = useState<Set<string>>(new Set());

  const isLight = themeMode === "light";
  const allFiles = [...filesMemoria, ...filesPlanos, ...filesPlanosArq];
  const pendingFiles = allFiles.filter(f => !successFileNames.has(f.name));

  const handleEnviarABD = async () => {
    if (!cat) return;
    setIsUploading(true);
    setUploadStatus({ type: "info", message: "Preparando envío y validando archivos locales..." });

    try {
      // 1. Generar Blob del PDF (Carátula) - Only if not already uploaded
      let pdfFile: File | undefined = undefined;
      const pdfFileName = `${cat.code}_${documentSHA256}.pdf`;
      
      if (!successFileNames.has(pdfFileName)) {
        const pdfBlob = await generatePDFBlob("letter");
        pdfFile = new File([pdfBlob], pdfFileName, { type: "application/pdf" });
      }

      // 2. Pre-Check de Límites Vercel
      const filesToUpload = [];
      if (pdfFile) filesToUpload.push(pdfFile);
      filesToUpload.push(...pendingFiles);

      const MAX_SINGLE_SIZE_BYTES = 3.0 * 1024 * 1024; // 3.0MB limit
      const oversizedFiles = filesToUpload.filter((f) => f.size > MAX_SINGLE_SIZE_BYTES);

      if (oversizedFiles.length > 0) {
        setErrorModal({
          code: "MAX_SINGLE_SIZE_EXCEEDED",
          error: `Uno o varios archivos exceden el límite estricto de 3.0 MB.`,
          details: oversizedFiles.map(f => `${f.name} (${(f.size / 1024 / 1024).toFixed(2)} MB)`),
        });
        setIsUploading(false);
        setUploadStatus({ type: "error", message: "❌ Límite de peso por archivo excedido." });
        return;
      }

      const totalSize = filesToUpload.reduce((sum, f) => sum + f.size, 0);
      const MAX_TOTAL_SIZE_BYTES = 300 * 1024 * 1024;
      if (totalSize > MAX_TOTAL_SIZE_BYTES) {
        setErrorModal({
          code: "MAX_TOTAL_SIZE_EXCEEDED",
          error: `El tamaño total combinado excede el límite de 300 MB.`,
          details: [`Peso total del envío: ${(totalSize / 1024 / 1024).toFixed(2)} MB.`],
        });
        setIsUploading(false);
        setUploadStatus({ type: "error", message: "❌ Límite de peso total excedido." });
        return;
      }

      setUploadStatus({ type: "info", message: "Enviando datos al servidor..." });

      // Enviar a la API con soporte de Retry
      const result = await enviarCaratulaCompleta(
        formData,
        cat,
        documentSHA256,
        pdfFile,
        pendingFiles,
        createdRegistroId || undefined
      );

      // Si nos devuelve ID o hash, guardarlos para no duplicar en reintentos
      const newRegId = result.data?.registro_id || createdRegistroId;
      const newHash = result.data?.cod_hash || createdCodHash;
      if (newRegId) setCreatedRegistroId(newRegId);
      if (newHash) setCreatedCodHash(newHash);

      // Extraer archivos exitosos (si devolvió array de subidos)
      const nuevosSubidos = result.data?.archivos_subidos || [];
      const newSuccessSet = new Set(successFileNames);
      nuevosSubidos.forEach(f => newSuccessSet.add(f.nombre_archivo));
      setSuccessFileNames(newSuccessSet);

      if (result.success) {
        setUploadStatus({
          type: "success",
          message: `✅ ¡Archivos enviados exitosamente! Redirigiendo...`,
        });
        setTimeout(() => {
          onSuccess(newRegId!, newHash || documentSHA256);
        }, 1500);
      } else {
        setErrorModal({
          code: result.code || "API_ERROR",
          error: result.error || "Error en la subida.",
          details: result.details,
          invalidFiles: result.invalidFiles,
          suggestions: result.suggestions,
          registroId: newRegId || undefined,
          codHash: newHash || undefined
        });

        // Averiguar cuántos faltan
        const restantes = filesToUpload.length - nuevosSubidos.length;
        setUploadStatus({
          type: "warning",
          message: `⚠️ Hubo un error de red. Subidos: ${nuevosSubidos.length}. Faltan: ${restantes}. Usa el botón "Reintentar" para continuar.`,
        });
      }
    } catch (error) {
      console.error("Error al enviar:", error);
      setErrorModal({
        code: "UNEXPECTED_ERROR",
        error: `Ocurrió un error inesperado.`,
        details: [error instanceof Error ? error.message : String(error)]
      });
      setUploadStatus({
        type: "error",
        message: `❌ Error inesperado.`,
      });
    } finally {
      setIsUploading(false);
    }
  };

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
                  color: "#ef4444", fontWeight: 900, backgroundColor: "rgba(239, 68, 68, 0.18)",
                  border: "1px solid rgba(239, 68, 68, 0.4)", padding: "1px 3px",
                  borderRadius: 4, margin: "0 1px", display: "inline-block"
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

  const btnPrimary: React.CSSProperties = {
    background: C.accent, color: themeMode === "light" ? "#fff" : C.deepGreen,
    border: "none", borderRadius: 10, padding: "16px 32px",
    fontWeight: 800, fontSize: "1.1em", cursor: "pointer",
    boxShadow: `0 4px 14px ${C.accent}60`, transition: "all 0.2s",
    width: "100%", marginTop: 24, textTransform: "uppercase", letterSpacing: 1
  };
  const btnSecondary: React.CSSProperties = {
    background: C.btnSecBg, border: `1px solid ${C.border}`, borderRadius: 10,
    padding: "16px 32px", color: C.textMain, fontSize: "1.1em",
    cursor: "pointer", fontWeight: 700, transition: "all 0.2s",
    width: "100%", marginTop: 12
  };
  const statusBox: React.CSSProperties = {
    padding: "16px 20px", borderRadius: 12,
    border: `1px solid ${
      uploadStatus.type === "success" ? "#22c55e" :
      uploadStatus.type === "error" ? "#ef4444" : 
      uploadStatus.type === "warning" ? "#f59e0b" : C.accent
    }`,
    background: {
      "success": "#22c55e20", "error": "#ef444420",
      "warning": "#f59e0b20", "info": `${C.accent}20`,
    }[uploadStatus.type || "info"],
    color: {
      "success": "#16a34a", "error": "#dc2626",
      "warning": "#d97706", "info": C.accent,
    }[uploadStatus.type || "info"],
    fontSize: "0.9em", fontWeight: 600, marginBottom: 20,
    display: uploadStatus.type ? "block" : "none",
  };

  const isRetry = createdRegistroId !== null;

  return (
    <div style={{
      background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 20,
      padding: "clamp(20px, 5vw, 40px)", boxShadow: C.glow, backdropFilter: "blur(12px)",
      animation: "fadeIn 0.4s ease"
    }}>
      <h2 style={{ fontSize: "1.8em", fontWeight: 900, marginBottom: 10, color: C.textMain }}>
        Resumen y Envío
      </h2>
      <p style={{ color: C.textMuted, fontSize: "1em", marginBottom: 30, lineHeight: 1.5 }}>
        Por favor revisa la información de tu trámite antes de enviarla al Departamento de Visados de la SIB.
      </p>

      {/* ── Status Banner ── */}
      <div style={statusBox}>
        {uploadStatus.message}
      </div>

      {/* ── Summary View ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: "0.8em", textTransform: "uppercase", letterSpacing: 2, color: C.accent, fontWeight: 800, marginBottom: 12 }}>
            Datos del Proyecto
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <span style={{ fontSize: "0.85em", color: C.textMuted, display: "block" }}>Categoría</span>
              <strong style={{ color: C.textMain }}>{cat.label}</strong>
            </div>
            <div>
              <span style={{ fontSize: "0.85em", color: C.textMuted, display: "block" }}>Título</span>
              <strong style={{ color: C.textMain }}>{formData.titulo || "Sin título"}</strong>
            </div>
            <div>
              <span style={{ fontSize: "0.85em", color: C.textMuted, display: "block" }}>Ingeniero</span>
              <strong style={{ color: C.textMain }}>{formData.ingNombre || "No especificado"}</strong>
            </div>
            <div>
              <span style={{ fontSize: "0.85em", color: C.textMuted, display: "block" }}>Código SHA256</span>
              <strong style={{ color: C.textMain, fontFamily: "monospace", fontSize: "0.85em" }}>{documentSHA256.substring(0, 16)}...</strong>
            </div>
          </div>
        </div>

        <div style={{ background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: "0.8em", textTransform: "uppercase", letterSpacing: 2, color: C.accent, fontWeight: 800, marginBottom: 12 }}>
            Archivos Adjuntos ({allFiles.length + 1})
          </div>
          <ul style={{ margin: 0, paddingLeft: 20, color: C.textMain, fontSize: "0.9em", display: "flex", flexDirection: "column", gap: 8 }}>
            <li style={{ color: successFileNames.has(`${cat.code}_${documentSHA256}.pdf`) ? "#10b981" : C.textMain }}>
              📄 Carátula Generada PDF {successFileNames.has(`${cat.code}_${documentSHA256}.pdf`) && "✅"}
            </li>
            {allFiles.map((f, i) => (
              <li key={i} style={{ color: successFileNames.has(f.name) ? "#10b981" : C.textMain }}>
                {f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB) {successFileNames.has(f.name) && "✅"}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <button 
        style={{...btnPrimary, opacity: isUploading ? 0.7 : 1}} 
        onClick={handleEnviarABD} 
        disabled={isUploading}
      >
        {isUploading ? "Enviando a Visados..." : isRetry ? `Reintentar ${pendingFiles.length} Fallidos` : "Enviar al Departamento de Visados"}
      </button>

      {!isUploading && !isRetry && (
        <button style={btnSecondary} onClick={goBack}>
          Volver a Vista Previa
        </button>
      )}

      {/* ── Modal de Errores Premium de la API ── */}
      {errorModal && (() => {
        const errorConfig: Record<string, { icon: string; title: string; desc: string; color: string; bg: string; action: string }> = {
          RATE_LIMIT_EXCEEDED: { icon: "⏳", title: "Límite de Peticiones", desc: "El servidor restringe la frecuencia de envíos.", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)", action: "Espera a que el servidor se libere antes de reintentar." },
          MAX_FILE_COUNT_EXCEEDED: { icon: "🗂️", title: "Cantidad Excedida", desc: "Demasiados archivos de una vez.", color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)", action: "El límite es 20 archivos." },
          MAX_SINGLE_SIZE_EXCEEDED: { icon: "⚖️", title: "Archivo Demasiado Grande", desc: "Uno o varios archivos sobrepasan el límite de 3.0 MB.", color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)", action: "Comprime tus PDFs." },
          MAX_TOTAL_SIZE_EXCEEDED: { icon: "📦", title: "Tamaño Total Excedido", desc: "El peso combinado supera los 300 MB.", color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)", action: "Remueve archivos innecesarios." },
          INVALID_FILE_FORMAT: { icon: "🚫", title: "Formato No Permitido", desc: "Extensiones no autorizadas.", color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)", action: "Solo pdf, png, jpg, webp, docx, xlsx, zip, rar." },
          DUPLICATE_FILES_IN_BATCH: { icon: "📋", title: "Archivos Duplicados", desc: "Nombres repetidos.", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)", action: "Renombra los archivos." },
          FILE_NAME_CLASH: { icon: "🔀", title: "Conflicto de Nombres", desc: "Nombres ya existen en este registro.", color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)", action: "Agrega un sufijo a tus archivos nuevos." },
          INVALID_FILENAME_CHARS: { icon: "⚠️", title: "Caracteres Prohibidos", desc: "Los nombres tienen caracteres inválidos.", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)", action: "Elimina < > : \" / \\ | ? *." },
          REGISTRO_NOT_FOUND: { icon: "🔍", title: "Registro No Encontrado", desc: "Identificador inválido.", color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)", action: "Crea una carátula nueva." },
          PAYLOAD_TOO_LARGE: { icon: "🚀", title: "Carga Demasiado Pesada", desc: "El tamaño superó el límite de la plataforma.", color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)", action: "Comprime los archivos e intenta nuevamente." }
        };

        const config = errorConfig[errorModal.code] || { icon: "❌", title: "Error en Subida", desc: errorModal.error || "Ocurrió un error inesperado.", color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)", action: "Puedes presionar Reintentar para continuar enviando los archivos faltantes." };

        return (
          <div style={{ position: "fixed", inset: 0, background: isLight ? "rgba(15, 23, 42, 0.55)" : "rgba(8, 12, 10, 0.78)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100000, padding: 20 }} onClick={() => setErrorModal(null)}>
            <div style={{ background: isLight ? "linear-gradient(135deg, #ffffff, #fff5f5)" : "linear-gradient(135deg, #180d0d, #0a0505)", color: C.textMain, border: `1px solid ${config.color}50`, borderRadius: 24, padding: "clamp(20px, 5vw, 36px)", width: "min(640px, 94vw)", maxHeight: "88vh", overflowY: "auto", position: "relative" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 20 }}>
                <span style={{ fontSize: "2.4em", background: config.bg, padding: "10px 14px", borderRadius: 16 }}>{config.icon}</span>
                <div>
                  <h3 style={{ fontSize: "1.3em", fontWeight: 900, margin: 0 }}>{config.title}</h3>
                  <span style={{ fontSize: "0.72em", fontWeight: 800, color: config.color, textTransform: "uppercase" }}>Error Code: {errorModal.code}</span>
                </div>
              </div>

              {errorModal.registroId && (
                <div style={{ background: isLight ? "#f0fdf4" : "rgba(16, 185, 129, 0.08)", border: `1px solid ${isLight ? "#bbf7d0" : "rgba(16, 185, 129, 0.25)"}`, borderRadius: 16, padding: "16px 20px", marginBottom: 20 }}>
                  <div style={{ color: isLight ? "#15803d" : "#10b981", fontWeight: 800, fontSize: "0.85em", textTransform: "uppercase" }}>✅ Trámite Resguardado</div>
                  <div style={{ fontSize: "0.88em", marginTop: 6 }}>Tu trámite ya está creado. Hash: <strong style={{ fontFamily: "monospace" }}>{errorModal.codHash}</strong></div>
                  <div style={{ fontSize: "0.8em", color: C.textMuted, marginTop: 6 }}>Los archivos que fallaron se pueden reintentar sin duplicar el trámite.</div>
                </div>
              )}

              <div style={{ background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, marginBottom: 20, fontSize: "0.92em" }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Detalle del problema:</div>
                <div style={{ color: C.textMuted }}>{config.desc}</div>

                {errorModal.invalidFiles && errorModal.invalidFiles.length > 0 ? (
                  <div style={{ marginTop: 14, borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
                    <div style={{ fontSize: "0.82em", fontWeight: 800, color: config.color, marginBottom: 10 }}>Archivos Rechazados ({errorModal.invalidFiles.length}):</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 180, overflowY: "auto" }}>
                      {errorModal.invalidFiles.map((item, idx) => (
                        <div key={idx} style={{ background: isLight ? "#fbfbfb" : "rgba(255, 255, 255, 0.02)", padding: 12, borderRadius: 10, border: `1px solid ${C.border}` }}>
                          <div style={{ fontWeight: 800 }}>{errorModal.code === "INVALID_FILENAME_CHARS" ? highlightFilename(item.nombre) : item.nombre}</div>
                          {item.errores && <ul style={{ color: "#ef4444", fontSize: "0.9em", paddingLeft: 18 }}>{item.errores.map((e,i) => <li key={i}>{e}</li>)}</ul>}
                          {item.sugerencias && <ul style={{ color: "#10b981", fontSize: "0.9em", paddingLeft: 18 }}>{item.sugerencias.map((s,i) => <li key={i}>{s}</li>)}</ul>}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : errorModal.details && errorModal.details.length > 0 && (
                  <div style={{ marginTop: 14, borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
                    <div style={{ fontSize: "0.82em", fontWeight: 800, color: config.color, marginBottom: 10 }}>Elementos ({errorModal.details.length}):</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 180, overflowY: "auto" }}>
                      {errorModal.details.map((item, idx) => (
                        <div key={idx} style={{ padding: 10, borderRadius: 10, border: `1px solid ${C.border}` }}>
                          {errorModal.code === "INVALID_FILENAME_CHARS" ? highlightFilename(item) : <span style={{ fontFamily: "monospace" }}>{item}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                <button onClick={() => setErrorModal(null)} style={{ flexGrow: 1, background: C.accent, color: isLight ? "#fff" : C.deepGreen, border: "none", borderRadius: 10, padding: 14, fontWeight: 700, cursor: "pointer" }}>
                  Entendido
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
