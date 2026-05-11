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
  const handleEnviarABD = async () => {    // DEBUG
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

      const allowedMime = new Set([
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/webp",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ]);
      const maxFileSizeBytes = 20 * 1024 * 1024;

      const allFiles = [...filesMemoria, ...filesPlanos, ...filesPlanosArq];
      const invalidTypeFiles = allFiles.filter(
        (file) => file.type && !allowedMime.has(file.type)
      );
      const oversizedFiles = allFiles.filter(
        (file) => file.size > maxFileSizeBytes
      );

      if (invalidTypeFiles.length > 0 || oversizedFiles.length > 0) {
        const details: string[] = [];
        if (invalidTypeFiles.length > 0) {
          details.push(
            "Tipo no permitido: " +
              invalidTypeFiles.map((f) => `${f.name} (${f.type || "tipo desconocido"})`).join(", ")
          );
        }
        if (oversizedFiles.length > 0) {
          details.push(
            "Excede 20 MB: " +
              oversizedFiles
                .map((f) => `${f.name} (${(f.size / 1024 / 1024).toFixed(2)} MB)`) 
                .join(", ")
          );
        }

        setModalInfo({
          title: "Archivos no válidos",
          message: "Algunos archivos no cumplen los requisitos y no se enviarán.",
          details,
        });
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
        setUploadStatus({
          type: "error",
          message: `❌ Error: ${result.error}`,
        });
      }
    } catch (error) {
      console.error("Error al enviar:", error);
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